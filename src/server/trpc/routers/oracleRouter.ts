import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import { askDestinyVoxOracle, type CosmicReadingResult } from '../../destinyVoxEngine';
import { calculateFullNumerology } from '../../../shared/numerology';
import { syncUserVipFromStripe } from '../../core/stripeSync';

export const oracleProcedures = {
  askOracle: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        profile: z.custom<CosmicReadingResult['profile']>().optional(),
        reading: z.custom<CosmicReadingResult>().optional(),
        history: z
          .array(
            z.object({
              sender: z.enum(['user', 'oracle']),
              text: z.string(),
            })
          )
          .optional(),
        language: z.string().default('en'),
      })
    )
    .mutation(async ({ input }) => {
      const rawUsername = await reddit.getCurrentUsername();
      const username = rawUsername ? rawUsername.replace(/^u\//i, '').trim() : '';
      if (username) {
        let isVip = false;
        try {
          const cached =
            (await redis.get(`destinyvox_vip_${username}`)) ||
            (await redis.get(`destinyvox_vip_${username.toLowerCase()}`));
          isVip = cached === 'active' || cached === 'true';
        } catch {
          // ignore
        }

        if (!isVip) {
          const syncRes = await syncUserVipFromStripe(username);
          isVip = syncRes.isVip;
        }

        if (!isVip) {
          return {
            answer: input.language?.startsWith('pt')
              ? 'O Oráculo é um recurso exclusivo para assinantes VIP.'
              : input.language?.startsWith('es')
              ? 'El Oráculo es una función exclusiva para suscriptores VIP.'
              : 'The Oracle is an exclusive feature for VIP subscribers.',
          };
        }
      }

      const safeProfile =
        input.reading?.profile ||
        (input.profile?.fullName && input.profile?.birthDate
          ? input.profile
          : calculateFullNumerology('Cosmic Seeker', '1995-07-07'));

      const answer = await askDestinyVoxOracle({
        question: input.question,
        profile: safeProfile,
        reading: input.reading,
        history: input.history,
        language: input.language,
      });
      return { answer };
    }),
};
