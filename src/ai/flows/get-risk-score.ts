
'use server';
/**
 * @fileOverview An AI agent that calculates a risk score based on telemetry data using OpenRouter.
 *
 * - getRiskScore - A function that calculates the risk score.
 */
import {ai}from '@/ai/ai-instance'; // Correctly imports ai instance
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
    name: 'getRiskScoreFlow',
    inputSchema: GetRiskScoreInputSchema,
    outputSchema: GetRiskScoreOutputSchema,
  },
  async (input) => {
    console.log('Executing getRiskScoreFlow with input (OpenRouter):', input);
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
        console.error("OPENROUTER_API_KEY is not set in environment variables.");
        throw new Error("OpenRouter AI Error: OPENROUTER_API_KEY is not configured.");
    }

    try {
      const promptString = `You are an expert in assessing risk based on telemetry data for CubeSats.

Given the following telemetry data, calculate a risk score between 0 and 100,
where 0 indicates no risk and 100 indicates maximum risk. Also, provide a brief explanation of how you arrived at the risk score.

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

      console.log("Sending prompt to OpenRouter:", promptString);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo", // As specified
          messages: [
            { role: "user", content: promptString }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error: ${response.status}`, errorText);
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log("OpenRouter raw response data:", responseData);

      const aiResponseContent = responseData.choices?.[0]?.message?.content;

      if (!aiResponseContent) {
        console.error('OpenRouter response missing content:', responseData);
        throw new Error('AI response from OpenRouter was missing or empty.');
      }
      console.log("OpenRouter AI response content:", aiResponseContent);

      let parsedOutput;
      try {
        parsedOutput = JSON.parse(aiResponseContent);
      } catch (parseError: any) {
        console.error('Failed to parse AI response from OpenRouter as JSON:', aiResponseContent, parseError);
        throw new Error(`AI response from OpenRouter was not valid JSON: '${aiResponseContent}'. Error: ${parseError.message}`);
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
           if (error.message.includes("OPENROUTER_API_KEY") || error.message.toLowerCase().includes("api key")) {
                throw error; // Rethrow specific API key error
           }
           throw new Error(`OpenRouter AI request failed: ${error.message}`);
       } else {
           throw new Error('An unknown error occurred during OpenRouter AI processing.');
       }
    }
  }