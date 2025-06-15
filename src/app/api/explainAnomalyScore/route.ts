
import { explainAnomalyScore, ExplainAnomalyScoreInput } from '@/ai/flows/explain-anomaly-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  console.log('/api/explainAnomalyScore - POST request received.');
  try {
    const body = await req.json();

    if (!body || !body.satelliteId || typeof body.satelliteId !== 'string') {
        console.error('/api/explainAnomalyScore - Invalid request: Missing or invalid satelliteId.');
        return NextResponse.json({ error: 'Invalid request: satelliteId is required and must be a string.' }, { status: 400 });
    }

    const result = await explainAnomalyScore(body);
    return NextResponse.json(result);
  } catch (error) {
    let errorMessage = 'An unexpected error occurred while explaining the anomaly score.';
    let statusCode = 500;
    let errorNameToReport = 'ServerError'; // Default error name for client

    if (error instanceof Error) {
        const errorName = (error as any).name || '';
        const originalMessage = error.message; // Keep original message for logging
        errorMessage = originalMessage; // Default to original message for client

        console.error(`/api/explainAnomalyScore - ERROR in POST handler. Name: ${errorName}, Message: ${originalMessage}`);
        if (error.stack) {
          console.error('/api/explainAnomalyScore - Error Stack:', error.stack);
        }


        switch (errorName) {
            case 'ConfigurationError':
                statusCode = 500;
                errorMessage = "AI Service Configuration Error: API key issue on server. Admin check server logs.";
                errorNameToReport = errorName;
                break;
            case 'OpenRouterAPIError':
                // (error as any).statusCode should be set by ai-instance.ts
                statusCode = (error as any).statusCode || 502; // Default to 502 if statusCode not present
                errorNameToReport = errorName;
                // Be more specific for client based on status code or message content
                if (statusCode === 401 || statusCode === 403 || originalMessage.toLowerCase().includes("authentication") || originalMessage.toLowerCase().includes("invalid api key")) {
                    errorMessage = "AI Service Provider Error: Authentication failed. Admin check configuration.";
                } else if (statusCode === 429 || originalMessage.toLowerCase().includes("rate limit")) {
                    errorMessage = "AI Service Provider Error: Rate limit exceeded. Please try again later.";
                } else {
                     errorMessage = `AI Service Provider Error: Received status ${statusCode}. Please try again.`;
                }
                break;
            case 'OpenRouterResponseError':
                statusCode = 502;
                errorMessage = "AI Service Error: Malformed response from AI provider.";
                errorNameToReport = errorName;
                break;
            case 'NetworkError':
                statusCode = 504;
                errorMessage = "AI Service Communication Error: Cannot connect to AI provider.";
                errorNameToReport = errorName;
                break;
            case 'SyntaxError':
                 statusCode = 502;
                 errorMessage = "AI Service Error: Invalid format response from AI (not JSON).";
                 errorNameToReport = 'AIResponseFormatError';
                 break;
            case 'ZodValidationError':
                 statusCode = 500;
                 errorMessage = `AI Service Error: Response data failed validation. ${originalMessage}`;
                 errorNameToReport = errorName;
                 break;
            case 'EmptyResponseError':
                 statusCode = 502;
                 errorMessage = "AI Service Error: Received an empty response from AI provider.";
                 errorNameToReport = errorName;
                 break;
            case 'NotFoundError':
                 statusCode = 404;
                 // errorMessage is already specific from the flow
                 errorNameToReport = errorName;
                 break;
            default:
                if (originalMessage.toLowerCase().includes("async_hooks")) {
                    statusCode = 500;
                    errorMessage = "Server Execution Error: Critical issue with 'async_hooks'. Review server logs.";
                    errorNameToReport = 'AsyncHooksError';
                } else if (!errorMessage || errorMessage === 'An unexpected error occurred while explaining the anomaly score.') {
                     errorMessage = "An internal server error occurred. Please check server logs for details.";
                }
                break;
        }
    } else if (typeof error === 'string') {
       errorMessage = error;
       console.error('/api/explainAnomalyScore - Error (string):', errorMessage);
    } else {
        console.error('/api/explainAnomalyScore - Unknown error object type in POST handler:', error);
    }

    return NextResponse.json(
        { error: errorMessage, errorType: errorNameToReport },
        { status: statusCode }
    );
  }
}

