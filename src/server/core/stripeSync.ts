import { redis } from '@devvit/web/server';

export const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY ||
  process.env.VITE_STRIPE_SECRET_KEY ||
  '';

/**
 * Verifica se o usuário do Reddit possui status VIP ativo no Redis interno.
 * Nenhuma chamada externa a api.stripe.com é realizada pelo backend Devvit.
 */
export async function syncUserVipFromStripe(
  username: string,
  _options: { forceCheck?: boolean } = {}
): Promise<{ isVip: boolean; sessionId?: string }> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser) return { isVip: false };

  const normUser = cleanUser.toLowerCase();

  // Verifica se o status VIP já está ativo no Redis interno
  try {
    const cachedVip =
      (await redis.get(`destinyvox_vip_${cleanUser}`)) ||
      (await redis.get(`destinyvox_vip_${normUser}`));
    if (cachedVip === 'active' || cachedVip === 'true') {
      return { isVip: true };
    }
  } catch {
    // Ignora erro de leitura do Redis
  }

  return { isVip: false };
}
