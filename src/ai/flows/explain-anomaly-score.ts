
'use server';

import { z } from 'zod';
import { getTelemetryData } from '@/services/telemetry';
import { openRouterAI } from '@/ai/ai-instance';
import { anomalySchemas } from '@/shared/anomalySchemas';

const { ExplainAnomalyScoreInput, ExplainAnomalyScoreOutput } = anomalySchemas;

type ExplainAnomalyScoreInputType = z.infer<typeof ExplainAnomalyScoreInput>;
type ExplainAnomalyScoreOutputType = z.infer<typeof ExplainAnomalyScoreOutput>;

function extractJson(response: string): string {
  // Attempt to find JSON within ```json ... ```
  const markdownMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    try {
      JSON.parse(markdownMatch[1]); // Validate
      return markdownMatch[1];
    } catch (e) {
      // console.warn("Failed to parse content within markdown JSON block, trying other methods.", e);
    }
  }

  // Attempt to find the first complete JSON object in the string
  let firstBrace = -1;
  let balance = 0;
  let potentialJson = "";

  for (let i = 0; i < response.length; i++) {
    if (response[i] === '{') {
      if (balance === 0) {
        firstBrace = i;
      }
      balance++;
    } else if (response[i] === '}') {
      if (balance > 0) { 
          balance--;
          if (balance === 0 && firstBrace !== -1) {
            potentialJson = response.substring(firstBrace, i + 1);
            try {
              JSON.parse(potentialJson); // Validate
              return potentialJson; 
            } catch (e) {
              // console.warn("Found a {}-balanced block that wasn't valid JSON, continuing search.", e, "Block:", potentialJson.substring(0,100));
              firstBrace = -1; 
            }
          }
      }
    }
  }
  
  // console.warn("No valid JSON extracted, returning empty object for Zod validation.");
  return '{}';
}

export async function explainAnomalyScore(
  input: ExplainAnomalyScoreInputType
): Promise<ExplainAnomalyScoreOutputType> {
  const { satelliteId } = input;

  const telemetryData = await getTelemetryData(satelliteId);
  if (!telemetryData) {
    console.error(`No telemetry data found for satellite ID: ${satelliteId} in explainAnomalyScore`);
    const notFoundError = new Error(`No telemetry data found for satellite ID: ${satelliteId}`);
    notFoundError.name = 'NotFoundError'; 
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
    responseText = await openRouterAI.call(prompt);

    if (!responseText || responseText.trim() === '') {
        console.error(`Empty response from openRouterAI for ${satelliteId}.`);
        const emptyResponseError = new Error('AI service returned an empty response.');
        emptyResponseError.name = 'EmptyResponseError';
        throw emptyResponseError;
    }

    const cleanedJsonString = extractJson(responseText);

    const json = JSON.parse(cleanedJsonString);

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

    return parsed.data;

  } catch (err: any) {
    console.error(`❌ Error in explainAnomalyScore for ${satelliteId} - Name: ${err.name}, Message: ${err.message}`);
    if (responseText && !(err instanceof SyntaxError) && err.name !== 'ZodValidationError') {
        console.error(`   Raw responseText that might have led to error for ${satelliteId}: ${responseText.substring(0, 500)}...`);
    }
    throw err;
  }
}

