import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import { encryptUsername } from '../../core/crypto';

export const stripeProcedures = {
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        username: z.string().optional(),
        successUrl: z.string().optional(),
        cancelUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const loggedInUser = await reddit.getCurrentUsername();
      const rawUser = input.username?.trim() || loggedInUser || '';
      const cleanUser = rawUser.replace(/^u\//i, '').trim();

      if (!cleanUser) {
        return {
          success: false,
          error: 'Username is required to link VIP access.',
        };
      }

      const encryptedUserToken = encryptUsername(cleanUser);

      // Redirecionamento direto para a landing page externa sem chamadas diretas a api.stripe.com
      return {
        success: true,
        checkoutUrl: `https://destinyvox.online/?u=${encodeURIComponent(cleanUser)}`,
        encryptedToken: encryptedUserToken,
      };
    }),

  verifyPaymentSession: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async () => {
      return {
        success: false,
        error: 'Direct Stripe API verification from Reddit Devvit is disabled.',
      };
    }),

  checkMyVipStatus: publicProcedure.mutation(async () => {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return { success: false, isVip: false, error: 'Usuário não autenticado.' };
    }
    const username = rawUsername.replace(/^u\//i, '').trim();
    const normUser = username.toLowerCase();

    const cachedVip =
      (await redis.get(`destinyvox_vip_${username}`)) ||
      (await redis.get(`destinyvox_vip_${normUser}`));
    const isVip = cachedVip === 'active' || cachedVip === 'true';

    return { success: true, isVip, username };
  }),
};
