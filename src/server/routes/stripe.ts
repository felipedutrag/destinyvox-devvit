import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import crypto from 'node:crypto';
import { decryptUsername } from '../core/crypto';

export const stripeRoutes = new Hono();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * Webhook oficial da Stripe para confirmar pagamentos e liberar status VIP
 * Rota: POST /api/stripe/webhook
 */
stripeRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const rawBody = await c.req.text();

  // Se houver STRIPE_WEBHOOK_SECRET configurado, valida a assinatura criptográfica
  if (STRIPE_WEBHOOK_SECRET && signature) {
    try {
      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='))?.slice(2);
      const signaturePart = parts.find((p) => p.startsWith('v1='))?.slice(3);

      if (!timestampPart || !signaturePart) {
        return c.text('Invalid stripe signature format', 400);
      }

      const signedPayload = `${timestampPart}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      if (expectedSignature !== signaturePart) {
        console.warn('Webhook Stripe: Assinatura inválida detectada.');
        return c.text('Invalid signature', 400);
      }
    } catch (err) {
      console.error('Erro ao verificar assinatura do webhook Stripe:', err);
      return c.text('Signature verification failed', 400);
    }
  }

  try {
    const event = JSON.parse(rawBody) as {
      type?: string;
      data?: {
        object?: {
          client_reference_id?: string;
          metadata?: {
            userToken?: string;
          };
          payment_status?: string;
          status?: string;
        };
      };
    };

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const userToken = session?.client_reference_id || session?.metadata?.userToken || '';

      if (userToken) {
        const username = decryptUsername(userToken);
        if (username) {
          // Ativa o VIP no Redis para o usuário do Reddit
          await redis.set(`destinyvox_vip_${username}`, 'active');
          console.log(`[Stripe] VIP 360° ativado com sucesso para u/${username}`);
        } else {
          console.warn('[Stripe] Token de usuário inválido ou adulterado no checkout');
        }
      }
    }

    return c.json({ received: true });
  } catch (err) {
    console.error('Erro no processamento do evento Stripe:', err);
    return c.text('Webhook processing error', 500);
  }
});
