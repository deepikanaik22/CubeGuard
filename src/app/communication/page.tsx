'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  SignalHigh, // Better icon for Signal Strength
  Clock, // Icon for Last Contact
  Timer, // Icon for Packet Delay
  AlertTriangle, // For errors
} from "lucide-react";
import React, { useState, useEffect } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Import subscription
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { formatDistanceToNowStrict } from 'date-fns'; // Use strict for cleaner output
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Import Alert components
import { useSatellite } from '@/context/SatelliteContext'; // Import useSatellite

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
       console.log("Received telemetry data on communication page:", data);
      setTelemetry(data);
      setError(null); // Clear error on new data
      if (data === null) {
         console.warn(`No telemetry data found for ${selectedSatelliteId} on communication page.`);
      }
      setIsLoading(false); // Stop loading
    }, (subError) => { // Handle subscription errors
        console.error("Telemetry subscription error on communication page:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
        setIsLoading(false);
        setTelemetry(null);
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for communication page:", selectedSatelliteId);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when satellite ID or mount status changes

   // Format last contact time from Firestore timestamp
   const getLastContactTime = () => {
     if (!telemetry?.timestamp) return 'N/A';
     try {
        // Convert Firestore Timestamp or JS Date to JS Date
        const lastContactDate = telemetry.timestamp instanceof Date
          ? telemetry.timestamp
          : telemetry.timestamp?.toDate?.(); // Handle potential Firestore Timestamp

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
      if (signal >= -80) return { text: 'Strong signal', color: 'text-green-600' };
      if (signal >= -90) return { text: 'Weak signal', color: 'text-yellow-600' };
      return { text: 'Very weak signal', color: 'text-red-600' };
    };

   // Determine packet delay status text and color
   const getDelayInfo = () => {
     if (!telemetry || telemetry.communicationLogs?.packetDelay == null) {
       return { text: 'Unknown', color: 'text-muted-foreground' };
     }
      const delay = telemetry.communicationLogs.packetDelay;
      if (delay <= 150) return { text: 'Low delay', color: 'text-green-600' };
      if (delay <= 250) return { text: 'Moderate delay', color: 'text-yellow-600' };
      return { text: 'High delay', color: 'text-red-600' };
   };

   const statusInfo = getStatusInfo();
   const delayInfo = getDelayInfo();


    // Render skeleton during SSR or initial client loading
    if (!isClient || isLoading) {
     return (
        <div className="space-y-4">
             <Skeleton className="h-8 w-1/3" />
             <Separator/>
             <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                 <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-3/4" /></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-3/4" /></CardContent></Card>
                 <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-3/4" /></CardContent></Card>
             </div>
         </div>
     );
   }


  return (
    <>
      {/* Sidebar is now in layout.tsx */}
      <div className="flex-1"> {/* Removed p-4, handled by layout */}
        <h1 className="font-semibold text-2xl mb-4">Communication Status ({selectedSatelliteId})</h1>

         {error && (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          )}

         {!telemetry && !error && !isLoading && (
              <Alert variant="default" className="my-4">
                 <Mail className="h-4 w-4" />
                 <AlertTitle>Waiting for Data</AlertTitle>
                 <AlertDescription>No communication data received yet for {selectedSatelliteId}. Ensure data is being sent.</AlertDescription>
             </Alert>
         )}

        {/* Display Communication Data from Real-time Telemetry */}
        {telemetry && (
         <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signal Strength</CardTitle>
                <SignalHigh className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
                 <div className="text-2xl font-bold">
                   {telemetry.communicationLogs?.signalStrength != null ? `${telemetry.communicationLogs.signalStrength} dBm` : 'N/A'}
                 </div>
                 <p className={`text-xs ${statusInfo.color}`}>
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
                    {telemetry.communicationLogs?.packetDelay != null ? `${telemetry.communicationLogs.packetDelay} ms` : 'N/A'}
                   </div>
                  <p className={`text-xs ${delayInfo.color}`}>
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

        {/* Optionally add a chart for signal strength/delay over time */}
        {/* <Separator className="my-6" />
        <Card>
           <CardHeader>
             <CardTitle>Communication History (Example)</CardTitle>
           </CardHeader>
           <CardContent>
             <Skeleton className="h-[200px] w-full" />
           </CardContent>
         </Card> */}
      </div>
    </>
  );
}
