import type { NumerologyProfile, ArchetypeData } from '../../shared/numerology';

export interface CosmicReadingResult {
  profile: NumerologyProfile;
  archetypes: {
    lifePath: ArchetypeData;
    expression: ArchetypeData;
    soulUrge: ArchetypeData;
    personality: ArchetypeData;
    birthday: ArchetypeData;
    maturity: ArchetypeData;
    personalYear: ArchetypeData;
  };
  interpretation: {
    destinyOverview: string;
    hiddenTalents: string;
    shadowAndChallenges: string;
    yearlyForecast: string;
    monthlyForecast?: string | undefined;
    dailyForecast?: string | undefined;
    cosmicMotto: string;
    birthdayTalent?: string | undefined;
    maturityMission?: string | undefined;
  };
}

export interface SynastryResult {
  user1: { username: string; profile: NumerologyProfile };
  user2: { username: string; profile: NumerologyProfile };
  compatibilityScore: number;
  harmonyTitle: string;
  connectionAnalysis: string;
  strengths: string;
  challenges: string;
  cosmicAdvice: string;
}

export type GeminiPart = {
  text?: string;
};

export type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

export type GeminiApiResponse = {
  candidates?: GeminiCandidate[];
};

export type InterpretationPayload = {
  destinyOverview?: string;
  hiddenTalents?: string;
  shadowAndChallenges?: string;
  yearlyForecast?: string;
  monthlyForecast?: string;
  dailyForecast?: string;
  cosmicMotto?: string;
};

export type SynastryPayload = {
  harmonyTitle?: string;
  connectionAnalysis?: string;
  strengths?: string;
  challenges?: string;
  cosmicAdvice?: string;
};
