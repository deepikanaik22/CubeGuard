
'use server';

import { z } from 'zod';
import { getTelemetryData } from '@/services/telemetry';
import { openRouterAI } from '@/ai/ai-instance';
import {
  ExplainAnomalyScoreInput,
  ExplainAnomalyScoreOutput,
} from '@/shared/anomalySchemas';

// Type alias for Zod schemas if needed for clarity, or use directly
type ExplainAnomalyScoreInputType = z.infer<typeof ExplainAnomalyScoreInput>;
type ExplainAnomalyScoreOutputType = z.infer<typeof ExplainAnomalyScoreOutput>;

// Utility to extract JSON object from messy AI response
function extractJson(response: string): string {
  const match = response.match(/\{[\s\S]*?\}/);
  // If no match, return an empty object string to avoid JSON.parse error on non-JSON,
  // then let Zod validation catch it as invalid.
  return match ? match[0] : '{}';
}

export async function explainAnomalyScore(
  input: ExplainAnomalyScoreInputType
): Promise<ExplainAnomalyScoreOutputType> {
  const { satelliteId } = input;

  const telemetryData = await getTelemetryData(satelliteId);
  if (!telemetryData) {
    console.error(`No telemetry data found for satellite ID: ${satelliteId} in explainAnomalyScore`);
    // Create an error object that the API route can identify
    const notFoundError = new Error(`No telemetry data found for satellite ID: ${satelliteId}`);
    notFoundError.name = 'NotFoundError'; // Custom name for easier checking
    throw notFoundError;
  }

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

Output ONLY the JSON object in the following format (no markdown, no text before or after):
{
  "explanation": "string",
  "breakdown": {
    "thermal": number,
    "comm": number,
    "power": number,
    "orientation": number
  }
}

If telemetry data seems insufficient or ambiguous for a confident analysis, return a JSON object like this:
{"explanation": "Analysis inconclusive due to limited or ambiguous telemetry data.", "breakdown": {"thermal": 0, "comm": 0, "power": 0, "orientation": 0}}
`;

  let responseText = '';
  try {
    // console.log(`Calling openRouterAI for satellite ${satelliteId} with prompt...`); // Verbose
    responseText = await openRouterAI.call(prompt);
    // console.log(`Raw response from openRouterAI for ${satelliteId}:`, responseText); // Verbose

    if (!responseText || responseText.trim() === '') {
        console.error(`Empty response from openRouterAI for ${satelliteId}.`);
        const emptyResponseError = new Error('AI service returned an empty response.');
        emptyResponseError.name = 'EmptyResponseError';
        throw emptyResponseError;
    }

    const cleanedJsonString = extractJson(responseText);
    // console.log(`Cleaned JSON string for ${satelliteId}:`, cleanedJsonString); // Verbose

    const json = JSON.parse(cleanedJsonString); // Can throw SyntaxError

    const parsed = ExplainAnomalyScoreOutput.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.errors.map((e: z.ZodIssue) =>
        `${e.path.join('.')} - ${e.message}`
      ).join('; ');
      console.error(`AI output validation failed for ${satelliteId}: ${issues}. Parsed JSON:`, json);
      const validationError = new Error(`AI output failed validation: ${issues}`);
      validationError.name = 'ZodValidationError';
      throw validationError;
    }

    // console.log(`Successfully parsed and validated AI response for ${satelliteId}:`, parsed.data); // Verbose
    return parsed.data;

  } catch (err: any) {
    console.error(`❌ Error in explainAnomalyScore for ${satelliteId} - Name: ${err.name}, Message: ${err.message}`);
    // Log context if available
    if (responseText && !(err instanceof SyntaxError) && err.name !== 'ZodValidationError') {
        console.error(`   Raw responseText that might have led to error for ${satelliteId}: ${responseText.substring(0, 500)}...`);
    }
    // Re-throw the original error to be handled by the API route.
    // This preserves error.name and other properties.
    throw err;
  }
}
