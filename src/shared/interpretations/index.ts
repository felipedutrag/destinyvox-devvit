import {
  calculatePersonalMonth,
  calculatePersonalDay,
  getSoulDictum,
  type NumerologyProfile,
} from '../numerology';
import { LIFE_PATH_INTERPRETATIONS } from './lifePath';
import { EXPRESSION_INTERPRETATIONS } from './expression';
import { SHADOW_INTERPRETATIONS } from './shadow';
import {
  YEARLY_FORECAST_INTERPRETATIONS,
  MONTHLY_FORECAST_INTERPRETATIONS,
  DAILY_FORECAST_INTERPRETATIONS,
} from './cycles';

export * from './lifePath';
export * from './expression';
export * from './shadow';
export * from './cycles';
export * from './soulUrge';
export * from './personality';

export type InterpretationLanguage = 'en' | 'pt' | 'es';

export function resolveInterpretationLang(language: string = 'en'): InterpretationLanguage {
  if (language.startsWith('pt')) return 'pt';
  if (language.startsWith('es')) return 'es';
  return 'en';
}

const MONTH_NAMES: Record<InterpretationLanguage, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

export interface CosmicInterpretation {
  destinyOverview: string;
  hiddenTalents: string;
  shadowAndChallenges: string;
  yearlyForecast: string;
  monthlyForecast: string;
  dailyForecast: string;
  cosmicMotto: string;
}

export function buildCosmicInterpretation(
  profile: NumerologyProfile,
  language: string = 'en',
  referenceDate: Date = new Date()
): CosmicInterpretation {
  const langKey = resolveInterpretationLang(language);
  const currentMonthNum = referenceDate.getMonth() + 1;
  const currentDayNum = referenceDate.getDate();

  const personalMonth = calculatePersonalMonth(profile.personalYear, currentMonthNum);
  const personalDay = calculatePersonalDay(personalMonth, currentDayNum);
  const monthName = MONTH_NAMES[langKey][currentMonthNum - 1] ?? MONTH_NAMES[langKey][0]!;

  const lpDict = LIFE_PATH_INTERPRETATIONS[langKey];
  const expDict = EXPRESSION_INTERPRETATIONS[langKey];
  const shadowDict = SHADOW_INTERPRETATIONS[langKey];
  const yearDict = YEARLY_FORECAST_INTERPRETATIONS[langKey];
  const monthDict = MONTHLY_FORECAST_INTERPRETATIONS[langKey];
  const dayDict = DAILY_FORECAST_INTERPRETATIONS[langKey];

  const destinyOverview = lpDict[profile.lifePath] || lpDict[1]!;
  const hiddenTalents = expDict[profile.expression] || expDict[1]!;
  const shadowAndChallenges = shadowDict[profile.lifePath] || shadowDict[1]!;
  const yearlyForecast = yearDict[profile.personalYear] || yearDict[1]!;
  const monthlyForecast = (monthDict[personalMonth] || monthDict[1]!)(monthName);
  const dailyForecast = dayDict[personalDay] || dayDict[1]!;
  const cosmicMotto = getSoulDictum(profile.lifePath, langKey);

  return {
    destinyOverview,
    hiddenTalents,
    shadowAndChallenges,
    yearlyForecast,
    monthlyForecast,
    dailyForecast,
    cosmicMotto,
  };
}
