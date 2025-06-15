
/**
 * @fileOverview Defines the Genkit AI instance and custom AI model utilities.
 * This file should be imported by other 'use server' files (flows, API routes).
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve the Google AI API key from environment variables
const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

// Basic check for Google AI API key presence during server startup (will log in server console)
if (!googleApiKey || googleApiKey.trim() === '') {
  console.warn('AI Initialization Warning: GOOGLE_GENAI_API_KEY environment variable is not set or is empty. Google AI features may not work.');
}


export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey,
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});

// Custom OpenRouter utility object
export const openRouterAI = {
  name: 'openrouter',
  call: async (prompt: string): Promise<string> => {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
        console.error("OPENROUTER_API_KEY is not set in environment variables.");
        throw new Error("OpenRouter AI Error: OPENROUTER_API_KEY is not configured.");
    }

    console.log("[openRouterAI.call] Sending prompt to OpenRouter:", prompt.substring(0, 100) + "..."); // Log a snippet

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // As specified in the example
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[openRouterAI.call] OpenRouter API error: ${response.status}`, errorText);
        throw new Error(`OpenRouter API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[openRouterAI.call] OpenRouter raw response data:", data);
    const content = data.choices?.[0]?.message?.content ?? '';

    if (content === '') {
        console.warn("[openRouterAI.call] OpenRouter returned empty content for prompt:", prompt.substring(0,100) + "...");
    } else {
        console.log("[openRouterAI.call] OpenRouter response content:", content);
    }
    return content;
  }
};
