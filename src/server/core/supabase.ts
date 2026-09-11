import { redis } from '@devvit/web/server';
import type { CosmicReadingResult } from '../destinyVoxEngine';

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
  status: boolean | string;
  credits?: number;
  plan?: string;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SavedChartItem = {
  id: string;
  name: string;
  birthDate: string;
  data: CosmicReadingResult;
};

export type SupabaseUserProfile = {
  id?: string;
  reddit_username: string;
  full_name: string;
  birth_date: string;
  language?: string;
  numerology_data: CosmicReadingResult;
  saved_charts?: SavedChartItem[];
  created_at?: string;
  updated_at?: string;
};

// ─── VIP & CRÉDITOS ──────────────────────────────────────────────────────────

/**
 * Consulta a tabela vip_users no Supabase para verificar se o usuário é pagante ativo ou tem créditos.
 * Utiliza cache no Redis do Devvit para performance.
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
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/vip_users?reddit_username=ilike.${encodeURIComponent(normUser)}&select=id,reddit_username,status,credits,plan`;
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
      const isActive =
        user.status === true ||
        user.status === 'true' ||
        user.status === 'active' ||
        (typeof user.credits === 'number' && user.credits > 0);

      if (isActive) {
        try {
          await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
          await redis.set(`destinyvox_vip_${normUser}`, 'active');
        } catch {
          // Erro de escrita de cache ignorado
        }
        return true;
      } else {
        // Se o Supabase retornou o usuário como inativo, limpa o Redis imediatamente
        try {
          await redis.del(`destinyvox_vip_${cleanUser}`);
          await redis.del(`destinyvox_vip_${normUser}`);
        } catch {
          // Erro de remoção de cache ignorado
        }
        return false;
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
  status: 'active' | 'inactive' | 'canceled' | boolean = 'active',
  plan: string = 'vip'
): Promise<boolean> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;

  const normUser = cleanUser.toLowerCase();
  const booleanStatus = status === 'active' || status === true;

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
        status: booleanStatus,
        plan,
        updated_at: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      if (booleanStatus) {
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

/**
 * Obtém saldo de créditos e status completo do usuário no Supabase.
 */
export async function getSupabaseUserVip(username: string): Promise<{
  isVip: boolean;
  credits: number;
  plan: string;
}> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { isVip: false, credits: 0, plan: '' };
  }

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/vip_users?reddit_username=ilike.${encodeURIComponent(cleanUser)}&select=status,credits,plan`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = (await res.json()) as SupabaseVipUser[];
      if (rows && rows[0]) {
        const user = rows[0];
        const credits = typeof user.credits === 'number' ? user.credits : 0;
        const isVip =
          user.status === true ||
          user.status === 'true' ||
          user.status === 'active' ||
          credits > 0;

        const normUser = cleanUser.toLowerCase();
        if (isVip) {
          try {
            await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
            await redis.set(`destinyvox_vip_${normUser}`, 'active');
          } catch {
            // ignore
          }
        } else {
          try {
            await redis.del(`destinyvox_vip_${cleanUser}`);
            await redis.del(`destinyvox_vip_${normUser}`);
          } catch {
            // ignore
          }
        }

        return { isVip, credits, plan: user.plan || '' };
      }
    }
  } catch (err) {
    console.error('[Supabase] Falha ao buscar saldo de créditos:', err);
  }

  return { isVip: false, credits: 0, plan: '' };
}

/**
 * Garante que todo novo usuário do Reddit receba exatamente 5 créditos gratuitos de boas-vindas
 * vinculados exclusivamente ao seu nome de usuário do Reddit (independente de quantos mapas gerar ou deletar).
 */
export async function ensureUserWelcomeCredits(username: string): Promise<{
  isVip: boolean;
  credits: number;
  plan: string;
}> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { isVip: false, credits: 0, plan: '' };
  }

  try {
    // 1. Verifica se já existe qualquer registro na tabela vip_users
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/vip_users?reddit_username=ilike.${encodeURIComponent(cleanUser)}&select=status,credits,plan`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = (await res.json()) as SupabaseVipUser[];
      if (rows && rows.length > 0 && rows[0]) {
        // Usuário já cadastrado anteriormente: preserva o saldo real e status existente
        const user = rows[0];
        const credits = typeof user.credits === 'number' ? user.credits : 0;
        const isVip =
          user.status === true ||
          user.status === 'true' ||
          user.status === 'active' ||
          credits > 0;
        return { isVip, credits, plan: user.plan || '' };
      }
    }

    // 2. Novo usuário: cadastra com 5 créditos de boas-vindas vinculados ao reddit_username
    const insertUrl = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/vip_users`;
    const insertRes = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates',
      },
      body: JSON.stringify({
        reddit_username: cleanUser,
        status: true,
        credits: 5,
        plan: 'free_welcome',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    if (insertRes.ok) {
      const normUser = cleanUser.toLowerCase();
      try {
        await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
        await redis.set(`destinyvox_vip_${normUser}`, 'active');
      } catch {
        // ignore
      }
      return { isVip: true, credits: 5, plan: 'free_welcome' };
    }
  } catch (err) {
    console.error('[Supabase] Falha ao atribuir créditos de boas-vindas:', err);
  }

  return getSupabaseUserVip(cleanUser);
}

/**
 * Consome 1 crédito do usuário ao realizar uma pergunta no Oráculo via função PostgreSQL atômica.
 */
export async function useSupabaseUserCredit(username: string): Promise<{
  success: boolean;
  credits: number;
  error?: string;
}> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, credits: 0, error: 'Configuração Supabase ausente' };
  }

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/use_user_credit`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_reddit_username: cleanUser }),
    });

    if (res.ok) {
      const data = (await res.json()) as { success: boolean; credits: number; error?: string };
      return data;
    }
  } catch (err) {
    console.error('[Supabase] Erro ao consumir crédito:', err);
  }

  return { success: false, credits: 0, error: 'Falha ao processar consumo de crédito' };
}

// ─── PERFIL E MAPAS NUMEROLÓGICOS (user_profiles) ───────────────────────────

/**
 * Busca o perfil numerológico e mapas salvos do usuário no Supabase.
 */
export async function getSupabaseUserProfile(username: string): Promise<SupabaseUserProfile | null> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/user_profiles?reddit_username=ilike.${encodeURIComponent(cleanUser)}&select=*`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.ok) {
      const rows = (await res.json()) as SupabaseUserProfile[];
      if (rows && rows[0]) {
        return rows[0];
      }
    }
  } catch (err) {
    console.error('[Supabase] Erro ao carregar user_profile:', err);
  }

  return null;
}

/**
 * Salva ou atualiza o perfil numerológico completo do usuário no Supabase.
 */
export async function saveSupabaseUserProfile(
  username: string,
  data: {
    fullName: string;
    birthDate: string;
    language?: string;
    numerologyData: CosmicReadingResult;
    savedCharts?: SavedChartItem[];
  }
): Promise<boolean> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/user_profiles`;
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
        full_name: data.fullName,
        birth_date: data.birthDate,
        language: data.language || 'en',
        numerology_data: data.numerologyData,
        saved_charts: data.savedCharts || [],
        updated_at: new Date().toISOString(),
      }),
    });

    if (res.ok) {
      return true;
    } else {
      console.warn(`[Supabase] Erro ao salvar user_profiles (${res.status}): ${res.statusText}`);
    }
  } catch (err) {
    console.error('[Supabase] Falha ao salvar perfil do usuário:', err);
  }

  return false;
}

/**
 * Atualiza apenas os mapas salvos (saved_charts) do usuário no Supabase.
 */
export async function saveSupabaseUserCharts(
  username: string,
  charts: SavedChartItem[]
): Promise<boolean> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/user_profiles?reddit_username=ilike.${encodeURIComponent(cleanUser)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        saved_charts: charts,
        updated_at: new Date().toISOString(),
      }),
    });

    return res.ok;
  } catch (err) {
    console.error('[Supabase] Erro ao atualizar saved_charts:', err);
    return false;
  }
}

/**
 * Limpa o perfil do usuário no Supabase.
 */
export async function deleteSupabaseUserProfile(username: string): Promise<boolean> {
  const cleanUser = username.replace(/^u\//i, '').trim();
  if (!cleanUser || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/user_profiles?reddit_username=ilike.${encodeURIComponent(cleanUser)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return res.ok;
  } catch (err) {
    console.error('[Supabase] Erro ao deletar perfil:', err);
    return false;
  }
}
