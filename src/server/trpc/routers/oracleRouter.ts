import { z } from 'zod';
import { publicProcedure } from '../init';
import { askDestinyVoxOracle, type CosmicReadingResult } from '../../destinyVoxEngine';

export const oracleProcedures = {
  askOracle: publicProcedure
    .input(
      z.object({
        question: z.string().min(3),
        profile: z.custom<CosmicReadingResult['profile']>(),
        language: z.string().default('en'),
      })
    )
    .mutation(async ({ input }) => {
      const answer = await askDestinyVoxOracle(input.question, input.profile, input.language);
      return { answer };
    }),
};
