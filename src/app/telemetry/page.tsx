'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BatteryCharging,
  ThermometerSun,
  ThermometerSnowflake,
  Waves,
  Navigation, // Gyroscope
  Compass, // Magnetometer
  SignalHigh,
  Timer,
  AlertTriangle,
  Cpu, // General system icon
  Rocket,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { subscribeToTelemetryData, TelemetryData } from "@/services/telemetry";
import React, { useState, useEffect, memo } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSatellite } from '@/context/SatelliteContext';
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger

// Memoized component for displaying telemetry details
const TelemetryDisplay = memo(({ telemetry }: { telemetry: TelemetryData | null }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // Skeleton for individual card
  const renderCardSkeleton = (key: number) => (
    <Card key={key}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-1/2 mb-1" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
    </Card>
  );

  if (!isClient || !telemetry) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => renderCardSkeleton(i))}
      </div>
    );
  }

  return (
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
                {telemetry.batteryVoltage >= 4.1 ? 'Excellent' : telemetry.batteryVoltage >= 3.8 ? 'Good' : telemetry.batteryVoltage >= 3.65 ? 'Fair' : 'Low'}
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
                 {telemetry.solarPanelOutput > 1.5 ? 'Charging Well' : telemetry.solarPanelOutput > 0.5 ? 'Charging Low' : 'Minimal/No Light'}
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
             <p className="text-xs text-muted-foreground">Electronics temp</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">External Temp</CardTitle>
           <ThermometerSun className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
             <div className="text-2xl font-bold">{telemetry.externalTemperature?.toFixed(1)} °C</div>
            <p className="text-xs text-muted-foreground">Surface temp</p>
        </CardContent>
      </Card>

      {/* Orientation/Attitude */}
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Gyroscope</CardTitle>
          <Navigation className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-sm space-y-1 font-mono">
                 <div>X: {telemetry.gyroscope?.x?.toFixed(3)?.padStart(7, ' ')}</div>
                 <div>Y: {telemetry.gyroscope?.y?.toFixed(3)?.padStart(7, ' ')}</div>
                 <div>Z: {telemetry.gyroscope?.z?.toFixed(3)?.padStart(7, ' ')}</div>
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
             <div className="text-sm space-y-1 font-mono">
                 <div>X: {telemetry.magnetometer?.x?.toFixed(4)?.padStart(8, ' ')}</div>
                 <div>Y: {telemetry.magnetometer?.y?.toFixed(4)?.padStart(8, ' ')}</div>
                 <div>Z: {telemetry.magnetometer?.z?.toFixed(4)?.padStart(8, ' ')}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Magnetic field (μT)</p>
        </CardContent>
      </Card>

      {/* Communication */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Signal Strength</CardTitle>
          <SignalHigh className="h-4 w-4 text-muted-foreground"/>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{telemetry.communicationLogs?.signalStrength?.toFixed(0)} dBm</div>
             <p className="text-xs text-muted-foreground">RSSI</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Packet Delay</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground"/>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{telemetry.communicationLogs?.packetDelay?.toFixed(0)} ms</div>
             <p className="text-xs text-muted-foreground">Round-trip time</p>
        </CardContent>
      </Card>
    </div>
  );
});
TelemetryDisplay.displayName = 'TelemetryDisplay';


export default function TelemetryPage() {
  const { selectedSatelliteId } = useSatellite();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // Use this for client-side checks

  useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);

  useEffect(() => {
    if (!selectedSatelliteId || !isClient) return;

    setIsLoading(true);
    setError(null);
    setTelemetry(null);

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      setIsLoading(false);
      setTelemetry(data);
      setError(null);
      if (data === null) {
         console.warn(`No telemetry data found for ${selectedSatelliteId} on telemetry page.`);
      }
    }, (subError) => {
        console.error("Telemetry subscription error on telemetry page:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]);


   // Render overall skeleton during initial client loading or main data fetching
   const renderPageSkeleton = () => (
      <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-1/3" />
          <Separator className="mb-6"/>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                         <Skeleton className="h-5 w-1/3" />
                         <Skeleton className="h-4 w-4" />
                      </CardHeader>
                      <CardContent>
                          <Skeleton className="h-8 w-1/2 mb-1" />
                          <Skeleton className="h-3 w-3/4" />
                      </CardContent>
                  </Card>
              ))}
          </div>
      </div>
   );

  return (
    <div className="flex-1">
      {/* Header for mobile */}
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
        {isClient && <SidebarTrigger className="md:hidden"/>}
        <h1 className="text-xl font-semibold ml-2">Detailed Telemetry</h1>
      </header>

      <div className="p-4">
        <h1 className="font-semibold text-2xl mb-4 hidden md:block">Detailed Telemetry ({selectedSatelliteId})</h1>
         <Separator className="mb-6 hidden md:block"/>

         {/* Conditional Rendering: Loading, Error, No Data, Telemetry Data */}
         {!isClient || isLoading ? (
             renderPageSkeleton()
         ) : error ? (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error Loading Telemetry</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          ) : !telemetry ? (
              <Alert variant="default" className="my-4">
                 <Rocket className="h-4 w-4" />
                 <AlertTitle>Waiting for Data</AlertTitle>
                 <AlertDescription>No detailed telemetry data received yet for {selectedSatelliteId}.</AlertDescription>
             </Alert>
         ) : (
           <TelemetryDisplay telemetry={telemetry} />
        )}
      </div>
    </div>
  );
}
