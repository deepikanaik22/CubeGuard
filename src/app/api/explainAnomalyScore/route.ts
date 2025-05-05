
import { explainAnomalyScore, ExplainAnomalyScoreInput } from '@/ai/flows/explain-anomaly-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: ExplainAnomalyScoreInput = await req.json();
    console.log('/api/explainAnomalyScore - Request body:', body); // Log request body
    const result = await explainAnomalyScore(body);
    console.log('/api/explainAnomalyScore - Success response:', result); // Log successful result
    return NextResponse.json(result);
  } catch (error) {
    // Log the full error object with stack trace if available
    console.error('/api/explainAnomalyScore - Internal Server Error:', error);

    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500; // Default to 500 Internal Server Error

    if (error instanceof Error) {
        errorMessage = error.message;
        // Check for specific error types if needed
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
         // Add more specific status codes based on error types if needed
    } else if (typeof error === 'string') {
       errorMessage = error;
    }


    // Return a JSON error response
    return NextResponse.json(
        { error: `Failed to explain anomaly score: ${errorMessage}` },
        { status: statusCode }
    );
  }
}

    