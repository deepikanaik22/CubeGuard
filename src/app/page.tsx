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
import {getTelemetryData, TelemetryData} from "@/services/telemetry";
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


const data = [
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
}

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({riskScoreData, calculateRiskScore, isLoading}) => {
  return (
    <>
      <p className="text-2xl font-bold">
        {isLoading ? 'Calculating...' : (riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A')}
      </p>
      <p className="text-sm text-muted-foreground">
        {isLoading ? 'Please wait...' : (riskScoreData ? riskScoreData.explanation : 'Click button to calculate risk score.')}
      </p>
      <Button onClick={calculateRiskScore} disabled={isLoading}>
        {isLoading ? 'Calculating...' : 'Calculate Risk'}
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
        <Alert key={index} variant="destructive">
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
        return;
      }

      // Pass the actual telemetry data object
      const explanation = await explainAnomalyScore({
        satelliteId: satelliteId,
        telemetryData: telemetry,
      });
      setAnomalyExplanation(explanation);
    } catch (error: any) {
       console.error("Error fetching anomaly explanation:", error);
      // More specific error handling if possible
      if (error instanceof Error) {
        setError(`An error occurred while fetching anomaly explanation: ${error.message}`);
      } else {
        setError("An unexpected error occurred while fetching anomaly explanation.");
      }
    } finally {
      setIsLoadingAnomaly(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={fetchAnomalyExplanation} disabled={isLoadingAnomaly || !telemetry}>
          {isLoadingAnomaly ? "Loading..." : "Get Anomaly Explanation"}
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
               "Click the button again to load explanation."
            )}
           </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};


const DynamicAnomalyExplanation = dynamic(() => Promise.resolve(AnomalyExplanation), { ssr: false });


interface HomeContentProps {
  batteryLevel: number;
  temperature: number;
  communicationStatus: "stable" | "unstable" | "lost";
  handleBatteryLevelChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTemperatureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCommunicationStatusChange: (value: "stable" | "unstable" | "lost") => void;
  riskScoreData: GetRiskScoreOutput | null;
  telemetry: TelemetryData | null;
  error: string | null;
  calculateRiskScore: () => Promise<void>;
  satelliteId: string;
  isLoadingRiskScore: boolean;
}

const HomeContent: React.FC<HomeContentProps> = ({
  batteryLevel,
  temperature,
  communicationStatus,
  handleBatteryLevelChange,
  handleTemperatureChange,
  handleCommunicationStatusChange,
  riskScoreData,
  telemetry,
  error,
  calculateRiskScore,
  satelliteId,
  isLoadingRiskScore
}) => {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  return (
    <>
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
                <Badge className="ml-auto">3</Badge>
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
      <div className="flex-1 p-4">
         <div className="flex items-center space-x-4">
           <SidebarTrigger className="block md:hidden" />
           <h1 className="font-semibold text-2xl">
             Satellite Telemetry Dashboard ({satelliteId})
           </h1>
           <DynamicAnomalyExplanation telemetry={telemetry} satelliteId={satelliteId} />
         </div>

         {error && (
           <Alert variant="destructive" className="my-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error</AlertTitle>
             <AlertDescription>{error}</AlertDescription>
           </Alert>
          )}


         <Separator className="my-4" />

         {/* Input/Control Cards */}
         <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-4">
           <Card>
             <CardHeader>
               <CardTitle>Battery Level Input</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center space-x-2">
                 <Label htmlFor="battery-level">Level (%):</Label>
                 <Input
                   type="number"
                   id="battery-level"
                   value={batteryLevel}
                   onChange={handleBatteryLevelChange}
                   className="w-20"
                   min="0"
                   max="100"
                 />
               </div>
               <p className="text-xs text-muted-foreground mt-1">Adjust simulated battery level.</p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Temperature Input</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center space-x-2">
                 <Label htmlFor="temperature">Temp (°C):</Label>
                 <Input
                   type="number"
                   id="temperature"
                   value={temperature}
                   onChange={handleTemperatureChange}
                   className="w-20"
                 />
               </div>
               <p className="text-xs text-muted-foreground mt-1">Adjust simulated temperature.</p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Communication Status</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex items-center space-x-2">
                 <Label htmlFor="communication-status">Status:</Label>
                 <Select value={communicationStatus} onValueChange={handleCommunicationStatusChange}>
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
                <p className="text-xs text-muted-foreground mt-1">Adjust simulated comm status.</p>
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
               {telemetry ? (
                 <div className="space-y-2">
                   <div className="flex items-center space-x-2">
                     <Battery className="h-4 w-4" />
                     <span>Battery Voltage: {telemetry?.batteryVoltage}V</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Waves className="h-4 w-4" />
                     <span>Solar Panel Output: {telemetry?.solarPanelOutput}W</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Thermometer className="h-4 w-4" />
                     <span>Internal Temp: {telemetry?.internalTemperature}°C</span>
                   </div>
                   <div className="flex items-center space-x-2">
                     <Thermometer className="h-4 w-4 text-blue-500" />
                     <span>External Temp: {telemetry?.externalTemperature}°C</span>
                   </div>
                    <div className="flex items-center space-x-2">
                     <Navigation className="h-4 w-4" />
                     <span>Gyro: ({telemetry.gyroscope.x.toFixed(2)}, {telemetry.gyroscope.y.toFixed(2)}, {telemetry.gyroscope.z.toFixed(2)})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4"/>
                       <span>Signal: {telemetry.communicationLogs.signalStrength} dBm, Delay: {telemetry.communicationLogs.packetDelay} ms</span>
                    </div>
                 </div>
               ) : (
                 <Skeleton className="h-40 w-full" /> // Adjusted height
               )}
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Anomaly Risk Score</CardTitle>
             </CardHeader>
             <CardContent>
               <RiskScoreDisplay riskScoreData={riskScoreData} calculateRiskScore={calculateRiskScore} isLoading={isLoadingRiskScore} />
             </CardContent>
           </Card>

           <Card className="col-span-1 md:col-span-2 lg:col-span-1"> {/* Chart takes less space */}
             <CardHeader>
               <CardTitle>Telemetry Data Stream (Example)</CardTitle>
             </CardHeader>
             <CardContent>
               <ResponsiveContainer width="100%" height={200}>
                 <AreaChart
                   data={data} // Using static data for now
                   margin={{
                     top: 10,
                     right: 30,
                     left: 0,
                     bottom: 0,
                   }}
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
  const [isClient, setIsClient] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(25);
  const [communicationStatus, setCommunicationStatus] = useState<"stable" | "unstable" | "lost">("stable");
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingRiskScore, setIsLoadingRiskScore] = useState(false);

  const satelliteId = "cubesat-001"; // Example satellite ID

  const calculateRiskScore = useCallback(async () => {
    setIsLoadingRiskScore(true);
    try {
      setError(null);
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
  }, [batteryLevel, temperature, communicationStatus]); // Dependencies for the callback

  const fetchTelemetry = useCallback(async () => {
    try {
      setError(null);
      const telemetryData = await getTelemetryData(satelliteId);
      setTelemetry(telemetryData);
      // Optionally, update input states based on fetched telemetry
      // setBatteryLevel(initialBatteryLevelFromTelemetry);
      // setTemperature(initialTemperatureFromTelemetry);
      // setCommunicationStatus(initialCommStatusFromTelemetry);
    } catch (error: any) {
       console.error("Error fetching telemetry data:", error);
      setError("An error occurred while fetching telemetry data: " + (error.message || "Unknown error"));
    }
  }, [satelliteId]);

  useEffect(() => {
    setIsClient(true); // Indicate that the component has mounted on the client
    fetchTelemetry(); // Initial telemetry fetch
     // Set up interval for fetching telemetry data every 10 seconds (example)
    const intervalId = setInterval(fetchTelemetry, 10000); // 10000 ms = 10 seconds

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchTelemetry]); // Re-run effect if fetchTelemetry changes (due to satelliteId change)


  const handleBatteryLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatteryLevel(Number(e.target.value));
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(Number(e.target.value));
  };

  const handleCommunicationStatusChange = (value: "stable" | "unstable" | "lost") => {
    setCommunicationStatus(value);
  };


  // Render null or a loading state on the server to avoid hydration mismatch
  if (!isClient) {
    return null; // Or a basic loading skeleton
  }

  return (
    <HomeContent
      batteryLevel={batteryLevel}
      temperature={temperature}
      communicationStatus={communicationStatus}
      handleBatteryLevelChange={handleBatteryLevelChange}
      handleTemperatureChange={handleTemperatureChange}
      handleCommunicationStatusChange={handleCommunicationStatusChange}
      riskScoreData={riskScoreData}
      telemetry={telemetry}
      error={error}
      calculateRiskScore={calculateRiskScore}
      satelliteId={satelliteId}
      isLoadingRiskScore={isLoadingRiskScore}
    />
  );
}
