// This file defines the ai instance. It should be imported by 'use server' files (flows, API routes).
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// --- API Key Logging ---
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('--- Genkit Initialization Start (ai-instance.ts) ---');
if (apiKey && apiKey.trim() !== '') {
  console.log('GOOGLE_GENAI_API_KEY: Environment variable FOUND and is NOT empty.');
} else if (!apiKey) {
  console.error('CRITICAL ERROR: GOOGLE_GENAI_API_KEY environment variable is NOT SET or is undefined.');
} else if (apiKey.trim() === '') {
   console.error('CRITICAL ERROR: GOOGLE_GENAI_API_KEY environment variable IS EMPTY.');
}
// --- End API Key Logging ---

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // Explicitly pass the API key. The googleAI plugin will handle if it's invalid.
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});

console.log('Genkit ai instance configured in ai-instance.ts.');
console.log('--- Genkit Initialization End (ai-instance.ts) ---');
