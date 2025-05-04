
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  SignalHigh,
  Clock,
  Timer,
  AlertTriangle,
  Rocket, // Added Rocket icon
} from "lucide-react";
import React, { useState, useEffect } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Using simulated source
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNowStrict } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSatellite } from '@/context/SatelliteContext';

export default function CommunicationPage() {
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

    console.log("Setting up telemetry subscription for communication page:", selectedSatelliteId);
    setIsLoading(true);
    setError(null);
    setTelemetry(null); // Clear previous data

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
       // console.log("Received telemetry data on communication page:", data); // Optional logging
       setIsLoading(false); // Stop loading once data/null arrives
       setTelemetry(data);
       setError(null); // Clear error on new data
      if (data === null) {
         console.warn(`No telemetry data found for ${selectedSatelliteId} on communication page.`);
         // Show 'waiting for data' state
      }
    }, (subError) => { // Handle subscription errors
        console.error("Telemetry subscription error on communication page:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
    });

    // Clean up subscription on component unmount or satellite change
    return () => {
      console.log("Unsubscribing from telemetry for communication page:", selectedSatelliteId);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when satellite ID or mount status changes


   // Format last contact time from telemetry timestamp
   const getLastContactTime = () => {
     if (!telemetry?.timestamp) return 'N/A';
     try {
       // Simulated data uses JS Date objects directly
       const lastContactDate = telemetry.timestamp;

       if (!(lastContactDate instanceof Date) || isNaN(lastContactDate.getTime())) {
            return 'Invalid date';
       }
       // Use strict formatting for cleaner output like "5 seconds ago"
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
      if (signal >= -80) return { text: 'Strong signal', color: 'text-green-600 dark:text-green-400' };
      if (signal >= -90) return { text: 'Fair signal', color: 'text-yellow-600 dark:text-yellow-400' };
      if (signal >= -95) return { text: 'Weak signal', color: 'text-orange-600 dark:text-orange-400' };
      return { text: 'Very weak signal', color: 'text-red-600 dark:text-red-400' };
    };

   // Determine packet delay status text and color
   const getDelayInfo = () => {
     if (!telemetry || telemetry.communicationLogs?.packetDelay == null) {
       return { text: 'Unknown', color: 'text-muted-foreground' };
     }
      const delay = telemetry.communicationLogs.packetDelay;
      if (delay <= 150) return { text: 'Low delay', color: 'text-green-600 dark:text-green-400' };
      if (delay <= 250) return { text: 'Moderate delay', color: 'text-yellow-600 dark:text-yellow-400' };
      if (delay <= 300) return { text: 'High delay', color: 'text-orange-600 dark:text-orange-400' };
      return { text: 'Critical delay', color: 'text-red-600 dark:text-red-400' };
   };

   // Calculate status info dynamically
   const statusInfo = getStatusInfo();
   const delayInfo = getDelayInfo();


    // Render skeleton during initial client loading or data fetching
    const renderSkeleton = () => (
       <div className="space-y-4 p-4"> {/* Added padding */}
            <Skeleton className="h-8 w-1/3" />
            <Separator/>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => ( // Render 3 skeleton cards
                  <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-5 w-2/5" />
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
        <h1 className="font-semibold text-2xl mb-4">Communication Status ({selectedSatelliteId})</h1>
         <Separator className="mb-6"/>

          {/* Conditional Rendering: Loading, Error, No Data, Comm Data */}
         {!isClient || isLoading ? (
             renderSkeleton()
         ) : error ? (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error Loading Communication Data</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          ) : !telemetry ? (
              <Alert variant="default" className="my-4">
                 <Rocket className="h-4 w-4" />
                 <AlertTitle>Waiting for Data</AlertTitle>
                 <AlertDescription>No communication data received yet for {selectedSatelliteId}. Ensure simulation is running or data source is active.</AlertDescription>
             </Alert>
         ) : (
         // Display Communication Data
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
                  <p className="text-xs text-muted-foreground">Time since last telemetry update.</p>
             </CardContent>
           </Card>
         </div>
         )}

        {/* Optionally add charts here later */}
        {/* <Separator className="my-6" />
        <Card> ... </Card> */}
      </div>
    </div>
  );
}
