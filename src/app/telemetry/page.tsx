'use client';

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {Separator} from "@/components/ui/separator";
import {getTelemetryData} from "@/services/telemetry";
import React, {useState, useEffect} from 'react';
import {Sidebar, SidebarTrigger} from "@/components/ui/sidebar";

export default function TelemetryPage() {
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
    <div>
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
  );
}

