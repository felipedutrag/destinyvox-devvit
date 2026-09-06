import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import { calculateSynastryReading, type CosmicReadingResult } from '../../destinyVoxEngine';

export const synastryProcedures = {
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
};
