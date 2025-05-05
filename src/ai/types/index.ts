/**
 * @fileOverview Centralized type definitions for AI flows.
 */

import {z} from 'genkit';

// --- explain-anomaly-score types ---

export const ExplainAnomalyScoreInputSchema = z.object({
  satelliteId: z.string().describe('The ID of the satellite to explain the anomaly score for.'),
  // Telemetry data is now fetched by the tool within the flow
});
export type ExplainAnomalyScoreInput = z.infer<typeof ExplainAnomalyScoreInputSchema>;


export const ExplainAnomalyScoreOutputSchema = z.object({
  explanation: z.string().describe('A detailed explanation of how the Anomaly Risk Score was calculated.'),
  breakdown: z.object({
    thermal: z.number().describe('The contribution of thermal factors to the risk score (0-100).'),
    comm: z.number().describe('The contribution of communication factors to the risk score (0-100).'),
    power: z.number().describe('The contribution of power factors to the risk score (0-100).'),
    orientation: z.number().describe('The contribution of orientation factors to the risk score (0-100).'),
  }).describe('A breakdown of the risk score by failure type.'),
});
export type ExplainAnomalyScoreOutput = z.infer<typeof ExplainAnomalyScoreOutputSchema>;


// --- get-risk-score types ---

export const GetRiskScoreInputSchema = z.object({
  batteryLevel: z.number().describe('Battery level in percentage (0-100).'),
  temperature: z.number().describe('Temperature in degrees Celsius.'),
  communicationStatus: z.enum(['stable', 'unstable', 'lost']).describe('Communication status.'),
});
export type GetRiskScoreInput = z.infer<typeof GetRiskScoreInputSchema>;


export const GetRiskScoreOutputSchema = z.object({
  riskScore: z.number().describe('The calculated risk score (0-100).'),
  explanation: z.string().describe('Explanation of the risk score calculation.'),
});
export type GetRiskScoreOutput = z.infer<typeof GetRiskScoreOutputSchema>;
