'use client';

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {Separator} from "@/components/ui/separator";
import {getTelemetryData} from "@/services/telemetry";
import React, {useState, useEffect} from 'react';
import {Sidebar, SidebarTrigger} from "@/components/ui/sidebar";
import { useRouter } from 'next/navigation';
import {Badge} from "@/components/ui/badge";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TelemetryPage() {
  const router = useRouter();
  const satelliteId = "cubesat-001";
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const telemetryData = await getTelemetryData(satelliteId);
      setTelemetry(telemetryData);
    };

    fetchData();
  }, [satelliteId]);

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
          <h1 className="font-semibold text-2xl">Telemetry</h1>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Battery Level</CardTitle>
            </CardHeader>
            <CardContent>
              {telemetry ? (
                <div className="flex items-center space-x-2">
                  <Battery className="h-4 w-4" />
                  <span>Battery Voltage: {telemetry?.batteryVoltage}V</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-full" />
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
                  <span>Solar Panel Output: {telemetry?.solarPanelOutput}W</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-full" />
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
                  <span>Internal Temperature: {telemetry?.internalTemperature}°C</span>
                </div>
              ) : (
                <Skeleton className="h-8 w-full" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarProvider>
  );
}
