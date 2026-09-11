import { redis } from '@devvit/web/server';
import {
  calculateFullNumerology,
  getArchetype,
  type NumerologyProfile,
} from '../../shared/numerology';
import { buildCosmicInterpretation } from '../../shared/interpretations';
import type { CosmicReadingResult } from './types';
import { notifyTelegramNewChart } from './notifications';
import { saveSupabaseUserProfile } from '../core/supabase';

/**
 * Gera a leitura e interpretação numerológica profunda a partir da biblioteca enciclopédica local,
 * sem requisição externa a IA, garantindo execução instantânea (<10ms), alta densidade literária
 * e disponibilidade total offline nos 3 idiomas (EN, PT, ES).
 */
export function generateNumerologyReading(
  profile: NumerologyProfile,
  language: string = 'en'
): CosmicReadingResult['interpretation'] {
  return buildCosmicInterpretation(profile, language);
}

// Alias assíncrono retrocompatível
export async function generateGeminiNumerologyReading(
  profile: NumerologyProfile,
  language: string = 'en'
): Promise<CosmicReadingResult['interpretation']> {
  return buildCosmicInterpretation(profile, language);
}

export async function getOrGenerateProfile(
  username: string,
  fullName: string,
  birthDate: string,
  language: string = 'en'
): Promise<CosmicReadingResult> {
  const profile = calculateFullNumerology(fullName, birthDate);
  const langKey = (language.startsWith('pt') ? 'pt' : language.startsWith('es') ? 'es' : 'en') as 'en' | 'pt' | 'es';

  const archetypes = {
    lifePath: getArchetype(profile.lifePath, langKey),
    expression: getArchetype(profile.expression, langKey),
    soulUrge: getArchetype(profile.soulUrge, langKey),
    personality: getArchetype(profile.personality, langKey),
    personalYear: getArchetype(profile.personalYear, langKey),
  };

  const interpretation = buildCosmicInterpretation(profile, language);

  const result: CosmicReadingResult = {
    profile,
    archetypes,
    interpretation,
  };

  if (username) {
    // 1. Persistência permanente no Supabase
    saveSupabaseUserProfile(username, {
      fullName,
      birthDate,
      language,
      numerologyData: result,
      savedCharts: [
        {
          id: 'primary',
          name: profile.fullName,
          birthDate: profile.birthDate,
          data: result,
        },
      ],
    }).catch((err) => console.error('[Supabase] Erro ao salvar mapa numerológico:', err));

    // 2. Cache no Redis e contadores estatísticos
    try {
      await redis.set(`destinyvox_user_${username}`, JSON.stringify(result));
      await redis.incrBy(`destinyvox_stat_lp_${profile.lifePath}`, 1);
    } catch (err) {
      console.error('Erro ao salvar no Redis:', err);
    }
    notifyTelegramNewChart(username, result).catch(() => {});
  }

  return result;
}
