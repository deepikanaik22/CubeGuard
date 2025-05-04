
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
} from "lucide-react";
// Import subscribeToTelemetryData instead of getTelemetryData
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
  // Determine input values based on current telemetry if available
  const batteryLevel = telemetry ? Math.round((telemetry.batteryVoltage / 4.2) * 100) : 50; // Example conversion
  const temperature = telemetry ? telemetry.internalTemperature : 25;
  // Determine comm status based on signal strength (example logic)
  let communicationStatus: "stable" | "unstable" | "lost" = "stable";
   if (telemetry) {
     if (telemetry.communicationLogs.signalStrength < -90) {
       communicationStatus = "lost";
     } else if (telemetry.communicationLogs.signalStrength < -80) {
       communicationStatus = "unstable";
     }
   }


  return (
    <>
      <p className="text-2xl font-bold">
        {isLoading ? 'Calculating...' : (riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A')}
      </p>
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'Please wait...' : (riskScoreData ? riskScoreData.explanation : 'Using latest telemetry data.')}
      </p>
       {/* Button triggers calculation based on the latest telemetry derived state */}
       <Button onClick={calculateRiskScore} disabled={isLoading || !telemetry}>
        {isLoading ? 'Calculating...' : 'Calculate Risk Score'}
      </Button>
    </>
  );
};

function AlertList() {
  const alerts = [
    {
      title: 'High Temperature Alert',
      description: 'Internal temperature exceeded threshold.',
    },
    {
      title: 'Low Battery Voltage',
      description: 'Battery voltage is below the critical level.',
    },
    {
      title: 'Communication Issue',
      description: 'Signal strength is weak, packet delay is high.',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {alerts.map((alert, index) => (
        <Alert key={index} variant="destructive" className="mb-4"> {/* Added margin bottom */}
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

interface AnomalyExplanationProps {
  telemetry: TelemetryData | null;
  satelliteId: string;
}

// Define AnomalyExplanation directly, no need for dynamic import if not causing hydration issues
const AnomalyExplanation: React.FC<AnomalyExplanationProps> = ({ telemetry, satelliteId }) => {
  const [anomalyExplanation, setAnomalyExplanation] = useState<ExplainAnomalyScoreOutput | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnomalyExplanation = async () => {
    try {
      setError(null);
      setIsLoadingAnomaly(true);

      if (!telemetry) {
        setError("Telemetry data is not available.");
        setIsLoadingAnomaly(false); // Stop loading if no telemetry
        return;
      }

      // Pass the actual telemetry data object
      const explanation = await explainAnomalyScore({
        satelliteId: satelliteId,
        telemetryData: telemetry, // Pass the live telemetry data
      });
      setAnomalyExplanation(explanation);
    } catch (error: any) {
       console.error("Error fetching anomaly explanation:", error);
       const errorMessage = error.message || "Unknown error";
       setError(`An error occurred while fetching anomaly explanation: ${errorMessage}`);
    } finally {
      setIsLoadingAnomaly(false);
    }
  };

  // No need to trigger fetch on button click if we always want to show it based on telemetry
  // Triggering inside DialogTrigger's onClick might be better UX
  // useEffect(() => {
  //   if (telemetry) {
  //     fetchAnomalyExplanation(); // Fetch whenever telemetry data is available/updated
  //   }
  // }, [telemetry, satelliteId]); // Depend on telemetry and satelliteId

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={fetchAnomalyExplanation} disabled={isLoadingAnomaly || !telemetry}>
         {isLoadingAnomaly ? "Loading Explanation..." : "Get Anomaly Explanation"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Anomaly Explanation for {satelliteId}</DialogTitle>
           <DialogDescription>
            {isLoadingAnomaly ? (
              <Skeleton className="h-20 w-full" />
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : anomalyExplanation ? (
              <div>
                <p>{anomalyExplanation.explanation}</p>
                <h4 className="font-semibold mt-4">Risk Breakdown:</h4>
                <ul>
                  <li>Thermal: {anomalyExplanation.breakdown.thermal}%</li>
                  <li>Communication: {anomalyExplanation.breakdown.comm}%</li>
                  <li>Power: {anomalyExplanation.breakdown.power}%</li>
                  <li>Orientation: {anomalyExplanation.breakdown.orientation}%</li>
                </ul>
              </div>
            ) : (
               "Click the button to load explanation." // Or "No explanation available yet."
            )}
           </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

// Remove dynamic import if not strictly needed for hydration issues
// const DynamicAnomalyExplanation = dynamic(() => import('@/app/page').then(mod => mod.AnomalyExplanation), { ssr: false });


interface HomeContentProps {
  telemetry: TelemetryData | null;
  error: string | null;
  satelliteId: string;
  riskScoreData: GetRiskScoreOutput | null; // Pass risk score data down
  calculateRiskScore: () => Promise<void>; // Pass calculate function
  isLoadingRiskScore: boolean; // Pass loading state
}

const HomeContent: React.FC<HomeContentProps> = ({
  telemetry,
  error,
  satelliteId,
  riskScoreData,
  calculateRiskScore,
  isLoadingRiskScore
}) => {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  // Calculate derived states from telemetry for display/input
  const batteryLevel = telemetry ? Math.round((telemetry.batteryVoltage / 4.2) * 100) : 0;
  const temperature = telemetry ? telemetry.internalTemperature : 0;
  let communicationStatus: "stable" | "unstable" | "lost" = "stable";
   if (telemetry) {
     if (telemetry.communicationLogs.signalStrength < -90) {
       communicationStatus = "lost";
     } else if (telemetry.communicationLogs.signalStrength < -80) {
       communicationStatus = "unstable";
     }
   }

   if (!isClient) {
     // Render loading state or null during SSR and initial client render
     return (
        <div className="flex-1 p-4 space-y-4">
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
     );
   }

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
                 <Badge className="ml-auto">3</Badge> {/* Example badge */}
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
         <div className="flex items-center space-x-4">
           <SidebarTrigger className="block md:hidden" />
           <h1 className="font-semibold text-2xl">
             Satellite Telemetry Dashboard ({satelliteId})
           </h1>
            {/* Pass telemetry to AnomalyExplanation */}
            <AnomalyExplanation telemetry={telemetry} satelliteId={satelliteId} />
         </div>

         {error && (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          )}

         <Separator className="my-4" />

         {/* Input/Control Cards - Make read-only as they reflect real-time data */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
           <Card>
             <CardHeader>
               <CardTitle>Battery Level</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center space-x-2">
                 <Label htmlFor="battery-level">Level (%):</Label>
                  {/* Display calculated battery level, make input read-only */}
                  <Input
                   type="number"
                   id="battery-level"
                   value={telemetry ? batteryLevel : ''} // Show live value
                   readOnly // Make read-only
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
                  {/* Display live temperature, make input read-only */}
                  <Input
                   type="number"
                   id="temperature"
                   value={telemetry ? temperature: ''} // Show live value
                   readOnly // Make read-only
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
                  {/* Display live status, disable select */}
                  <Select value={telemetry ? communicationStatus : 'stable'} disabled>
                   <SelectTrigger className="w-[180px]">
                     <SelectValue placeholder="Select Status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="stable">Stable</SelectItem>
                     <SelectItem value="unstable">Unstable</SelectItem>
                     <SelectItem value="lost">Lost</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
                <p className="text-xs text-muted-foreground mt-1">Current communication status.</p>
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
                {/* Use Skeleton while telemetry is null initially */}
               {telemetry ? (
                 <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                     <Battery className="h-4 w-4" />
                     <span>Battery Voltage: {telemetry.batteryVoltage?.toFixed(2)}V</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Waves className="h-4 w-4" />
                     <span>Solar Panel Output: {telemetry.solarPanelOutput?.toFixed(2)}W</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Thermometer className="h-4 w-4" />
                     <span>Internal Temp: {telemetry.internalTemperature?.toFixed(1)}°C</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Thermometer className="h-4 w-4 text-blue-500" />
                     <span>External Temp: {telemetry.externalTemperature?.toFixed(1)}°C</span>
                   </div>
                    <div className="flex items-center space-x-2">
                     <Navigation className="h-4 w-4" />
                     <span>Gyro: ({telemetry.gyroscope?.x?.toFixed(2)}, {telemetry.gyroscope?.y?.toFixed(2)}, {telemetry.gyroscope?.z?.toFixed(2)})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4"/>
                       <span>Signal: {telemetry.communicationLogs?.signalStrength} dBm, Delay: {telemetry.communicationLogs?.packetDelay} ms</span>
                    </div>
                 </div>
               ) : (
                 <Skeleton className="h-40 w-full" />
               )}
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Anomaly Risk Score</CardTitle>
             </CardHeader>
             <CardContent>
                {/* Pass live telemetry to RiskScoreDisplay */}
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
               <CardTitle>Telemetry Data Stream (Example)</CardTitle>
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
                     dataKey="pv" // Update dataKey based on actual data
                     stroke="hsl(var(--primary))"
                     fill="hsl(var(--primary))"
                     fillOpacity={0.3}
                   />
                 </AreaChart>
               </ResponsiveContainer>
               <p className="text-xs text-muted-foreground mt-2">Example chart using static data.</p>
             </CardContent>
           </Card>
         </div>


         <Separator className="my-4" />

         {/* Alerts Section */}
         <div>
           <h2 className="font-semibold text-xl mb-2">Alerts</h2>
           <ScrollArea className="h-[300px] w-full rounded-md border">
             <AlertList />
           </ScrollArea>
         </div>
       </div>
    </>
  );
};


export default function Home() {
  // Remove local state for battery, temp, comm status
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = useState(false);
  const [isClient, setIsClient] = useState(false); // State to track client-side mount

  const satelliteId = "cubesat-001"; // Example satellite ID

  // Subscribe to telemetry data on component mount
  useEffect(() => {
     setIsClient(true); // Component has mounted
    console.log("Setting up telemetry subscription for:", satelliteId);
    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
       console.log("Received telemetry data:", data);
      setTelemetry(data);
      setError(null); // Clear error on new data
       if (data === null) {
          setError(`Could not fetch telemetry for ${satelliteId}. Check Firestore document.`);
       }
    });

    // Clean up subscription on component unmount
    return () => {
      console.log("Unsubscribing from telemetry for:", satelliteId);
      unsubscribe();
    };
  }, [satelliteId]); // Re-subscribe if satelliteId changes

  // Calculate risk score based on the latest telemetry state
  const calculateRiskScore = useCallback(async () => {
    if (!telemetry) {
      setError("Cannot calculate risk score without telemetry data.");
      return;
    }
    setIsLoadingRiskScore(true);
    try {
      setError(null);
       // Derive inputs from the latest telemetry state
      const batteryLevel = Math.round((telemetry.batteryVoltage / 4.2) * 100);
      const temperature = telemetry.internalTemperature;
      let communicationStatus: "stable" | "unstable" | "lost" = "stable";
       if (telemetry.communicationLogs.signalStrength < -90) {
         communicationStatus = "lost";
       } else if (telemetry.communicationLogs.signalStrength < -80) {
         communicationStatus = "unstable";
       }

      const riskScore = await getRiskScore({
        batteryLevel,
        temperature,
        communicationStatus,
      });
      setRiskScoreData(riskScore);
    } catch (error: any) {
      console.error("Error calculating risk score:", error);
      setError("An error occurred while calculating risk score: " + (error.message || "Unknown error"));
    } finally {
       setIsLoadingRiskScore(false);
    }
  }, [telemetry]); // Depend on telemetry state

  // Remove handlers for manual input changes
  // const handleBatteryLevelChange = ...
  // const handleTemperatureChange = ...
  // const handleCommunicationStatusChange = ...

   // Render HomeContent only on the client after mount
   if (!isClient) {
     return null; // Or return a loading skeleton for SSR
   }

  return (
    // Pass state and functions down to HomeContent
    <HomeContent
      telemetry={telemetry}
      error={error}
      satelliteId={satelliteId}
      riskScoreData={riskScoreData}
      calculateRiskScore={calculateRiskScore}
      isLoadingRiskScore={isLoadingRiskScore}
    />
  );
}
