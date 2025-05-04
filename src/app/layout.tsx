'use client';
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import {SatelliteProvider} from '@/context/SatelliteContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Navigation,
  AlertTriangle,
  Cpu,
  Mail,
} from 'lucide-react';
import {useRouter, usePathname} from 'next/navigation';
import {Badge} from '@/components/ui/badge'; // Assuming you might want alerts badge here later
import SatelliteSelector from '@/components/SatelliteSelector';
import {useEffect, useState} from 'react';
import { subscribeToTelemetryData, TelemetryData } from '@/services/telemetry'; // Import for alert count

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// export const metadata: Metadata = { // Metadata cannot be used in 'use client' components
//   title: 'CubeSense',
//   description: 'Satellite Anomaly Detection Dashboard',
// };


// Shared Sidebar Component
function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [destructiveAlertCount, setDestructiveAlertCount] = useState(0);
  // In a real app, get satelliteId from context
  const satelliteId = "cubesat-001"; // Placeholder

  // Basic alert count logic (similar to alerts page, needs context for satelliteId)
  useEffect(() => {
    const unsubscribe = subscribeToTelemetryData(satelliteId, (data) => {
      if (data) {
        // Simplified alert logic for badge count
        let count = 0;
        if (data.internalTemperature > 35) count++;
        if (data.batteryVoltage < 3.7) count++;
        if (data.communicationLogs?.signalStrength < -90) count++;
        if (data.communicationLogs?.packetDelay > 250) count++;
        setDestructiveAlertCount(count);
      } else {
        setDestructiveAlertCount(0);
      }
    }, (error) => {
      console.error("Error getting alert count for sidebar:", error);
      setDestructiveAlertCount(0);
    });

    return () => unsubscribe();
  }, [satelliteId]);


  const handleNavigation = (path: string) => {
    setOpenMobile(false);
    router.push(path);
  };

  return (
    <Sidebar className="w-60 hidden md:flex md:flex-col"> {/* Hide on mobile, use Sheet */}
      <SidebarHeader>
         <div className="flex flex-col gap-2 p-2">
           <h2 className="font-semibold text-lg">CubeSense</h2>
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
        <p className="text-xs text-muted-foreground">
          CubeSense Monitoring
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

// Mobile Sidebar using Sheet
function MobileSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { openMobile, setOpenMobile } = useSidebar();
    // Alert count logic similar to AppSidebar can be added if needed

    const handleNavigation = (path: string) => {
        setOpenMobile(false);
        router.push(path);
    };

    // Note: The Sheet content needs to be structured correctly within the layout
    // This component might just trigger the Sheet which is defined elsewhere,
    // or the Sheet needs to be part of the main layout structure controlled by SidebarProvider.
    // For simplicity, the SidebarTrigger in the main content area will handle opening.
    // The actual Sheet content can mirror the AppSidebar structure.
     return null; // Trigger is usually placed in the main content header
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
         <title>CubeSense</title>
         <meta name="description" content="Satellite Anomaly Detection Dashboard" />
       </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SatelliteProvider>
          <SidebarProvider>
             <div className="flex min-h-screen">
               <AppSidebar /> {/* Sidebar for desktop */}
                {/* Main content area */}
               <main className="flex-1 flex flex-col">
                 {/* Header for mobile trigger */}
                  <header className="p-4 border-b md:hidden flex items-center gap-2">
                     <SidebarTrigger />
                     <h1 className="font-semibold text-xl">CubeSense</h1>
                  </header>
                 {/* Page content */}
                 <div className="flex-1 p-4">
                   {children}
                 </div>
               </main>
             </div>
          </SidebarProvider>
        </SatelliteProvider>
      </body>
    </html>
  );
}
