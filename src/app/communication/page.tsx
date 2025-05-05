'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  SignalHigh,
  Clock,
  Timer,
  AlertTriangle,
  Rocket,
} from "lucide-react";
import React, { useState, useEffect, memo } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry';
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNowStrict } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSatellite } from '@/context/SatelliteContext';
import { SidebarTrigger } from '@/components/ui/sidebar'; // Import SidebarTrigger

// Memoized component for displaying communication data
const CommunicationDisplay = memo(({ telemetry }: { telemetry: TelemetryData | null }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

   // Format last contact time from telemetry timestamp
   const getLastContactTime = () => {
     if (!telemetry?.timestamp) return 'N/A';
     try {
       const lastContactDate = telemetry.timestamp;
       if (!(lastContactDate instanceof Date) || isNaN(lastContactDate.getTime())) {
            return 'Invalid date';
       }
       return formatDistanceToNowStrict(lastContactDate, { addSuffix: true });
     } catch (e) {
       console.error("Error formatting timestamp:", e);
       return 'Error';
     }
   };

   // Determine communication status text and color based on signal strength
   const getStatusInfo = () => {
     if (!telemetry || telemetry.communicationLogs?.signalStrength == null) {
        return { text: 'Unknown', color: 'text-muted-foreground' };
      }
      const signal = telemetry.communicationLogs.signalStrength;
      if (signal >= -80) return { text: 'Strong', color: 'text-green-600 dark:text-green-400' };
      if (signal >= -90) return { text: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' };
      if (signal >= -95) return { text: 'Weak', color: 'text-orange-600 dark:text-orange-400' };
      return { text: 'Very Weak', color: 'text-red-600 dark:text-red-400' };
    };

   // Determine packet delay status text and color
   const getDelayInfo = () => {
     if (!telemetry || telemetry.communicationLogs?.packetDelay == null) {
       return { text: 'Unknown', color: 'text-muted-foreground' };
     }
      const delay = telemetry.communicationLogs.packetDelay;
      if (delay <= 150) return { text: 'Low', color: 'text-green-600 dark:text-green-400' };
      if (delay <= 250) return { text: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' };
      if (delay <= 300) return { text: 'High', color: 'text-orange-600 dark:text-orange-400' };
      return { text: 'Critical', color: 'text-red-600 dark:text-red-400' };
   };

   const statusInfo = getStatusInfo();
   const delayInfo = getDelayInfo();

   // Skeleton for individual card
   const renderCardSkeleton = (key: number) => (
     <Card key={key}>
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
         <Skeleton className="h-5 w-2/5" />
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
       <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
         {Array.from({ length: 3 }).map((_, i) => renderCardSkeleton(i))}
       </div>
     );
   }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">Signal Strength</CardTitle>
           <SignalHigh className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">
              {telemetry.communicationLogs?.signalStrength != null ? `${telemetry.communicationLogs.signalStrength.toFixed(0)} dBm` : 'N/A'}
            </div>
            <p className={`text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.text}
            </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Packet Delay</CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
             <div className="text-2xl font-bold">
               {telemetry.communicationLogs?.packetDelay != null ? `${telemetry.communicationLogs.packetDelay.toFixed(0)} ms` : 'N/A'}
              </div>
             <p className={`text-xs font-medium ${delayInfo.color}`}>
                 {delayInfo.text}
             </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Contact</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
             <div className="text-2xl font-bold">{getLastContactTime()}</div>
             <p className="text-xs text-muted-foreground">Since last update.</p>
        </CardContent>
      </Card>
    </div>
  );
});
CommunicationDisplay.displayName = 'CommunicationDisplay';

export default function CommunicationPage() {
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
         console.warn(`No telemetry data found for ${selectedSatelliteId} on communication page.`);
      }
    }, (subError) => {
        console.error("Telemetry subscription error on communication page:", subError);
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
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-2/5" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
              </Card>
            </div>
        </div>
    );


  return (
    <div className="flex-1">
      {/* Header for mobile */}
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
        {isClient && <SidebarTrigger className="md:hidden"/>}
        <h1 className="text-xl font-semibold ml-2">Communication</h1>
      </header>

      <div className="p-4">
        <h1 className="font-semibold text-2xl mb-4 hidden md:block">Communication Status ({selectedSatelliteId})</h1>
        <Separator className="mb-6 hidden md:block"/>

          {/* Conditional Rendering: Loading, Error, No Data, Comm Data */}
         {!isClient || isLoading ? (
             renderPageSkeleton()
         ) : error ? (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error Loading Data</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          ) : !telemetry ? (
              <Alert variant="default" className="my-4">
                 <Rocket className="h-4 w-4" />
                 <AlertTitle>Waiting for Data</AlertTitle>
                 <AlertDescription>No communication data received yet for {selectedSatelliteId}.</AlertDescription>
             </Alert>
         ) : (
           <CommunicationDisplay telemetry={telemetry} />
         )}

        {/* Optionally add charts here later */}
        {/* <Separator className="my-6" />
        <Card> ... </Card> */}
      </div>
    </div>
  );
}
