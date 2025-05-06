
'use server';
/**
 * @fileOverview Explains the anomaly score for a given satellite based on telemetry data.
 *
 * - explainAnomalyScore - A function that explains the anomaly score.
 */

import {ai} from '@/ai/ai-instance';
import {TelemetryData, getTelemetryData} from '@/services/telemetry';
import {z} from 'genkit';
import type {
  ExplainAnomalyScoreInput,
  ExplainAnomalyScoreOutput,
} from '@/ai/types';

const ExplainAnomalyScoreInputSchema = z.object({
  satelliteId: z
    .string()
    .describe('The ID of the satellite to explain the anomaly score for.'),
});

const ExplainAnomalyScoreOutputSchema = z.object({
  explanation: z
    .string()
    .describe(
      'A detailed explanation of how the Anomaly Risk Score was calculated.'
    ),
  breakdown: z
    .object({
      thermal: z
        .number()
        .describe(
          'The contribution of thermal factors to the risk score (0-100).'
        ),
      comm: z
        .number()
        .describe(
          'The contribution of communication factors to the risk score (0-100).'
        ),
      power: z
        .number()
        .describe(
          'The contribution of power factors to the risk score (0-100).'
        ),
      orientation: z
        .number()
        .describe(
          'The contribution of orientation factors to the risk score (0-100).'
        ),
    })
    .describe('A breakdown of the risk score by failure type.'),
});

const getTelemetryDataTool = ai.defineTool(
  {
    name: 'getTelemetryData',
    description: 'Retrieves the latest telemetry data for a specific satellite.',
    inputSchema: z.object({
      satelliteId: z.string().describe('The ID of the satellite.'),
    }),
    outputSchema: z.object({
       id: z.string().optional(),
       gyroscope: z.object({ x: z.number(), y: z.number(), z: z.number() }),
       batteryVoltage: z.number(),
       solarPanelOutput: z.number(),
       internalTemperature: z.number(),
       externalTemperature: z.number(),
       magnetometer: z.object({ x: z.number(), y: z.number(), z: z.number() }),
       communicationLogs: z.object({ signalStrength: z.number(), packetDelay: z.number() }),
       timestamp: z.date().optional(),
    }),
  },
  async (input) => {
    console.log(`[getTelemetryDataTool] Attempting to fetch data for satellite: ${input.satelliteId}`);
    try {
      const data = await getTelemetryData(input.satelliteId);
      if (!data) {
        console.warn(`[getTelemetryDataTool] No telemetry data found for satellite ${input.satelliteId}.`);
        throw new Error(
          `Telemetry data not found for satellite ${input.satelliteId}. Cannot generate explanation.`
        );
      }
       console.log(`[getTelemetryDataTool] Successfully retrieved telemetry data for ${input.satelliteId} at ${data.timestamp?.toISOString()}`);
      const validatedData = {
         ...data,
         timestamp: data.timestamp instanceof Date ? data.timestamp : (data.timestamp as any)?.toDate?.() ?? undefined,
      };
      const validation = getTelemetryDataTool.outputSchema.safeParse(validatedData);
       if (!validation.success) {
         console.error("[getTelemetryDataTool] Output validation failed:", JSON.stringify(validation.error.flatten(), null, 2));
         throw new Error("[getTelemetryDataTool] Failed to return data in the expected format.");
       }
       console.log("[getTelemetryDataTool] Returning validated data for", input.satelliteId);
      return validation.data;
    } catch (error) {
        console.error(`[getTelemetryDataTool] Error during data fetch for ${input.satelliteId}:`, error);
         if (error instanceof Error) {
           console.error(`[getTelemetryDataTool] Error Stack for ${input.satelliteId}:`, error.stack);
           throw new Error(`[getTelemetryDataTool] Failed to retrieve telemetry data: ${error.message}`);
         } else {
            console.error('[getTelemetryDataTool] An unknown error object was thrown:', error);
            throw new Error('[getTelemetryDataTool] An unknown error occurred while retrieving telemetry data.');
         }
    }
  }
);

export async function explainAnomalyScore(
  input: ExplainAnomalyScoreInput
): Promise<ExplainAnomalyScoreOutput> {
   console.log("[explainAnomalyScore Flow] Initiating with input:", JSON.stringify(input, null, 2));
  try {
    const result = await explainAnomalyScoreFlow(input);
     console.log("[explainAnomalyScore Flow] Execution successful. Result:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[explainAnomalyScore Flow] Critical error during execution:', error);
     if (error instanceof Error) {
         console.error('[explainAnomalyScore Flow] Error Stack Trace:', error.stack);
         throw error; // Re-throw to be caught by the API route handler
     } else {
         console.error('[explainAnomalyScore Flow] Unknown error object thrown:', error);
         throw new Error('[explainAnomalyScore Flow] Failed due to an unknown error.');
     }
  }
}

const prompt = ai.definePrompt<
  {telemetryData: TelemetryData; satelliteId: string},
  typeof ExplainAnomalyScoreOutputSchema
>({
  name: 'explainAnomalyScorePrompt',
  model: 'gemini-1.5-flash-latest', // Explicitly set a faster model
  input: {
    schema: z.object({
      satelliteId: z.string(),
      telemetryData: z.object({
         id: z.string().optional(),
         gyroscope: z.object({ x: z.number(), y: z.number(), z: z.number() }),
         batteryVoltage: z.number(),
         solarPanelOutput: z.number(),
         internalTemperature: z.number(),
         externalTemperature: z.number(),
         magnetometer: z.object({ x: z.number(), y: z.number(), z: z.number() }),
         communicationLogs: z.object({ signalStrength: z.number(), packetDelay: z.number() }),
         timestamp: z.date().optional(),
      }),
    }),
  },
  output: {
    schema: ExplainAnomalyScoreOutputSchema,
  },
  prompt: `You are an expert AI analyst specializing in CubeSat telemetry data and anomaly detection.

You will receive telemetry data for a specific satellite (ID: {{satelliteId}}) and must provide a detailed explanation for its anomaly risk score.

Analyze the provided telemetry data meticulously:
{{#with telemetryData}}
- Gyroscope (deg/s): x={{gyroscope.x}}, y={{gyroscope.y}}, z={{gyroscope.z}}
- Battery Voltage (V): {{batteryVoltage}}
- Solar Panel Output (W): {{solarPanelOutput}}
- Internal Temp (°C): {{internalTemperature}}
- External Temp (°C): {{externalTemperature}}
- Magnetometer (μT): x={{magnetometer.x}}, y={{magnetometer.y}}, z={{magnetometer.z}}
- Comms: Signal Strength={{communicationLogs.signalStrength}} dBm, Packet Delay={{communicationLogs.packetDelay}} ms
- Timestamp: {{#if timestamp}}{{timestamp}}{{else}}N/A{{/if}}
{{/with}}

Based *only* on this data, identify potential anomalies or deviations using these guidelines:
*   **Orientation Risk:** Unusual gyroscope fluctuations (> 1 deg/s change between readings, if available, or absolute values far from zero without command) or significant magnetometer deviations (changes > 10 μT or values inconsistent with expected orbital position).
*   **Power Risk:** Battery voltage critically low (< 3.65V) or low (< 3.75V). Solar panel output unexpectedly low (< 0.5W in expected sunlight).
*   **Thermal Risk:** Internal temperature critically high (> 38°C) or high (> 35°C). External temperature exceeding expected bounds (e.g., > 50°C or < -30°C). Rapid temperature changes.
*   **Communication Risk:** Signal strength critically weak (< -95 dBm) or weak (< -90 dBm). Packet delay critically high (> 300 ms) or high (> 250 ms).

**Output Requirements:**
1.  **Explanation:** Provide a clear, concise explanation of how the overall anomaly risk score was determined, citing specific telemetry values and comparing them to the risk guidelines. Mention which factors contributed most significantly.
2.  **Breakdown:** Provide a numerical breakdown (0-100 for each category, summing roughly to 100 if multiple risks exist, or representing the primary risk factor's estimated contribution) for the contribution of each category (thermal, comm, power, orientation) to the overall risk. If a category shows no risk, assign 0.

Ensure the output strictly adheres to the required JSON format.`,
});

const explainAnomalyScoreFlow = ai.defineFlow<
  typeof ExplainAnomalyScoreInputSchema,
  typeof ExplainAnomalyScoreOutputSchema
>(
  {
    name: 'explainAnomalyScoreFlow',
    inputSchema: ExplainAnomalyScoreInputSchema,
    outputSchema: ExplainAnomalyScoreOutputSchema,
    tools: [getTelemetryDataTool],
  },
  async (input, context) => {
     console.log(`[explainAnomalyScoreFlow] Starting execution for satellite: ${input.satelliteId}`);
    let telemetryData: TelemetryData | null = null;
    const flowStartTime = Date.now();

    try {
        console.log(`[explainAnomalyScoreFlow] Calling tool 'getTelemetryData' for satellite ${input.satelliteId}. Context available: ${!!context}`);
        const toolStartTime = Date.now();
        telemetryData = await context.callTool('getTelemetryData', { satelliteId: input.satelliteId });
        const toolEndTime = Date.now();
        console.log(`[explainAnomalyScoreFlow] Tool 'getTelemetryData' completed in ${toolEndTime - toolStartTime}ms.`);
        console.log('[explainAnomalyScoreFlow] Telemetry data received from tool:', telemetryData ? 'Data received' : 'No data received (null)');

        if (!telemetryData) {
             console.error(`[explainAnomalyScoreFlow] Tool 'getTelemetryData' returned null for satellite ${input.satelliteId}.`);
             throw new Error(`Tool 'getTelemetryData' returned no data for satellite ${input.satelliteId}. This is unexpected if the satellite ID is valid.`);
        }
    } catch (toolError) {
        console.error(`[explainAnomalyScoreFlow] Error executing 'getTelemetryData' tool for ${input.satelliteId}:`, toolError);
        if (toolError instanceof Error) {
           console.error(`[explainAnomalyScoreFlow] Tool Error Stack:`, toolError.stack);
           throw new Error(`Failed to retrieve telemetry via tool for ${input.satelliteId}: ${toolError.message}`);
        } else {
           console.error('[explainAnomalyScoreFlow] Unknown error object thrown by tool:', toolError);
           throw new Error(`An unknown error occurred while using the telemetry tool for ${input.satelliteId}.`);
         }
    }

    try {
      console.log(`[explainAnomalyScoreFlow] Calling AI prompt with telemetry data for ${input.satelliteId}. Telemetry data:`, JSON.stringify(telemetryData, null, 2));
      const promptStartTime = Date.now();
      const result = await prompt({
        telemetryData,
        satelliteId: input.satelliteId,
      });
      const promptEndTime = Date.now();
      console.log(`[explainAnomalyScoreFlow] AI prompt execution completed in ${promptEndTime - promptStartTime}ms.`);
      console.log('[explainAnomalyScoreFlow] AI prompt raw result object:', JSON.stringify(result, null, 2));

      if (!result?.output) {
        console.error(
          '[explainAnomalyScoreFlow] AI prompt did not return a valid output structure. Result:', JSON.stringify(result, null, 2)
        );
        throw new Error('AI explanation response was missing or empty.');
      }

      const validation = ExplainAnomalyScoreOutputSchema.safeParse(result.output);
      if (!validation.success) {
          console.error("[explainAnomalyScoreFlow] AI explanation output failed schema validation:", JSON.stringify(validation.error.flatten(), null, 2));
          console.error("[explainAnomalyScoreFlow] Invalid AI output received:", JSON.stringify(result.output, null, 2));
          throw new Error(`AI explanation response did not match expected format: ${validation.error.message}`);
      }

      const flowEndTime = Date.now();
      console.log(`[explainAnomalyScoreFlow] Successfully generated and validated output for ${input.satelliteId}. Total flow time: ${flowEndTime - flowStartTime}ms.`);
      return result.output;
    } catch (error) {
       console.error(`[explainAnomalyScoreFlow] Error during AI prompt execution for ${input.satelliteId}:`, error);
        if (error instanceof Error) {
            console.error(`[explainAnomalyScoreFlow] AI Prompt Error Stack:`, error.stack);
            if (error.message.includes("API key not valid")) {
                 throw new Error("AI Error: Invalid API Key. Please check configuration.");
            }
            // Check for timeout specific messages if the SDK provides them, otherwise rely on general message
            if (error.message.toLowerCase().includes('timeout') || error.message.toLowerCase().includes('deadline exceeded')) {
                throw new Error(`AI prompt execution timed out for ${input.satelliteId}: ${error.message}`);
            }
            throw new Error(`AI prompt execution failed for ${input.satelliteId}: ${error.message}`);
        } else {
            console.error('[explainAnomalyScoreFlow] Unknown error object thrown during AI prompt:', error);
            throw new Error(`An unknown error occurred during AI processing for ${input.satelliteId}.`);
        }
    }
  }
);

