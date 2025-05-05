'use client'; // Remove 'use server' directive
// Removed 'use server' directive as this file exports the 'ai' object - REVERTED based on subsequent errors indicating this should be 'use server'


import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import type { TelemetryData } from '@/services/telemetry'; // Import TelemetryData for schema

// --- Enhanced API Key Logging ---
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('--- Genkit Initialization ---');
if (apiKey && apiKey.trim() !== '') {
  console.log('GOOGLE_GENAI_API_KEY environment variable FOUND.');
  // Avoid logging the actual key in production logs, show partial key for verification
  const maskedKey = apiKey.length > 8
    ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
    : 'API key is too short to mask effectively.';
  console.log('API Key Value (masked):', maskedKey);
} else if (!apiKey) {
  console.error('ERROR: GOOGLE_GENAI_API_KEY environment variable NOT SET or is undefined.');
  console.error('Please ensure the GOOGLE_GENAI_API_KEY is set in your .env file and the server is restarted.');
} else if (apiKey.trim() === '') {
   console.error('ERROR: GOOGLE_GENAI_API_KEY environment variable IS EMPTY.');
   console.error('Please ensure the GOOGLE_GENAI_API_KEY has a valid value in your .env file and the server is restarted.');
}
// --- End Enhanced Logging ---

// Define the ai instance. This module should be imported by server components or server actions ('use server' files)
export const ai = genkit({
  promptDir: './prompts', // Note: This might need adjustment if prompts are stored elsewhere
  plugins: [
    googleAI({
      // Explicitly pass the apiKey variable read from process.env
      apiKey: apiKey, // Pass the potentially undefined/empty key to let googleAI handle it or throw
    }),
  ],
  // Ensure this model is available in your Google Cloud project and enabled for the API key
  // model: 'googleai/gemini-2.0-flash', // Default model if not specified in flows/prompts - REMOVED as model is specified in flows
  // Add detailed logging within Genkit itself if possible/needed
   logLevel: 'debug', // Enable debug logging for more Genkit insights
   enableTracing: true, // Enable tracing
});

console.log('Genkit ai instance configured.');
console.log('--- End Genkit Initialization ---');