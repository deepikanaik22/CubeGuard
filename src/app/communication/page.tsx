
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarTrigger, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarSeparator, useSidebar } from '@/components/ui/sidebar';
import {
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Import subscription
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { formatDistanceToNow } from 'date-fns'; // For formatting last contact time


export default function CommunicationPage() {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const satelliteId = "cubesat-001"; // Example satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // State to track client-side mount

  useEffect(() => {
    setIsClient(true); // Component has mounted
    console.log("Setting up telemetry subscription for communication page:", satelliteId);
    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
       console.log("Received telemetry data on communication page:", data);
      setTelemetry(data);
      setError(null); // Clear error on new data
      if (data === null) {
         setError(`Could not fetch telemetry for ${satelliteId}. Check Firestore document.`);
      }
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for communication page:", satelliteId);
      unsubscribe();
    };
  }, [satelliteId]);

   // Format last contact time from Firestore timestamp
   const getLastContactTime = () => {
     if (!telemetry?.timestamp) return 'N/A';
     try {
        // Convert Firestore Timestamp to JS Date
       const lastContactDate = telemetry.timestamp.toDate();
       return formatDistanceToNow(lastContactDate, { addSuffix: true });
     } catch (e) {
       console.error("Error formatting timestamp:", e);
       return 'Invalid date';
     }
   };

    if (!isClient) {
     // Render loading state or null during SSR and initial client render
     return (
        <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Separator/>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32"/>
                <Skeleton className="h-32"/>
                <Skeleton className="h-32"/>
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
                 <Badge className="ml-auto">3</Badge> {/* Example badge */}
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
          <h1 className="font-semibold text-2xl">Communication Status ({satelliteId})</h1>
        </div>

         {error && (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          )}

        <Separator className="my-4" />

        {/* Display Communication Data from Real-time Telemetry */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Signal Strength</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <>
                  <p className="text-2xl font-bold">{telemetry.communicationLogs?.signalStrength} dBm</p>
                  <p className="text-sm text-muted-foreground">
                     {telemetry.communicationLogs?.signalStrength > -80 ? 'Strong signal.' : telemetry.communicationLogs?.signalStrength > -90 ? 'Weak signal.' : 'Very weak signal.'}
                  </p>
                </>
              ) : (
                <Skeleton className="h-10 w-3/4" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Packet Delay</CardTitle>
            </CardHeader>
            <CardContent>
               {telemetry ? (
                 <>
                   <p className="text-2xl font-bold">{telemetry.communicationLogs?.packetDelay} ms</p>
                   <p className="text-sm text-muted-foreground">
                     {telemetry.communicationLogs?.packetDelay < 150 ? 'Low delay.' : telemetry.communicationLogs?.packetDelay < 250 ? 'Moderate delay.' : 'High delay.'}
                   </p>
                 </>
               ) : (
                 <Skeleton className="h-10 w-3/4" />
               )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last Contact</CardTitle>
            </CardHeader>
            <CardContent>
               {telemetry ? (
                 <>
                   <p className="text-2xl font-bold">{getLastContactTime()}</p>
                   <p className="text-sm text-muted-foreground">Time since last telemetry update.</p>
                 </>
               ) : (
                 <Skeleton className="h-10 w-3/4" />
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

