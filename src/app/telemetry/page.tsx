
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
  Compass, // Using Compass for Magnetometer
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
// Import subscribeToTelemetryData
import { subscribeToTelemetryData, TelemetryData } from "@/services/telemetry";
import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";

export default function TelemetryPage() {
  const router = useRouter();
  const satelliteId = "cubesat-001"; // Example satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOpenMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false); // State to track client-side mount


  useEffect(() => {
    setIsClient(true); // Component has mounted
    console.log("Setting up telemetry subscription for:", satelliteId);
    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
      console.log("Received telemetry data on telemetry page:", data);
      setTelemetry(data);
      setError(null); // Clear error on new data
      if (data === null) {
         setError(`Could not fetch telemetry for ${satelliteId}. Check Firestore document.`);
      }
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for:", satelliteId);
      unsubscribe();
    };
  }, [satelliteId]);

   if (!isClient) {
     // Render loading state or null during SSR and initial client render
     return (
        <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Separator/>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24"/>
                <Skeleton className="h-24"/>
                <Skeleton className="h-24"/>
                <Skeleton className="h-24"/>
                <Skeleton className="h-24"/>
                <Skeleton className="h-24"/>
                 <Skeleton className="h-24"/>
                <Skeleton className="h-24"/>
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
          <h1 className="font-semibold text-2xl">Detailed Telemetry ({satelliteId})</h1>
        </div>

        {error && (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          )}

        <Separator className="my-4" />

        {/* Display all telemetry data points in cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Power System */}
          <Card>
            <CardHeader>
              <CardTitle>Battery Voltage</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4" />
                  <span className="text-xl font-semibold">{telemetry.batteryVoltage?.toFixed(2)}V</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-1/2" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solar Panel Output</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Waves className="h-4 w-4" />
                  <span className="text-xl font-semibold">{telemetry.solarPanelOutput?.toFixed(2)}W</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-1/2" />
              )}
            </CardContent>
          </Card>

           {/* Thermal System */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-xl font-semibold">{telemetry.internalTemperature?.toFixed(1)}°C</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-1/2" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>External Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-blue-500" />
                  <span className="text-xl font-semibold">{telemetry.externalTemperature?.toFixed(1)}°C</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-1/2" />
              )}
            </CardContent>
          </Card>

          {/* Orientation/Attitude */}
           <Card>
            <CardHeader>
              <CardTitle>Gyroscope</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4" />
                   <span className="text-sm">
                     X: {telemetry.gyroscope?.x?.toFixed(3)}, Y: {telemetry.gyroscope?.y?.toFixed(3)}, Z: {telemetry.gyroscope?.z?.toFixed(3)}
                   </span>
                </div>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Magnetometer</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Compass className="h-4 w-4" /> {/* Using Compass icon */}
                   <span className="text-sm">
                     X: {telemetry.magnetometer?.x?.toFixed(4)}, Y: {telemetry.magnetometer?.y?.toFixed(4)}, Z: {telemetry.magnetometer?.z?.toFixed(4)}
                   </span>
                </div>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </CardContent>
          </Card>

          {/* Communication */}
          <Card>
            <CardHeader>
              <CardTitle>Signal Strength</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4"/>
                  <span className="text-xl font-semibold">{telemetry.communicationLogs?.signalStrength} dBm</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-1/2" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Packet Delay</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4"/>
                  <span className="text-xl font-semibold">{telemetry.communicationLogs?.packetDelay} ms</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-1/2" />
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
