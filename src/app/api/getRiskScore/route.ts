
import {getRiskScore, GetRiskScoreInput} from '@/ai/flows/get-risk-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: GetRiskScoreInput = await req.json();
    console.log('/api/getRiskScore - Request body:', body); // Log request body
    const result = await getRiskScore(body);
    console.log('/api/getRiskScore - Success response:', result); // Log successful result
    return NextResponse.json(result);
  } catch (error) {
    console.error('/api/getRiskScore - Error processing request:', error); // Log the full error object
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    // Determine appropriate status code
    let statusCode = 500;
    if (errorMessage.includes("Invalid API Key")) {
        statusCode = 401; // Unauthorized
    }
    // Add more specific status codes based on error types if needed

    return NextResponse.json({ error: `Failed to calculate risk score: ${errorMessage}` }, { status: statusCode });
  }
}
