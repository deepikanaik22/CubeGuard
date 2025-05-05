'use server';
/**
 * @fileOverview An AI agent that calculates a risk score based on telemetry data.
 *
 * - getRiskScore - A function that calculates the risk score.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import type { GetRiskScoreInput, GetRiskScoreOutput } from '@/ai/types'; // Import types

// Define schemas locally for runtime validation
const GetRiskScoreInputSchema = z.object({
  batteryLevel: z.number().describe('Battery level in percentage (0-100).'),
  temperature: z.number().describe('Temperature in degrees Celsius.'),
  communicationStatus: z.enum(['stable', 'unstable', 'lost']).describe('Communication status.'),
});

const GetRiskScoreOutputSchema = z.object({
  riskScore: z.number().describe('The calculated risk score (0-100).'),
  explanation: z.string().describe('Explanation of the risk score calculation.'),
});


export async function getRiskScore(input: GetRiskScoreInput): Promise<GetRiskScoreOutput> {
  return getRiskScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getRiskScorePrompt',
  input: {
    schema: z.object({ // Use the local schema definition
      batteryLevel: z.number().describe('Battery level in percentage (0-100).'),
      temperature: z.number().describe('Temperature in degrees Celsius.'),
      communicationStatus: z.string().describe('Communication status (stable, unstable, lost).'),
    }),
  },
  output: {
    schema: GetRiskScoreOutputSchema, // Use the local schema definition
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

Provide the risk score and explanation.`, // Simplified instruction, rely on output schema
});

const getRiskScoreFlow = ai.defineFlow<
  typeof GetRiskScoreInputSchema, // Use local schema
  typeof GetRiskScoreOutputSchema // Use local schema
>(
  {
    name: 'getRiskScoreFlow',
    inputSchema: GetRiskScoreInputSchema, // Use local schema
    outputSchema: GetRiskScoreOutputSchema, // Use local schema
  },
  async input => {
    const {output} = await prompt(input);

    // Add robust check for output
    if (!output) {
        console.error("AI prompt did not return a valid output for getRiskScoreFlow.");
        // Consider throwing a more specific error or returning a default/error state
        throw new Error("Failed to calculate risk score due to missing AI output.");
    }
    return output;
  }
);
