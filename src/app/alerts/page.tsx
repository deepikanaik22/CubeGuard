'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Cpu, Mail } from "lucide-react";
import React, { useState, useEffect } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Import subscription
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { useSatellite } from '@/context/SatelliteContext'; // Import useSatellite

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
      id: `high-temp-${now.getTime()}`, // Unique ID using timestamp
      title: 'High Temperature Alert',
      description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) exceeded threshold (35°C).`,
      variant: 'destructive',
      timestamp: now,
    });
  } else if (telemetry.internalTemperature > 30) { // Warning
     currentAlerts.push({
      id: `warn-temp-${now.getTime()}`,
      title: 'Temperature Warning',
      description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) is elevated (Threshold: 30°C).`,
      variant: 'default',
      timestamp: now,
    });
  }

  // Battery Voltage Alert
  if (telemetry.batteryVoltage < 3.7) {
    currentAlerts.push({
      id: `low-battery-${now.getTime()}`,
      title: 'Low Battery Voltage',
      description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is below critical level (3.7V).`,
      variant: 'destructive',
      timestamp: now,
    });
  } else if (telemetry.batteryVoltage < 3.8) { // Warning
     currentAlerts.push({
      id: `warn-battery-${now.getTime()}`,
      title: 'Battery Voltage Warning',
      description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is low (Threshold: 3.8V).`,
      variant: 'default',
      timestamp: now,
    });
  }

   // Communication Signal Strength Alert
   if (telemetry.communicationLogs?.signalStrength < -90) {
     currentAlerts.push({
       id: `comm-issue-signal-${now.getTime()}`,
       title: 'Communication Issue',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is very weak (Threshold: -90 dBm).`,
       variant: 'destructive',
       timestamp: now,
     });
   } else if (telemetry.communicationLogs?.signalStrength < -85) { // Warning
      currentAlerts.push({
       id: `comm-warning-signal-${now.getTime()}`,
       title: 'Communication Warning',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is weak (Threshold: -85 dBm).`,
       variant: 'default', // Use default variant for warnings
       timestamp: now,
     });
   }

   // Communication Packet Delay Alert
   if (telemetry.communicationLogs?.packetDelay > 250) {
     currentAlerts.push({
       id: `comm-issue-delay-${now.getTime()}`,
       title: 'High Packet Delay',
       description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is high (Threshold: 250 ms).`,
       variant: 'destructive',
       timestamp: now,
     });
   } else if (telemetry.communicationLogs?.packetDelay > 200) { // Warning
      currentAlerts.push({
       id: `comm-warning-delay-${now.getTime()}`,
       title: 'Packet Delay Warning',
       description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is elevated (Threshold: 200 ms).`,
       variant: 'default',
       timestamp: now,
     });
   }

   // Sort alerts: destructive first, then by timestamp (newest first)
   currentAlerts.sort((a, b) => {
      if (a.variant === 'destructive' && b.variant !== 'destructive') return -1;
      if (a.variant !== 'destructive' && b.variant === 'destructive') return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
   });

  return currentAlerts;
};


export default function AlertsPage() {
  const { selectedSatelliteId } = useSatellite(); // Get selected satellite ID
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

   useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);

   useEffect(() => {
     if (!selectedSatelliteId || !isClient) return; // Don't subscribe if no satellite or not mounted

    console.log("Setting up telemetry subscription for alerts page:", selectedSatelliteId);
    setIsLoading(true);
    setError(null);
    setTelemetry(null); // Clear previous data
    setAlerts([]); // Clear alerts

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      console.log("Received telemetry data on alerts page:", data);
      setTelemetry(data); // Store the raw telemetry
      if (data) {
        const generated = generateAlerts(data);
         console.log("Generated alerts:", generated);
        setAlerts(generated); // Update alerts based on new data
        setError(null);
      } else {
        setAlerts([]); // Clear alerts if no data
        console.warn(`No telemetry data found for ${selectedSatelliteId} on alerts page.`);
      }
      setIsLoading(false); // Stop loading once data (or null) is received
    }, (subError) => { // Handle subscription errors
        console.error("Telemetry subscription error on alerts page:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
        setAlerts([]);
    });

    return () => {
      console.log("Unsubscribing from telemetry for alerts page:", selectedSatelliteId);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when satellite ID or mount status changes


  // Render skeleton during SSR or initial client loading
  if (!isClient || isLoading) {
     return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Separator/>
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        </div>
     );
   }


  return (
    <>
      {/* Sidebar is now in layout.tsx */}
      <div className="flex-1"> {/* Removed p-4, handled by layout */}
        <h1 className="font-semibold text-2xl mb-4">Alerts ({selectedSatelliteId})</h1>

         {/* Show loading or error state */}
          {isLoading ? (
            // Handled by the !isClient || isLoading block above
            null
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <div>
                <h2 className="font-semibold text-xl mb-2">Current Alerts</h2>
                <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-md border"> {/* Adjust height as needed */}
                  <div className="p-4 space-y-3"> {/* Consistent spacing */}
                    {alerts.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No active alerts for {selectedSatelliteId}.</p>
                    ) : (
                      alerts.map((alert) => (
                        <Alert key={alert.id} variant={alert.variant} className="mb-3"> {/* Consistent margin */}
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
