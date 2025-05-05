
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Log the API key to verify it's loaded correctly (remove this in production)
console.log('Attempting to use Google GenAI API Key:', process.env.GOOGLE_GENAI_API_KEY ? 'Loaded' : 'Not Loaded/Undefined');
// You can temporarily uncomment the line below to log the actual key for debugging,
// but **ensure you remove it before committing or deploying**.
// console.log('API Key Value:', process.env.GOOGLE_GENAI_API_KEY);

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Ensure this model is appropriate for your key/project
});
