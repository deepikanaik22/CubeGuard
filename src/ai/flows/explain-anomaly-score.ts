'use server';
/**
 * @fileOverview Explains the anomaly score for a given satellite based on telemetry data.
 *
 * - explainAnomalyScore - A function that explains the anomaly score.
 */

import {ai} from '@/ai/ai-instance'; // Correctly imports ai instance from the non-'use server' file
import {TelemetryData, getTelemetryData} from '@/services/telemetry';
import {z} from 'genkit';
import type {
  ExplainAnomalyScoreInput,
  ExplainAnomalyScoreOutput,
} from '@/ai/types'; // Import types

// Define schemas locally for runtime validation
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

// Define a tool for getting telemetry data
const getTelemetryDataTool = ai.defineTool(
  {
    name: 'getTelemetryData',
    description: 'Retrieves the latest telemetry data for a specific satellite.',
    inputSchema: z.object({
      satelliteId: z.string().describe('The ID of the satellite.'),
    }),
    // Update output schema to reflect TelemetryData interface more accurately
    outputSchema: z.object({
       id: z.string().optional(),
       gyroscope: z.object({ x: z.number(), y: z.number(), z: z.number() }),
       batteryVoltage: z.number(),
       solarPanelOutput: z.number(),
       internalTemperature: z.number(),
       externalTemperature: z.number(),
       magnetometer: z.object({ x: z.number(), y: z.number(), z: z.number() }),
       communicationLogs: z.object({ signalStrength: z.number(), packetDelay: z.number() }),
       timestamp: z.date().optional(), // Assuming timestamp is a Date object from simulation
    }),
  },
  async (input) => {
    console.log('Executing getTelemetryDataTool for:', input.satelliteId);
    try {
      const data = await getTelemetryData(input.satelliteId);
      if (!data) {
        console.warn(`No telemetry data found by tool for satellite ${input.satelliteId}`);
        // Decide if throwing an error or returning null/empty state is better
        throw new Error(
          `Telemetry data not found for satellite ${input.satelliteId}`
        );
      }
       console.log(`Telemetry data retrieved successfully for ${input.satelliteId}:`, data.timestamp);
      // Ensure the returned data matches the tool's outputSchema
      // Convert timestamp to Date if it's not already (e.g., from Firestore Timestamp)
      const validatedData = {
         ...data,
         timestamp: data.timestamp instanceof Date ? data.timestamp : (data.timestamp as any)?.toDate?.() ?? undefined, // Handle potential Firestore Timestamp
      };
       // Optional: Validate against schema before returning
      const validation = getTelemetryDataTool.outputSchema.safeParse(validatedData);
       if (!validation.success) {
         console.error("Tool output validation failed:", validation.error);
         // Decide how to handle validation failure - throw or return sanitized data
         throw new Error("Tool failed to return data in the expected format.");
       }
      return validation.data; // Return validated data
    } catch (error) {
        console.error(`Error in getTelemetryDataTool for ${input.satelliteId}:`, error);
         if (error instanceof Error) {
           throw new Error(`Failed to retrieve telemetry data: ${error.message}`);
         } else {
            throw new Error('An unknown error occurred while retrieving telemetry data.');
         }
    }
  }
);

// Exported wrapper function remains async
export async function explainAnomalyScore(
  input: ExplainAnomalyScoreInput
): Promise<ExplainAnomalyScoreOutput> {
   console.log("Calling explainAnomalyScoreFlow with input:", input);
  try {
    const result = await explainAnomalyScoreFlow(input);
     console.log("explainAnomalyScoreFlow returned:", result);
    return result;
  } catch (error) {
    console.error('Error executing explainAnomalyScoreFlow:', error);
     if (error instanceof Error) {
         throw new Error(`Failed to get anomaly explanation: ${error.message}`);
     } else {
         throw new Error('Failed to get anomaly explanation due to an unknown error.');
     }
  }
}

// Adjust prompt input schema to match the tool's output
const prompt = ai.definePrompt<
  {telemetryData: TelemetryData; satelliteId: string}, // Input type for the prompt function
  typeof ExplainAnomalyScoreOutputSchema // Output schema for the prompt
>({
  name: 'explainAnomalyScorePrompt',
  input: {
    // Define input schema for the prompt context
    schema: z.object({
      satelliteId: z.string(),
      telemetryData: z.object({ // Match the tool's output structure
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
    // Define output schema for the prompt
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
  typeof ExplainAnomalyScoreInputSchema, // Input schema for the flow
  typeof ExplainAnomalyScoreOutputSchema // Output schema for the flow
>(
  {
    name: 'explainAnomalyScoreFlow',
    inputSchema: ExplainAnomalyScoreInputSchema,
    outputSchema: ExplainAnomalyScoreOutputSchema,
    tools: [getTelemetryDataTool], // Provide the tool to the flow
  },
  async (input, context) => {
     console.log('Executing explainAnomalyScoreFlow for satellite:', input.satelliteId);
    let telemetryData: TelemetryData | null = null;

    try {
        // Use the tool provided by the context
        // Ensure the tool name matches the definition ('getTelemetryData')
        telemetryData = await context.callTool('getTelemetryData', { satelliteId: input.satelliteId }); // Use context.callTool
        console.log('Telemetry data received from tool:', telemetryData);

        if (!telemetryData) {
             // This case might be handled inside the tool itself, but double-check
             throw new Error(`Tool did not return telemetry data for satellite ${input.satelliteId}`);
        }

    } catch (toolError) {
        console.error('Error executing getTelemetryData tool:', toolError);
        if (toolError instanceof Error) {
            throw new Error(`Failed to retrieve telemetry via tool: ${toolError.message}`);
        } else {
             throw new Error('An unknown error occurred while using the telemetry tool.');
        }
    }


    try {
      // Pass the retrieved data to the prompt
      const result = await prompt({
        telemetryData, // Pass the data fetched by the tool
        satelliteId: input.satelliteId,
      });
       console.log('AI prompt result for explanation:', result);

      // Add robust check for output and structure
      if (!result?.output) {
        console.error(
          'AI prompt did not return a valid output structure for explainAnomalyScoreFlow.'
        );
        throw new Error('AI explanation response was missing or empty.');
      }

      // Validate the output against the schema
      const validation = ExplainAnomalyScoreOutputSchema.safeParse(result.output);
      if (!validation.success) {
          console.error("AI explanation output failed schema validation:", validation.error);
          throw new Error(`AI explanation response did not match expected format: ${validation.error.message}`);
      }


      console.log('explainAnomalyScoreFlow successfully generated output:', result.output);
      return result.output; // Already validated
    } catch (error) {
       console.error('Error during AI prompt execution for explanation:', error);
       if (error instanceof Error) {
           // Check for specific API key errors
           if (error.message.includes("API key not valid")) {
               throw new Error("AI Error: Invalid API Key. Please check configuration.");
           }
           throw new Error(`AI explanation prompt failed: ${error.message}`);
       } else {
           throw new Error('An unknown error occurred during AI explanation processing.');
       }
    }
  }
);
