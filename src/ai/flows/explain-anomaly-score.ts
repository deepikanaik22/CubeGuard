'use server';

/**
 * @fileOverview Explains the anomaly score for a given satellite based on telemetry data.
 */

import { ai } from '@/ai/ai-instance';
import { getTelemetryData, TelemetryData } from '@/services/telemetry';
import { z } from 'genkit';
import type {
  ExplainAnomalyScoreInput,
  ExplainAnomalyScoreOutput,
} from '@/ai/types';

const ExplainAnomalyScoreInputSchema = z.object({
  satelliteId: z.string().describe('The ID of the satellite to explain the anomaly score for.'),
});

const ExplainAnomalyScoreOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation of how the Anomaly Risk Score was calculated.'),
  breakdown: z.object({
    thermal: z.number().describe('Thermal risk contribution (0-100).'),
    comm: z.number().describe('Communication risk contribution (0-100).'),
    power: z.number().describe('Power risk contribution (0-100).'),
    orientation: z.number().describe('Orientation risk contribution (0-100).'),
  }),
});

const getTelemetryDataTool = ai.defineTool(
  {
    name: 'getTelemetryData',
    description: 'Fetches telemetry data for a specific satellite.',
    inputSchema: z.object({ satelliteId: z.string() }),
    outputSchema: z.object({
      id: z.string().optional(),
      gyroscope: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      batteryVoltage: z.number(),
      solarPanelOutput: z.number(),
      internalTemperature: z.number(),
      externalTemperature: z.number(),
      magnetometer: z.object({ x: z.number(), y: z.number(), z: z.number() }),
      communicationLogs: z.object({
        signalStrength: z.number(),
        packetDelay: z.number(),
      }),
      timestamp: z.date().optional(),
    }),
  },
  async ({ satelliteId }) => {
    console.log(`[getTelemetryDataTool] Fetching data for: ${satelliteId}`);
    const data = await getTelemetryData(satelliteId);
    if (!data) throw new Error(`No telemetry data found for ${satelliteId}`);
    return {
      ...data,
      timestamp:
        data.timestamp instanceof Date
          ? data.timestamp
          : (data.timestamp as any)?.toDate?.() ?? undefined,
    };
  }
);

const prompt = ai.definePrompt<
  { telemetryData: TelemetryData; satelliteId: string },
  typeof ExplainAnomalyScoreOutputSchema
>({
  name: 'explainAnomalyScorePrompt',
  model: 'googleai/gemini-pro', // Changed to googleai/gemini-pro
  input: {
    schema: z.object({
      satelliteId: z.string(),
      telemetryData: getTelemetryDataTool.outputSchema,
    }),
  },
  output: {
    schema: ExplainAnomalyScoreOutputSchema,
  },
  prompt: `
You are an expert AI analyst specializing in CubeSat telemetry and anomaly detection.

You will receive telemetry for Satellite {{satelliteId}}. Use the data below to explain how the anomaly risk score was determined:

{{#with telemetryData}}
- Gyroscope: x={{gyroscope.x}}, y={{gyroscope.y}}, z={{gyroscope.z}}
- Battery Voltage: {{batteryVoltage}}V
- Solar Panel Output: {{solarPanelOutput}}W
- Internal Temp: {{internalTemperature}}°C
- External Temp: {{externalTemperature}}°C
- Magnetometer: x={{magnetometer.x}}, y={{magnetometer.y}}, z={{magnetometer.z}}
- Signal Strength: {{communicationLogs.signalStrength}} dBm
- Packet Delay: {{communicationLogs.packetDelay}} ms
- Timestamp: {{#if timestamp}}{{timestamp}}{{else}}N/A{{/if}}
{{/with}}

Risk guidelines:
- **Thermal**: Internal > 35°C (high), > 38°C (critical); External < -30°C or > 50°C
- **Power**: Battery < 3.75V (low), < 3.65V (critical); Solar < 0.5W
- **Orientation**: Gyroscope or magnetometer values highly deviant
- **Communication**: Signal < -90 dBm (weak), < -95 dBm (critical); Delay > 250 ms (high), > 300 ms (critical)

1. **Explanation**: Describe clearly what caused the risk and which metrics triggered concern.
2. **Breakdown**: Score 0–100 for thermal, power, orientation, and communication.

Output MUST be valid JSON as per schema.`,
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
    console.log(`[Flow] Starting anomaly score explanation for ${input.satelliteId}`);
    const telemetryData = await context.callTool('getTelemetryData', {
      satelliteId: input.satelliteId,
    });

    const result = await prompt({
      telemetryData,
      satelliteId: input.satelliteId,
    });

    if (!result.output) {
      throw new Error('AI did not return a valid output.');
    }

    const validation = ExplainAnomalyScoreOutputSchema.safeParse(result.output);
    if (!validation.success) {
      console.error('Invalid AI output:', validation.error.flatten());
      throw new Error('Invalid AI output format.');
    }

    console.log(`[Flow] Explanation successful for ${input.satelliteId}`);
    return validation.data;
  }
);

export async function explainAnomalyScore(
  input: ExplainAnomalyScoreInput
): Promise<ExplainAnomalyScoreOutput> {
  console.log(`[Handler] Received request for satellite ${input.satelliteId}`);
  return await explainAnomalyScoreFlow(input);
}
