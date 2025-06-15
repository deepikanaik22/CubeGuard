// shared/aiSchemas.ts
import { z } from 'zod';

export const anomalySchemas = {
  ExplainAnomalyScoreInput: z.object({ satelliteId: z.string() }),
  ExplainAnomalyScoreOutput: z.object({
    explanation: z.string(),
    breakdown: z.object({
      thermal: z.number(),
      comm: z.number(),
      power: z.number(),
      orientation: z.number(),
    }),
  }),
  GetRiskScoreInput: z.object({
    batteryLevel: z.number(),
    temperature: z.number(),
    communicationStatus: z.enum(['stable', 'unstable', 'lost']),
  }),
  GetRiskScoreOutput: z.object({
    riskScore: z.number().min(0).max(100),
    explanation: z.string(),
  }),
};

// shared/anomalySchemas.ts
// import { z } from 'zod';

// export const anomalySchemas = {
//   ExplainAnomalyScoreInputSchema: z.object({
//     satelliteId: z.string(),
//   }),
//   ExplainAnomalyScoreOutputSchema: z.object({
//     explanation: z.string(),
//     breakdown: z.object({
//       thermal: z.number(),
//       comm: z.number(),
//       power: z.number(),
//       orientation: z.number(),
//     }),
//   }),
// };
