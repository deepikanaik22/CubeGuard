
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
  Rocket, // Added Rocket icon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { subscribeToTelemetryData, TelemetryData } from "@/services/telemetry"; // Using simulated source
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSatellite } from '@/context/SatelliteContext';

export default function TelemetryPage() {
  const { selectedSatelliteId } = useSatellite(); // Get selected satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);

  useEffect(() => {
    if (!selectedSatelliteId || !isClient) return; // Don't subscribe if no satellite or not mounted

    console.log("Setting up telemetry subscription for detailed telemetry:", selectedSatelliteId);
    setIsLoading(true);
    setError(null);
    setTelemetry(null); // Clear previous data

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      // console.log("Received telemetry data on telemetry page:", data); // Optional logging
      setIsLoading(false); // Stop loading once data/null arrives
      setTelemetry(data);
      setError(null); // Clear error on new data
      if (data === null) {
         console.warn(`No telemetry data found for ${selectedSatelliteId} on telemetry page.`);
         // Show 'waiting for data' state rather than error
      }
    }, (subError) => {
        console.error("Telemetry subscription error on telemetry page:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
    });

    // Cleanup subscription
    return () => {
      console.log("Unsubscribing from telemetry for:", selectedSatelliteId);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when selectedSatelliteId or client status changes


   // Render skeleton during initial client loading or data fetching
   const renderSkeleton = () => (
      <div className="space-y-4 p-4"> {/* Added padding */}
          <Skeleton className="h-8 w-1/3" />
          <Separator/>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => ( // Render 8 skeleton cards
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
     // The main layout including Sidebar is handled by src/app/layout.tsx
    <div className="flex-1"> {/* This div takes up the remaining space */}
      <div className="p-4"> {/* Add padding to the content area */}
        <h1 className="font-semibold text-2xl mb-4">Detailed Telemetry ({selectedSatelliteId})</h1>
         <Separator className="mb-6"/>

         {/* Conditional Rendering: Loading, Error, No Data, Telemetry Data */}
         {!isClient || isLoading ? (
             renderSkeleton()
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
                 <AlertDescription>No detailed telemetry data received yet for {selectedSatelliteId}. Ensure simulation is running or data source is active.</AlertDescription>
             </Alert>
         ) : (
            // Display all telemetry data points in cards
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
                    <div className="text-sm space-y-1 font-mono"> {/* Use mono for alignment */}
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
                     <div className="text-sm space-y-1 font-mono"> {/* Use mono for alignment */}
                         <div>X: {telemetry.magnetometer?.x?.toFixed(4)?.padStart(8, ' ')}</div>
                         <div>Y: {telemetry.magnetometer?.y?.toFixed(4)?.padStart(8, ' ')}</div>
                         <div>Z: {telemetry.magnetometer?.z?.toFixed(4)?.padStart(8, ' ')}</div>
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
                    <div className="text-2xl font-bold">{telemetry.communicationLogs?.signalStrength?.toFixed(0)} dBm</div>
                     <p className="text-xs text-muted-foreground">Received signal strength (RSSI)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Packet Delay</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{telemetry.communicationLogs?.packetDelay?.toFixed(0)} ms</div>
                     <p className="text-xs text-muted-foreground">Round-trip communication time</p>
                </CardContent>
              </Card>

            </div>
        )}
      </div>
    </div>
  );
}
