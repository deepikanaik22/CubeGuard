import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Retrieve API keys from environment
const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Logging key prefixes (safe for debugging, not full key)
console.log('🔑 Google GenAI key prefix:', googleApiKey?.substring(0, 5) || 'N/A');
console.log('🔑 OpenRouter key prefix:', openRouterApiKey?.substring(0, 5) || 'N/A');

// Warn if missing Google API key
if (!googleApiKey || googleApiKey.trim() === '') {
  console.warn('⚠️ GOOGLE_GENAI_API_KEY not set or empty. Google AI features may not work.');
}

// Initialize Genkit with GoogleAI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: googleApiKey,
    }),
  ],
  logLevel: 'debug',
  enableTracing: true,
});

// OpenRouter AI Utility
export const openRouterAI = {
  name: 'openrouter',
  call: async (prompt: string, signal?: AbortSignal): Promise<string> => {
    if (!openRouterApiKey) {
      console.error('❌ OPENROUTER_API_KEY is not set.');
      throw new Error('Missing OpenRouter API key.');
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        signal, // Optional abort signal
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response format from OpenRouter');
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('🧠 OpenRouter AI error:', error.message);
      throw error;
    }
  },
};
