'use client';
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Correct import if using next/font
import './globals.css';
import { SatelliteProvider } from '@/context/SatelliteContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider, // Ensure SidebarProvider is imported
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
  Rocket, // Use Rocket icon consistently
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import SatelliteSelector from '@/components/SatelliteSelector';
import { useEffect, useState, memo } from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry';
import { useSatellite } from '@/context/SatelliteContext'; // Import context hook

const geistSans = Geist({ // Correct usage if library provides it this way
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({ // Correct usage
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Client component, cannot use export const metadata

// Memoize AppSidebar
const AppSidebar = memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [destructiveAlertCount, setDestructiveAlertCount] = useState(0);
  const { selectedSatelliteId } = useSatellite();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Alert count logic
  useEffect(() => {
    if (!isClient || !selectedSatelliteId) return;

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      if (data) {
        let count = 0;
        if (data.internalTemperature > 38) count++;
        if (data.batteryVoltage < 3.65) count++;
        if (data.communicationLogs?.signalStrength < -95) count++;
        if (data.communicationLogs?.packetDelay > 300) count++;
        setDestructiveAlertCount(count);
      } else {
        setDestructiveAlertCount(0);
      }
    }, (error) => {
      console.error("Error getting alert count for sidebar:", error);
      setDestructiveAlertCount(0);
    });

    return () => unsubscribe();
  }, [selectedSatelliteId, isClient]);

  const handleNavigation = (path: string) => {
    setOpenMobile(false);
    router.push(path);
  };

  // Render Sidebar only on the client to avoid hydration issues with dynamic content (badge)
  if (!isClient) {
    // Optionally render a skeleton or null on the server
    return null;
  }

  return (
    <Sidebar className="w-60 hidden md:flex md:flex-col">
      <SidebarHeader>
         <div className="flex flex-col gap-2 p-4">
           <div className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              <h2 className="font-semibold text-lg">CubeSense</h2>
            </div>
           <SatelliteSelector />
         </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuButton onClick={() => handleNavigation('/')} isActive={pathname === '/'}>
              <Navigation className="mr-2 h-4 w-4" />
              <span>Overview</span>
            </SidebarMenuButton>
            <SidebarMenuButton onClick={() => handleNavigation('/telemetry')} isActive={pathname === '/telemetry'}>
              <Cpu className="mr-2 h-4 w-4" />
              <span>Telemetry</span>
            </SidebarMenuButton>
            <SidebarMenuButton onClick={() => handleNavigation('/alerts')} isActive={pathname === '/alerts'}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Alerts</span>
               {destructiveAlertCount > 0 && (
                   <Badge variant="destructive" className="ml-auto">
                       {destructiveAlertCount}
                   </Badge>
               )}
            </SidebarMenuButton>
            <SidebarMenuButton onClick={() => handleNavigation('/communication')} isActive={pathname === '/communication'}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Communication</span>
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-xs text-muted-foreground p-4">
          CubeSense Monitoring v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
});
AppSidebar.displayName = 'AppSidebar';

// Root Layout Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
         <title>CubeSense - Satellite Monitoring</title>
         <meta name="description" content="Real-time CubeSat anomaly detection dashboard powered by AI." />
       </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <SatelliteProvider>
          <SidebarProvider>
             <div className="flex min-h-screen bg-background">
               <AppSidebar />
               {/* Main content area */}
               <main className="flex-1 flex flex-col">
                 {/* Content is rendered directly now, header is moved to individual pages for mobile */}
                 {children}
               </main>
             </div>
          </SidebarProvider>
        </SatelliteProvider>
      </body>
    </html>
  );
}
