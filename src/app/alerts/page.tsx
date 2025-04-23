'use client';

import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Sidebar, SidebarTrigger} from '@/components/ui/sidebar';
import React from 'react';

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
  {
    title: 'Orientation Drift',
    description: 'Satellite orientation is drifting outside acceptable parameters.',
  },
  {
    title: 'Solar Panel Degradation',
    description: 'Solar panel output has decreased significantly.',
  },
];

export default function AlertsPage() {
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
          <h1 className="font-semibold text-2xl">Alerts</h1>
        </div>

        <Separator className="my-4" />

        <div>
          <h2 className="font-semibold text-xl mb-2">Current Alerts</h2>
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <div className="p-4">
              {alerts.map((alert, index) => (
                <Alert key={index} variant={index % 2 === 0 ? 'destructive' : 'default'} className="mt-4">
                  <AlertTitle>{alert.title}</AlertTitle>
                  <AlertDescription>{alert.description}</AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </SidebarProvider>
  );
}
