
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
import { useEffect, useState } from 'react';
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
// Use <head> tags directly within the RootLayout component return

// Shared Sidebar Component - Needs context to get selectedSatelliteId
function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [destructiveAlertCount, setDestructiveAlertCount] = useState(0);
  const { selectedSatelliteId } = useSatellite(); // Get ID from context

  // Alert count logic based on telemetry subscription
  useEffect(() => {
    if (!selectedSatelliteId) return; // Don't subscribe if no satellite is selected

    const unsubscribe = subscribeToTelemetryData(selectedSatelliteId, (data) => {
      if (data) {
        // Simplified critical alert logic for badge count
        let count = 0;
        if (data.internalTemperature > 38) count++; // Critical temp
        if (data.batteryVoltage < 3.65) count++; // Critical voltage
        if (data.communicationLogs?.signalStrength < -95) count++; // Critical signal
        if (data.communicationLogs?.packetDelay > 300) count++; // Critical delay
        setDestructiveAlertCount(count);
      } else {
        setDestructiveAlertCount(0);
      }
    }, (error) => {
      console.error("Error getting alert count for sidebar:", error);
      setDestructiveAlertCount(0); // Reset on error
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [selectedSatelliteId]); // Re-subscribe if satellite changes

  const handleNavigation = (path: string) => {
    setOpenMobile(false); // Close mobile sidebar on navigation
    router.push(path);
  };

  return (
    // Sidebar structure using components from ui/sidebar
    <Sidebar className="w-60 hidden md:flex md:flex-col"> {/* Hidden on mobile */}
      <SidebarHeader>
         <div className="flex flex-col gap-2 p-4"> {/* Added padding */}
           <div className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" /> {/* App Icon */}
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
        <p className="text-xs text-muted-foreground p-4"> {/* Added padding */}
          CubeSense Monitoring v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}

// Root Layout Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
         {/* Metadata can be placed directly in <head> for client components */}
         <title>CubeSense - Satellite Monitoring</title>
         <meta name="description" content="Real-time CubeSat anomaly detection dashboard powered by AI." />
          {/* Add favicon links here if you have them */}
       </head>
       {/* Apply font variables to the body */}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
         {/* Wrap the entire application that needs satellite context */}
        <SatelliteProvider>
          {/* Wrap the entire application that needs sidebar context */}
          <SidebarProvider>
             <div className="flex min-h-screen bg-background">
               {/* Render the AppSidebar which uses SatelliteContext */}
               <AppSidebar />
                {/* Main content area */}
               <main className="flex-1 flex flex-col">
                 {/* Optional Header for mobile view or global actions */}
                 <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
                    <SidebarTrigger className="md:hidden"/>
                    <h1 className="text-xl font-semibold">CubeSense</h1>
                    {/* Add other header elements like user profile if needed */}
                 </header>
                 {/* The actual page content passed as children */}
                 <div className="flex-1"> {/* Let content area grow */}
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
