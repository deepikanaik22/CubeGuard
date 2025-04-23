'use server';
/**
 * @fileOverview An AI agent that calculates a risk score based on telemetry data.
 *
 * - getRiskScore - A function that calculates the risk score.
 * - GetRiskScoreInput - The input type for the getRiskScore function.
 * - GetRiskScoreOutput - The return type for the getRiskScore function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GetRiskScoreInputSchema = z.object({
  batteryLevel: z.number().describe('Battery level in percentage (0-100).'),
  temperature: z.number().describe('Temperature in degrees Celsius.'),
  communicationStatus: z.enum(['stable', 'unstable', 'lost']).describe('Communication status.'),
});
export type GetRiskScoreInput = z.infer<typeof GetRiskScoreInputSchema>;

const GetRiskScoreOutputSchema = z.object({
  riskScore: z.number().describe('The calculated risk score (0-100).'),
  explanation: z.string().describe('Explanation of the risk score calculation.'),
});
export type GetRiskScoreOutput = z.infer<typeof GetRiskScoreOutputSchema>;

export async function getRiskScore(input: GetRiskScoreInput): Promise<GetRiskScoreOutput> {
  return getRiskScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getRiskScorePrompt',
  input: {
    schema: z.object({
      batteryLevel: z.number().describe('Battery level in percentage (0-100).'),
      temperature: z.number().describe('Temperature in degrees Celsius.'),
      communicationStatus: z.string().describe('Communication status (stable, unstable, lost).'),
    }),
  },
  output: {
    schema: z.object({
      riskScore: z.number().describe('The calculated risk score (0-100).'),
      explanation: z.string().describe('Explanation of the risk score calculation.'),
    }),
  },
  prompt: `You are an expert in assessing risk based on telemetry data.

Given the following telemetry data, calculate a risk score between 0 and 100,
where 0 indicates no risk and 100 indicates maximum risk. Also, provide a brief explanation of how you arrived at the risk score.

Telemetry Data:
- Battery Level: {{batteryLevel}}%
- Temperature: {{temperature}}°C
- Communication Status: {{communicationStatus}}

Consider the following factors:
- Low battery level increases the risk.
- Extreme temperatures (high or low) increase the risk.
- Unstable or lost communication significantly increases the risk.

Provide the risk score and explanation in the following format:
{
  "riskScore": number,
  "explanation": string
}`,
});

const getRiskScoreFlow = ai.defineFlow<
  typeof GetRiskScoreInputSchema,
  typeof GetRiskScoreOutputSchema
>(
  {
    name: 'getRiskScoreFlow',
    inputSchema: GetRiskScoreInputSchema,
    outputSchema: GetRiskScoreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
