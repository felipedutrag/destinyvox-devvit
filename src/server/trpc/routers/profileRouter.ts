import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import {
  getOrGenerateProfile,
  type CosmicReadingResult,
} from '../../destinyVoxEngine';
import { encryptUsername } from '../../core/crypto';
import { syncUserVipFromStripe } from '../../core/stripeSync';
import {
  getSupabaseUserProfile,
  saveSupabaseUserCharts,
  deleteSupabaseUserProfile,
  getSupabaseUserVip,
  type SavedChartItem,
} from '../../core/supabase';

export { type SavedChartItem };

export const profileProcedures = {
  getSavedProfile: publicProcedure.query(async () => {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) {
      return { exists: false, charts: [], username: '', isVip: false, credits: 0 };
    }
    const username = rawUsername.replace(/^u\//i, '').trim();

    // 1. Consulta VIP e créditos no Supabase
    let isVip = false;
    let credits = 0;
    try {
      const vipInfo = await getSupabaseUserVip(username);
      isVip = vipInfo.isVip || vipInfo.credits > 0;
      credits = vipInfo.credits;
    } catch {
      // ignore
    }

    if (!isVip) {
      try {
        const vipFlag =
          (await redis.get(`destinyvox_vip_${username}`)) ||
          (await redis.get(`destinyvox_vip_${username.toLowerCase()}`));
        if (vipFlag === 'active' || vipFlag === 'true') {
          isVip = true;
        }
      } catch {
        // Ignorar erro ao ler flag VIP do Redis
      }
    }

    // Fallback de sincronização Stripe se necessário
    if (!isVip) {
      try {
        const syncRes = await syncUserVipFromStripe(username);
        if (syncRes.isVip) {
          isVip = true;
        }
      } catch {
        // Ignora falha de rede da Stripe para não travar o carregamento do perfil
      }
    }

    const userToken = username ? encryptUsername(username) : '';

    // 2. Busca perfil e mapas salvos no Supabase (Fonte da Verdade)
    try {
      const supabaseProfile = await getSupabaseUserProfile(username);
      if (supabaseProfile && supabaseProfile.numerology_data) {
        const profileData = supabaseProfile.numerology_data;
        const charts: SavedChartItem[] =
          supabaseProfile.saved_charts && supabaseProfile.saved_charts.length > 0
            ? supabaseProfile.saved_charts
            : [
                {
                  id: 'primary',
                  name: supabaseProfile.full_name || profileData.profile.fullName,
                  birthDate: supabaseProfile.birth_date || profileData.profile.birthDate,
                  data: profileData,
                },
              ];

        // Atualiza cache rápido no Redis
        await redis.set(`destinyvox_user_${username}`, JSON.stringify(profileData)).catch(() => {});
        await redis.set(`destinyvox_charts_${username}`, JSON.stringify(charts)).catch(() => {});

        return { exists: true, data: profileData, charts, username, isVip, credits, userToken };
      }
    } catch (err) {
      console.error('[Supabase] Erro ao carregar perfil:', err);
    }

    // 3. Fallback: Busca no Redis caso o Supabase não tenha ou esteja temporariamente inacessível
    let charts: SavedChartItem[] = [];
    try {
      const rawCharts = await redis.get(`destinyvox_charts_${username}`);
      if (rawCharts) {
        charts = JSON.parse(rawCharts);
      }
    } catch {
      // Ignorar erro ao ler lista de mapas
    }

    try {
      const raw = await redis.get(`destinyvox_user_${username}`);
      if (raw) {
        const profileData = JSON.parse(raw) as CosmicReadingResult;
        if (charts.length === 0) {
          charts = [
            {
              id: 'primary',
              name: profileData.profile.fullName,
              birthDate: profileData.profile.birthDate,
              data: profileData,
            },
          ];
          await redis.set(`destinyvox_charts_${username}`, JSON.stringify(charts));
        }
        return { exists: true, data: profileData, charts, username, isVip, credits, userToken };
      }
    } catch {
      // Ignorar erro ao ler perfil salvo
    }

    return { exists: false, charts, username, isVip, credits, userToken };
  }),

  generateReading: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2),
        birthDate: z.string().min(8),
        language: z.string().default('en'),
      })
    )
    .mutation(async ({ input }) => {
      const username = (await reddit.getCurrentUsername()) || '';
      const result = await getOrGenerateProfile(username, input.fullName, input.birthDate, input.language);
      return { success: true, result, username };
    }),

  clearProfile: publicProcedure.mutation(async () => {
    const rawUsername = await reddit.getCurrentUsername();
    if (!rawUsername) return { success: true };
    const username = rawUsername.replace(/^u\//i, '').trim();

    try {
      await deleteSupabaseUserProfile(username).catch(() => {});
      await redis.del(`destinyvox_user_${username}`);
      await redis.del(`destinyvox_charts_${username}`);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }),

  saveChart: publicProcedure
    .input(
      z.object({
        chart: z.object({
          id: z.string(),
          name: z.string(),
          birthDate: z.string(),
          data: z.custom<CosmicReadingResult>(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const rawUsername = await reddit.getCurrentUsername();
      if (!rawUsername) {
        return { success: true, charts: [input.chart] };
      }
      const username = rawUsername.replace(/^u\//i, '').trim();

      try {
        // Tenta buscar mapas existentes do Supabase ou Redis
        let charts: SavedChartItem[] = [];
        const supabaseProfile = await getSupabaseUserProfile(username);
        if (supabaseProfile && supabaseProfile.saved_charts && supabaseProfile.saved_charts.length > 0) {
          charts = supabaseProfile.saved_charts;
        } else {
          const rawCharts = await redis.get(`destinyvox_charts_${username}`);
          if (rawCharts) {
            charts = JSON.parse(rawCharts);
          }
        }

        charts = charts.filter(
          (c) => c.id !== input.chart.id && c.name.toLowerCase() !== input.chart.name.toLowerCase()
        );
        charts.unshift(input.chart);
        if (charts.length > 20) charts = charts.slice(0, 20);

        // Salva no Supabase e no cache Redis
        await saveSupabaseUserCharts(username, charts);
        await redis.set(`destinyvox_charts_${username}`, JSON.stringify(charts));

        return { success: true, charts };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }),

  deleteChart: publicProcedure
    .input(z.object({ chartId: z.string() }))
    .mutation(async ({ input }) => {
      const rawUsername = await reddit.getCurrentUsername();
      if (!rawUsername) {
        return { success: true, charts: [] };
      }
      const username = rawUsername.replace(/^u\//i, '').trim();

      try {
        let charts: SavedChartItem[] = [];
        const supabaseProfile = await getSupabaseUserProfile(username);
        if (supabaseProfile && supabaseProfile.saved_charts) {
          charts = supabaseProfile.saved_charts;
        } else {
          const rawCharts = await redis.get(`destinyvox_charts_${username}`);
          if (rawCharts) {
            charts = JSON.parse(rawCharts);
          }
        }

        charts = charts.filter((c) => c.id !== input.chartId);

        if (charts.length === 0) {
          await deleteSupabaseUserProfile(username).catch(() => {});
          await redis.del(`destinyvox_charts_${username}`);
          await redis.del(`destinyvox_user_${username}`);
        } else {
          await saveSupabaseUserCharts(username, charts);
          await redis.set(`destinyvox_charts_${username}`, JSON.stringify(charts));
        }

        return { success: true, charts };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }),

  checkUserExists: publicProcedure
    .input(z.object({ username: z.string().min(2) }))
    .query(async ({ input }) => {
      const cleanUser = input.username.replace(/^u\//i, '').trim();

      // 1. Checa no Supabase
      try {
        const supabaseProfile = await getSupabaseUserProfile(cleanUser);
        if (supabaseProfile && supabaseProfile.numerology_data) {
          const data = supabaseProfile.numerology_data;
          return { exists: true, username: cleanUser, profile: data.profile, archetypes: data.archetypes };
        }
      } catch {
        // ignora erro do Supabase
      }

      // 2. Checa no Redis
      try {
        const raw = await redis.get(`destinyvox_user_${cleanUser}`);
        if (raw) {
          const data = JSON.parse(raw) as CosmicReadingResult;
          return { exists: true, username: cleanUser, profile: data.profile, archetypes: data.archetypes };
        }
      } catch {
        // Ignorar erro de leitura
      }

      return { exists: false, username: cleanUser };
    }),
};
