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
  useSidebar,
} from '@/components/ui/sidebar';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
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
import {getTelemetryData, TelemetryData} from '@/services/telemetry'; // Using simulated source now
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
        <p className="text-2xl font-bold">
          {isClient ? (
            isLoading ? (
              'Calculating...'
            ) : riskScoreData ? (
              `${riskScoreData.riskScore}%`
            ) : error ? ( // Show N/A if error occurred
                'N/A'
            ) : (
                'N/A' // Default N/A before calculation
            )
          ) : (
            <Skeleton className="h-8 w-1/2" />
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {isClient ? (
            isLoading ? (
              'AI analyzing risk...'
            ) : error ? (
                 'Calculation failed. See error above.' // Indicate failure
            ) : riskScoreData ? (
              riskScoreData.explanation
            ) : (
              'Click button to calculate risk.'
            )
          ) : (
            <Skeleton className="h-4 w-3/4" />
          )}
        </p>
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
        const explanation = await explainAnomalyScore({satelliteId: satelliteId});
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
         } else {
            setAnomalyError(`AI Error: ${errorMessage}`); // General error message
         }
      } finally {
        setIsLoadingAnomaly(false);
      }
    }, [satelliteId]); // Dependency is only satelliteId

    return (
      <Dialog>
        <DialogTrigger asChild>
          {/* Ensure button is only interactive on client */}
          <Button
            onClick={isClient ? fetchAnomalyExplanation : undefined}
            disabled={!isClient || isLoadingAnomaly}
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

const DynamicAnomalyExplanation = dynamic(
  () => Promise.resolve(AnomalyExplanation),
  {ssr: false}
);

// Component to display the main content area
function HomeContent({
  batteryLevel,
  temperature,
  communicationStatus,
  handleBatteryLevelChange, // Pass handlers
  handleTemperatureChange,
  handleCommunicationStatusChange,
  riskScoreData,
  telemetry,
  error,
  calculateRiskScore,
}: any) {
  const { selectedSatelliteId } = useSatellite(); // Get satellite ID here
   const [isClient, setIsClient] = useState(false); // Client-side check

  useEffect(() => {
    setIsClient(true); // Component has mounted
  }, []);


  return (
    <>
      {/* Header for mobile - Keep this structure */}
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
        {isClient && <SidebarTrigger className="md:hidden" />} {/* Conditionally render based on isClient */}
        <h1 className="text-xl font-semibold ml-2">CubeSense</h1>
        <div className="ml-auto">
          <SatelliteSelector />
        </div>
      </header>

      {/* Main content */}
      <div className="p-4">
        {' '}
        {/* Added padding for spacing */}
        {/* Desktop Header */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-2xl">
              CubeSense Dashboard ({selectedSatelliteId || '...'}){' '}
              {/* Display selected satellite ID */}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Use SatelliteSelector on Desktop */}
            {/* Use DynamicAnomalyExplanation */}
            <DynamicAnomalyExplanation
              satelliteId={selectedSatelliteId || ''} // Pass satellite ID
            />
          </div>
        </div>
        <Separator className="my-4 hidden md:block" />
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Simulation Input Area - Now Read Only */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Live Telemetry Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="battery-level" className="min-w-[100px]">
                Battery (%)
              </Label>
              <Input
                type="number"
                id="battery-level"
                value={batteryLevel}
                readOnly // Make read-only
                className="w-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="temperature" className="min-w-[100px]">
                Temperature (°C)
              </Label>
              <Input
                type="number"
                id="temperature"
                value={temperature}
                readOnly // Make read-only
                className="w-20"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="comm-status" className="min-w-[100px]">
                Comm Status
              </Label>
               {/* Keep Select, but disable interaction if needed, or just display text */}
               <Input
                 type="text"
                 id="comm-status-display"
                 value={communicationStatus}
                 readOnly
                 className="w-[180px]"
               />
              {/* <Select value={communicationStatus} onValueChange={handleCommunicationStatusChange} disabled>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="unstable">Unstable</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select> */}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Anomaly Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskScoreDisplay
              riskScoreData={riskScoreData}
              isLoading={false} // Let RiskScoreDisplay manage its own loading if needed
              error={null} // Pass specific risk score error if available
              calculateRiskScore={calculateRiskScore}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function Home() {
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


  // Fetch and update telemetry data based on subscription
  useEffect(() => {
    if (!selectedSatelliteId) return;

    setTelemetryError(null); // Clear previous errors
    setCurrentTelemetry(null); // Clear old data
    setDisplayBatteryLevel(0); // Reset display values
    setDisplayTemperature(0);
    setDisplayCommStatus('N/A');


    console.log(`Subscribing to telemetry for ${selectedSatelliteId}`);
    const unsubscribe = subscribeToTelemetryData(
      selectedSatelliteId,
      (data) => {
         console.log(`Received telemetry update for ${selectedSatelliteId}:`, data?.timestamp);
        setCurrentTelemetry(data);
        setTelemetryError(null); // Clear error on successful update

        // Update display values based on new data
         if (data) {
            setDisplayBatteryLevel(Math.min(100, Math.max(0, Math.round(((data.batteryVoltage - 3.5) / (4.2 - 3.5)) * 100))));
            setDisplayTemperature(data.internalTemperature);
            if (data.communicationLogs?.signalStrength >= -85) {
              setDisplayCommStatus("stable");
            } else if (data.communicationLogs?.signalStrength >= -95) { // Adjusted threshold
              setDisplayCommStatus("unstable");
            } else {
              setDisplayCommStatus("lost");
            }
         } else {
             // Handle case where data is null (e.g., initial load or error)
             setDisplayBatteryLevel(0);
             setDisplayTemperature(0);
             setDisplayCommStatus('N/A');
              console.warn(`Received null telemetry data for ${selectedSatelliteId}`);
              // Optionally set an error or warning state here
              // setTelemetryError("No telemetry data available.");
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
  }, [selectedSatelliteId]); // Re-subscribe when satellite ID changes


  // Function to calculate risk score using latest display values
  const calculateRiskScore = useCallback(async () => {
     setRiskScoreLoading(true);
     setRiskScoreError(null);
     setRiskScoreData(null); // Clear previous score

    try {
        // Use the current display values as input
       const inputData = {
           batteryLevel: displayBatteryLevel,
           temperature: displayTemperature,
           communicationStatus: displayCommStatus as "stable" | "unstable" | "lost", // Cast status
       };
        console.log("Calculating risk score with input:", inputData);
        const riskScore = await getRiskScore(inputData);
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
        setRiskScoreError(`Risk Score Error: ${message}`);
    } finally {
       setRiskScoreLoading(false);
    }
  }, [displayBatteryLevel, displayTemperature, displayCommStatus]); // Depend on display values


  return (
    <div className="flex min-h-screen">
      {/* Sidebar is rendered by AppSidebar in layout now */}
      {/* Main Content Area */}
      <div className="flex-1">
        <HomeContent
          batteryLevel={displayBatteryLevel}
          temperature={displayTemperature}
          communicationStatus={displayCommStatus}
          // Pass dummy handlers if needed, or remove if inputs are read-only
          handleBatteryLevelChange={() => {}}
          handleTemperatureChange={() => {}}
          handleCommunicationStatusChange={() => {}}
          riskScoreData={riskScoreData}
          telemetry={currentTelemetry} // Pass the raw telemetry if needed elsewhere
          error={telemetryError} // Pass telemetry fetching error
          calculateRiskScore={calculateRiskScore}
        />
      </div>
    </div>
  );
}
