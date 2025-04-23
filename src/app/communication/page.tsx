'use client';

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Separator} from '@/components/ui/separator';
import {Sidebar, SidebarTrigger} from '@/components/ui/sidebar';
import {
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import { useRouter } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";

const communicationData = {
  signalStrength: '-75 dBm',
  packetDelay: '120 ms',
  lastContact: '2 minutes ago',
};

export default function CommunicationPage() {
  const router = useRouter();

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
    </SidebarProvider>
  );
}
