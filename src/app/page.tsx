'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
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
import {getTelemetryData} from "@/services/telemetry";
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
import React, {useState, useEffect} from 'react';
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
}

const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({riskScoreData, calculateRiskScore}) => {
  return (
    <>
      <p className="text-2xl font-bold">
        {riskScoreData ? `${riskScoreData.riskScore}%` : 'N/A'}
      </p>
      <p className="text-sm text-muted-foreground">
        {riskScoreData ? riskScoreData.explanation : 'No risk score calculated.'}
      </p>
      <Button onClick={calculateRiskScore}>Calculate Risk</Button>
    </>
  );
};

export default function Home() {
  const router = useRouter();
  const satelliteId = "cubesat-001";

  const [batteryLevel, setBatteryLevel] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(25);
  const [communicationStatus, setCommunicationStatus] = useState<"stable" | "unstable" | "lost">("stable");
  const [telemetry, setTelemetry] = useState<any>(null); // Replace 'any' with the correct type
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(null);
  const [anomalyExplanation, setAnomalyExplanation] = useState<ExplainAnomalyScoreOutput | null>(null);
  const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const telemetryData = await getTelemetryData(satelliteId);
        setTelemetry(telemetryData);
      } catch (err) {
        console.error("Failed to fetch telemetry data", err);
        setError("Failed to fetch telemetry data.");
      }
    };

    fetchData();
  }, [satelliteId]);

  const calculateRiskScore = async () => {
    try {
      const riskData = await getRiskScore({
        batteryLevel: Number(batteryLevel),
        temperature: Number(temperature),
        communicationStatus: communicationStatus,
      });
      setRiskScoreData(riskData);
    } catch (error) {
      console.error("Error calculating risk score:", error);
      setError("Failed to calculate risk score");
    }
  };

  const handleBatteryLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatteryLevel(Number(e.target.value));
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(Number(e.target.value));
  };

  const handleCommunicationStatusChange = (value: "stable" | "unstable" | "lost") => {
    setCommunicationStatus(value);
  };

  const fetchAnomalyExplanation = async () => {
    try {
      setError(null);
      setIsLoadingAnomaly(true);
      const explanation = await explainAnomalyScore({satelliteId});
      setAnomalyExplanation(explanation);
    } catch (error) {
      setError("An error occurred while fetching anomaly explanation.");
      console.error("Error fetching anomaly explanation:", error);
    } finally {
      setIsLoadingAnomaly(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="w-60">
        <SidebarHeader>
          <h2 className="font-semibold text-lg">CubeGuard</h2>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuButton onClick={() => router.push('/')}>
                <Navigation className="mr-2 h-4 w-4" />
                <span>Overview</span>
              </SidebarMenuButton>
              <SidebarMenuButton onClick={() => router.push('/telemetry')}>
                <Cpu className="mr-2 h-4 w-4" />
                <span>Telemetry</span>
              </SidebarMenuButton>
              <SidebarMenuButton onClick={() => router.push('/alerts')}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Alerts</span>
                <Badge className="ml-auto">3</Badge>
              </SidebarMenuButton>
              <SidebarMenuButton onClick={() => router.push('/communication')}>
                <Mail className="mr-2 h-4 w-4" />
                <span>Communication</span>
              </SidebarMenuButton>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <p className="text-xs text-muted-foreground">
            CubeGuard - Satellite Monitoring
          </p>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 p-4">
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="block md:hidden" />
          <h1 className="font-semibold text-2xl">
            Satellite Telemetry Dashboard
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={fetchAnomalyExplanation} disabled={isLoadingAnomaly}>
                {isLoadingAnomaly ? "Loading..." : "Get Anomaly Explanation"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Anomaly Explanation</DialogTitle>
                {isLoadingAnomaly ? (
                  <DialogDescription>Loading explanation...</DialogDescription>
                ) : error ? (
                  <DialogDescription>{error}</DialogDescription>
                ) : (
                  <DialogDescription>{anomalyExplanation?.explanation}</DialogDescription>
                )}
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                  value={batteryLevel}
                  onChange={handleBatteryLevelChange}
                  className="w-20"
                />
              </div>
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
                  value={temperature}
                  onChange={handleTemperatureChange}
                  className="w-20"
                />
              </div>
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
                    <SelectValue placeholder={communicationStatus} />
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
              <CardTitle>Telemetry Data</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <>
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
                    <span>Internal Temperature: {telemetry?.internalTemperature}°C</span>
                  </div>
                </>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskScoreDisplay riskScoreData={riskScoreData} calculateRiskScore={calculateRiskScore} />
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Telemetry Data Stream</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={data}
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
                    dataKey="pv"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-4" />

        <div>
          <h2 className="font-semibold text-xl mb-2">Alerts</h2>
          <ScrollArea className="h-[300px] w-full rounded-md border">
            <AlertList />
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}

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
    <div className="p-4">
      {alerts.map((alert, index) => (
        <Alert key={index} variant="destructive">
          <AlertTitle>{alert.title}</AlertTitle>
          <AlertDescription>{alert.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
