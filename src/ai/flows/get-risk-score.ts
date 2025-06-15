
'use server';
/**
 * @fileOverview An AI agent that calculates a risk score based on telemetry data using OpenRouter.
 *
 * - getRiskScore - A function that calculates the risk score.
 */
import {ai, openRouterAI }from '@/ai/ai-instance'; // Correctly imports ai instance and openRouterAI
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
  riskScore: z.number().min(0).max(100).describe('The calculated risk score (0-100).'),
  explanation: z.string().describe('Explanation of the risk score calculation (1-2 sentences).'),
});

// Exported wrapper function remains async
export async function getRiskScore(
  input: GetRiskScoreInput
): Promise<GetRiskScoreOutput> {
   console.log("Calling getRiskScoreFlow (OpenRouter) with input:", input);
  try {
    const result = await getRiskScoreFlow(input);
     console.log("getRiskScoreFlow (OpenRouter) returned:", result);
    return result;
  } catch (error) {
    console.error('Error executing getRiskScoreFlow (OpenRouter):', error);
    if (error instanceof Error) {
       if (error.message.includes("OPENROUTER_API_KEY") || error.message.toLowerCase().includes("api key")) {
           throw new Error("OpenRouter AI Error: Missing or invalid API Key. Please check .env configuration and ensure OPENROUTER_API_KEY is set.");
       }
       throw new Error(`Failed to calculate risk score via OpenRouter: ${error.message}`);
    } else {
       throw new Error('Failed to calculate risk score via OpenRouter due to an unknown error.');
    }
  }
}

const getRiskScoreFlow = ai.defineFlow<
  typeof GetRiskScoreInputSchema,
  typeof GetRiskScoreOutputSchema
>(
  {
    name: 'getRiskScoreFlow', // Still a Genkit flow for tracing, but uses openRouterAI.call
    inputSchema: GetRiskScoreInputSchema,
    outputSchema: GetRiskScoreOutputSchema,
  },
  async (input) => {
    console.log('Executing getRiskScoreFlow with input (using openRouterAI.call):', input);

    // Construct the prompt for OpenRouter
    const promptString = `You are an expert in assessing risk based on telemetry data for CubeSats.

Given the following telemetry data, calculate a risk score between 0 and 100,
where 0 indicates no risk and 100 indicates maximum risk. Also, provide a brief explanation (1-2 sentences) of how you arrived at the risk score.

Telemetry Data:
- Battery Level: ${input.batteryLevel}%
- Temperature: ${input.temperature}°C
- Communication Status: ${input.communicationStatus}

Consider the following factors carefully:
- Low battery level (< 20%) significantly increases the risk.
- Very high (> 40°C) or very low (< -10°C) temperatures increase the risk.
- Unstable or lost communication significantly increases the risk. 'Lost' status represents the highest communication risk.

Output the risk score and a concise explanation based ONLY on the provided data and risk factors.
Ensure the output strictly adheres to the JSON format: {"riskScore": number, "explanation": "string in one or two sentences"}.`;

    try {
      const aiResponseContent = await openRouterAI.call(promptString);

      if (!aiResponseContent) {
        console.error('OpenRouter response missing content via openRouterAI.call.');
        throw new Error('AI response from OpenRouter was missing or empty.');
      }

      let parsedOutput;
      try {
        parsedOutput = JSON.parse(aiResponseContent);
      } catch (parseError: any) {
        console.error('Failed to parse AI response from OpenRouter as JSON:', aiResponseContent, parseError);
        // Provide more context in the error message
        throw new Error(`AI response from OpenRouter was not valid JSON. Content: '${aiResponseContent}'. Error: ${parseError.message}`);
      }

      const validation = GetRiskScoreOutputSchema.safeParse(parsedOutput);
      if (!validation.success) {
          console.error("OpenRouter AI output failed schema validation:", validation.error.flatten());
          console.error("Invalid AI output received from OpenRouter:", parsedOutput);
          throw new Error(`AI response from OpenRouter did not match expected format: ${validation.error.message}`);
      }

      console.log('getRiskScoreFlow (OpenRouter) successfully generated and validated output:', validation.data);
      return validation.data;

    } catch (error) {
      console.error('Error within getRiskScoreFlow (OpenRouter) execution:', error);
       if (error instanceof Error) {
           // Rethrow specific API key error if caught by openRouterAI.call
           if (error.message.includes("OPENROUTER_API_KEY")) {
                throw error;
           }
           throw new Error(`OpenRouter AI processing failed: ${error.message}`);
       } else {
           throw new Error('An unknown error occurred during OpenRouter AI processing.');
       }
    }
  }
);
