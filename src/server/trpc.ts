import { initTRPC } from '@trpc/server';
import { transformer } from '../shared/transformer';
import { Context } from './context';
import { context, reddit, redis } from '@devvit/web/server';
import { z } from 'zod';
import {
  getOrGenerateProfile,
  askDestinyVoxOracle,
  calculateSynastryReading,
  type CosmicReadingResult,
} from './destinyVoxEngine';

/**
 * Initialization of tRPC backend
 */
const t = initTRPC.context<Context>().create({
  transformer,
});

export const router = t.router;
export const publicProcedure = t.procedure;

type SavedChartItem = {
  id: string;
  name: string;
  birthDate: string;
  data: CosmicReadingResult;
};

export const appRouter = t.router({
  destinyvox: t.router({
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
          return { exists: true, data: profileData, charts, username, isVip };
        }
      } catch {
        // Ignorar erro ao ler perfil salvo
      }
      return { exists: false, charts, username, isVip };
    }),

    setVipStatus: publicProcedure
      .input(z.object({ username: z.string(), secretKey: z.string() }))
      .mutation(async ({ input }) => {
        if (input.secretKey !== 'destinyvox_secret_vip_2026') {
          return { success: false, error: 'Chave não autorizada' };
        }
        const cleanUser = input.username.replace(/^u\//i, '').trim();
        await redis.set(`destinyvox_vip_${cleanUser}`, 'active');
        return { success: true, message: `Status VIP ativado para u/${cleanUser}!` };
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

    askOracle: publicProcedure
      .input(
        z.object({
          question: z.string().min(3),
          profile: z.custom<CosmicReadingResult['profile']>(),
          language: z.string().default('en'),
        })
      )
      .mutation(async ({ input }) => {
        const answer = await askDestinyVoxOracle(input.question, input.profile, input.language);
        return { answer };
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

    postComment: publicProcedure
      .input(
        z.object({
          commentText: z.string().min(5),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const postId = context.postId;
          if (!postId) {
            return { success: false, error: 'Post ID não encontrado.' };
          }
          const comment = await reddit.submitComment({
            id: postId,
            text: input.commentText,
          });
          return { success: true, commentId: comment.id };
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error('Erro ao postar comentário no Reddit:', errorMsg);
          return { success: false, error: errorMsg };
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

    calculateSynastry: publicProcedure
      .input(
        z.object({
          targetUsername: z.string().min(2),
          language: z.string().default('en'),
        })
      )
      .mutation(async ({ input }) => {
        const currentUsername = await reddit.getCurrentUsername();
        if (!currentUsername) {
          return { success: false, error: 'Você precisa estar logado no Reddit para calcular sinastria.' };
        }
        const targetClean = input.targetUsername.replace(/^u\//i, '').trim();

        const rawCurrent = await redis.get(`destinyvox_user_${currentUsername}`);
        if (!rawCurrent) {
          return { success: false, error: 'Você precisa primeiro calcular seu próprio mapa.' };
        }
        const currentUserData = JSON.parse(rawCurrent) as CosmicReadingResult;

        const rawTarget = await redis.get(`destinyvox_user_${targetClean}`);
        if (!rawTarget) {
          return {
            success: false,
            userNotFound: true,
            targetUsername: targetClean,
            error: `u/${targetClean} ainda não calculou suas efemérides cósmicas no DestinyVox.`,
          };
        }
        const targetUserData = JSON.parse(rawTarget) as CosmicReadingResult;

        const synastry = await calculateSynastryReading(
          currentUsername,
          currentUserData.profile,
          targetClean,
          targetUserData.profile,
          input.language
        );

        return { success: true, synastry };
      }),

    subscribeMember: publicProcedure.mutation(async () => {
      try {
        await reddit.subscribeToCurrentSubreddit();
        return { success: true };
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
