/**
 * @fileOverview Defines the Genkit AI instance.
 * This file should be imported by other 'use server' files (flows, API routes).
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Retrieve the API key from environment variables
const apiKey = process.env.GOOGLE_GENAI_API_KEY;

// Basic check for API key presence during server startup (will log in server console)
if (!apiKey || apiKey.trim() === '') {
  console.warn('AI Initialization Warning: GOOGLE_GENAI_API_KEY environment variable is not set or is empty. AI features may not work.');
}


export const ai = genkit({
  plugins: [
    googleAI({
      // The googleAI plugin will internally handle the apiKey.
      // If apiKey is undefined or empty here, the plugin itself will likely throw a more specific error later if a call is made.
      apiKey: apiKey,
    }),
  ],
  logLevel: 'debug', // Keep logLevel for Genkit's own logging verbosity.
  enableTracing: true, // Keep tracing enabled for debugging flows.
});
