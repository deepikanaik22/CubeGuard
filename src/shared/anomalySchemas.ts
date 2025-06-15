// src/shared/anomalySchemas.ts
import { z } from 'zod';

export const ExplainAnomalyScoreInput = z.object({
  satelliteId: z.string(),
});

export const ExplainAnomalyScoreOutput = z.object({
  explanation: z.string(),
  breakdown: z.object({
    thermal: z.number(),
    comm: z.number(),
    power: z.number(),
    orientation: z.number(),
  }),
});

export const GetRiskScoreInput = z.object({
  batteryLevel: z.number(),
  temperature: z.number(),
  communicationStatus: z.enum(['stable', 'unstable', 'lost']),
});

export const GetRiskScoreOutput = z.object({
  riskScore: z.number().min(0).max(100),
  explanation: z.string(),
});
