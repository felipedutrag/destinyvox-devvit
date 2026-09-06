import { z } from 'zod';
import { publicProcedure } from '../init';
import { askDestinyVoxOracle } from '../../destinyVoxEngine';
import { calculateFullNumerology } from '../../../shared/numerology';

export const oracleProcedures = {
  askOracle: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        profile: z.any().optional(),
        language: z.string().default('en'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const safeProfile =
          input.profile?.fullName && input.profile?.birthDate
            ? input.profile
            : calculateFullNumerology('Cosmic Seeker', '1995-07-07');
        const answer = await askDestinyVoxOracle(input.question, safeProfile, input.language);
        return { success: true, answer };
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error('[oracleRouter error]:', errMessage);
        return { success: false, answer: `[ERRO ORÁCULO]: ${errMessage}` };
      }
    }),
};
