import { describe, it, expect } from 'vitest';
import { calculateFullNumerology } from './numerology';
import {
  buildCosmicInterpretation,
  resolveInterpretationLang,
  LIFE_PATH_INTERPRETATIONS,
  EXPRESSION_INTERPRETATIONS,
  SHADOW_INTERPRETATIONS,
  YEARLY_FORECAST_INTERPRETATIONS,
  MONTHLY_FORECAST_INTERPRETATIONS,
  DAILY_FORECAST_INTERPRETATIONS,
} from './interpretations';

describe('Interpretations Library & Engine', () => {
  it('resolves languages correctly', () => {
    expect(resolveInterpretationLang('en')).toBe('en');
    expect(resolveInterpretationLang('en-US')).toBe('en');
    expect(resolveInterpretationLang('pt')).toBe('pt');
    expect(resolveInterpretationLang('pt-BR')).toBe('pt');
    expect(resolveInterpretationLang('es')).toBe('es');
    expect(resolveInterpretationLang('es-ES')).toBe('es');
    expect(resolveInterpretationLang('fr')).toBe('en');
  });

  it('contains entries for numbers 1-9, 11, 22, 33 in all 3 languages for core modules', () => {
    const requiredNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
    const languages = ['en', 'pt', 'es'] as const;

    for (const lang of languages) {
      for (const num of requiredNumbers) {
        const lpText = LIFE_PATH_INTERPRETATIONS[lang][num];
        expect(lpText, `Missing Life Path #${num} in ${lang}`).toBeDefined();
        expect(lpText?.split('\n\n').length).toBeGreaterThanOrEqual(3);

        const expText = EXPRESSION_INTERPRETATIONS[lang][num];
        expect(expText, `Missing Expression #${num} in ${lang}`).toBeDefined();
        expect(expText?.split('\n\n').length).toBeGreaterThanOrEqual(3);

        const shadowText = SHADOW_INTERPRETATIONS[lang][num];
        expect(shadowText, `Missing Shadow #${num} in ${lang}`).toBeDefined();
        expect(shadowText?.split('\n\n').length).toBeGreaterThanOrEqual(3);
      }

      for (let cycle = 1; cycle <= 9; cycle++) {
        expect(YEARLY_FORECAST_INTERPRETATIONS[lang][cycle], `Missing Year #${cycle} in ${lang}`).toBeDefined();
        expect(MONTHLY_FORECAST_INTERPRETATIONS[lang][cycle], `Missing Month #${cycle} in ${lang}`).toBeDefined();
        expect(DAILY_FORECAST_INTERPRETATIONS[lang][cycle], `Missing Day #${cycle} in ${lang}`).toBeDefined();
      }
    }
  });

  it('builds complete cosmic interpretation for standard profile in Portuguese', () => {
    const profile = calculateFullNumerology('Clarice Lispector', '1920-12-10');
    const interpretation = buildCosmicInterpretation(profile, 'pt-BR');

    expect(interpretation.destinyOverview).toBeTruthy();
    expect(interpretation.destinyOverview.split('\n\n').length).toBe(3);

    expect(interpretation.hiddenTalents).toBeTruthy();
    expect(interpretation.hiddenTalents.split('\n\n').length).toBe(3);

    expect(interpretation.shadowAndChallenges).toBeTruthy();
    expect(interpretation.shadowAndChallenges.split('\n\n').length).toBe(3);

    expect(interpretation.yearlyForecast).toBeTruthy();
    expect(interpretation.monthlyForecast).toBeTruthy();
    expect(interpretation.dailyForecast).toBeTruthy();
    expect(interpretation.cosmicMotto).toBeTruthy();
  });

  it('builds complete cosmic interpretation for master numbers in English', () => {
    const profile = calculateFullNumerology('Leonardo da Vinci', '1452-04-15');
    const interpretation = buildCosmicInterpretation(profile, 'en');

    expect(interpretation.destinyOverview).toBeTruthy();
    expect(interpretation.hiddenTalents).toBeTruthy();
    expect(interpretation.shadowAndChallenges).toBeTruthy();
    expect(interpretation.yearlyForecast).toBeTruthy();
    expect(interpretation.cosmicMotto).toBeTruthy();
  });

  it('builds complete cosmic interpretation in Spanish', () => {
    const profile = calculateFullNumerology('Jorge Luis Borges', '1899-08-24');
    const interpretation = buildCosmicInterpretation(profile, 'es');

    expect(interpretation.destinyOverview).toBeTruthy();
    expect(interpretation.hiddenTalents).toBeTruthy();
    expect(interpretation.shadowAndChallenges).toBeTruthy();
    expect(interpretation.yearlyForecast).toBeTruthy();
    expect(interpretation.cosmicMotto).toBeTruthy();
  });
});
