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
      const v1Signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));

      if (!timestampPart || v1Signatures.length === 0) {
        return c.text('Invalid stripe signature format', 400);
      }

      const signedPayload = `${timestampPart}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

      const isValid = v1Signatures.some((sig) => {
        try {
          return (
            sig.length === expectedSignature.length &&
            crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSignature, 'hex'))
          );
        } catch {
          return false;
        }
      });

      if (!isValid) {
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
          id?: string;
          client_reference_id?: string;
          metadata?: {
            userToken?: string;
            username?: string;
            reddit_username?: string;
            u?: string;
          };
          custom_fields?: Array<{
            key?: string;
            label?: { custom?: string };
            text?: { value?: string };
          }>;
          payment_status?: string;
          status?: string;
        };
      };
    };

    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      let candidate =
        session?.client_reference_id ||
        session?.metadata?.userToken ||
        session?.metadata?.username ||
        session?.metadata?.reddit_username ||
        session?.metadata?.u ||
        '';

      // Fallback para campos customizados configurados no Stripe Checkout Link
      if (!candidate && Array.isArray(session?.custom_fields)) {
        const userField = session.custom_fields.find(
          (f) =>
            /reddit|user|usuario|username/i.test(f?.key || '') ||
            /reddit|user|usuario|username/i.test(f?.label?.custom || '')
        );
        if (userField?.text?.value) {
          candidate = userField.text.value;
        }
      }

      if (candidate) {
        let username = decryptUsername(candidate);
        if (!username) {
          const rawClean = candidate.replace(/^u\//i, '').replace(/^u_/i, '').trim();
          if (/^[a-zA-Z0-9_-]{3,30}$/.test(rawClean)) {
            username = rawClean;
          }
        }

        if (username) {
          const cleanUser = username.replace(/^u\//i, '').trim();
          const normUser = cleanUser.toLowerCase();

          // Ativa o VIP no Redis para o usuário do Reddit (ambas as chaves para case-insensitivity)
          await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
          await redis.set(`destinyvox_vip_${normUser}`, 'active');
          console.log(`[Stripe] VIP 360° ativado com sucesso para u/${cleanUser}`);
        } else {
          console.warn('[Stripe] Token ou username não reconhecido no checkout:', candidate);
        }
      } else {
        console.warn('[Stripe] Nenhum identificador de usuário encontrado na sessão:', session?.id);
      }
    }

    return c.json({ received: true });
  } catch (err) {
    console.error('Erro no processamento do evento Stripe:', err);
    return c.text('Webhook processing error', 500);
  }
});
