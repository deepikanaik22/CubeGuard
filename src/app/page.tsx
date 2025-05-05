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
  useSidebar
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
import { getTelemetryData, TelemetryData } from '@/services/telemetry'; // Using simulated source now
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
import {explainAnomalyScore} from "@/ai/flows/explain-anomaly-score";
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
import {getRiskScore} from "@/ai/flows/get-risk-score";
import React, {useState, useEffect, useCallback, memo} from 'react';
import {useRouter} from 'next/navigation';
import { useSatellite } from '@/context/SatelliteContext';
import SatelliteSelector from '@/components/SatelliteSelector'; // Import SatelliteSelector
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Import types from the centralized types file
import type { GetRiskScoreOutput, ExplainAnomalyScoreOutput } from '@/ai/types';


// Recharts needs client-side rendering
const DynamicAreaChart = dynamic(() =>
  import('recharts').then(mod => mod.AreaChart), { ssr: false });
const DynamicResponsiveContainer = dynamic(() =>
  import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

interface RiskScoreDisplayProps {
  riskScoreData: GetRiskScoreOutput | null;
  isLoading: boolean;
  error: string | null;
  calculateRiskScore: () => void; // Add calculateRiskScore prop
}

// Memoize RiskScoreDisplay
const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = memo(({ riskScoreData, isLoading, error, calculateRiskScore }) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  return (
    <>
       {isClient && error && (
         <Alert variant="destructive" className="mb-2 text-xs">
           <AlertTriangle className="h-3 w-3" />
           <AlertTitle className="text-xs">AI Risk Score Error</AlertTitle>
           <AlertDescription>{error}</AlertDescription>
         </Alert>
       )}
       <p className="text-2xl font-bold">
         {isClient ? (isLoading ? 'Calculating...' : (riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A')) : <Skeleton className="h-8 w-1/2"/>}
       </p>
       <p className="text-sm text-muted-foreground">
         {isClient ? (isLoading ? 'AI analyzing risk...' : (riskScoreData ? riskScoreData.explanation : 'Click button to calculate risk.')) : <Skeleton className="h-4 w-3/4"/>}
       </p>
       {isClient && ( // Only render button on client
         <Button onClick={calculateRiskScore} disabled={isLoading} className="mt-4">
           {isLoading ? 'Calculating...' : 'Calculate Risk'}
         </Button>
       )}
    </>
  );
});
RiskScoreDisplay.displayName = 'RiskScoreDisplay';


interface AnomalyExplanationProps {
  telemetry: TelemetryData | null; // Pass telemetry data
  satelliteId: string; // Pass satelliteId
}

// Memoize AnomalyExplanation
const AnomalyExplanation: React.FC<AnomalyExplanationProps> = memo(({ telemetry, satelliteId }) => {
  const [anomalyExplanation, setAnomalyExplanation] = useState<ExplainAnomalyScoreOutput | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [anomalyError, setAnomalyError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

   // Function to fetch anomaly explanation using AI
  const fetchAnomalyExplanation = useCallback(async () => {
    // Note: Telemetry is no longer passed directly, the flow fetches it using the tool
    setIsLoadingAnomaly(true);
    setAnomalyError(null);
    setAnomalyExplanation(null); // Clear previous explanation

    try {
      const explanation = await explainAnomalyScore({ satelliteId: satelliteId });
      setAnomalyExplanation(explanation);
    } catch (aiError: any) {
      console.error("Error calling explainAnomalyScore AI flow:", aiError);
       let errorMessage = "Failed to get anomaly explanation.";
        if (aiError instanceof Error) {
            errorMessage = aiError.message;
        } else if (typeof aiError === 'string') {
            errorMessage = aiError;
        }

        if (errorMessage.includes('400 Bad Request') || errorMessage.includes('API key not valid')) {
            setAnomalyError("AI Error: Invalid API Key or bad request. Please check your configuration and Genkit setup.");
        } else if (errorMessage.includes('429')) {
            setAnomalyError("AI Error: API Rate Limit Exceeded. Please try again later.");
        } else {
            setAnomalyError(`AI Error: ${errorMessage}`);
        }
    } finally {
      setIsLoadingAnomaly(false);
    }
  }, [satelliteId]); // Removed telemetry dependency here

  return (
    <Dialog>
      <DialogTrigger asChild>
        {/* Ensure button is only interactive on client */}
        <Button onClick={isClient ? fetchAnomalyExplanation : undefined} disabled={!isClient || isLoadingAnomaly} variant="outline">
          {isLoadingAnomaly ? 'Loading...' : 'Get Anomaly Explanation'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anomaly Explanation for {satelliteId}</DialogTitle>
           <DialogDescription>
            AI-powered analysis of the anomaly risk score based on latest telemetry.
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
          ) : anomalyError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{anomalyError}</AlertDescription>
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
             <p className="text-sm text-muted-foreground text-center py-4">Click the button to load the explanation.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
AnomalyExplanation.displayName = 'AnomalyExplanation';

// Keep DynamicAnomalyExplanation for client-side rendering if needed, though memo might suffice
const DynamicAnomalyExplanation = dynamic(() => Promise.resolve(AnomalyExplanation), { ssr: false });


function HomeInner({
  batteryLevel,
  temperature,
  communicationStatus,
  setBatteryLevel,
  setTemperature,
  setCommunicationStatus,
  riskScoreData,
  telemetry,
  error,
  calculateRiskScore,
}: any) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar(); // ✅ Now safely used inside SidebarProvider

  return (
    <>
      <Sidebar className="w-60">
          <SidebarHeader>
             <div className="flex flex-col gap-2 p-4">
               <div className="flex items-center gap-2">
                  <Rocket className="h-6 w-6 text-primary" />
                  <h2 className="font-semibold text-lg">CubeSense</h2>
                </div>
                {/* Use SatelliteSelector here */}
               <SatelliteSelector />
             </div>
          </SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuButton onClick={() => router.push('/')} isActive={router.pathname === '/'}>
                  <Navigation className="mr-2 h-4 w-4" />
                  <span>Overview</span>
                </SidebarMenuButton>
                <SidebarMenuButton onClick={() => router.push('/telemetry')} isActive={router.pathname === '/telemetry'}>
                  <Cpu className="mr-2 h-4 w-4" />
                  <span>Telemetry</span>
                </SidebarMenuButton>
                <SidebarMenuButton onClick={() => router.push('/alerts')} isActive={router.pathname === '/alerts'}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Alerts</span>
                   {/* Add badge logic if needed */}
                </SidebarMenuButton>
                 <SidebarMenuButton onClick={() => router.push('/communication')} isActive={router.pathname === '/communication'}>
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Communication</span>
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <p className="text-xs text-muted-foreground p-4">
              CubeSense Monitoring v1.0
            </p>
          </SidebarFooter>
        </Sidebar>
      <div className="flex-1 p-4">
         {/* Header for mobile - Keep this structure */}
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
           <SidebarTrigger className="md:hidden"/>
           <h1 className="text-xl font-semibold ml-2">CubeSense</h1>
           <div className="ml-auto"><SatelliteSelector /></div>
        </header>

         {/* Main content */}
         <div> {/* Main content wrapper */}
            {/* Desktop Header */}
             <div className="hidden md:flex flex-wrap items-center justify-between gap-4 mb-4">
               <div className="flex items-center gap-2">
                 <h1 className="font-semibold text-2xl">
                    CubeSense Dashboard ({telemetry?.id || '...'}) {/* Display selected satellite ID */}
                 </h1>
               </div>
               <div className="flex items-center gap-4">
                   {/* Use SatelliteSelector on Desktop */}
                   <SatelliteSelector />
                   {/* Use DynamicAnomalyExplanation */}
                   <DynamicAnomalyExplanation
                     telemetry={telemetry} // Pass telemetry if needed by the component internally
                     satelliteId={telemetry?.id || ""} // Pass satellite ID
                   />
               </div>
             </div>
             <Separator className="my-4 hidden md:block" />

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Simulation Input Area */}
             <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Simulate Telemetry Input</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="battery-level" className="min-w-[100px]">Battery (%)</Label>
                        <Input
                            type="number"
                            id="battery-level"
                            value={batteryLevel}
                            onChange={(e) => setBatteryLevel(Number(e.target.value))}
                            className="w-20"
                        />
                    </div>
                     <div className="flex items-center space-x-2">
                        <Label htmlFor="temperature" className="min-w-[100px]">Temperature (°C)</Label>
                        <Input
                            type="number"
                            id="temperature"
                            value={temperature}
                            onChange={(e) => setTemperature(Number(e.target.value))}
                            className="w-20"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                         <Label htmlFor="comm-status" className="min-w-[100px]">Comm Status</Label>
                         <Select value={communicationStatus} onValueChange={(value: "stable" | "unstable" | "lost") => setCommunicationStatus(value)}>
                             <SelectTrigger className="w-[180px]">
                                 <SelectValue placeholder="Select status" />
                             </SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="stable">Stable</SelectItem>
                                 <SelectItem value="unstable">Unstable</SelectItem>
                                 <SelectItem value="lost">Lost</SelectItem>
                             </SelectContent>
                         </Select>
                    </div>
                </CardContent>
             </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Anomaly Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskScoreDisplay
                  riskScoreData={riskScoreData}
                  isLoading={false} // Adjust based on actual loading state if needed
                  error={null} // Adjust based on actual error state if needed
                  calculateRiskScore={calculateRiskScore}
                />
              </CardContent>
            </Card>

             {/* Display Fetched Telemetry Data if available */}
            {telemetry && (
                 <Card className="mt-6">
                     <CardHeader>
                         <CardTitle>Live Telemetry Data ({telemetry.id})</CardTitle>
                     </CardHeader>
                     <CardContent>
                         <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
                             {JSON.stringify(telemetry, (key, value) =>
                                 // Format Date objects nicely
                                 key === 'timestamp' && value instanceof Date ? value.toISOString() : value,
                             2)}
                         </pre>
                     </CardContent>
                 </Card>
             )}
        </div>
      </div>
    </>
  );
}

export default function Home() {
  const [batteryLevel, setBatteryLevel] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(25);
  const [communicationStatus, setCommunicationStatus] = useState<"stable" | "unstable" | "lost">("stable");
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use the context hook to get the selected satellite ID
   const { selectedSatelliteId } = useSatellite(); // Use context


  const calculateRiskScore = async () => {
    try {
      setError(null);
      const riskScore = await getRiskScore({
        batteryLevel,
        temperature,
        communicationStatus,
      });
      setRiskScoreData(riskScore);
    } catch (error: any) {
      setError("An error occurred while calculating risk score: " + error.message);
       // Log the full error for debugging
      console.error("Risk Score Calculation Error:", error);
    }
  };

  const fetchTelemetry = useCallback(async () => {
    try {
      setError(null);
      const telemetryData = await getTelemetryData(selectedSatelliteId); // Use selected ID
      setTelemetry(telemetryData);
       // Update input fields based on fetched/simulated data if needed
      if (telemetryData) {
        setBatteryLevel(Math.min(100, Math.max(0, Math.round(((telemetryData.batteryVoltage - 3.5) / (4.2 - 3.5)) * 100))));
        setTemperature(telemetryData.internalTemperature);
         // Determine communication status based on signal strength (example logic)
        if (telemetryData.communicationLogs?.signalStrength >= -85) {
          setCommunicationStatus("stable");
        } else if (telemetryData.communicationLogs?.signalStrength >= -90) {
          setCommunicationStatus("unstable");
        } else {
          setCommunicationStatus("lost");
        }
      }
    } catch (error: any) {
      setError("An error occurred while fetching telemetry data: " + error.message);
       console.error("Telemetry Fetch Error:", error);
    }
  }, [selectedSatelliteId]); // Depend on selectedSatelliteId

  useEffect(() => {
    // Initial fetch
    fetchTelemetry();

    // Set up interval to fetch/simulate data periodically
    const intervalId = setInterval(fetchTelemetry, 5000); // Fetch every 5 seconds

    // Cleanup function to clear the interval when the component unmounts or selectedSatelliteId changes
    return () => clearInterval(intervalId);
  }, [fetchTelemetry]); // fetchTelemetry includes selectedSatelliteId dependency

  return (
    // SidebarProvider is now in layout.tsx
      <HomeInner
        batteryLevel={batteryLevel}
        temperature={temperature}
        communicationStatus={communicationStatus}
        setBatteryLevel={setBatteryLevel}
        setTemperature={setTemperature}
        setCommunicationStatus={setCommunicationStatus}
        riskScoreData={riskScoreData}
        telemetry={telemetry}
        error={error}
        calculateRiskScore={calculateRiskScore}
      />
  );
}
