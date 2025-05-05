'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Rocket } from "lucide-react";
import React, { useState, useEffect, memo } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry';
import { Skeleton } from "@/components/ui/skeleton";
import { useSatellite } from '@/context/SatelliteContext';
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger

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

    // Temperature Alert (Critical)
    if (telemetry.internalTemperature > 38) {
      currentAlerts.push({
        id: `high-temp-${telemetry.id}-${now.getTime()}`,
        title: 'Critical Temperature Alert',
        description: `Internal temp (${telemetry.internalTemperature.toFixed(1)}°C) exceeded critical threshold (38°C). Risk of overheating.`,
        variant: 'destructive',
        timestamp: now,
      });
    }
    // Temperature Warning
    else if (telemetry.internalTemperature > 35) {
      currentAlerts.push({
        id: `warn-temp-${telemetry.id}-${now.getTime()}`,
        title: 'High Temperature Warning',
        description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) is high (Threshold: 35°C). Monitor closely.`,
        variant: 'default',
        timestamp: now,
      });
    }

    // Battery Voltage Alert (Critical)
    if (telemetry.batteryVoltage < 3.65) {
      currentAlerts.push({
        id: `low-battery-${telemetry.id}-${now.getTime()}`,
        title: 'Critical Low Battery',
        description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is critically low (Threshold: 3.65V). Potential power loss imminent.`,
        variant: 'destructive',
        timestamp: now,
      });
    }
    // Battery Voltage Warning
    else if (telemetry.batteryVoltage < 3.75) {
       currentAlerts.push({
        id: `warn-battery-${telemetry.id}-${now.getTime()}`,
        title: 'Low Battery Warning',
        description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is low (Threshold: 3.75V). Check power generation.`,
        variant: 'default',
        timestamp: now,
      });
    }

    // Communication Signal Strength Alert (Critical)
    if (telemetry.communicationLogs?.signalStrength < -95) {
      currentAlerts.push({
        id: `comm-issue-signal-${telemetry.id}-${now.getTime()}`,
        title: 'Critical Comm Signal',
        description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is very weak (Threshold: -95 dBm). Potential loss of contact.`,
        variant: 'destructive',
        timestamp: now,
      });
    }
     // Communication Signal Strength Warning
     else if (telemetry.communicationLogs?.signalStrength < -90) {
       currentAlerts.push({
        id: `comm-warn-signal-${telemetry.id}-${now.getTime()}`,
        title: 'Weak Comm Signal',
        description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is weak (Threshold: -90 dBm). Investigate link quality.`,
        variant: 'default',
        timestamp: now,
      });
    }

    // Communication Packet Delay Alert (Critical)
    if (telemetry.communicationLogs?.packetDelay > 300) {
      currentAlerts.push({
        id: `comm-issue-delay-${telemetry.id}-${now.getTime()}`,
        title: 'Critical Packet Delay',
        description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is critically high (Threshold: 300 ms). Investigate network issues.`,
        variant: 'destructive',
        timestamp: now,
      });
    }
     // Communication Packet Delay Warning
     else if (telemetry.communicationLogs?.packetDelay > 250) {
      currentAlerts.push({
        id: `comm-warn-delay-${telemetry.id}-${now.getTime()}`,
        title: 'High Packet Delay',
        description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is high (Threshold: 250 ms).`,
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

// Memoize the AlertsDisplay component
const AlertsDisplay = memo(({ alerts, selectedSatelliteId }: { alerts: AlertInfo[]; selectedSatelliteId: string }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    // Render basic skeleton or null during server render/initial client mount
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Separator className="mb-6" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Alert variant="default" className="my-4">
        <Rocket className="h-4 w-4" />
        <AlertTitle>No Active Alerts</AlertTitle>
        <AlertDescription>No current alerts detected for {selectedSatelliteId}. System appears nominal based on current thresholds.</AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full">
      <div className="pr-4 space-y-3">
        {alerts.map((alert) => (
          <Alert key={alert.id} variant={alert.variant} className="mb-3 shadow-sm">
            <AlertTriangle className="h-4 w-4 mt-1" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>
              {alert.description}
              <span className="block text-xs text-muted-foreground mt-1">
                {alert.timestamp.toLocaleString()}
              </span>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  );
});
AlertsDisplay.displayName = 'AlertsDisplay';

export default function AlertsPage() {
  const { selectedSatelliteId } = useSatellite();
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // Use this for client-side checks

   useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);

   useEffect(() => {
     if (!selectedSatelliteId || !isClient) return; // Don't subscribe if no satellite or not mounted

    setIsLoading(true);
    setError(null);
    setAlerts([]); // Clear alerts for new satellite

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      setIsLoading(false);
      if (data) {
        setAlerts(generateAlerts(data));
        setError(null);
      } else {
        setAlerts([]);
        console.warn(`No telemetry data found for ${selectedSatelliteId} on alerts page.`);
      }
    }, (subError) => {
        console.error("Telemetry subscription error on alerts page:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
        setIsLoading(false);
        setAlerts([]);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when satellite ID or mount status changes


  // Render skeleton during initial client loading or data fetching
  const renderSkeleton = () => (
     <div className="space-y-4 p-4">
         <Skeleton className="h-8 w-1/3" />
         <Separator className="mb-6"/>
         <div className="space-y-4">
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
         </div>
     </div>
  );


  return (
    <div className="flex-1">
       {/* Header for mobile */}
       <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
          {isClient && <SidebarTrigger className="md:hidden"/>}
          <h1 className="text-xl font-semibold ml-2">Alerts</h1>
       </header>

       <div className="p-4">
         <h1 className="font-semibold text-2xl mb-4 hidden md:block">Alerts ({selectedSatelliteId})</h1>
         <Separator className="mb-6 hidden md:block"/>

          {/* Conditional Rendering: Loading, Error, Alerts */}
          {!isClient || isLoading ? (
            renderSkeleton()
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Alerts</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
           ) : (
             <AlertsDisplay alerts={alerts} selectedSatelliteId={selectedSatelliteId} />
          )}
      </div>
    </div>
  );
}
