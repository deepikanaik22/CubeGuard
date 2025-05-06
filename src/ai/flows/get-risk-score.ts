
'use server';
/**
 * @fileOverview An AI agent that calculates a risk score based on telemetry data.
 *
 * - getRiskScore - A function that calculates the risk score.
 */
import {ai}from '@/ai/ai-instance'; // Correctly imports ai instance from the non-'use server' file
import {z} from 'genkit';
import type {GetRiskScoreInput, GetRiskScoreOutput} from '@/ai/types'; // Import types

// Define schemas locally for runtime validation
const GetRiskScoreInputSchema = z.object({
  batteryLevel: z.number().describe('Battery level in percentage (0-100).'),
  temperature: z.number().describe('Temperature in degrees Celsius.'),
  communicationStatus: z
    .enum(['stable', 'unstable', 'lost'])
    .describe('Communication status.'),
});

const GetRiskScoreOutputSchema = z.object({
  riskScore: z.number().describe('The calculated risk score (0-100).'),
  explanation: z.string().describe('Explanation of the risk score calculation.'),
});

// Exported wrapper function remains async
export async function getRiskScore(
  input: GetRiskScoreInput
): Promise<GetRiskScoreOutput> {
   console.log("Calling getRiskScoreFlow with input:", input);
  try {
    const result = await getRiskScoreFlow(input);
     console.log("getRiskScoreFlow returned:", result);
    return result;
  } catch (error) {
    console.error('Error executing getRiskScoreFlow:', error);
    // Rethrow a more specific error or a structured error object
    if (error instanceof Error) {
       // Check for specific API key errors
       if (error.message.includes("API key not valid")) {
           throw new Error("AI Error: Invalid API Key. Please check configuration.");
       }
       throw new Error(`Failed to calculate risk score: ${error.message}`);
    } else {
       throw new Error('Failed to calculate risk score due to an unknown error.');
    }
  }
}

const prompt = ai.definePrompt({
  name: 'getRiskScorePrompt',
  model: 'gemini-1.5-flash-latest', // Specify the model to use
  input: {
    schema: GetRiskScoreInputSchema, // Use the local schema definition
  },
  output: {
    schema: GetRiskScoreOutputSchema, // Use the local schema definition
  },
  prompt: `You are an expert in assessing risk based on telemetry data for CubeSats.

Given the following telemetry data, calculate a risk score between 0 and 100,
where 0 indicates no risk and 100 indicates maximum risk. Also, provide a brief explanation of how you arrived at the risk score.

Telemetry Data:
- Battery Level: {{batteryLevel}}%
- Temperature: {{temperature}}°C
- Communication Status: {{communicationStatus}}

Consider the following factors carefully:
- Low battery level (< 20%) significantly increases the risk.
- Very high (> 40°C) or very low (< -10°C) temperatures increase the risk.
- Unstable or lost communication significantly increases the risk. 'Lost' status represents the highest communication risk.

Output the risk score and a concise explanation based ONLY on the provided data and risk factors. Ensure the output strictly adheres to the required JSON format.`,
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
  async (input) => {
    console.log('Executing getRiskScoreFlow with input:', input);
    try {
      const {output} = await prompt(input); // Correctly destructure output
      console.log('AI prompt result:', output); // Log the output directly

      // Add robust check for output and structure
      if (!output) {
        console.error(
          'AI prompt did not return a valid output structure for getRiskScoreFlow.'
        );
        throw new Error(
          'AI response was missing or empty.'
        );
      }

      // Validate the output against the schema (Genkit might do this implicitly, but explicit check adds safety)
      const validation = GetRiskScoreOutputSchema.safeParse(output);
      if (!validation.success) {
          console.error("AI output failed schema validation:", validation.error);
          throw new Error(`AI response did not match expected format: ${validation.error.message}`);
      }


      console.log('getRiskScoreFlow successfully generated output:', output);
      return output; // Already validated
    } catch (error) {
      console.error('Error within getRiskScoreFlow execution:', error);
      // Log the specific error from the prompt call if possible
       if (error instanceof Error) {
           // Check for specific API key errors
           if (error.message.includes("API key not valid")) {
               throw new Error("AI Error: Invalid API Key. Please check configuration.");
           }
           throw new Error(`AI prompt failed: ${error.message}`);
       } else {
           throw new Error('An unknown error occurred during AI processing.');
       }
    }
  }
);

// Make sure only the wrapper function and types are intended for export if using modules
// (The 'export' keyword handles this)


