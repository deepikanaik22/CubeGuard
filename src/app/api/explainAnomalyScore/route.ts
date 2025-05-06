
import { explainAnomalyScore, ExplainAnomalyScoreInput } from '@/ai/flows/explain-anomaly-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  console.log('/api/explainAnomalyScore - POST request received.');
  try {
    console.log('/api/explainAnomalyScore - Parsing request body...');
    const body: ExplainAnomalyScoreInput = await req.json();
    console.log('/api/explainAnomalyScore - Request body parsed:', body);

    if (!body || !body.satelliteId) {
        console.error('/api/explainAnomalyScore - Invalid request: Missing satelliteId.');
        return NextResponse.json({ error: 'Invalid request: satelliteId is required.' }, { status: 400 });
    }

    console.log(`/api/explainAnomalyScore - Calling Genkit flow for satellite: ${body.satelliteId}`);
    const result = await explainAnomalyScore(body);
    console.log('/api/explainAnomalyScore - Genkit flow successful. Result:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('/api/explainAnomalyScore - ERROR in POST handler:', error);

    let errorMessage = 'An unexpected error occurred while explaining the anomaly score.';
    let statusCode = 500;

    if (error instanceof Error) {
        errorMessage = error.message;
        console.error('/api/explainAnomalyScore - Error Message:', errorMessage);
        console.error('/api/explainAnomalyScore - Error Stack:', error.stack); // Log stack for server-side debugging

        if (errorMessage.toLowerCase().includes("api key not valid")) {
            statusCode = 401; // Unauthorized
            errorMessage = "AI Error: Invalid API Key. Please check configuration.";
        } else if (errorMessage.toLowerCase().includes("module not found") && errorMessage.toLowerCase().includes("async_hooks")) {
            statusCode = 500; // Internal Server Error
            errorMessage = "Server Configuration Error: Failed to resolve 'async_hooks'. Check Next.js webpack and server component externalization settings.";
        } else if (errorMessage.toLowerCase().includes("async_hooks")) {
            // Catch-all for other async_hooks related issues
            statusCode = 500;
            errorMessage = `Server Execution Error involving 'async_hooks': ${errorMessage}. Review server logs.`;
        } else if (errorMessage.includes("not found")) { // e.g. telemetry data not found
            statusCode = 404;
        } else if (errorMessage.includes("Tool did not return telemetry data")) {
            statusCode = 404; // Or 500 if tool should always return data
        } else if (errorMessage.includes("AI explanation response")) { // E.g. AI output validation failed
             statusCode = 502; // Bad Gateway
        } else if (errorMessage.includes("Failed to retrieve telemetry via tool")) {
            statusCode = 504; // Gateway Timeout or similar
        }
    } else if (typeof error === 'string') {
       errorMessage = error;
       console.error('/api/explainAnomalyScore - Error (string):', errorMessage);
    } else {
        console.error('/api/explainAnomalyScore - Unknown error object type in POST handler:', error);
    }

    // Return a more generic message to the client for 500 errors
    const clientErrorMessage = statusCode >= 500 ?
      "An internal server error occurred. Please check server logs for details." :
      errorMessage;

    return NextResponse.json(
        { error: clientErrorMessage },
        { status: statusCode }
    );
  }
}
