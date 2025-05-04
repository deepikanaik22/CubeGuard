
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
} from "@/components/ui/sidebar";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
  Mail,
  Navigation,
  AlertTriangle,
  Cpu,
  Rocket, // Added Rocket icon
} from "lucide-react";
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Using simulated source now
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
import {getRiskScore, GetRiskScoreOutput} from "@/ai/flows/get-risk-score";
import React, {useState, useEffect, useCallback} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import { useSatellite } from '@/context/SatelliteContext';
import SatelliteSelector from '@/components/SatelliteSelector'; // Import SatelliteSelector

// Recharts needs client-side rendering
const DynamicAreaChart = dynamic(() =>
  import('recharts').then(mod => mod.AreaChart), { ssr: false });
const DynamicResponsiveContainer = dynamic(() =>
  import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

interface RiskScoreDisplayProps {
  riskScoreData: GetRiskScoreOutput | null;
  isLoading: boolean;
  error: string | null;
}

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({ riskScoreData, isLoading, error }) => {
  return (
    <>
       {error && (
         <Alert variant="destructive" className="mb-2 text-xs">
           <AlertTriangle className="h-3 w-3" />
           <AlertTitle className="text-xs">AI Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}
      <p className="text-2xl font-bold">
        {isLoading ? 'Calculating...' : (riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A')}
      </p>
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'AI analyzing risk...' : (riskScoreData ? riskScoreData.explanation : 'Awaiting telemetry data for analysis.')}
      </p>
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
        <Button onClick={fetchAnomalyExplanation} disabled={!telemetryAvailable || isLoadingAnomaly} variant="outline">
          {isLoadingAnomaly ? 'Loading...' : 'Get AI Explanation'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anomaly Explanation for {satelliteId}</DialogTitle>
           <DialogDescription>
            AI-powered analysis of the current anomaly risk score based on telemetry.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {isLoadingAnomaly ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Separator className="my-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Fetching Explanation</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : anomalyExplanation ? (
            <div>
              <h4 className="font-semibold mb-2">Explanation:</h4>
              <p className="text-sm text-muted-foreground mb-4">{anomalyExplanation.explanation}</p>
               <Separator className="my-4" />
              <h4 className="font-semibold mb-2">Risk Breakdown:</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Thermal: {anomalyExplanation.breakdown.thermal?.toFixed(1)}%</li>
                <li>Communication: {anomalyExplanation.breakdown.comm?.toFixed(1)}%</li>
                <li>Power: {anomalyExplanation.breakdown.power?.toFixed(1)}%</li>
                <li>Orientation: {anomalyExplanation.breakdown.orientation?.toFixed(1)}%</li>
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Click the button again to load the explanation.</p> // Initial or cleared state
          )}
        </div>
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
      variant: 'default', // Use 'default' for warnings
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

// Main Home Component
export default function Home() {
  const { selectedSatelliteId } = useSatellite(); // Get selected satellite ID from context
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]); // State for alerts
  const [error, setError] = useState<string | null>(null); // For telemetry subscription errors
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true);
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = useState(false);
  const [riskScoreError, setRiskScoreError] = useState<string | null>(null);
  const [anomalyExplanation, setAnomalyExplanation] = useState<ExplainAnomalyScoreOutput | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]); // For chart
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensure this runs only on the client
  }, []);


  // Subscribe to telemetry data (now simulated)
  useEffect(() => {
    if (!selectedSatelliteId || !isClient) return; // Don't subscribe if no satellite or not mounted

    console.log("Setting up telemetry subscription for:", selectedSatelliteId);
    setIsLoadingTelemetry(true);
    setError(null);
    // Reset states for the new satellite
    setTelemetry(null);
    setAlerts([]);
    setRiskScoreData(null);
    setRiskScoreError(null);
    setAnomalyExplanation(null);
    setAnomalyError(null);
    setTelemetryHistory([]);

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      // console.log("Received telemetry data:", data); // Can be noisy with simulation
      setIsLoadingTelemetry(false); // Stop loading once first data/null arrives

      if (data) {
        setTelemetry(data);
        const newAlerts = generateAlerts(data);
        setAlerts(newAlerts);

        // Update telemetry history for chart (keep last N points)
         setTelemetryHistory(prev => {
            const history = [...prev, data];
            // Keep only the last 30 data points
            return history.slice(-30);
         });

        // Trigger AI analysis automatically when new data arrives
        calculateRiskScore(data);
        setError(null); // Clear any previous subscription error
      } else {
        // Handle case where data is null (e.g., initial state or error)
        setTelemetry(null);
        setAlerts([]);
        setTelemetryHistory([]);
         console.warn(`No telemetry data received for ${selectedSatelliteId}. Simulation might be initializing or ID is unknown.`);
         // Don't set a persistent error here, let the UI show "Waiting for data"
      }
    }, (subError) => { // Error callback for the subscription itself
      console.error("Telemetry subscription error:", subError);
      setError(`Failed to subscribe to telemetry for ${selectedSatelliteId}.`);
      setIsLoadingTelemetry(false);
      // Reset all states on subscription error
      setTelemetry(null);
      setAlerts([]);
      setTelemetryHistory([]);
      setRiskScoreData(null);
      setRiskScoreError(null);
      setAnomalyExplanation(null);
      setAnomalyError(null);
    });

    // Cleanup function
    return () => {
      console.log("Unsubscribing from telemetry for:", selectedSatelliteId);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when satellite ID or client status changes


  // Function to calculate risk score using AI
  const calculateRiskScore = useCallback(async (currentTelemetry: TelemetryData | null) => {
    if (!currentTelemetry) {
      setRiskScoreError("Cannot calculate risk score without telemetry data.");
      setRiskScoreData(null);
      return;
    }

    // Prepare input for the getRiskScore flow
    const batteryLevel = Math.min(100, Math.max(0, Math.round(((currentTelemetry.batteryVoltage - 3.5) / (4.2 - 3.5)) * 100))); // Normalize voltage to % (adjust range if needed)
    const temperature = currentTelemetry.internalTemperature;
    let communicationStatus: "stable" | "unstable" | "lost";
    if (currentTelemetry.communicationLogs.signalStrength >= -85) {
      communicationStatus = "stable";
    } else if (currentTelemetry.communicationLogs.signalStrength >= -95) {
      communicationStatus = "unstable";
    } else {
      communicationStatus = "lost";
    }

    setIsLoadingRiskScore(true);
    setRiskScoreError(null);

    try {
      const result = await getRiskScore({
        batteryLevel,
        temperature,
        communicationStatus,
      });
      setRiskScoreData(result);
    } catch (aiError: any) {
      console.error("Error calling getRiskScore AI flow:", aiError);
      setRiskScoreError("AI Error: " + (aiError.message || "Failed to get risk score"));
      setRiskScoreData(null);
    } finally {
      setIsLoadingRiskScore(false);
    }
  }, []); // Empty dependency array, relies on passed currentTelemetry

  // Function to fetch anomaly explanation using AI
  const fetchAnomalyExplanation = useCallback(async () => {
    if (!telemetry) {
      setAnomalyError("Cannot fetch explanation without current telemetry data.");
      return;
    }
    setIsLoadingAnomaly(true);
    setAnomalyError(null);
    setAnomalyExplanation(null); // Clear previous explanation

    try {
      // The flow `explainAnomalyScore` now fetches its own data using the tool
      const explanation = await explainAnomalyScore({ satelliteId: selectedSatelliteId });
      setAnomalyExplanation(explanation);
    } catch (aiError: any) {
      console.error("Error calling explainAnomalyScore AI flow:", aiError);
       const errorMessage = aiError.message || "Failed to get explanation";
       // Check for specific Genkit/API errors if needed
      if (errorMessage.includes('429')) {
           setAnomalyError("API Rate Limit Exceeded. Please try again later.");
      } else if (errorMessage.includes('API key not valid')) {
           setAnomalyError("Invalid API Key. Please check your configuration.");
      }
      else {
           setAnomalyError(`AI Error: ${errorMessage}`);
      }
    } finally {
      setIsLoadingAnomaly(false);
    }
  }, [telemetry, selectedSatelliteId]); // Depend on telemetry and satelliteId


  // Format telemetry history for the chart
  const formattedChartData = telemetryHistory.map(t => ({
    name: t.timestamp instanceof Date ? t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A', // Format timestamp HH:MM:SS
    voltage: t.batteryVoltage,
    temp: t.internalTemperature,
    signal: t.communicationLogs?.signalStrength ?? -120, // Default if null
  }));


  // Render skeleton during initial client load or when telemetry is loading
  const renderSkeleton = () => (
     <div className="space-y-4">
         <div className="flex items-center justify-between mb-4">
             <Skeleton className="h-8 w-1/3" />
             <Skeleton className="h-10 w-36" />
         </div>
         <Separator/>
         <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
             <Skeleton className="h-24"/>
             <Skeleton className="h-24"/>
             <Skeleton className="h-24"/>
         </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
             <Skeleton className="h-36"/>
             <Skeleton className="h-36"/>
             <Skeleton className="h-36"/>
         </div>
         <Skeleton className="h-64 mb-4"/> {/* Chart */}
         <Skeleton className="h-40"/> {/* Alerts */}
     </div>
   );

  // Render content when data/error state is known
  const renderContent = () => {
    // Show loading state
    if (!isClient || isLoadingTelemetry && telemetryHistory.length === 0) { // Show skeleton if not client or loading initial data
        return renderSkeleton();
    }

    // Show error state for telemetry subscription
    if (error) {
        return (
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Telemetry Subscription Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        );
    }

    // Show message if no data has arrived yet (but subscription is active)
    if (!telemetry) {
        return (
          <Alert variant="default" className="my-4">
            <Rocket className="h-4 w-4" /> {/* Changed icon */}
            <AlertTitle>Waiting for Telemetry</AlertTitle>
            <AlertDescription>Attempting to receive data for {selectedSatelliteId}. Ensure the simulation is running or data source is active.</AlertDescription>
          </Alert>
        );
    }

    // --- Main Dashboard Content ---
    // Calculate derived states for display
    const batteryLevel = Math.min(100, Math.max(0, Math.round(((telemetry.batteryVoltage - 3.5) / (4.2 - 3.5)) * 100)));
    const temperature = telemetry.internalTemperature;
    let communicationStatus: "stable" | "unstable" | "lost";
     if (telemetry.communicationLogs.signalStrength >= -85) {
       communicationStatus = "stable";
     } else if (telemetry.communicationLogs.signalStrength >= -90) {
       communicationStatus = "unstable";
     } else {
       communicationStatus = "lost";
     }
    const commStatusColor = communicationStatus === 'stable' ? 'text-green-600' :
                            communicationStatus === 'unstable' ? 'text-yellow-600' : 'text-red-600';


    return (
      <>
        {/* Header with Satellite Selector and AI Explanation Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
             {/* <SidebarTrigger className="md:hidden" />  Mobile trigger can be here or in layout */}
             <h1 className="font-semibold text-2xl">
                CubeSense Dashboard
             </h1>
           </div>
           <div className="flex items-center gap-4">
             <SatelliteSelector />
             <DynamicAnomalyExplanation
               anomalyExplanation={anomalyExplanation}
               isLoadingAnomaly={isLoadingAnomaly}
               error={anomalyError}
               satelliteId={selectedSatelliteId}
               fetchAnomalyExplanation={fetchAnomalyExplanation}
               telemetryAvailable={!!telemetry} // Enable button only if telemetry is available
             />
           </div>
         </div>
         <Separator className="my-4" />

         {/* Key Telemetry Indicators */}
         <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Battery Level</CardTitle>
                <Battery className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{batteryLevel}%</div>
               <p className="text-xs text-muted-foreground">({telemetry.batteryVoltage?.toFixed(2)}V)</p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Internal Temp</CardTitle>
                <Thermometer className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{temperature?.toFixed(1)}°C</div>
                <p className="text-xs text-muted-foreground">Core electronics</p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Comm Status</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className={`text-2xl font-bold capitalize ${commStatusColor}`}>
                 {communicationStatus}
               </div>
               <p className="text-xs text-muted-foreground">Signal: {telemetry.communicationLogs?.signalStrength} dBm</p>
             </CardContent>
           </Card>
         </div>

          {/* AI Analysis and Current Telemetry Details */}
         <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
           <Card>
             <CardHeader>
               <CardTitle>AI Anomaly Risk Score</CardTitle>
             </CardHeader>
             <CardContent>
                 <RiskScoreDisplay
                  riskScoreData={riskScoreData}
                  isLoading={isLoadingRiskScore}
                  error={riskScoreError}
                />
             </CardContent>
           </Card>

            <Card>
             <CardHeader>
               <CardTitle>Current Telemetry Snapshot</CardTitle>
             </CardHeader>
             <CardContent>
                {/* Display more detailed telemetry */}
               <div className="space-y-1 text-sm">
                 <div><Waves className="inline h-4 w-4 mr-2 text-muted-foreground"/> Solar: {telemetry.solarPanelOutput?.toFixed(2)}W</div>
                 <div><Thermometer className="inline h-4 w-4 mr-2 text-blue-500"/> Ext Temp: {telemetry.externalTemperature?.toFixed(1)}°C</div>
                 <div><Navigation className="inline h-4 w-4 mr-2 text-muted-foreground"/> Gyro: ({telemetry.gyroscope?.x?.toFixed(2)}, {telemetry.gyroscope?.y?.toFixed(2)}, {telemetry.gyroscope?.z?.toFixed(2)})</div>
                 <div><Cpu className="inline h-4 w-4 mr-2 text-muted-foreground"/> Mag: ({telemetry.magnetometer?.x?.toFixed(3)}, ...)</div> {/* Abbreviated Mag */}
                 <div><Mail className="inline h-4 w-4 mr-2 text-muted-foreground"/> Delay: {telemetry.communicationLogs?.packetDelay} ms</div>
               </div>
             </CardContent>
           </Card>

            {/* Placeholder for future actions or status */}
            <Card>
               <CardHeader>
                 <CardTitle>System Status</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex items-center gap-2">
                    <Badge variant={alerts.some(a => a.variant === 'destructive') ? 'destructive' : 'secondary'}>
                       {alerts.some(a => a.variant === 'destructive') ? 'Alert Active' : 'Nominal'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">Last update: {telemetry.timestamp?.toLocaleTimeString()}</p>
                 </div>
                  {/* Potential actions could go here */}
               </CardContent>
             </Card>
         </div>


          {/* Telemetry History Chart */}
           <Card className="mb-4">
             <CardHeader>
               <CardTitle>Telemetry History (Voltage, Temp, Signal)</CardTitle>
             </CardHeader>
             <CardContent className="h-[250px]"> {/* Fixed height for container */}
                <DynamicResponsiveContainer width="100%" height="100%">
                 <DynamicAreaChart data={formattedChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                   <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                   <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" tick={{ fontSize: 10 }} domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                   <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                   <YAxis yAxisId="signal" orientation="right" dx={40} stroke="hsl(var(--chart-3))" tick={{ fontSize: 10 }} domain={[-120, -50]} />
                   <Tooltip contentStyle={{ fontSize: '12px', padding: '5px', backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                   <defs>
                      <linearGradient id="colorVoltage" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                       </linearGradient>
                   </defs>
                   <Area yAxisId="left" type="monotone" dataKey="voltage" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorVoltage)" name="Voltage (V)" dot={false} />
                   <Area yAxisId="right" type="monotone" dataKey="temp" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorTemp)" name="Temp (°C)" dot={false} />
                   <Area yAxisId="signal" type="monotone" dataKey="signal" stroke="hsl(var(--chart-3))" fillOpacity={1} fill="url(#colorSignal)" name="Signal (dBm)" dot={false} />
                 </DynamicAreaChart>
               </DynamicResponsiveContainer>
             </CardContent>
           </Card>


         {/* Live Alerts Section */}
         <div>
           <h2 className="font-semibold text-xl mb-2">Live Alerts</h2>
           <ScrollArea className="h-[250px] w-full rounded-md border">
              <div className="p-4 space-y-3">
               {alerts.length === 0 ? (
                 <p className="text-muted-foreground text-center py-4">No active alerts for {selectedSatelliteId}.</p>
               ) : (
                 alerts.map((alert) => (
                   <Alert key={alert.id} variant={alert.variant} className="mb-3">
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


   // --- Component Return ---
  return (
     // Layout structure is now handled by src/app/layout.tsx which includes SidebarProvider
     <>
       {/* Sidebar is rendered via layout */}
       <div className="flex-1"> {/* Main content area flex */}
           {/* Header is potentially in layout or here */}
           {/*<header className="p-4 border-b md:hidden flex items-center gap-2">
              <SidebarTrigger />
              <h1 className="font-semibold text-xl">CubeSense</h1>
           </header>*/}
          {/* Page content */}
          <div className="p-4"> {/* Padding for the main content */}
             {renderContent()}
          </div>
        </div>
      </>
  );
}
