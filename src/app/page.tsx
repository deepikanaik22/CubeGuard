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
} from "lucide-react";
// Import subscribeToTelemetryData
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry';
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
  calculateRiskScore: () => void;
  isLoading: boolean;
  telemetry: TelemetryData | null; // Pass telemetry to determine input values
}

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({riskScoreData, calculateRiskScore, isLoading, telemetry}) => {

  return (
    <>
      <p className="text-2xl font-bold">
        {isLoading ? 'Calculating...' : (riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A')}
      </p>
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'Please wait...' : (riskScoreData ? riskScoreData.explanation : 'Click button to calculate risk based on current telemetry.')}
      </p>
       {/* Button triggers calculation based on the latest telemetry derived state */}
       <Button onClick={calculateRiskScore} disabled={isLoading || !telemetry} className="mt-2">
        {isLoading ? 'Calculating...' : 'Calculate Risk Score'}
      </Button>
    </>
  );
};

// Simple AlertList component for demonstration
function AlertList() {
  // In a real app, this would likely fetch or subscribe to alert data
  const alerts = [
    {
      id: 'temp-1',
      title: 'High Temperature Alert',
      description: 'Internal temperature exceeded threshold.',
      variant: 'destructive',
    },
    {
      id: 'batt-1',
      title: 'Low Battery Voltage',
      description: 'Battery voltage is below the critical level.',
      variant: 'destructive',
    },
    {
      id: 'comm-1',
      title: 'Communication Issue',
      description: 'Signal strength is weak, packet delay is high.',
      variant: 'default', // Example of a non-destructive alert
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {alerts.length === 0 ? (
         <p className="text-muted-foreground text-center">No active alerts.</p>
      ) : (
         alerts.map((alert) => (
            <Alert key={alert.id} variant={alert.variant as "default" | "destructive"} className="mb-4">
               <AlertTriangle className="h-4 w-4"/>
               <AlertTitle>{alert.title}</AlertTitle>
               <AlertDescription>{alert.description}</AlertDescription>
            </Alert>
         ))
      )}
    </div>
  );
}


interface AnomalyExplanationProps {
  telemetry: TelemetryData | null;
  satelliteId: string;
}

const AnomalyExplanation: React.FC<AnomalyExplanationProps> = ({ telemetry, satelliteId }) => {
  const [anomalyExplanation, setAnomalyExplanation] = useState<ExplainAnomalyScoreOutput | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalyExplanation = useCallback(async () => {
    if (!telemetry) {
      setError("Cannot fetch explanation without telemetry data.");
      return;
    }
    try {
      setError(null);
      setIsLoadingAnomaly(true);
      setAnomalyExplanation(null); // Clear previous explanation

      const explanation = await explainAnomalyScore({
        satelliteId: satelliteId,
        // No need to pass telemetryData if the flow uses the tool
      });
      setAnomalyExplanation(explanation);
    } catch (error: any) {
       console.error("Error fetching anomaly explanation:", error);
       const errorMessage = error.message || "Unknown error";
       setError(`Error fetching anomaly explanation: ${errorMessage}`);
    } finally {
      setIsLoadingAnomaly(false);
    }
  }, [telemetry, satelliteId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={fetchAnomalyExplanation} disabled={!telemetry} variant="outline">
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

const DynamicAnomalyExplanation = dynamic(() => Promise.resolve(AnomalyExplanation), { ssr: false });


function HomeContent({
  telemetry,
  error,
  satelliteId,
  isLoadingTelemetry
}: {
  telemetry: TelemetryData | null;
  error: string | null;
  satelliteId: string;
  isLoadingTelemetry: boolean;
}) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = useState(false);
  const [riskScoreError, setRiskScoreError] = useState<string | null>(null);

  // Calculate derived states from telemetry for display/input
  const batteryLevel = telemetry ? Math.round((telemetry.batteryVoltage / 4.2) * 100) : null;
  const temperature = telemetry ? telemetry.internalTemperature : null;
  let communicationStatus: "stable" | "unstable" | "lost" | null = null;
   if (telemetry) {
     if (telemetry.communicationLogs.signalStrength < -90) {
       communicationStatus = "lost";
     } else if (telemetry.communicationLogs.signalStrength < -80) {
       communicationStatus = "unstable";
     } else {
       communicationStatus = "stable";
     }
   }

   // Calculate risk score based on the latest telemetry state
   const calculateRiskScore = useCallback(async () => {
    if (!telemetry || batteryLevel === null || temperature === null || communicationStatus === null) {
      setRiskScoreError("Cannot calculate risk score without complete telemetry data.");
      return;
    }
    setIsLoadingRiskScore(true);
    setRiskScoreError(null);
    setRiskScoreData(null); // Clear previous score
    try {
      const riskScore = await getRiskScore({
        batteryLevel,
        temperature,
        communicationStatus,
      });
      setRiskScoreData(riskScore);
    } catch (error: any) {
      console.error("Error calculating risk score:", error);
      setRiskScoreError("Error calculating risk score: " + (error.message || "Unknown error"));
    } finally {
       setIsLoadingRiskScore(false);
    }
  }, [telemetry, batteryLevel, temperature, communicationStatus]);


  return (
    <>
      {/* Sidebar remains the same */}
      <Sidebar className="w-60">
         <SidebarHeader>
           <h2 className="font-semibold text-lg">CubeSense</h2>
         </SidebarHeader>
         <SidebarSeparator />
         <SidebarContent>
           <SidebarGroup>
             <SidebarMenu>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/') }}>
                 <Navigation className="mr-2 h-4 w-4" />
                 <span>Overview</span>
               </SidebarMenuButton>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/telemetry') }}>
                 <Cpu className="mr-2 h-4 w-4" />
                 <span>Telemetry</span>
               </SidebarMenuButton>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/alerts') }}>
                 <AlertTriangle className="mr-2 h-4 w-4" />
                 <span>Alerts</span>
                 {/* Dynamic alert count could be added here */}
               </SidebarMenuButton>
               <SidebarMenuButton onClick={() => { setOpenMobile(false); router.push('/communication') }}>
                 <Mail className="mr-2 h-4 w-4" />
                 <span>Communication</span>
               </SidebarMenuButton>
             </SidebarMenu>
           </SidebarGroup>
         </SidebarContent>
         <SidebarFooter>
           <p className="text-xs text-muted-foreground">
             CubeSense - Satellite Monitoring
           </p>
         </SidebarFooter>
       </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 p-4">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-4">
              <SidebarTrigger className="block md:hidden" />
              <h1 className="font-semibold text-2xl">
                Satellite Dashboard ({satelliteId})
              </h1>
            </div>
            {/* Pass telemetry to AnomalyExplanation */}
            <DynamicAnomalyExplanation telemetry={telemetry} satelliteId={satelliteId} />
         </div>


         {/* Show loading skeletons or error message */}
         {isLoadingTelemetry ? (
             <div className="space-y-4">
                 <Skeleton className="h-8 w-1/2" />
                 <Separator/>
                 <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                     <Skeleton className="h-32"/>
                     <Skeleton className="h-32"/>
                     <Skeleton className="h-32"/>
                     <Skeleton className="h-40"/>
                     <Skeleton className="h-40"/>
                     <Skeleton className="h-40 md:col-span-2 lg:col-span-1"/>
                 </div>
                 <Separator/>
                 <Skeleton className="h-64"/>
             </div>
         ) : error ? (
             <Alert variant="destructive" className="my-4">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Telemetry Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          ) : !telemetry ? (
             <Alert variant="default" className="my-4">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>No Data</AlertTitle>
                 <AlertDescription>Waiting for telemetry data for {satelliteId}. Ensure data is being sent to Firestore.</AlertDescription>
             </Alert>
          ) : (
            // Render actual content when data is loaded
            <>
              <Separator className="my-4" />

              {/* Input/Display Cards - Reflect real-time data */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Battery Level</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="battery-level">Level (%):</Label>
                       <Input
                        type="number"
                        id="battery-level"
                        value={batteryLevel ?? ''}
                        readOnly
                        className="w-20"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Current battery level.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Temperature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="temperature">Temp (°C):</Label>
                       <Input
                        type="number"
                        id="temperature"
                        value={temperature ?? ''}
                        readOnly
                        className="w-20"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Current internal temperature.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Communication Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="communication-status">Status:</Label>
                       <Select value={communicationStatus ?? ''} disabled>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="stable">Stable</SelectItem>
                          <SelectItem value="unstable">Unstable</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <p className="text-xs text-muted-foreground mt-1">Based on signal strength.</p>
                  </CardContent>
                </Card>
              </div>


               {/* Display Cards */}
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Telemetry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Battery className="h-4 w-4 text-muted-foreground" />
                        <span>Voltage: {telemetry.batteryVoltage?.toFixed(2)}V</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Waves className="h-4 w-4 text-muted-foreground" />
                        <span>Solar Output: {telemetry.solarPanelOutput?.toFixed(2)}W</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <span>Internal Temp: {telemetry.internalTemperature?.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Thermometer className="h-4 w-4 text-blue-500" />
                        <span>External Temp: {telemetry.externalTemperature?.toFixed(1)}°C</span>
                      </div>
                       <div className="flex items-center space-x-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span>Gyro: ({telemetry.gyroscope?.x?.toFixed(2)}, {telemetry.gyroscope?.y?.toFixed(2)}, {telemetry.gyroscope?.z?.toFixed(2)})</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <Mail className="h-4 w-4 text-muted-foreground"/>
                          <span>Signal: {telemetry.communicationLogs?.signalStrength} dBm, Delay: {telemetry.communicationLogs?.packetDelay} ms</span>
                       </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Anomaly Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                     {riskScoreError && (
                         <Alert variant="destructive" className="mb-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Risk Score Error</AlertTitle>
                            <AlertDescription>{riskScoreError}</AlertDescription>
                         </Alert>
                     )}
                     <RiskScoreDisplay
                      riskScoreData={riskScoreData}
                      calculateRiskScore={calculateRiskScore}
                      isLoading={isLoadingRiskScore}
                      telemetry={telemetry}
                    />
                  </CardContent>
                </Card>

                <Card className="col-span-1 md:col-span-2 lg:col-span-1"> {/* Chart */}
                  <CardHeader>
                    <CardTitle>Telemetry Chart (Example)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart
                        data={chartData} // Replace with real-time data array if implemented
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="pv" // Example data key
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-muted-foreground mt-2">Example chart showing static data.</p>
                  </CardContent>
                </Card>
              </div>


              <Separator className="my-4" />

              {/* Alerts Section */}
              <div>
                <h2 className="font-semibold text-xl mb-2">Alerts (Demo)</h2>
                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <AlertList />
                </ScrollArea>
              </div>
            </>
          )}
       </div>
    </>
  );
};


export default function Home() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(true); // Start in loading state
  const [isClient, setIsClient] = useState(false); // Track client-side mount

  const satelliteId = "cubesat-001"; // Example satellite ID

  // Subscribe to telemetry data on component mount (client-side only)
  useEffect(() => {
     setIsClient(true); // Component has mounted

     console.log("Setting up telemetry subscription for:", satelliteId);
     setIsLoadingTelemetry(true); // Set loading state
     setError(null); // Clear previous errors

     const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
        console.log("Received telemetry data:", data);
        setTelemetry(data);
        setIsLoadingTelemetry(false); // Data received (or null), stop loading
        setError(null); // Clear error on successful data fetch (even if data is null)
        if (data === null) {
           // Optionally set a specific message if the document doesn't exist
           // setError(`No telemetry data found for ${satelliteId}. Waiting for updates...`);
           console.warn(`No telemetry data found for ${satelliteId}. Waiting for updates...`);
        }
     }, (subError) => { // Handle subscription errors
         console.error("Telemetry subscription error:", subError);
         setError(`Failed to subscribe to telemetry for ${satelliteId}. Check console and Firestore rules.`);
         setIsLoadingTelemetry(false); // Stop loading on error
         setTelemetry(null); // Clear any stale data
     });

     // Clean up subscription on component unmount
     return () => {
       console.log("Unsubscribing from telemetry for:", satelliteId);
       unsubscribe();
     };
   }, [satelliteId]); // Re-subscribe if satelliteId changes


   // Render null or a basic layout skeleton during SSR / initial hydration
   if (!isClient) {
     // This skeleton could be more detailed to match the layout
     return (
        <div className="flex min-h-screen">
            <Skeleton className="w-60 hidden md:block" /> {/* Sidebar Placeholder */}
            <div className="flex-1 p-4 space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Separator/>
                <Skeleton className="h-64"/>
            </div>
        </div>
     )
   }

  return (
    // Pass state and functions down to HomeContent
    <HomeContent
      telemetry={telemetry}
      error={error}
      satelliteId={satelliteId}
      isLoadingTelemetry={isLoadingTelemetry}
    />
  );
}
