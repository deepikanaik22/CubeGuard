import { genkit } from 'genkit';

// If you're not using Google anymore, you can remove this line:
// import { googleAI } from '@genkit-ai/googleai';

const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey || openRouterApiKey.trim() === '') {
  console.warn('AI Initialization Warning: OPENROUTER_API_KEY not set. OpenRouter features may not work.');
}

export const ai = genkit({
  plugins: [], // No plugins since you're not using Google anymore
  logLevel: 'debug',
  enableTracing: true,
});

// 👇 Add OpenRouter manual fetch logic here
export const openRouterAI = {
  call: async (prompt: string): Promise<string> => {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // or another supported model
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 OpenRouter API error:', errorText);
      throw new Error(`OpenRouter error (${response.status}): ${errorText}`);
    }    

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  },
};
