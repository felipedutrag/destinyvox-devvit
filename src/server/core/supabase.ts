import { redis } from '@devvit/web/server';

export const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://zesbznfykirwzoubatio.supabase.co';
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplc2J6bmZ5a2lyd3pvdWJhdGlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODkyMTI4OCwiZXhwIjoyMTA0NDk3Mjg4fQ.N7wd7XZeS9AnLVlbxR1FoPckct_Z6jTsSPrdEk29kFM';
export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplc2J6bmZ5a2lyd3pvdWJhdGlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjEyODgsImV4cCI6MjEwNDQ5NzI4OH0.XKd4yXSfDIiQu8AvePG9DTJK9_u-hMsOc4h7LiR65YA';

export type SupabaseVipUser = {
  id?: string;
  reddit_username: string;
  status: string;
  plan?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

/**
 * Consulta a tabela vip_users no Supabase para verificar se o usuário é pagante ativo.
 * Utiliza cache no Redis do Devvit por padrão para evitar chamadas de rede redundantes.
 */
export async function checkSupabaseVip(
  username: string,
  options: { bypassCache?: boolean } = {}
): Promise<boolean> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser) return false;

  const normUser = cleanUser.toLowerCase();

  // 1. Verifica cache no Redis
  if (!options.bypassCache) {
    try {
      const cached =
        (await redis.get(`destinyvox_vip_${cleanUser}`)) ||
        (await redis.get(`destinyvox_vip_${normUser}`));
      if (cached === 'active' || cached === 'true') {
        return true;
      }
    } catch {
      // Falha de leitura do Redis ignorada
    }
  }

  // 2. Consulta a API REST do Supabase
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/vip_users?reddit_username=ilike.${encodeURIComponent(normUser)}&select=id,reddit_username,status,plan`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.warn(`[Supabase] Erro ao consultar vip_users (${res.status}): ${res.statusText}`);
      return false;
    }

    const rows = (await res.json()) as SupabaseVipUser[];
    if (Array.isArray(rows) && rows.length > 0 && rows[0]) {
      const user = rows[0];
      const isActive = user.status?.toLowerCase() === 'active';
      if (isActive) {
        // Armazena no Redis com cache
        try {
          await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
          await redis.set(`destinyvox_vip_${normUser}`, 'active');
        } catch {
          // Erro de escrita de cache ignorado
        }
        return true;
      }
    }
  } catch (err: unknown) {
    console.error('[Supabase] Falha na requisição de VIP:', err);
  }

  return false;
}

/**
 * Atualiza ou insere o status de um usuário na tabela vip_users do Supabase.
 */
export async function upsertSupabaseVipUser(
  username: string,
  status: 'active' | 'inactive' | 'canceled' = 'active',
  plan: string = 'vip'
): Promise<boolean> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;

  const normUser = cleanUser.toLowerCase();

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/vip_users`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        reddit_username: cleanUser,
        status,
        plan,
      }),
    });

    if (res.ok) {
      if (status === 'active') {
        await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
        await redis.set(`destinyvox_vip_${normUser}`, 'active');
      } else {
        await redis.del(`destinyvox_vip_${cleanUser}`);
        await redis.del(`destinyvox_vip_${normUser}`);
      }
      return true;
    } else {
      console.warn(`[Supabase] Erro ao upsert vip_users (${res.status}): ${res.statusText}`);
    }
  } catch (err) {
    console.error('[Supabase] Falha ao upsert vip_users:', err);
  }

  return false;
}
