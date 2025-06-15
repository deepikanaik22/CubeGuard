
'use server';

import { z } from 'zod';
import { getTelemetryData } from '@/services/telemetry';
import { openRouterAI } from '@/ai/ai-instance';
import { anomalySchemas } from '@/shared/anomalySchemas'; // Correctly import anomalySchemas

// Destructure with the correct names from anomalySchemas
const { ExplainAnomalyScoreInput, ExplainAnomalyScoreOutput } = anomalySchemas;


export async function explainAnomalyScore(
  input: z.infer<typeof ExplainAnomalyScoreInput> // Use ExplainAnomalyScoreInput from anomalySchemas
) {
  const { satelliteId } = input;

  const telemetryData = await getTelemetryData(satelliteId);
  if (!telemetryData) throw new Error(`No telemetry data for ${satelliteId}`);

  // Using the prompt structure based on the file's current use of openRouterAI
  // This prompt needs to ask for a JSON output matching ExplainAnomalyScoreOutput.
  const prompt = `
You are an expert in satellite anomaly detection. Based on the telemetry data for satellite ${satelliteId},
explain the anomaly risk score.

Telemetry Snapshot:
- Battery Voltage: ${telemetryData.batteryVoltage.toFixed(2)}V
- Solar Panel Output: ${telemetryData.solarPanelOutput.toFixed(2)}W
- Internal Temperature: ${telemetryData.internalTemperature.toFixed(1)}°C
- External Temperature: ${telemetryData.externalTemperature.toFixed(1)}°C
- Gyroscope (X,Y,Z): ${telemetryData.gyroscope.x.toFixed(3)}, ${telemetryData.gyroscope.y.toFixed(3)}, ${telemetryData.gyroscope.z.toFixed(3)} deg/s
- Magnetometer (X,Y,Z): ${telemetryData.magnetometer.x.toFixed(4)}, ${telemetryData.magnetometer.y.toFixed(4)}, ${telemetryData.magnetometer.z.toFixed(4)} µT
- Communication Signal Strength: ${telemetryData.communicationLogs.signalStrength.toFixed(0)} dBm
- Communication Packet Delay: ${telemetryData.communicationLogs.packetDelay.toFixed(0)} ms

Provide:
1. A concise overall "explanation" (2-3 sentences) of the factors contributing to the current anomaly risk.
2. A "breakdown" object estimating the percentage contribution of 'thermal', 'comm' (communication), 'power', and 'orientation' systems to the risk. These should sum to roughly 100.

Output ONLY the JSON object in the specified format: {"explanation": "string", "breakdown": {"thermal": number, "comm": number, "power": number, "orientation": number}}.
Do not include any other text, just the JSON.
  `;

  const responseText = await openRouterAI.call(prompt);

  try {
    // Attempt to parse the responseText, which should be a JSON string
    const parsedJson = JSON.parse(responseText);
    // Validate the parsed JSON against the Zod schema
    const parsed = ExplainAnomalyScoreOutput.parse(parsedJson); // Use ExplainAnomalyScoreOutput from anomalySchemas
    return parsed;
  } catch (err) {
    console.error('❌ AI output invalid or not JSON:', responseText, err);
    // Construct a more informative error message
    let errorMessage = 'Invalid AI output format.';
    if (err instanceof z.ZodError) {
      errorMessage = `AI output failed validation: ${err.errors.map(e => `${e.path.join('.')} - ${e.message}`).join(', ')}`;
    } else if (err instanceof SyntaxError) {
      errorMessage = `AI output was not valid JSON. Content: ${responseText.substring(0,100)}...`;
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }
    throw new Error(errorMessage);
  }
}

