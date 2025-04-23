'use server';
/**
 * @fileOverview Explains the anomaly score for a given satellite based on telemetry data.
 *
 * - explainAnomalyScore - A function that explains the anomaly score.
 * - ExplainAnomalyScoreInput - The input type for the explainAnomalyScore function.
 * - ExplainAnomalyScoreOutput - The return type for the explainAnomalyScore function.
 */

import {ai} from '@/ai/ai-instance';
import {TelemetryData, getTelemetryData} from '@/services/telemetry';
import {z} from 'genkit';

const ExplainAnomalyScoreInputSchema = z.object({
  satelliteId: z.string().describe('The ID of the satellite to explain the anomaly score for.'),
});
export type ExplainAnomalyScoreInput = z.infer<typeof ExplainAnomalyScoreInputSchema>;

const ExplainAnomalyScoreOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation of how the Anomaly Risk Score was calculated.'),
  breakdown: z.object({
    thermal: z.number().describe('The contribution of thermal factors to the risk score (0-100).'),
    comm: z.number().describe('The contribution of communication factors to the risk score (0-100).'),
    power: z.number().describe('The contribution of power factors to the risk score (0-100).'),
    orientation: z.number().describe('The contribution of orientation factors to the risk score (0-100).'),
  }).describe('A breakdown of the risk score by failure type.'),
});
export type ExplainAnomalyScoreOutput = z.infer<typeof ExplainAnomalyScoreOutputSchema>;

export const explainAnomalyScore = async (input: ExplainAnomalyScoreInput): Promise<ExplainAnomalyScoreOutput> =>
  explainAnomalyScoreFlow(input);

const getTelemetryDataTool = ai.defineTool({
  name: 'getTelemetryData',
  description: 'Retrieves the latest telemetry data for a given satellite.',
  inputSchema: z.object({
    satelliteId: z.string().describe('The ID of the satellite to retrieve telemetry data for.'),
  }),
  outputSchema: z.object({
    gyroscope: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    batteryVoltage: z.number(),
    solarPanelOutput: z.number(),
    internalTemperature: z.number(),
    externalTemperature: z.number(),
    magnetometer: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
    communicationLogs: z.object({
      signalStrength: z.number(),
      packetDelay: z.number(),
    }),
  }),
}, async ({satelliteId}) => {
  const data = await getTelemetryData({satelliteId});
  return data;
});

const prompt = ai.definePrompt<{ telemetryData: TelemetryData; satelliteId: string}, ExplainAnomalyScoreOutput>({
  name: 'explainAnomalyScorePrompt',
  input: {
    schema: z.object({}),
    contextSchema: z.object({
      telemetryData: z.any(),
      satelliteId: z.string().describe('The ID of the satellite to explain the anomaly score for.'),
    }),
  },
  output: {
    schema: z.object({
      explanation: z.string().describe('A detailed explanation of how the Anomaly Risk Score was calculated.'),
      breakdown: z.object({
        thermal: z.number().describe('The contribution of thermal factors to the risk score (0-100).'),
        comm: z.number().describe('The contribution of communication factors to the risk score (0-100).'),
        power: z.number().describe('The contribution of power factors to the risk score (0-100).'),
        orientation: z.number().describe('The contribution of orientation factors to the risk score (0-100).'),
      }).describe('A breakdown of the risk score by failure type.'),
    }),
  },
  prompt: `You are an expert in analyzing CubeSat telemetry data to determine the likelihood of anomalies.

You will receive a request to explain the anomaly score for a specific satellite. Your task is to provide a detailed explanation of how the Anomaly Risk Score was calculated, including the factors that contribute to the risk and a breakdown by failure type (thermal, comm, power, orientation).

Analyze the telemetry data which is provided below to identify any potential anomalies or deviations from expected values. Consider the following factors:

*   Gyroscope data: Unusual fluctuations or drift may indicate orientation problems.
*   Battery voltage: Low voltage may indicate power issues.
*   Solar panel output: Reduced output may indicate power issues.
*   Internal/External temperature: Extreme temperatures or rapid changes may indicate thermal problems.
*   Magnetometer readings: Unexpected readings may indicate orientation problems.
*   Communication logs: Weak signal strength or high packet delay may indicate communication problems.

Based on your analysis, provide a clear and concise explanation of how the Anomaly Risk Score was calculated. Include specific examples from the telemetry data to support your explanation.

Finally, provide a breakdown of the risk score by failure type (thermal, comm, power, orientation), indicating the percentage contribution of each factor to the overall risk score.

Satellite ID: {{satelliteId}}
Here is the telemetry data:
{{#with telemetryData}}
Gyroscope: x={{gyroscope.x}}, y={{gyroscope.y}}, z={{gyroscope.z}}
Battery Voltage: {{batteryVoltage}}
Solar Panel Output: {{solarPanelOutput}}
Internal Temperature: {{internalTemperature}}
External Temperature: {{externalTemperature}}
Magnetometer: x={{magnetometer.x}}, y={{magnetometer.y}}, z={{magnetometer.z}}Communication Logs: Signal Strength={{communicationLogs.signalStrength}}, Packet Delay={{communicationLogs.packetDelay}}{{/with}}`,
});

const explainAnomalyScoreFlow = ai.defineFlow({
  name: 'explainAnomalyScoreFlow',
  inputSchema: ExplainAnomalyScoreInputSchema,
  outputSchema: ExplainAnomalyScoreOutputSchema,
  tools: {getTelemetryData: getTelemetryDataTool},
}, async (input, context) => {
  const telemetryData = await context.getTelemetryData({satelliteId: input.satelliteId});
  const result = await prompt({
    telemetryData,
    satelliteId: input.satelliteId,
  });

  return result.output;
});
