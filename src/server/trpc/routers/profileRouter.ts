import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import {
  getOrGenerateProfile,
  type CosmicReadingResult,
} from '../../destinyVoxEngine';
import { encryptUsername } from '../../core/crypto';

export type SavedChartItem = {
  id: string;
  name: string;
  birthDate: string;
  data: CosmicReadingResult;
};

export const profileProcedures = {
  getSavedProfile: publicProcedure.query(async () => {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return { exists: false, charts: [], username: '', isVip: false };
    }

    let isVip = false;
    try {
      const vipFlag = await redis.get(`destinyvox_vip_${username}`);
      isVip = vipFlag === 'active' || vipFlag === 'true';
    } catch {
      // Ignorar erro ao ler flag VIP
    }

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
        const userToken = username ? encryptUsername(username) : '';
        return { exists: true, data: profileData, charts, username, isVip, userToken };
      }
    } catch {
      // Ignorar erro ao ler perfil salvo
    }
    const userToken = username ? encryptUsername(username) : '';
    return { exists: false, charts, username, isVip, userToken };
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
    const username = await reddit.getCurrentUsername();
    if (!username) return { success: true };
    try {
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
      const username = await reddit.getCurrentUsername();
      if (!username) {
        return { success: true, charts: [input.chart] };
      }
      try {
        const rawCharts = await redis.get(`destinyvox_charts_${username}`);
        let charts: SavedChartItem[] = [];
        if (rawCharts) {
          charts = JSON.parse(rawCharts);
        }
        charts = charts.filter(
          (c) => c.id !== input.chart.id && c.name.toLowerCase() !== input.chart.name.toLowerCase()
        );
        charts.unshift(input.chart);
        if (charts.length > 20) charts = charts.slice(0, 20);
        await redis.set(`destinyvox_charts_${username}`, JSON.stringify(charts));
        return { success: true, charts };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }),

  deleteChart: publicProcedure
    .input(z.object({ chartId: z.string() }))
    .mutation(async ({ input }) => {
      const username = await reddit.getCurrentUsername();
      if (!username) {
        return { success: true, charts: [] };
      }
      try {
        const rawCharts = await redis.get(`destinyvox_charts_${username}`);
        if (rawCharts) {
          let charts: SavedChartItem[] = JSON.parse(rawCharts);
          charts = charts.filter((c) => c.id !== input.chartId);
          if (charts.length === 0) {
            await redis.del(`destinyvox_charts_${username}`);
            await redis.del(`destinyvox_user_${username}`);
          } else {
            await redis.set(`destinyvox_charts_${username}`, JSON.stringify(charts));
          }
          return { success: true, charts };
        }
        await redis.del(`destinyvox_user_${username}`);
        return { success: true, charts: [] };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }),

  checkUserExists: publicProcedure
    .input(z.object({ username: z.string().min(2) }))
    .query(async ({ input }) => {
      const cleanUser = input.username.replace(/^u\//i, '').trim();
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
