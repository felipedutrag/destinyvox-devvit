import { z } from 'zod';
import { reddit } from '@devvit/web/server';
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

      const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
      if (!STRIPE_SECRET_KEY) {
        return {
          success: false,
          error: 'STRIPE_SECRET_KEY is not configured on the server.',
        };
      }

      const successUrl =
        input.successUrl || 'https://reddit.com?destinyvox_status=success';
      const cancelUrl =
        input.cancelUrl || 'https://reddit.com?destinyvox_status=cancelled';

      try {
        const bodyParams = new URLSearchParams({
          'payment_method_types[0]': 'card',
          mode: 'payment',
          client_reference_id: encryptedUserToken,
          'metadata[userToken]': encryptedUserToken,
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][product_data][name]': 'DestinyVox VIP 360° Access',
          'line_items[0][price_data][product_data][description]': 'Karmic Pinnacles, Major Arcana & Synastry',
          'line_items[0][price_data][unit_amount]': '499',
          'line_items[0][quantity]': '1',
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const sessionData = (await stripeRes.json()) as {
          id?: string;
          url?: string;
          error?: { message?: string };
        };

        if (!stripeRes.ok || !sessionData.url) {
          console.error('Stripe API error:', sessionData.error);
          return {
            success: false,
            error: sessionData.error?.message || 'Failed to create Stripe checkout session.',
          };
        }

        return {
          success: true,
          checkoutUrl: sessionData.url,
          sessionId: sessionData.id,
          encryptedToken: encryptedUserToken,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('Erro ao chamar API da Stripe:', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }
    }),
};
