'use client';
import dynamic from 'next/dynamic';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"; // Corrected: removed SidebarProvider from here
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
  Mail,
  Navigation,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { subscribeToTelemetryData, TelemetryData, getTelemetryData } from '@/services/telemetry';
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {Badge} from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {ScrollArea} from "@/components/ui/scroll-area";
import {explainAnomalyScore, ExplainAnomalyScoreOutput} from "@/ai/flows/explain-anomaly-score";
import {Skeleton} from "@/components/ui/skeleton";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Separator} from "@/components/ui/separator";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {getRiskScore, GetRiskScoreOutput} from "@/ai/flows/get-risk-score";
import React, {useState, useEffect, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import { useSatellite } from '@/context/SatelliteContext'; // Import useSatellite

// Example static data for chart
const chartData = [
  {name: "00:00", uv: 400, pv: 2400, amt: 2400},
  {name: "00:15", uv: 300, pv: 1398, amt: 2210},
  {name: "00:30", uv: 200, pv: 9800, amt: 2290},
  {name: "00:45", uv: 278, pv: 3908, amt: 2000},
  {name: "01:00", uv: 189, pv: 4800, amt: 2181},
  {name: "01:15", uv: 239, pv: 3800, amt: 2500},
  {name: "01:30", uv: 349, pv: 4300, amt: 2100},
];

interface RiskScoreDisplayProps {
  riskScoreData: GetRiskScoreOutput | null;
  isLoading: boolean;
}

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({riskScoreData, isLoading}) => {
  return (
    <>
      <p className="text-2xl font-bold">
        {isLoading ? 'Calculating...' : (riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A')}
      </p>
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'AI analyzing risk...' : (riskScoreData ? riskScoreData.explanation : 'Awaiting telemetry data for analysis.')}
      </p>
       {/* Button removed - calculation triggered by telemetry update */}
    </>
  );
};


interface AnomalyExplanationProps {
  anomalyExplanation: ExplainAnomalyScoreOutput | null;
  isLoadingAnomaly: boolean;
  error: string | null;
  satelliteId: string;
  fetchAnomalyExplanation: () => void; // Callback to trigger fetch
  telemetryAvailable: boolean; // To disable button if no telemetry
}

const AnomalyExplanation: React.FC<AnomalyExplanationProps> = ({
  anomalyExplanation,
  isLoadingAnomaly,
  error,
  satelliteId,
  fetchAnomalyExplanation,
  telemetryAvailable,
 }) => {

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Trigger fetch when dialog is opened */}
        <Button onClick={fetchAnomalyExplanation} disabled={!telemetryAvailable} variant="outline">
         Get Anomaly Explanation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Anomaly Explanation for {satelliteId}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {isLoadingAnomaly ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ) : error ? (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          ) : anomalyExplanation ? (
            <div>
              <p>{anomalyExplanation.explanation}</p>
              <h4 className="font-semibold mt-4 mb-2">Risk Breakdown:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Thermal: {anomalyExplanation.breakdown.thermal}%</li>
                <li>Communication: {anomalyExplanation.breakdown.comm}%</li>
                <li>Power: {anomalyExplanation.breakdown.power}%</li>
                <li>Orientation: {anomalyExplanation.breakdown.orientation}%</li>
              </ul>
            </div>
          ) : (
             "Click the button again to load the explanation." // Initial or cleared state
          )}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
};

// Keep DynamicAnomalyExplanation for client-side rendering
const DynamicAnomalyExplanation = dynamic(() => Promise.resolve(AnomalyExplanation), { ssr: false });

// Define alert types
interface AlertInfo {
  id: string;
  title: string;
  description: string;
  variant: 'default' | 'destructive';
  timestamp: Date;
}

// Generate alerts based on telemetry data
const generateAlerts = (telemetry: TelemetryData): AlertInfo[] => {
  const currentAlerts: AlertInfo[] = [];
  const now = new Date();

  if (telemetry.internalTemperature > 35) {
    currentAlerts.push({
      id: `high-temp-${now.getTime()}`,
      title: 'High Temperature Alert',
      description: `Internal temperature (${telemetry.internalTemperature.toFixed(1)}°C) exceeded threshold (35°C). Check thermal control system.`,
      variant: 'destructive',
      timestamp: now,
    });
  }
   if (telemetry.batteryVoltage < 3.7) {
    currentAlerts.push({
      id: `low-battery-${now.getTime()}`,
      title: 'Low Battery Voltage',
      description: `Battery voltage (${telemetry.batteryVoltage.toFixed(2)}V) is critical (Threshold: 3.7V). Check power generation and load.`,
      variant: 'destructive',
      timestamp: now,
    });
  }
  if (telemetry.communicationLogs?.signalStrength < -90) {
     currentAlerts.push({
       id: `comm-issue-signal-${now.getTime()}`,
       title: 'Communication Issue',
       description: `Signal strength (${telemetry.communicationLogs.signalStrength} dBm) is very weak (Threshold: -90 dBm). Possible obstruction or hardware issue.`,
       variant: 'destructive',
       timestamp: now,
     });
   }
    if (telemetry.communicationLogs?.packetDelay > 250) {
     currentAlerts.push({
       id: `comm-issue-delay-${now.getTime()}`,
       title: 'High Packet Delay',
       description: `Packet delay (${telemetry.communicationLogs.packetDelay} ms) is high (Threshold: 250 ms). Investigate network congestion or link quality.`,
       variant: 'destructive',
       timestamp: now,
     });
   }
   // Add more critical alerts here based on requirements

   // Sort alerts: destructive first, then by timestamp (newest first)
   currentAlerts.sort((a, b) => {
      if (a.variant === 'destructive' && b.variant !== 'destructive') return -1;
      if (a.variant !== 'destructive' && b.variant === 'destructive') return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
   });

  return currentAlerts;
};


export default function Home() {
  const { selectedSatelliteId } = useSatellite(); // Get selected satellite ID from context
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]); // State for alerts
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = useState(false);
  const [riskScoreError, setRiskScoreError] = useState<string | null>(null);
  const [anomalyExplanation, setAnomalyExplanation] = useState<ExplainAnomalyScoreOutput | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]); // For chart

  useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);

  // Subscribe to telemetry data
  useEffect(() => {
    if (!selectedSatelliteId) return; // Don't subscribe if no satellite is selected

    console.log("Setting up telemetry subscription for:", selectedSatelliteId);
    setIsLoadingTelemetry(true);
    setError(null);
    setTelemetry(null); // Clear previous data when satellite changes
    setAlerts([]);
    setRiskScoreData(null); // Clear AI results
    setAnomalyExplanation(null);
    setTelemetryHistory([]); // Clear history


    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      console.log("Received telemetry data:", data);
      setTelemetry(data);
       setIsLoadingTelemetry(false);

      if (data) {
         // Generate alerts based on new data
         const newAlerts = generateAlerts(data);
         setAlerts(newAlerts);

         // Update telemetry history for chart (keep last N points)
         setTelemetryHistory(prev => [...prev.slice(-29), data].slice(0, 30)); // Keep last 30 points


         // Trigger AI analysis automatically
         calculateRiskScore(data); // Pass current data
         // fetchAnomalyExplanation(); // Optionally trigger this too, or keep button

         setError(null);
      } else {
        console.warn(`No telemetry data found for ${selectedSatelliteId}. Waiting for updates...`);
         setAlerts([]); // Clear alerts if no data
         setTelemetryHistory([]); // Clear history
      }
    }, (subError) => {
        console.error("Telemetry subscription error:", subError);
        setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}. Check console and Firestore rules.`);
        setIsLoadingTelemetry(false);
        setTelemetry(null);
        setAlerts([]);
        setTelemetryHistory([]);
    });

    return () => {
      console.log("Unsubscribing from telemetry for:", selectedSatelliteId);
      unsubscribe();
    };
  }, [selectedSatelliteId]); // Re-subscribe when selectedSatelliteId changes

   // Calculate risk score based on the latest telemetry state
   const calculateRiskScore = useCallback(async (currentTelemetry: TelemetryData) => {
     // Calculate derived inputs for the AI model
     const batteryLevel = Math.round((currentTelemetry.batteryVoltage / 4.2) * 100);
     const temperature = currentTelemetry.internalTemperature;
     let communicationStatus: "stable" | "unstable" | "lost";
      if (currentTelemetry.communicationLogs.signalStrength >= -80) {
         communicationStatus = "stable";
       } else if (currentTelemetry.communicationLogs.signalStrength >= -90) {
         communicationStatus = "unstable";
       } else {
         communicationStatus = "lost";
       }


    if (batteryLevel === null || temperature === null || communicationStatus === null) {
      setRiskScoreError("Cannot calculate risk score without complete telemetry data.");
      return;
    }
    setIsLoadingRiskScore(true);
    setRiskScoreError(null);
    // setRiskScoreData(null); // Keep previous score while loading new one? Or clear? User preference.
    try {
      const riskScore = await getRiskScore({
        batteryLevel,
        temperature,
        communicationStatus,
      });
      setRiskScoreData(riskScore);
    } catch (error: any) {
      console.error("Error calculating risk score:", error);
      setRiskScoreError("AI Error: " + (error.message || "Unknown error"));
      setRiskScoreData(null); // Clear score on error
    } finally {
       setIsLoadingRiskScore(false);
    }
  }, []); // Dependencies will be handled by passing currentTelemetry

  // Fetch anomaly explanation
   const fetchAnomalyExplanation = useCallback(async () => {
     if (!telemetry) { // Check if telemetry data is available
       setAnomalyError("Cannot fetch explanation without telemetry data.");
       return;
     }
     try {
       setAnomalyError(null);
       setIsLoadingAnomaly(true);
       setAnomalyExplanation(null); // Clear previous explanation

       // Pass current telemetry data directly to the flow if needed,
       // or rely on the flow's tool to fetch it using the satelliteId.
       // Assuming the flow uses the tool:
       const explanation = await explainAnomalyScore({ satelliteId: selectedSatelliteId });
       setAnomalyExplanation(explanation);
     } catch (error: any) {
        console.error("Error fetching anomaly explanation:", error);
        const errorMessage = error.message || "Unknown error";
        setAnomalyError(`Error fetching anomaly explanation: ${errorMessage}`);
     } finally {
       setIsLoadingAnomaly(false);
     }
   }, [telemetry, selectedSatelliteId]);


   // Format telemetry history for the chart
    const formattedChartData = telemetryHistory.map(t => ({
       name: t.timestamp instanceof Date ? t.timestamp.toLocaleTimeString() : 'N/A', // Format timestamp
       voltage: t.batteryVoltage,
       temp: t.internalTemperature,
       signal: t.communicationLogs?.signalStrength ?? -120, // Default if null
     }));


   // Render skeleton during SSR or initial client render before mount
   if (!isClient) {
     return (
        <div className="flex flex-col p-4 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Separator/>
            <Skeleton className="h-64"/>
        </div>
     );
   }

  // Main page content rendering logic
  const renderContent = () => {
      if (isLoadingTelemetry) {
          return (
             <div className="space-y-4">
                 <p>Loading telemetry data for {selectedSatelliteId}...</p>
                 <Skeleton className="h-32"/>
                 <Skeleton className="h-40"/>
                 <Skeleton className="h-64"/>
             </div>
          );
      }
      if (error) {
           return (
             <Alert variant="destructive" className="my-4">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Telemetry Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          );
      }
      if (!telemetry) {
          return (
             <Alert variant="default" className="my-4">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>No Data</AlertTitle>
                 <AlertDescription>Waiting for telemetry data for {selectedSatelliteId}. Ensure data is being sent to Firestore.</AlertDescription>
             </Alert>
          );
      }

      // Derived states for display (already calculated for AI)
      const batteryLevel = Math.round((telemetry.batteryVoltage / 4.2) * 100);
      const temperature = telemetry.internalTemperature;
      let communicationStatus: "stable" | "unstable" | "lost";
       if (telemetry.communicationLogs.signalStrength >= -80) {
         communicationStatus = "stable";
       } else if (telemetry.communicationLogs.signalStrength >= -90) {
         communicationStatus = "unstable";
       } else {
         communicationStatus = "lost";
       }


      // Main content when data is loaded
      return (
         <>
           <div className="flex items-center justify-between mb-4">
             <h1 className="font-semibold text-2xl">
               Dashboard ({selectedSatelliteId})
             </h1>
             <DynamicAnomalyExplanation
                anomalyExplanation={anomalyExplanation}
                isLoadingAnomaly={isLoadingAnomaly}
                error={anomalyError}
                satelliteId={selectedSatelliteId}
                fetchAnomalyExplanation={fetchAnomalyExplanation}
                telemetryAvailable={!!telemetry} // Pass boolean indicating if telemetry is loaded
             />
           </div>
           <Separator className="my-4" />

           {/* Input/Display Cards - Reflect real-time data */}
           <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
             <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Battery Level</CardTitle>
                  <Battery className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{batteryLevel}%</div>
                 <p className="text-xs text-muted-foreground">Current charge</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Internal Temp</CardTitle>
                  <Thermometer className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{temperature?.toFixed(1)}°C</div>
                  <p className="text-xs text-muted-foreground">Core electronics temperature</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                 <CardTitle className="text-sm font-medium">Comm Status</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 <div className={`text-2xl font-bold capitalize ${
                     communicationStatus === 'stable' ? 'text-green-600' :
                     communicationStatus === 'unstable' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{communicationStatus}</div>
                 <p className="text-xs text-muted-foreground">Signal: {telemetry.communicationLogs?.signalStrength} dBm</p>
               </CardContent>
             </Card>
           </div>

            {/* AI Analysis and Current Telemetry Cards */}
           <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
             <Card>
               <CardHeader>
                 <CardTitle>Anomaly Risk Score</CardTitle>
               </CardHeader>
               <CardContent>
                  {riskScoreError && (
                      <Alert variant="destructive" className="mb-2">
                         <AlertTriangle className="h-4 w-4" />
                         <AlertTitle>Risk Score Error</AlertTitle>
                         <AlertDescription>{riskScoreError}</AlertDescription>
                      </Alert>
                  )}
                  <RiskScoreDisplay
                   riskScoreData={riskScoreData}
                   isLoading={isLoadingRiskScore}
                 />
               </CardContent>
             </Card>

              <Card>
               <CardHeader>
                 <CardTitle>Current Telemetry</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-1 text-sm">
                   {/* Simplified display */}
                   <div><Battery className="inline h-4 w-4 mr-2 text-muted-foreground"/> Voltage: {telemetry.batteryVoltage?.toFixed(2)}V</div>
                   <div><Waves className="inline h-4 w-4 mr-2 text-muted-foreground"/> Solar: {telemetry.solarPanelOutput?.toFixed(2)}W</div>
                   <div><Thermometer className="inline h-4 w-4 mr-2 text-blue-500"/> Ext Temp: {telemetry.externalTemperature?.toFixed(1)}°C</div>
                   <div><Navigation className="inline h-4 w-4 mr-2 text-muted-foreground"/> Gyro: ({telemetry.gyroscope?.x?.toFixed(2)}, {telemetry.gyroscope?.y?.toFixed(2)})</div>
                   <div><Mail className="inline h-4 w-4 mr-2 text-muted-foreground"/> Delay: {telemetry.communicationLogs?.packetDelay} ms</div>
                 </div>
               </CardContent>
             </Card>

             {/* Placeholder for future logs or actions */}
              <Card>
                 <CardHeader>
                   <CardTitle>System Log</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground">No system events logged yet.</p>
                   {/* Logs could be displayed here */}
                 </CardContent>
               </Card>
           </div>


            {/* Telemetry Chart */}
             <Card className="mb-4">
               <CardHeader>
                 <CardTitle>Telemetry History (Voltage, Temp, Signal)</CardTitle>
               </CardHeader>
               <CardContent>
                 <ResponsiveContainer width="100%" height={250}>
                   <AreaChart data={formattedChartData}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                     <YAxis yAxisId="left" stroke="hsl(var(--primary))" tick={{ fontSize: 10 }} />
                     <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" tick={{ fontSize: 10 }} />
                     <YAxis yAxisId="signal" orientation="right" dx={40} stroke="hsl(var(--chart-3))" tick={{ fontSize: 10 }} />
                     <Tooltip contentStyle={{ fontSize: '12px', padding: '5px' }}/>
                     <Area yAxisId="left" type="monotone" dataKey="voltage" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Voltage (V)" />
                     <Area yAxisId="right" type="monotone" dataKey="temp" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.2} name="Temp (°C)" />
                      <Area yAxisId="signal" type="monotone" dataKey="signal" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.2} name="Signal (dBm)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>


           {/* Alerts Section */}
           <div>
             <h2 className="font-semibold text-xl mb-2">Live Alerts</h2>
             <ScrollArea className="h-[250px] w-full rounded-md border">
                <div className="p-4 space-y-3"> {/* Added space-y-3 */}
                 {alerts.length === 0 ? (
                   <p className="text-muted-foreground text-center py-4">No active alerts.</p>
                 ) : (
                   alerts.map((alert) => (
                     <Alert key={alert.id} variant={alert.variant} className="mb-3"> {/* Added mb-3 */}
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
      );
  };

  return (
     // The main structure is now in RootLayout, this just renders the page content
      <>
         {/* Mobile header and trigger are in RootLayout */}
         {renderContent()}
      </>
  );
}
