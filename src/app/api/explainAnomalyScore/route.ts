
import { explainAnomalyScore, ExplainAnomalyScoreInput } from '@/ai/flows/explain-anomaly-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  console.log('/api/explainAnomalyScore - Received POST request'); // Log entry
  try {
    const body: ExplainAnomalyScoreInput = await req.json();
    console.log('/api/explainAnomalyScore - Request body:', JSON.stringify(body, null, 2)); // Log parsed request body

    if (!body || !body.satelliteId) {
        console.error('/api/explainAnomalyScore - Invalid request body: Missing satelliteId');
        return NextResponse.json({ error: 'Invalid request: satelliteId is required.' }, { status: 400 });
    }

    console.log(`/api/explainAnomalyScore - Calling explainAnomalyScore flow for satellite: ${body.satelliteId}`);
    const result = await explainAnomalyScore(body);
    console.log('/api/explainAnomalyScore - Success response:', JSON.stringify(result, null, 2)); // Log successful result

    return NextResponse.json(result);
  } catch (error) {
    // Log the full error object with stack trace if available
    console.error('/api/explainAnomalyScore - Internal Server Error:', error); // Log the full error object

    let errorMessage = 'An unexpected error occurred while explaining the anomaly score.';
    let statusCode = 500; // Default to 500 Internal Server Error

    if (error instanceof Error) {
        errorMessage = error.message;
        // Add specific status codes based on error types if needed
        if (errorMessage.includes("API key not valid")) {
            statusCode = 401; // Unauthorized
            errorMessage = "AI Error: Invalid API Key. Please check configuration.";
        } else if (errorMessage.includes("not found")) {
            statusCode = 404; // Not Found (e.g., telemetry data)
            errorMessage = `Error: Resource not found. ${errorMessage}`;
        } else if (errorMessage.includes("Tool did not return telemetry data")) {
            statusCode = 404; // Or potentially 500 if the tool *should* always return data
            errorMessage = `Error: Could not retrieve necessary data. ${errorMessage}`;
        } else if (errorMessage.includes("AI explanation response")) {
             // Specific error from flow's validation or output check
             statusCode = 502; // Bad Gateway - issue with upstream AI response
             errorMessage = `AI Error: ${errorMessage}`;
        } else if (errorMessage.includes("Failed to retrieve telemetry via tool")) {
            statusCode = 504; // Gateway Timeout or Bad Gateway depending on context
            errorMessage = `Error: ${errorMessage}`;
        }
        // Log the stack trace if available
        if (error.stack) {
          console.error('/api/explainAnomalyScore - Error Stack Trace:', error.stack);
        }
    } else if (typeof error === 'string') {
       errorMessage = error;
    } else {
        // Handle non-Error objects if necessary
        errorMessage = 'An unknown error object was thrown.';
        console.error('/api/explainAnomalyScore - Unknown error object:', error);
    }


    // Return a JSON error response
    return NextResponse.json(
        // Provide a generic error message to the client, but log details server-side
        { error: `Failed to explain anomaly score. Please check server logs for details.` },
        { status: statusCode }
    );
  }
}
