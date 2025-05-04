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
const generateAlerts = (telemetry: TelemetryData): AlertInfo[] => {
  const currentAlerts: AlertInfo[] = [];
  const now = new Date();

  // Temperature Alert
  if (telemetry.internalTemperature > 35) {
    currentAlerts.push({
      id: 'high-temp',
      title: 'High Temperature Alert',
      description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) exceeded threshold (35°C).`,
      variant: 'destructive',
      timestamp: now,
    });
  } else if (telemetry.internalTemperature > 30) { // Warning
     currentAlerts.push({
      id: 'warn-temp',
      title: 'Temperature Warning',
      description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) is elevated (Threshold: 30°C).`,
      variant: 'default',
      timestamp: now,
    });
  }

  // Battery Voltage Alert
  if (telemetry.batteryVoltage < 3.7) {
    currentAlerts.push({
      id: 'low-battery',
      title: 'Low Battery Voltage',
      description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is below critical level (3.7V).`,
      variant: 'destructive',
      timestamp: now,
    });
  } else if (telemetry.batteryVoltage < 3.8) { // Warning
     currentAlerts.push({
      id: 'warn-battery',
      title: 'Battery Voltage Warning',
      description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is low (Threshold: 3.8V).`,
      variant: 'default',
      timestamp: now,
    });
  }

   // Communication Signal Strength Alert
   if (telemetry.communicationLogs?.signalStrength < -90) {
     currentAlerts.push({
       id: 'comm-issue-signal',
       title: 'Communication Issue',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is very weak (Threshold: -90 dBm).`,
       variant: 'destructive',
       timestamp: now,
     });
   } else if (telemetry.communicationLogs?.signalStrength < -85) { // Warning
      currentAlerts.push({
       id: 'comm-warning-signal',
       title: 'Communication Warning',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is weak (Threshold: -85 dBm).`,
       variant: 'default', // Use default variant for warnings
       timestamp: now,
     });
   }

   // Communication Packet Delay Alert
   if (telemetry.communicationLogs?.packetDelay > 250) {
     currentAlerts.push({
       id: 'comm-issue-delay',
       title: 'High Packet Delay',
       description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is high (Threshold: 250 ms).`,
       variant: 'destructive',
       timestamp: now,
     });
   } else if (telemetry.communicationLogs?.packetDelay > 200) { // Warning
      currentAlerts.push({
       id: 'comm-warning-delay',
       title: 'Packet Delay Warning',
       description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is elevated (Threshold: 200 ms).`,
       variant: 'default',
       timestamp: now,
     });
   }

   // Add more alert conditions based on other telemetry data
   // e.g., Gyroscope drift, Solar panel output low, External temp limits

   // Sort alerts: destructive first, then by timestamp (newest first)
   currentAlerts.sort((a, b) => {
      if (a.variant === 'destructive' && b.variant !== 'destructive') return -1;
      if (a.variant !== 'destructive' && b.variant === 'destructive') return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
   });


  return currentAlerts;
};


export default function AlertsPage() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const satelliteId = "cubesat-001"; // Example satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [isClient, setIsClient] = useState(false); // State to track client-side mount


   useEffect(() => {
    setIsClient(true); // Component has mounted

    console.log("Setting up telemetry subscription for alerts page:", satelliteId);
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
      console.log("Received telemetry data on alerts page:", data);
      setTelemetry(data); // Store the raw telemetry
      if (data) {
        const generated = generateAlerts(data);
         console.log("Generated alerts:", generated);
        setAlerts(generated); // Update alerts based on new data
        setError(null);
      } else {
        setAlerts([]); // Clear alerts if no data
        console.warn(`No telemetry data found for ${satelliteId} on alerts page.`);
        // Don't set an error here, just show "No data" message
      }
      setIsLoading(false); // Stop loading once data (or null) is received
    }, (subError) => { // Handle subscription errors
        console.error("Telemetry subscription error on alerts page:", subError);
        setError(`Failed to subscribe to telemetry for ${satelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
        setAlerts([]);
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for alerts page:", satelliteId);
      unsubscribe();
    };
  }, [satelliteId]);

  const destructiveAlertCount = alerts.filter(a => a.variant === 'destructive').length;

  // Render skeleton during SSR or initial client render before mount
  if (!isClient) {
     return (
        <div className="flex min-h-screen">
             <Skeleton className="w-60 hidden md:block" /> {/* Sidebar Placeholder */}
            <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Separator/>
                <Skeleton className="h-64"/>
            </div>
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
                 {destructiveAlertCount > 0 && (
                     <Badge variant="destructive" className="ml-auto">
                         {destructiveAlertCount}
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

         {/* Show loading or error state */}
          {isLoading ? (
            <div className="mt-4 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Separator className="my-4" />
              <div>
                <h2 className="font-semibold text-xl mb-2">Current Alerts</h2>
                <ScrollArea className="h-[calc(100vh-200px)] w-full rounded-md border"> {/* Adjust height as needed */}
                  <div className="p-4 space-y-4">
                    {alerts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No active alerts.</p>
                    ) : (
                      alerts.map((alert) => (
                        <Alert key={alert.id} variant={alert.variant} className="mb-4"> {/* Use dynamic variant */}
                          <AlertTriangle className="h-4 w-4"/>
                          <AlertTitle>{alert.title}</AlertTitle>
                          <AlertDescription>
                             {alert.description}
                             <span className="block text-xs text-muted-foreground mt-1">
                               {alert.timestamp.toLocaleString()}
                             </span>
                           </AlertDescription>
                        </Alert>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
      </div>
    </>
  );
}
