'use client';

import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Separator} from '@/components/ui/separator';
import {Sidebar, SidebarTrigger} from '@/components/ui/sidebar';
import React from 'react';

export default function AlertsPage() {
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

  return (
    <div>
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
  );
}

