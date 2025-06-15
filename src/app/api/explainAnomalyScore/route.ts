
import { explainAnomalyScore, ExplainAnomalyScoreInput } from '@/ai/flows/explain-anomaly-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  console.log('/api/explainAnomalyScore - POST request received.');
  try {
    // console.log('/api/explainAnomalyScore - Parsing request body...'); // Verbose
    const body = await req.json(); // No explicit type cast needed for input to flow
    // console.log('/api/explainAnomalyScore - Request body parsed:', body); // Verbose

    // Basic validation for satelliteId, more complex validation is in the Zod schema in the flow
    if (!body || !body.satelliteId || typeof body.satelliteId !== 'string') {
        console.error('/api/explainAnomalyScore - Invalid request: Missing or invalid satelliteId.');
        return NextResponse.json({ error: 'Invalid request: satelliteId is required and must be a string.' }, { status: 400 });
    }

    // console.log(`/api/explainAnomalyScore - Calling flow for satellite: ${body.satelliteId}`); // Verbose
    const result = await explainAnomalyScore(body); // Body should conform to ExplainAnomalyScoreInputType
    // console.log('/api/explainAnomalyScore - Flow successful. Result:', result); // Verbose

    return NextResponse.json(result);
  } catch (error) {
    // Default error state
    let errorMessage = 'An unexpected error occurred while explaining the anomaly score.';
    let statusCode = 500;

    if (error instanceof Error) {
        const errorName = (error as any).name || ''; // Get custom error name if set
        errorMessage = error.message; // Use the original error message

        // Log detailed error info on the server
        console.error(`/api/explainAnomalyScore - ERROR in POST handler. Name: ${errorName}, Message: ${errorMessage}`);
        console.error('/api/explainAnomalyScore - Error Stack:', error.stack);

        switch (errorName) {
            case 'ConfigurationError':
                statusCode = 500; // Server misconfiguration
                errorMessage = "AI Service Configuration Error: API key issue. Admin check server setup.";
                break;
            case 'OpenRouterAPIError':
                statusCode = 502; // Error from OpenRouter itself
                // Avoid exposing too much detail from external API error messages
                errorMessage = "AI Service Provider Error: The AI provider returned an error. Please try again later.";
                if (error.message.includes("Rate limit exceeded")) {
                     errorMessage = "AI Service Provider Error: Rate limit exceeded. Please try again later.";
                } else if (error.message.toLowerCase().includes("authentication") || error.message.includes("401")) {
                     errorMessage = "AI Service Provider Error: Authentication failed. Admin check configuration.";
                }
                break;
            case 'OpenRouterResponseError':
                statusCode = 502; // Bad response structure from OpenRouter
                errorMessage = "AI Service Error: Malformed response from AI provider.";
                break;
            case 'NetworkError':
                statusCode = 504; // Network issue connecting to OpenRouter
                errorMessage = "AI Service Communication Error: Cannot connect to AI provider.";
                break;
            case 'SyntaxError': // JSON.parse error in the flow
                 statusCode = 502;
                 errorMessage = "AI Service Error: Invalid format response from AI (not JSON).";
                 break;
            case 'ZodValidationError': // Zod validation error in the flow
                 statusCode = 500; // Or 502; data from AI is bad, our validation caught it
                 errorMessage = `AI Service Error: Response data failed validation. ${error.message}`;
                 break;
            case 'EmptyResponseError':
                 statusCode = 502;
                 errorMessage = "AI Service Error: Received an empty response from AI provider.";
                 break;
            case 'NotFoundError': // e.g., Telemetry data not found
                 statusCode = 404;
                 // errorMessage is already specific from the flow
                 break;
            default:
                // Handle other errors, including generic errors or those with specific messages
                if (errorMessage.toLowerCase().includes("async_hooks")) {
                    statusCode = 500;
                    errorMessage = "Server Execution Error: Critical issue with 'async_hooks'. Review server logs.";
                }
                // If it's still a generic 500 at this point, the default message is used.
                break;
        }
    } else if (typeof error === 'string') {
       errorMessage = error; // Should be rare if flows always throw Error objects
       console.error('/api/explainAnomalyScore - Error (string):', errorMessage);
    } else {
        // Non-Error object thrown, highly unusual
        console.error('/api/explainAnomalyScore - Unknown error object type in POST handler:', error);
    }

    // Final client-facing message construction
    const clientErrorMessage = (statusCode === 500 && (errorMessage.startsWith("An unexpected error") || errorMessage.startsWith("Failed to explain anomaly score"))) ?
      "An internal server error occurred. Please check server logs for details." :
      errorMessage;

    return NextResponse.json(
        { error: clientErrorMessage },
        { status: statusCode }
    );
  }
}
