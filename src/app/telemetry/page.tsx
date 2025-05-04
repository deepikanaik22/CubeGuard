'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BatteryCharging, // More specific icon
  ThermometerSun, // Icon for External Temp
  ThermometerSnowflake, // Icon for Internal Temp (cooler)
  Waves,
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
  Compass, // Using Compass for Magnetometer
  SignalHigh, // For Signal Strength
  Timer, // For Packet Delay
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
// Import subscribeToTelemetryData
import { subscribeToTelemetryData, TelemetryData } from "@/services/telemetry";
import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarTrigger, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarSeparator, useSidebar } from "@/components/ui/sidebar";
import { useRouter } from 'next/navigation';
// No need for Badge here unless showing alert count
// import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For showing errors


export default function TelemetryPage() {
  const router = useRouter();
  const satelliteId = "cubesat-001"; // Example satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const { setOpenMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false); // State to track client-side mount


  useEffect(() => {
    setIsClient(true); // Component has mounted

    console.log("Setting up telemetry subscription for detailed telemetry:", satelliteId);
    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
      console.log("Received telemetry data on telemetry page:", data);
      setTelemetry(data);
      setError(null); // Clear error on new data
      if (data === null) {
         console.warn(`No telemetry data found for ${satelliteId} on telemetry page.`);
         // Don't set error, handle in UI
      }
      setIsLoading(false); // Stop loading
    }, (subError) => { // Handle subscription errors
        console.error("Telemetry subscription error on telemetry page:", subError);
        setError(`Failed to subscribe to telemetry for ${satelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for:", satelliteId);
      unsubscribe();
    };
  }, [satelliteId]);

   // Render skeleton during SSR or initial client loading
   if (!isClient || isLoading) {
     return (
        <div className="flex min-h-screen">
            <Skeleton className="w-60 hidden md:block" /> {/* Sidebar Placeholder */}
            <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Separator/>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(8)].map((_, i) => ( // Render 8 skeleton cards
                        <Card key={i}>
                            <CardHeader><Skeleton className="h-5 w-1/3" /></CardHeader>
                            <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
                        </Card>
                    ))}
                </div>
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

         {!telemetry && !error && !isLoading && (
              <Alert variant="default" className="my-4">
                 <Cpu className="h-4 w-4" />
                 <AlertTitle>Waiting for Data</AlertTitle>
                 <AlertDescription>No telemetry data received yet for {satelliteId}. Ensure data is being sent.</AlertDescription>
             </Alert>
         )}


        <Separator className="my-4" />

        {/* Display all telemetry data points in cards */}
        {telemetry && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* Power System */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Battery Voltage</CardTitle>
                  <BatteryCharging className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{telemetry.batteryVoltage?.toFixed(2)} V</div>
                    <p className="text-xs text-muted-foreground">
                        {telemetry.batteryVoltage >= 4.0 ? 'Fully charged' : telemetry.batteryVoltage >= 3.7 ? 'Good' : 'Low'}
                    </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Solar Panel Output</CardTitle>
                  <Waves className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{telemetry.solarPanelOutput?.toFixed(2)} W</div>
                    <p className="text-xs text-muted-foreground">
                         {telemetry.solarPanelOutput > 1 ? 'Charging' : 'Low/No sunlight'}
                     </p>
                </CardContent>
              </Card>

               {/* Thermal System */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Internal Temp</CardTitle>
                   <ThermometerSnowflake className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{telemetry.internalTemperature?.toFixed(1)} °C</div>
                     <p className="text-xs text-muted-foreground">Electronics temperature</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">External Temp</CardTitle>
                   <ThermometerSun className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <div className="text-2xl font-bold">{telemetry.externalTemperature?.toFixed(1)} °C</div>
                    <p className="text-xs text-muted-foreground">Satellite surface temperature</p>
                </CardContent>
              </Card>

              {/* Orientation/Attitude */}
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gyroscope</CardTitle>
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-sm space-y-1">
                         <div>X: <span className="font-mono">{telemetry.gyroscope?.x?.toFixed(3)}</span></div>
                         <div>Y: <span className="font-mono">{telemetry.gyroscope?.y?.toFixed(3)}</span></div>
                         <div>Z: <span className="font-mono">{telemetry.gyroscope?.z?.toFixed(3)}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Rotational rates (deg/s)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Magnetometer</CardTitle>
                  <Compass className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     <div className="text-sm space-y-1">
                         <div>X: <span className="font-mono">{telemetry.magnetometer?.x?.toFixed(4)}</span></div>
                         <div>Y: <span className="font-mono">{telemetry.magnetometer?.y?.toFixed(4)}</span></div>
                         <div>Z: <span className="font-mono">{telemetry.magnetometer?.z?.toFixed(4)}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Magnetic field vector (μT)</p>
                </CardContent>
              </Card>

              {/* Communication */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signal Strength</CardTitle>
                  <SignalHigh className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{telemetry.communicationLogs?.signalStrength} dBm</div>
                     <p className="text-xs text-muted-foreground">Received signal strength</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Packet Delay</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{telemetry.communicationLogs?.packetDelay} ms</div>
                     <p className="text-xs text-muted-foreground">Round-trip communication time</p>
                </CardContent>
              </Card>

            </div>
        )}
      </div>
    </>
  );
}
