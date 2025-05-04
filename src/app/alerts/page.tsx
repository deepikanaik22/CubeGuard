
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarSeparator, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import React, { useState, useEffect } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Import subscription
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface AlertInfo {
  id: string;
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  timestamp: Date;
}

// Function to generate alerts based on telemetry data
const generateAlerts = (telemetry: TelemetryData | null): AlertInfo[] => {
  const currentAlerts: AlertInfo[] = [];
  const now = new Date();

  if (!telemetry) {
    return currentAlerts; // No data, no alerts
  }

  // Example Alert Logic (Replace with your actual thresholds and logic)
  if (telemetry.internalTemperature > 35) { // Threshold: 35°C
    currentAlerts.push({
      id: 'high-temp',
      title: 'High Temperature Alert',
      description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) exceeded threshold (35°C).`,
      variant: 'destructive',
      timestamp: now,
    });
  }

  if (telemetry.batteryVoltage < 3.7) { // Threshold: 3.7V
    currentAlerts.push({
      id: 'low-battery',
      title: 'Low Battery Voltage',
      description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is below the critical level (3.7V).`,
      variant: 'destructive',
      timestamp: now,
    });
  }

   if (telemetry.communicationLogs?.signalStrength < -90) { // Threshold: -90 dBm
     currentAlerts.push({
       id: 'comm-issue-signal',
       title: 'Communication Issue',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is very weak.`,
       variant: 'destructive',
       timestamp: now,
     });
   } else if (telemetry.communicationLogs?.signalStrength < -85) { // Warning threshold
      currentAlerts.push({
       id: 'comm-warning-signal',
       title: 'Communication Warning',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is weak.`,
       variant: 'default', // Use default variant for warnings
       timestamp: now,
     });
   }

   if (telemetry.communicationLogs?.packetDelay > 250) { // Threshold: 250 ms
     currentAlerts.push({
       id: 'comm-issue-delay',
       title: 'High Packet Delay',
       description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is high.`,
       variant: 'destructive',
       timestamp: now,
     });
   }

  // --- Add more alert conditions based on other telemetry data ---
  // e.g., gyroscope drift, solar panel output low, etc.


   // Sort alerts by timestamp (newest first) or severity
   currentAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());


  return currentAlerts;
};


export default function AlertsPage() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const satelliteId = "cubesat-001"; // Example satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mount


   useEffect(() => {
    setIsClient(true); // Component has mounted
    console.log("Setting up telemetry subscription for alerts page:", satelliteId);
    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
      console.log("Received telemetry data on alerts page:", data);
      setTelemetry(data);
      if (data) {
        const generated = generateAlerts(data);
         console.log("Generated alerts:", generated);
        setAlerts(generated); // Update alerts based on new data
      } else {
        setAlerts([]); // Clear alerts if no data
        setError(`Could not fetch telemetry for ${satelliteId}. Check Firestore document.`);
      }
       if(data === null) setError(null); // Clear error if data comes back
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for alerts page:", satelliteId);
      unsubscribe();
    };
  }, [satelliteId]);

    if (!isClient) {
     // Render loading state or null during SSR and initial client render
     return (
        <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Separator/>
            <Skeleton className="h-64"/>
        </div>
     );
   }


  return (
    <>
       {/* Sidebar remains the same */}
      <Sidebar className="w-60">
         <SidebarHeader>
           <h2 className="font-semibold text-lg">CubeSense</h2>
         </SidebarHeader>
         <SidebarSeparator />
         <SidebarContent>
           <SidebarGroup>
             <SidebarMenu>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/') }}>
                 <Navigation className="mr-2 h-4 w-4" />
                 <span>Overview</span>
               </SidebarMenuButton>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/telemetry') }}>
                 <Cpu className="mr-2 h-4 w-4" />
                 <span>Telemetry</span>
               </SidebarMenuButton>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/alerts') }}>
                 <AlertTriangle className="mr-2 h-4 w-4" />
                 <span>Alerts</span>
                 {/* Display dynamic alert count */}
                 {alerts.filter(a => a.variant === 'destructive').length > 0 && (
                     <Badge variant="destructive" className="ml-auto">
                         {alerts.filter(a => a.variant === 'destructive').length}
                     </Badge>
                 )}
               </SidebarMenuButton>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/communication') }}>
                 <Mail className="mr-2 h-4 w-4" />
                 <span>Communication</span>
               </SidebarMenuButton>
             </SidebarMenu>
           </SidebarGroup>
         </SidebarContent>
         <SidebarFooter>
           <p className="text-xs text-muted-foreground">
             CubeSense - Satellite Monitoring
           </p>
         </SidebarFooter>
       </Sidebar>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="block md:hidden" />
          <h1 className="font-semibold text-2xl">Alerts ({satelliteId})</h1>
        </div>

         {error && !telemetry && ( // Show error only if telemetry is also null
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          )}

        <Separator className="my-4" />

        <div>
          <h2 className="font-semibold text-xl mb-2">Current Alerts</h2>
           {/* Use Skeleton while loading initial data */}
           {!telemetry && !error ? (
               <Skeleton className="h-[400px] w-full rounded-md border" />
            ) : (
              <ScrollArea className="h-[400px] w-full rounded-md border">
                <div className="p-4 space-y-4"> {/* Added space-y-4 for spacing */}
                  {alerts.length === 0 && !error && (
                    <p className="text-muted-foreground p-4">No active alerts.</p>
                  )}
                  {alerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.variant} className="mb-4"> {/* Use dynamic variant */}
                      <AlertTriangle className="h-4 w-4"/>
                      <AlertTitle>{alert.title}</AlertTitle>
                      <AlertDescription>{alert.description}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            )
           }
        </div>
      </div>
    </>
  );
}
