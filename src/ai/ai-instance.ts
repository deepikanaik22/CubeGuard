import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Retrieve API keys
const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

// Logging keys securely (optional)
console.log('Google GenAI key prefix:', googleApiKey?.substring(0, 5));
console.log('OpenRouter key prefix:', openRouterApiKey?.substring(0, 5));

if (!googleApiKey || googleApiKey.trim() === '') {
  console.warn('AI Initialization Warning: GOOGLE_GENAI_API_KEY not set or empty. Google AI features may not work.');
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

// OpenRouter utility with fallback logic
export const openRouterAI = {
  name: 'openrouter',
  call: async (prompt: string): Promise<string> => {
    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY is not set.");
      throw new Error("Missing OpenRouter key.");
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
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
    return data.choices?.[0]?.message?.content ?? '';
  },
};
