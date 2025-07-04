
import { genkit } from 'genkit';

// Module-scoped API key, loaded once.
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

if (!openRouterApiKey || openRouterApiKey.trim() === '') {
  // This warning is good for server startup, but the call method will also check.
  console.warn('AI Initialization Warning: OPENROUTER_API_KEY not set. OpenRouter features may not work.');
  
}

export const ai = genkit({
  plugins: [],
//  logLevel: 'debug',
//  enableTracing: true,
});

export const openRouterAI = {
  call: async (prompt: string): Promise<string> => {
    // Check API key on each call for robustness, as env might change or be late-loaded in some contexts
    if (!openRouterApiKey || openRouterApiKey.trim() === '') {
      console.error('🔴 OpenRouter Configuration Error: OPENROUTER_API_KEY is not set or empty at call time.');
      const configError = new Error('OpenRouter Configuration Error: API key is missing or invalid. Please check server configuration.');
      configError.name = 'ConfigurationError';
      throw configError;
    }

    // Log the API key being used (masked) for debugging
    const maskedApiKey = openRouterApiKey ? `${openRouterApiKey.substring(0, 8)}...${openRouterApiKey.substring(openRouterApiKey.length - 4)}` : 'NOT SET';
    console.log(`Attempting to call OpenRouter with API Key (masked): ${maskedApiKey}`);
    console.log('Prompt snippet:', prompt.substring(0, 100) + "...");

    try {
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
        console.error('🔴 OpenRouter API HTTP error:', response.status, errorText);
        let detail = errorText;
        try {
            const errJson = JSON.parse(errorText);
            if (errJson.error && errJson.error.message) {
                detail = errJson.error.message;
            }
        } catch (e) { /* ignore if errorText is not JSON */ }
        // Prepend status to the message for clarity if it's not already there
        const messagePrefix = `(${response.status}) `;
        const fullDetail = detail.startsWith(messagePrefix.trim()) ? detail : messagePrefix + detail;

        const apiError = new Error(`OpenRouter API Error: ${fullDetail}`);
        apiError.name = 'OpenRouterAPIError';
        (apiError as any).statusCode = response.status; // Store status code
        throw apiError;
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0 || !data.choices[0].message || typeof data.choices[0].message.content !== 'string') {
          console.error('🔴 OpenRouter Response Error: Invalid or empty response structure.', data);
          const responseError = new Error('OpenRouter Response Error: Received invalid or empty response structure from AI service.');
          responseError.name = 'OpenRouterResponseError';
          throw responseError;
      }
      return data.choices[0].message.content;

    } catch (error: any) {
        console.error(`🔴 OpenRouter AI Call Failed - Name: ${error.name}, Message: ${error.message}`);
        if (error.name === 'ConfigurationError' || error.name === 'OpenRouterAPIError' || error.name === 'OpenRouterResponseError') {
            throw error;
        }
        const networkError = new Error(`OpenRouter Network Error: Communication failed. ${error.message || 'Unknown network issue'}`);
        networkError.name = 'NetworkError';
        throw networkError;
    }
  },
};

