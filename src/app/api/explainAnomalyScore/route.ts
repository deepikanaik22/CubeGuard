
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
    console.error('/api/explainAnomalyScore - Error processing request:', error); // Log the full error object
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes("Invalid API Key")) {
        statusCode = 401; // Unauthorized
    } else if (errorMessage.includes("not found")) {
        statusCode = 404; // Not Found (e.g., telemetry data)
    }
    // Add more specific status codes based on error types if needed

    return NextResponse.json({ error: `Failed to explain anomaly score: ${errorMessage}` }, { status: statusCode });
  }
}
