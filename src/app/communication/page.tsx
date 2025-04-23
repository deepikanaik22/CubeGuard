'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {SidebarTrigger} from '@/components/ui/sidebar';

export default function CommunicationPage() {
  const communicationData = {
    signalStrength: '-75 dBm',
    packetDelay: '120 ms',
    lastContact: '2 minutes ago',
  };

  return (
    <div>
      <div className="flex items-center space-x-4">
        <SidebarTrigger className="block md:hidden" />
        <h1 className="font-semibold text-2xl">Communication</h1>
      </div>

      <Separator className="my-4" />

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Signal Strength</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{communicationData.signalStrength}</p>
            <p className="text-sm text-muted-foreground">Acceptable signal strength.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Packet Delay</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{communicationData.packetDelay}</p>
            <p className="text-sm text-muted-foreground">Slightly elevated packet delay.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{communicationData.lastContact}</p>
            <p className="text-sm text-muted-foreground">Regular communication intervals.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
