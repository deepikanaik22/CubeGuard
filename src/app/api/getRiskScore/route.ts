import {getRiskScore, GetRiskScoreInput} from '@/ai/flows/get-risk-score';
import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body: GetRiskScoreInput = await req.json();
    const result = await getRiskScore(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return NextResponse.json({error: 'Failed to calculate risk score'}, {status: 500});
  }
}
