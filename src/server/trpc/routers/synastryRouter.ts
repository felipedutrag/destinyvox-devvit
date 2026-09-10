import { z } from 'zod';
import { reddit, redis } from '@devvit/web/server';
import { publicProcedure } from '../init';
import { calculateSynastryReading, type CosmicReadingResult } from '../../destinyVoxEngine';
import { getSupabaseUserProfile } from '../../core/supabase';

async function getUserReading(username: string): Promise<CosmicReadingResult | null> {
  const clean = username.replace(/^u\//i, '').trim();

  // 1. Supabase (persistente)
  try {
    const profile = await getSupabaseUserProfile(clean);
    if (profile && profile.numerology_data) {
      return profile.numerology_data;
    }
  } catch {
    // ignora erro do Supabase
  }

  // 2. Redis (cache)
  try {
    const raw = await redis.get(`destinyvox_user_${clean}`);
    if (raw) {
      return JSON.parse(raw) as CosmicReadingResult;
    }
  } catch {
    // ignora erro do Redis
  }

  return null;
}

export const synastryProcedures = {
  calculateSynastry: publicProcedure
    .input(
      z.object({
        targetUsername: z.string().min(2),
        language: z.string().default('en'),
      })
    )
    .mutation(async ({ input }) => {
      const rawCurrent = await reddit.getCurrentUsername();
      if (!rawCurrent) {
        return { success: false, error: 'Você precisa estar logado no Reddit para calcular sinastria.' };
      }
      const currentUsername = rawCurrent.replace(/^u\//i, '').trim();
      const targetClean = input.targetUsername.replace(/^u\//i, '').trim();

      const currentUserData = await getUserReading(currentUsername);
      if (!currentUserData) {
        return { success: false, error: 'Você precisa primeiro calcular seu próprio mapa.' };
      }

      const targetUserData = await getUserReading(targetClean);
      if (!targetUserData) {
        return {
          success: false,
          userNotFound: true,
          targetUsername: targetClean,
          error: `u/${targetClean} ainda não calculou suas coordenadas cósmicas no DestinyVox.`,
        };
      }

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
