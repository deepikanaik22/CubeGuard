"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
  Mail,
  Navigation,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getTelemetryData } from "@/services/telemetry";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { explainAnomalyScore } from "@/ai/flows/explain-anomaly-score";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const data = [
  { name: "00:00", uv: 400, pv: 2400, amt: 2400 },
  { name: "00:15", uv: 300, pv: 1398, amt: 2210 },
  { name: "00:30", uv: 200, pv: 9800, amt: 2290 },
  { name: "00:45", uv: 278, pv: 3908, amt: 2000 },
  { name: "01:00", uv: 189, pv: 4800, amt: 2181 },
  { name: "01:15", uv: 239, pv: 3800, amt: 2500 },
  { name: "01:30", uv: 349, pv: 4300, amt: 2100 },
];

export default function Home() {
  const satelliteId = "cubesat-001";
  const [telemetry, setTelemetry] = useState(null);
  const [anomalyExplanation, setAnomalyExplanation] = useState(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const data = await getTelemetryData(satelliteId);
      setTelemetry(data);
    };

    const fetchAnomalyExplanation = async () => {
      const explanation = await explainAnomalyScore({ satelliteId });
      setAnomalyExplanation(explanation);
    };

    fetchTelemetry();
    fetchAnomalyExplanation();
  }, []);

  const anomalyRiskScore =
    anomalyExplanation?.breakdown?.comm +
      anomalyExplanation?.breakdown?.orientation +
      anomalyExplanation?.breakdown?.power +
      anomalyExplanation?.breakdown?.thermal || 0;

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
              <SidebarMenuButton>
                <Navigation className="mr-2 h-4 w-4" />
                <span>Overview</span>
              </SidebarMenuButton>
              <SidebarMenuButton>
                <Cpu className="mr-2 h-4 w-4" />
                <span>Telemetry</span>
              </SidebarMenuButton>
              <SidebarMenuButton>
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Alerts</span>
                <Badge className="ml-auto">3</Badge>
              </SidebarMenuButton>
              <SidebarMenuButton>
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
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Battery Voltage</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4" />
                  <span>{telemetry?.batteryVoltage}V</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-24" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solar Panel Output</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Waves className="h-4 w-4" />
                  <span>{telemetry?.solarPanelOutput}W</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-24" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4" />
                  <span>{telemetry?.internalTemperature}°C</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-24" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anomaly Risk Score</CardTitle>
            </CardHeader>
            <CardContent>
              {anomalyExplanation ? (
                <>
                  <div className="text-2xl font-bold">{anomalyRiskScore}%</div>
                  <p>Likely Failure Type: Thermal</p>
                  <p className="text-sm text-muted-foreground">
                    {anomalyExplanation?.explanation}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-sm">Breakdown:</p>
                  <ul className="list-disc list-inside text-sm">
                    <li>Thermal: {anomalyExplanation?.breakdown?.thermal}%</li>
                    <li>Comm: {anomalyExplanation?.breakdown?.comm}%</li>
                    <li>Power: {anomalyExplanation?.breakdown?.power}%</li>
                    <li>
                      Orientation: {anomalyExplanation?.breakdown?.orientation}%
                    </li>
                  </ul>
                </>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
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
            <div className="p-4">
              <Alert variant="destructive">
                <AlertTitle>High Temperature Alert</AlertTitle>
                <AlertDescription>
                  Internal temperature exceeded threshold.
                </AlertDescription>
              </Alert>
              <Alert className="mt-4">
                <AlertTitle>Low Battery Voltage</AlertTitle>
                <AlertDescription>
                  Battery voltage is below the critical level.
                </AlertDescription>
              </Alert>
              <Alert className="mt-4">
                <AlertTitle>Communication Issue</AlertTitle>
                <AlertDescription>
                  Signal strength is weak, packet delay is high.
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
