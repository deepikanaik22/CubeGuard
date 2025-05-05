'use client';
import dynamic from 'next/dynamic';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarSeparator,
  SidebarProvider,
  useSidebar
} from "@/components/ui/sidebar";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {
  Battery,
  Thermometer,
  Waves,
  Mail,
  Navigation,
  AlertTriangle,
  Cpu,
  Rocket, // Added Rocket icon
} from 'lucide-react';
import { getTelemetryData, TelemetryData, subscribeToTelemetryData } from '@/services/telemetry'; // Using simulated source now
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {ScrollArea} from '@/components/ui/scroll-area';
import {explainAnomalyScore} from '@/ai/flows/explain-anomaly-score';
import {Skeleton} from '@/components/ui/skeleton';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Separator} from '@/components/ui/separator';
import {getRiskScore} from '@/ai/flows/get-risk-score';
import React, {useState, useEffect, useCallback, memo} from 'react';
import {useRouter} from 'next/navigation';
import {useSatellite} from '@/context/SatelliteContext';
import SatelliteSelector from '@/components/SatelliteSelector'; // Import SatelliteSelector
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {Input} from '@/components/ui/input';

// Import types from the centralized types file
import type {GetRiskScoreOutput, ExplainAnomalyScoreOutput} from '@/ai/types';

interface RiskScoreDisplayProps {
  riskScoreData: GetRiskScoreOutput | null;
  isLoading: boolean;
  error: string | null;
  calculateRiskScore: () => void; // Add calculateRiskScore prop
}

// Memoize RiskScoreDisplay
const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = memo(
  ({riskScoreData, isLoading, error, calculateRiskScore}) => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
      setIsClient(true);
    }, []);

    return (
      <>
        {isClient && error && (
          <Alert variant="destructive" className="mb-2 text-xs">
            <AlertTriangle className="h-3 w-3" />
            <AlertTitle className="text-xs">AI Risk Score Error</AlertTitle>
             {/* Display the specific error message */}
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
         {/* Changed <p> to <div> to fix hydration error */}
        <div className="text-2xl font-bold">
          {isClient ? (
            isLoading ? (
              'Calculating...'
            ) : riskScoreData ? (
              `${riskScoreData.riskScore}%`
            ) : error ? ( // Show N/A if error occurred
                'N/A'
            ) : (
                'Awaiting telemetry...' // Default state before calculation or if no data
            )
          ) : (
            <Skeleton className="h-8 w-1/2" /> // Skeleton for SSR/initial load
          )}
        </div>
         {/* Changed p to div to fix hydration error */}
        <div className="text-sm text-muted-foreground mt-1">
          {isClient ? (
            isLoading ? (
              'AI analyzing risk...'
            ) : error ? (
                 'Calculation failed. See error above.' // Indicate failure
            ) : riskScoreData ? (
              riskScoreData.explanation
            ) : (
              'Click button to calculate risk using current telemetry.'
            )
          ) : (
            <Skeleton className="h-4 w-3/4 mt-1" /> // Skeleton for SSR/initial load
          )}
        </div>
        {isClient && ( // Only render button on client
          <Button
            onClick={calculateRiskScore}
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? 'Calculating...' : 'Calculate Risk'}
          </Button>
        )}
      </>
    );
  }
);
RiskScoreDisplay.displayName = 'RiskScoreDisplay';


interface AnomalyExplanationProps {
  satelliteId: string; // Pass satelliteId only
}

// Memoize AnomalyExplanation
const AnomalyExplanation: React.FC<AnomalyExplanationProps> = memo(
  ({satelliteId}) => {
    const [anomalyExplanation, setAnomalyExplanation] =
      useState<ExplainAnomalyScoreOutput | null>(null);
    const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);
    const [anomalyError, setAnomalyError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Function to fetch anomaly explanation using AI
    const fetchAnomalyExplanation = useCallback(async () => {
      if (!satelliteId) {
          setAnomalyError("Please select a satellite first.");
          return;
      }
      setIsLoadingAnomaly(true);
      setAnomalyError(null);
      setAnomalyExplanation(null); // Clear previous explanation

      try {
        console.log(`Requesting anomaly explanation for ${satelliteId}`);
        // const explanation = await explainAnomalyScore({satelliteId: satelliteId});
         const response = await fetch('/api/explainAnomalyScore', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ satelliteId }),
         });
          if (!response.ok) {
             const errorData = await response.json();
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
         const explanation = await response.json();
        console.log(`Received anomaly explanation for ${satelliteId}:`, explanation);
        setAnomalyExplanation(explanation);
      } catch (aiError: any) {
        console.error('Error calling explainAnomalyScore AI flow:', aiError);
        let errorMessage = 'An unexpected error occurred.';
        if (aiError instanceof Error) {
          errorMessage = aiError.message; // Use the message from the caught error
        } else if (typeof aiError === 'string') {
          errorMessage = aiError;
        }
         // Provide more specific user feedback based on common errors
         if (errorMessage.includes("API key not valid") || errorMessage.includes("Invalid API Key")) {
            setAnomalyError("AI Error: Invalid API Key. Please check your .env configuration.");
         } else if (errorMessage.includes("429")) {
            setAnomalyError("AI Error: API Rate Limit Exceeded. Please try again later.");
         } else if (errorMessage.includes("did not match expected format") || errorMessage.includes("response was missing")) {
             setAnomalyError("AI Error: Received an unexpected response format from the AI. Please try again.");
         } else if (errorMessage.includes("Failed to retrieve telemetry")) {
             setAnomalyError(`Error: Could not retrieve telemetry data for ${satelliteId}. ${errorMessage}`);
         } else if (errorMessage.includes("unexpected response")) {
             setAnomalyError("AI Error: An unexpected response was received from the server");
         }
         else {
            setAnomalyError(`AI Error: ${errorMessage}`); // General error message
         }
      } finally {
        setIsLoadingAnomaly(false);
      }
    }, [satelliteId]); // Dependency is only satelliteId

    // Ensure DialogTrigger and Button are only rendered client-side
    if (!isClient) {
      return <Button variant="outline" disabled>Loading...</Button>;
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
           <Button
              onClick={fetchAnomalyExplanation}
             disabled={isLoadingAnomaly}
             variant="outline"
           >
             {isLoadingAnomaly ? 'Loading Explanation...' : 'Get Anomaly Explanation'}
           </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anomaly Explanation for {satelliteId}</DialogTitle>
            <DialogDescription>
              AI-powered analysis of the anomaly risk score based on latest
              telemetry.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingAnomaly ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <Separator className="my-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : anomalyError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{anomalyError}</AlertDescription>
              </Alert>
            ) : anomalyExplanation ? (
              <div>
                <h4 className="font-semibold mb-2">Explanation:</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {anomalyExplanation.explanation}
                </p>
                <Separator className="my-4" />
                <h4 className="font-semibold mb-2">Risk Breakdown:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>
                    Thermal: {anomalyExplanation.breakdown.thermal?.toFixed(1)}%
                  </li>
                  <li>
                    Comm: {anomalyExplanation.breakdown.comm?.toFixed(1)}%
                  </li>
                  <li>
                    Power: {anomalyExplanation.breakdown.power?.toFixed(1)}%
                  </li>
                  <li>
                    Orientation:{' '}
                    {anomalyExplanation.breakdown.orientation?.toFixed(1)}%
                  </li>
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Click the button to load the explanation.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
AnomalyExplanation.displayName = 'AnomalyExplanation';

// Wrapper component for client-side only rendering
const ClientOnlyAnomalyExplanation = (props: AnomalyExplanationProps) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render a placeholder or skeleton during SSR/initial load
    return <Button variant="outline" disabled>Loading Explanation...</Button>;
  }

  return <AnomalyExplanation {...props} />;
};


// Component to display the main content area
function HomeContent({
  batteryLevel,
  temperature,
  communicationStatus,
  riskScoreData,
  riskScoreLoading, // Pass down loading state
  riskScoreError,   // Pass down error state
  telemetry,
  telemetryError, // Renamed from error to avoid confusion
  calculateRiskScore,
}: {
  batteryLevel: number;
  temperature: number;
  communicationStatus: string;
  riskScoreData: GetRiskScoreOutput | null;
  riskScoreLoading: boolean;
  riskScoreError: string | null;
  telemetry: TelemetryData | null;
  telemetryError: string | null;
  calculateRiskScore: () => void;
}) {
  const { selectedSatelliteId } = useSatellite(); // Get satellite ID here
  const [isClient, setIsClient] = useState(false); // Client-side check

  useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);

  return (
    <div className="flex-1">
      {/* Header for mobile - Keep this structure */}
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
        {isClient && <SidebarTrigger className="md:hidden" />} {/* Conditionally render based on isClient */}
        <h1 className="text-xl font-semibold ml-2">CubeSense</h1>
        <div className="ml-auto">
          {isClient && <SatelliteSelector />}
        </div>
      </header>

      {/* Main content */}
      <div className="p-4">
        {' '}
        {/* Added padding for spacing */}
        {/* Desktop Header */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-2xl">
              CubeSense Dashboard ({selectedSatelliteId || '...'}){' '}
            </h1>
          </div>
           <div className="flex items-center gap-4">
             {/* Conditional render anomaly explanation button */}
             {isClient && <ClientOnlyAnomalyExplanation satelliteId={selectedSatelliteId || ''} />}
           </div>
        </div>
        <Separator className="my-4 hidden md:block" />

         {/* Show telemetry error if present */}
         {telemetryError && (
           <Alert variant="destructive" className="mb-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Telemetry Error</AlertTitle>
             <AlertDescription>{telemetryError}</AlertDescription>
           </Alert>
         )}


        {/* Telemetry Snapshot Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Live Telemetry Snapshot</CardTitle>
            <CardDescription>Latest data received from {selectedSatelliteId || '...'}.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="battery-level-display" className="min-w-[100px]">
                Battery (%)
              </Label>
              {/* Use Input, but make it readOnly */}
               {/* Conditionally render Input based on isClient */}
              {isClient ? (
                  <Input
                    type="number"
                    id="battery-level-display"
                    value={telemetry === null ? '' : batteryLevel}
                    readOnly
                    className="w-20"
                  />
              ) : (
                 <Skeleton className="h-10 w-20" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="temperature-display" className="min-w-[100px]">
                Temperature (°C)
              </Label>
               {/* Conditionally render Input based on isClient */}
              {isClient ? (
                  <Input
                    type="number"
                    id="temperature-display"
                    value={telemetry === null ? '' : temperature}
                    readOnly
                    className="w-20"
                  />
               ) : (
                  <Skeleton className="h-10 w-20" />
               )}
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="comm-status-display" className="min-w-[100px]">
                Comm Status
              </Label>
               {/* Conditionally render Input based on isClient */}
               {isClient ? (
                  <Input
                     type="text"
                     id="comm-status-display"
                     value={telemetry === null ? 'Loading...' : communicationStatus}
                     readOnly
                     className="w-[180px]"
                  />
                ) : (
                   <Skeleton className="h-10 w-[180px]" />
                )}
            </div>
          </CardContent>
        </Card>

        {/* AI Risk Score Card */}
        <Card>
          <CardHeader>
            <CardTitle>AI Anomaly Risk Score</CardTitle>
             <CardDescription>Calculated based on the latest telemetry snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
             {/* Pass loading and error states down */}
            <RiskScoreDisplay
              riskScoreData={riskScoreData}
              isLoading={riskScoreLoading}
              error={riskScoreError}
              calculateRiskScore={calculateRiskScore}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// Renamed original Home component to HomeContainer
export default function HomeContainer() {
  const router = useRouter();
  const {selectedSatelliteId} = useSatellite(); // Use context

  // State for displaying telemetry
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryData | null>(null);
   const [displayBatteryLevel, setDisplayBatteryLevel] = useState<number>(0);
   const [displayTemperature, setDisplayTemperature] = useState<number>(0);
   const [displayCommStatus, setDisplayCommStatus] = useState<string>('N/A');


  // State for AI Risk Score
  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(
    null
  );
   const [riskScoreLoading, setRiskScoreLoading] = useState<boolean>(false);
   const [riskScoreError, setRiskScoreError] = useState<string | null>(null);

  // General Error State (for telemetry fetching)
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
   const [isClient, setIsClient] = useState(false); // Client-side check

    useEffect(() => {
      setIsClient(true); // Component has mounted
    }, []);


  // Fetch and update telemetry data based on subscription
  useEffect(() => {
    if (!selectedSatelliteId || !isClient) return; // Only run on client with satelliteId

    setTelemetryError(null); // Clear previous errors
    setCurrentTelemetry(null); // Clear old data
    setDisplayBatteryLevel(0); // Reset display values
    setDisplayTemperature(0);
    setDisplayCommStatus('N/A');
    setRiskScoreData(null); // Clear old risk score when satellite changes
    setRiskScoreError(null);


    console.log(`Subscribing to telemetry for ${selectedSatelliteId}`);
    const unsubscribe = subscribeToTelemetryData(
      selectedSatelliteId,
      (data) => {
         // console.log(`Received telemetry update for ${selectedSatelliteId}:`, data?.timestamp);
        setCurrentTelemetry(data);
        setTelemetryError(null); // Clear error on successful update

        // Update display values based on new data
         if (data) {
            // More robust battery calculation (ensure no division by zero or NaN)
            const voltage = data.batteryVoltage;
            const minVoltage = 3.5;
            const maxVoltage = 4.2;
            const range = maxVoltage - minVoltage;
            let batteryPercent = 0;
            if (range > 0) {
                batteryPercent = Math.min(100, Math.max(0, Math.round(((voltage - minVoltage) / range) * 100)));
            }
            setDisplayBatteryLevel(batteryPercent);

            setDisplayTemperature(data.internalTemperature);

            // Determine Comm Status based on Signal Strength
             const signalStrength = data.communicationLogs?.signalStrength;
             if (signalStrength == null) {
                setDisplayCommStatus('Unknown');
             } else if (signalStrength >= -85) {
               setDisplayCommStatus("stable");
             } else if (signalStrength >= -95) {
               setDisplayCommStatus("unstable");
             } else {
               setDisplayCommStatus("lost");
             }
             // Optionally, trigger risk score calculation automatically on new data
             // calculateRiskScore(); // Uncomment if auto-calculation is desired
         } else {
             // Handle case where data is null (e.g., initial load or error)
             setDisplayBatteryLevel(0);
             setDisplayTemperature(0);
             setDisplayCommStatus('N/A');
              console.warn(`Received null telemetry data for ${selectedSatelliteId}`);
              // Optionally set an error or warning state here
              setTelemetryError("No telemetry data currently available.");
         }
      },
      (error) => {
        console.error(
          `Telemetry subscription error for ${selectedSatelliteId}:`,
          error
        );
        setTelemetryError(
          `Failed to subscribe to telemetry for ${selectedSatelliteId}: ${error.message}`
        );
        setCurrentTelemetry(null); // Clear data on error
         setDisplayBatteryLevel(0);
         setDisplayTemperature(0);
         setDisplayCommStatus('Error');
      }
    );

    // Cleanup subscription on component unmount or satellite change
    return () => {
      console.log(`Unsubscribing from telemetry for ${selectedSatelliteId}`);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]); // Re-subscribe when satellite ID or client status changes


  // Function to calculate risk score using latest display values
  const calculateRiskScore = useCallback(async () => {
     if (!isClient) return; // Don't run on server

     setRiskScoreLoading(true);
     setRiskScoreError(null);
     setRiskScoreData(null); // Clear previous score

    try {
        // Use the current display values as input
       const inputData = {
           batteryLevel: displayBatteryLevel,
           temperature: displayTemperature,
           // Ensure communicationStatus is one of the allowed enum values
           communicationStatus: ["stable", "unstable", "lost"].includes(displayCommStatus)
                                ? displayCommStatus as "stable" | "unstable" | "lost"
                                : "unstable", // Default to unstable if status is unexpected
       };
        console.log("Calculating risk score with input:", inputData);
        // Call the API route instead of the flow directly
         const response = await fetch('/api/getRiskScore', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(inputData),
         });

         if (!response.ok) {
             const errorData = await response.json();
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
         }

        const riskScore = await response.json();
        console.log("Received risk score:", riskScore);
        setRiskScoreData(riskScore);
    } catch (error: any) {
        console.error('Risk Score Calculation Error:', error);
        let message = "An unexpected error occurred.";
         if (error instanceof Error) {
             message = error.message; // Use the message from the caught error
         } else if (typeof error === 'string') {
             message = error;
         }
         // Add specific error handling for API key issues
         if (message.includes("API key not valid") || message.includes("Invalid API Key")) {
            setRiskScoreError("AI Error: Invalid API Key. Please check configuration.");
         } else {
            setRiskScoreError(`AI Error: ${message}`);
         }
    } finally {
       setRiskScoreLoading(false);
    }
  }, [displayBatteryLevel, displayTemperature, displayCommStatus, isClient]); // Depend on display values and client status

  // Render HomeContent only on the client to avoid hydration issues with client-side state
  if (!isClient) {
      // Optionally render a loading skeleton or null during SSR
      return (
          <div className="flex min-h-screen">
               <div className="flex-1 p-4">
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <Separator className="my-4"/>
                   <div className="grid gap-6">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-40 w-full" />
                   </div>
               </div>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar is rendered by AppSidebar in layout now */}
      {/* Main Content Area */}
        <HomeContent
          batteryLevel={displayBatteryLevel}
          temperature={displayTemperature}
          communicationStatus={displayCommStatus}
          riskScoreData={riskScoreData}
          riskScoreLoading={riskScoreLoading}
          riskScoreError={riskScoreError}
          telemetry={currentTelemetry}
          telemetryError={telemetryError}
          calculateRiskScore={calculateRiskScore}
        />
    </div>
  );
}
