import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import { askDestinyVoxOracle, type CosmicReadingResult } from '../../destinyVoxEngine';
import { calculateFullNumerology } from '../../../shared/numerology';
import { syncUserVipFromStripe } from '../../core/stripeSync';
import { getSupabaseUserVip, useSupabaseUserCredit } from '../../core/supabase';

export const oracleProcedures = {
  getMyCredits: publicProcedure.query(async () => {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return { credits: 0, isVip: false, username: '' };
    }
    const username = rawUsername.replace(/^u\//i, '').trim();

    try {
      const vipInfo = await getSupabaseUserVip(username);
      return {
        credits: vipInfo.credits,
        isVip: vipInfo.isVip || vipInfo.credits > 0,
        username,
      };
    } catch {
      return { credits: 0, isVip: false, username };
    }
  }),

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
      let hasAccess = false;
      let remainingCredits = 0;

      if (username) {
        // 1. Consulta VIP e créditos diretamente no Supabase
        try {
          const vipInfo = await getSupabaseUserVip(username);
          hasAccess = vipInfo.isVip || vipInfo.credits > 0;
          remainingCredits = vipInfo.credits;
        } catch {
          // ignore
        }

        // 2. Cache no Redis caso o Supabase não tenha respondido
        if (!hasAccess) {
          try {
            const cached =
              (await redis.get(`destinyvox_vip_${username}`)) ||
              (await redis.get(`destinyvox_vip_${username.toLowerCase()}`));
            if (cached === 'active' || cached === 'true') {
              hasAccess = true;
            }
          } catch {
            // ignore
          }
        }

        // 3. Fallback Stripe
        if (!hasAccess) {
          try {
            const syncRes = await syncUserVipFromStripe(username);
            hasAccess = syncRes.isVip;
          } catch {
            // ignore
          }
        }

        if (!hasAccess) {
          return {
            answer: input.language?.startsWith('pt')
              ? 'Você precisa de créditos para consultar o Oráculo. Adquira um pacote de perguntas na nossa página oficial.'
              : input.language?.startsWith('es')
              ? 'Necesitas créditos para consultar al Oráculo. Adquiere un paquete de preguntas en nuestra página oficial.'
              : 'You need credits to consult the Oracle. Acquire a question pack on our official page.',
            remainingCredits: 0,
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

      // Se o usuário estiver autenticado, consome 1 crédito no Supabase
      if (username) {
        try {
          const creditRes = await useSupabaseUserCredit(username);
          if (creditRes.success) {
            remainingCredits = creditRes.credits;
          }
        } catch (err) {
          console.error('[Oracle] Erro ao debitar crédito:', err);
        }
      }

      return { answer, remainingCredits };
    }),
};
