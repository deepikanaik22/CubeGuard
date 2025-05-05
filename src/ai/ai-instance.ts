'use server'; // Add 'use server' directive for server-side execution

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// --- Enhanced API Key Logging ---
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('--- Genkit Initialization ---');
if (apiKey) {
  console.log('GOOGLE_GENAI_API_KEY environment variable FOUND.');
  // Avoid logging the actual key in production logs
  // console.log('API Key Value (masked):', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
} else {
  console.error('ERROR: GOOGLE_GENAI_API_KEY environment variable NOT FOUND.');
  console.error('Please ensure the GOOGLE_GENAI_API_KEY is set in your .env file and the server is restarted.');
}
// --- End Enhanced Logging ---

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      // Explicitly pass the apiKey variable read from process.env
      apiKey: apiKey,
    }),
  ],
  // Ensure this model is available in your Google Cloud project and enabled for the API key
  model: 'googleai/gemini-2.0-flash',
  // Add detailed logging within Genkit itself if possible/needed
  // logLevel: 'debug', // Uncomment for more verbose Genkit logs
});

console.log('Genkit ai instance configured.');
console.log('--- End Genkit Initialization ---');
