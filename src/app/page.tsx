// src/app/page.tsx
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
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {
  Battery,
  Thermometer,
  Waves,
  Mail,
  Navigation,
  AlertTriangle,
  Cpu,
  Rocket,
} from 'lucide-react';
import { subscribeToTelemetryData, TelemetryData, getTelemetryData } from '@/services/telemetry';
import {Alert, AlertTitle, AlertDescription as UIDescription} from '@/components/ui/alert';
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
  DialogHeader as DialogPrimitiveHeader, // Alias to avoid conflict
  DialogTitle as DialogPrimitiveTitle, // Alias to avoid conflict
  DialogDescription as DialogPrimitiveDescription, // Alias to avoid conflict
  DialogTrigger,
} from '@/components/ui/dialog';
import {Separator as UiSeparator} from '@/components/ui/separator'; // Alias Separator
import {getRiskScore} from '@/ai/flows/get-risk-score';
import React, {useState, useEffect, useCallback, memo} from 'react';
import { useRouter } from 'next/navigation';
import {useSatellite} from '@/context/SatelliteContext';
import SatelliteSelector from '@/components/SatelliteSelector';
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
  calculateRiskScore: () => void;
}

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
            <AlertTitle className="text-xs font-semibold">AI Risk Score Error</AlertTitle>
            <UIDescription className="text-xs">{error}</UIDescription>
          </Alert>
        )}
         <div className="text-2xl font-bold"> {/* Changed p to div */}
           {isClient ? (
             isLoading ? (
               <Skeleton className="h-8 w-1/2" />
             ) : riskScoreData ? (
               `${riskScoreData.riskScore}%`
             ) : error ? (
               'N/A'
             ) : (
               'N/A'
             )
           ) : (
             <Skeleton className="h-8 w-1/2" />
           )}
         </div>
         <div className="text-sm text-muted-foreground mt-1 min-h-[20px]"> {/* Changed p to div */}
           {isClient ? (
             isLoading ? (
               <Skeleton className="h-4 w-3/4 mt-1" />
             ) : error ? (
                 'Calculation failed.'
             ) : riskScoreData ? (
               riskScoreData.explanation
             ) : (
               'Click button to calculate risk.'
             )
           ) : (
             <Skeleton className="h-4 w-3/4 mt-1" />
           )}
         </div>
        {isClient && (
          <Button
            onClick={calculateRiskScore}
            disabled={isLoading}
            className="mt-4"
            size="sm"
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
  satelliteId: string;
}

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

    const fetchAnomalyExplanation = useCallback(async () => {
      if (!satelliteId) {
          setAnomalyError("Please select a satellite first.");
          return;
      }
      setIsLoadingAnomaly(true);
      setAnomalyError(null);
      setAnomalyExplanation(null);

      try {
        console.log(`Requesting anomaly explanation for ${satelliteId}`);
        const response = await fetch('/api/explainAnomalyScore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ satelliteId }),
        });

         const responseText = await response.text();

        if (!response.ok) {
           console.error(`/api/explainAnomalyScore request failed with status ${response.status}. Response text:`, responseText);
          let errorData: any;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
             errorData = responseText;
             if (typeof errorData === 'string' && errorData.trim().toLowerCase().startsWith('<!doctype html')) {
                console.error("Server returned HTML instead of JSON:", errorData.substring(0, 500) + "..."); // Log a snippet
                 throw new Error(`Server Error (Status: ${response.status}). An unexpected HTML response was received. Please check server logs for the underlying error (e.g., 'async_hooks' issue).`);
             }
          }
          throw new Error(errorData?.error || errorData || `HTTP error! status: ${response.status}`);
        }

        const explanation = JSON.parse(responseText);
        console.log(`Received anomaly explanation for ${satelliteId}:`, explanation);
        setAnomalyExplanation(explanation);
      } catch (aiError: any) {
        console.error('Error calling explainAnomalyScore AI flow:', aiError);
        let errorMessage = 'An unexpected error occurred.';
        if (aiError instanceof Error) {
          errorMessage = aiError.message;
        } else if (typeof aiError === 'string') {
          errorMessage = aiError;
        }
         if (errorMessage.includes("API key not valid") || errorMessage.includes("Invalid API Key")) {
            setAnomalyError("AI Error: Invalid API Key. Please check your .env configuration.");
         } else if (errorMessage.includes("429")) {
            setAnomalyError("AI Error: API Rate Limit Exceeded. Please try again later.");
         } else if (errorMessage.includes("did not match expected format") || errorMessage.includes("response was missing")) {
             setAnomalyError("AI Error: Received an unexpected response format from the AI. Please try again.");
         } else if (errorMessage.includes("Failed to retrieve telemetry")) {
             setAnomalyError(`Error: Could not retrieve telemetry data for ${satelliteId}. ${errorMessage}`);
         } else if (errorMessage.includes("Server Error (Status: 500)") || errorMessage.includes("Server returned an HTML error page")) {
             setAnomalyError(errorMessage);
         } else if (errorMessage.includes("Server Error (Status: 500). An unexpected HTML response was received.")){
             setAnomalyError(errorMessage);
         }
         else {
            setAnomalyError(`AI Error: ${errorMessage}`);
         }
      } finally {
        setIsLoadingAnomaly(false);
      }
    }, [satelliteId]);

    if (!isClient) {
      return <Button variant="outline" disabled>Loading Explanation...</Button>;
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
          <DialogPrimitiveHeader>
            <DialogPrimitiveTitle>Anomaly Explanation for {satelliteId}</DialogPrimitiveTitle>
            <DialogPrimitiveDescription>
              AI-powered analysis of the anomaly risk score based on latest
              telemetry.
            </DialogPrimitiveDescription>
          </DialogPrimitiveHeader>
          <div className="mt-4">
            {isLoadingAnomaly ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <UiSeparator className="my-4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : anomalyError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <UIDescription>{anomalyError}</UIDescription>
              </Alert>
            ) : anomalyExplanation ? (
              <div>
                <h4 className="font-semibold mb-2">Explanation:</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {anomalyExplanation.explanation}
                </p>
                <UiSeparator className="my-4" />
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

const DynamicAnomalyExplanation = dynamic(() => Promise.resolve(AnomalyExplanation), { ssr: false });


interface HomeContentProps {
  batteryLevel: number;
  temperature: number;
  communicationStatus: "stable" | "unstable" | "lost" | "N/A" | "Error" | "Loading..." | "Unknown";
  riskScoreData: GetRiskScoreOutput | null;
  riskScoreLoading: boolean;
  riskScoreError: string | null;
  telemetry: TelemetryData | null;
  telemetryError: string | null;
  calculateRiskScore: () => void;
}


function HomeContent({
  batteryLevel,
  temperature,
  communicationStatus,
  riskScoreData,
  riskScoreLoading,
  riskScoreError,
  telemetry,
  telemetryError,
  calculateRiskScore,
}: HomeContentProps) {
  const { selectedSatelliteId } = useSatellite();
  const [isClient, setIsClient] = useState(false);
  const { setOpenMobile } = useSidebar();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleNavigation = (path: string) => {
    setOpenMobile(false);
    router.push(path);
  };


  return (
    <div className="flex-1">
      <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 md:hidden">
        {isClient && <SidebarTrigger className="md:hidden" />}
        <h1 className="text-xl font-semibold ml-2">CubeSense</h1>
        <div className="ml-auto">
          {isClient && <SatelliteSelector />}
        </div>
      </header>

      <div className="p-4">
        <div className="hidden md:flex flex-wrap items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h1 className="font-semibold text-2xl">
              CubeSense Dashboard ({selectedSatelliteId || '...'}){' '}
            </h1>
          </div>
           <div className="flex items-center gap-4">
              {isClient && <DynamicAnomalyExplanation satelliteId={selectedSatelliteId || ''} />}
           </div>
        </div>
        <UiSeparator className="my-4 hidden md:block" />

         {telemetryError && (
           <Alert variant="destructive" className="mb-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Telemetry Error</AlertTitle>
             <UIDescription>{telemetryError}</UIDescription>
           </Alert>
         )}


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
               {isClient ? (
                   <Input
                     type="number"
                     id="battery-level-display"
                     value={telemetry === null ? '' : batteryLevel.toFixed(0)}
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
               {isClient ? (
                   <Input
                     type="number"
                     id="temperature-display"
                     value={telemetry === null ? '' : temperature.toFixed(1)}
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
               {isClient ? (
                  <div className="flex-1 min-w-[80px] h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                    {communicationStatus}
                  </div>
               ) : (
                 <Skeleton className="h-10 flex-1 min-w-[80px]" />
               )}
             </div>
           </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Anomaly Risk Score</CardTitle>
             <CardDescription>Calculated based on the latest telemetry snapshot.</CardDescription>
          </CardHeader>
          <CardContent>
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


export default function HomeContainer() {
  const {selectedSatelliteId} = useSatellite();

  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryData | null>(null);
   const [displayBatteryLevel, setDisplayBatteryLevel] = useState<number>(0);
   const [displayTemperature, setDisplayTemperature] = useState<number>(0);
   const [displayCommStatus, setDisplayCommStatus] = useState<HomeContentProps["communicationStatus"]>('Loading...');


  const [riskScoreData, setRiskScoreData] = useState<GetRiskScoreOutput | null>(
    null
  );
   const [riskScoreLoading, setRiskScoreLoading] = useState<boolean>(false);
   const [riskScoreError, setRiskScoreError] = useState<string | null>(null);

  const [telemetryError, setTelemetryError] = useState<string | null>(null);
   const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);


  useEffect(() => {
    if (!selectedSatelliteId || !isClient) return;

    setTelemetryError(null);
    setCurrentTelemetry(null);
    setDisplayBatteryLevel(0);
    setDisplayTemperature(0);
    setDisplayCommStatus('Loading...');
    setRiskScoreData(null);
    setRiskScoreError(null);


    console.log(`Subscribing to telemetry for ${selectedSatelliteId}`);
    const unsubscribe = subscribeToTelemetryData(
      selectedSatelliteId,
      (data) => {
        setCurrentTelemetry(data);
        setTelemetryError(null);

         if (data) {
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
         } else {
             setDisplayBatteryLevel(0);
             setDisplayTemperature(0);
             setDisplayCommStatus('N/A');
              console.warn(`Received null telemetry data for ${selectedSatelliteId}`);
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
        setCurrentTelemetry(null);
         setDisplayBatteryLevel(0);
         setDisplayTemperature(0);
         setDisplayCommStatus('Error');
      }
    );

    return () => {
      console.log(`Unsubscribing from telemetry for ${selectedSatelliteId}`);
      unsubscribe();
    };
  }, [selectedSatelliteId, isClient]);


  const calculateRiskScore = useCallback(async () => {
     if (!isClient) return;

     const validCommStatuses = ["stable", "unstable", "lost"];
     const currentCommStatus = displayCommStatus;

      if (!validCommStatuses.includes(currentCommStatus as string) && currentCommStatus !== "Unknown") {
          setRiskScoreError("Cannot calculate risk: Invalid communication status.");
          return;
      }


     setRiskScoreLoading(true);
     setRiskScoreError(null);
     setRiskScoreData(null);

    try {
       const inputData = {
           batteryLevel: displayBatteryLevel,
           temperature: displayTemperature,
           communicationStatus: validCommStatuses.includes(currentCommStatus as string)
                                ? currentCommStatus as "stable" | "unstable" | "lost"
                                : "unstable",
       };
        console.log("Calculating risk score with input:", inputData);
         const response = await fetch('/api/getRiskScore', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(inputData),
         });

          const responseText = await response.text();

         if (!response.ok) {
            console.error(`/api/getRiskScore request failed with status ${response.status}. Response text:`, responseText);
             let errorData;
             try {
                 errorData = JSON.parse(responseText);
             } catch (e) {
                  errorData = responseText;
                 if (typeof errorData === 'string' && errorData.trim().toLowerCase().startsWith('<!doctype html')) {
                     console.error("Server returned HTML instead of JSON:", errorData.substring(0, 500) + "...");
                      throw new Error(`Server Error (Status: ${response.status}). Please check server logs.`);
                 }
             }
             throw new Error(errorData?.error || errorData || `HTTP error! status: ${response.status}`);
         }

        const riskScore = JSON.parse(responseText);
        console.log("Received risk score:", riskScore);
        setRiskScoreData(riskScore);
    } catch (error: any) {
        console.error('Risk Score Calculation Error:', error);
        let message = "An unexpected error occurred.";
         if (error instanceof Error) {
             message = error.message;
         } else if (typeof error === 'string') {
             message = error;
         }
         if (message.includes("API key not valid") || message.includes("Invalid API Key")) {
            setRiskScoreError("AI Error: Invalid API Key. Please check configuration.");
          } else if (message.includes("Server Error (Status: 500)") || message.includes("Server returned an HTML error page")) {
              setRiskScoreError("Server Error: An unexpected issue occurred on the server. Check logs for details.");
         } else {
            setRiskScoreError(`AI Error: ${message}`);
         }
    } finally {
       setRiskScoreLoading(false);
    }
  }, [displayBatteryLevel, displayTemperature, displayCommStatus, isClient]);

  if (!isClient) {
      return (
          <div className="flex min-h-screen">
               <div className="flex-1 p-4">
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <UiSeparator className="my-4"/>
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

