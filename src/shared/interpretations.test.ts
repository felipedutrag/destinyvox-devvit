import { describe, it, expect } from 'vitest';
import {
  calculateFullNumerology,
  calculateBirthday,
  calculateMaturity,
  getSoulUrgeDeep,
  getPersonalityDeep,
  getBirthdayDeep,
  getMaturityDeep,
} from './numerology';
import {
  buildCosmicInterpretation,
  resolveInterpretationLang,
  LIFE_PATH_INTERPRETATIONS,
  EXPRESSION_INTERPRETATIONS,
  SHADOW_INTERPRETATIONS,
  SOUL_URGE_INTERPRETATIONS,
  PERSONALITY_INTERPRETATIONS,
  BIRTHDAY_INTERPRETATIONS,
  MATURITY_INTERPRETATIONS,
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

  it('contains entries for all 7 pillars + shadows (1-9, 11, 22, 33) in all 3 languages', () => {
    const requiredNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
    const languages = ['en', 'pt', 'es'] as const;

    for (const lang of languages) {
      for (const num of requiredNumbers) {
        // 1. Life Path
        const lpText = LIFE_PATH_INTERPRETATIONS[lang][num];
        expect(lpText, `Missing Life Path #${num} in ${lang}`).toBeDefined();
        expect(lpText?.split('\n\n').length).toBeGreaterThanOrEqual(3);

        // 2. Expression
        const expText = EXPRESSION_INTERPRETATIONS[lang][num];
        expect(expText, `Missing Expression #${num} in ${lang}`).toBeDefined();
        expect(expText?.split('\n\n').length).toBeGreaterThanOrEqual(3);

        // 3. Shadow
        const shadowText = SHADOW_INTERPRETATIONS[lang][num];
        expect(shadowText, `Missing Shadow #${num} in ${lang}`).toBeDefined();
        expect(shadowText?.split('\n\n').length).toBeGreaterThanOrEqual(3);

        // 4. Soul Urge
        const soulText = SOUL_URGE_INTERPRETATIONS[lang][num];
        expect(soulText, `Missing Soul Urge #${num} in ${lang}`).toBeDefined();
        expect(soulText?.split('\n\n').length).toBeGreaterThanOrEqual(3);
        expect(getSoulUrgeDeep(num, lang)).toBe(soulText);

        // 5. Personality
        const personaText = PERSONALITY_INTERPRETATIONS[lang][num];
        expect(personaText, `Missing Personality #${num} in ${lang}`).toBeDefined();
        expect(personaText?.split('\n\n').length).toBeGreaterThanOrEqual(3);
        expect(getPersonalityDeep(num, lang)).toBe(personaText);

        // 6. Birthday Number
        const bdayText = BIRTHDAY_INTERPRETATIONS[lang][num];
        expect(bdayText, `Missing Birthday #${num} in ${lang}`).toBeDefined();
        expect(bdayText?.split('\n\n').length).toBeGreaterThanOrEqual(3);
        expect(getBirthdayDeep(num, lang)).toBe(bdayText);

        // 7. Maturity Number
        const matText = MATURITY_INTERPRETATIONS[lang][num];
        expect(matText, `Missing Maturity #${num} in ${lang}`).toBeDefined();
        expect(matText?.split('\n\n').length).toBeGreaterThanOrEqual(3);
        expect(getMaturityDeep(num, lang)).toBe(matText);
      }

      // Temporal Cycles (1-9)
      for (let cycle = 1; cycle <= 9; cycle++) {
        expect(YEARLY_FORECAST_INTERPRETATIONS[lang][cycle], `Missing Year #${cycle} in ${lang}`).toBeDefined();
        expect(MONTHLY_FORECAST_INTERPRETATIONS[lang][cycle], `Missing Month #${cycle} in ${lang}`).toBeDefined();
        expect(DAILY_FORECAST_INTERPRETATIONS[lang][cycle], `Missing Day #${cycle} in ${lang}`).toBeDefined();
      }
    }
  });

  it('calculates Birthday and Maturity numbers accurately', () => {
    // 1920-12-10 -> Day 10 -> 1+0 = 1
    expect(calculateBirthday('1920-12-10')).toBe(1);
    // Born on 22nd -> Master 22
    expect(calculateBirthday('1985-05-22')).toBe(22);
    // Born on 11th -> Master 11
    expect(calculateBirthday('1990-11-11')).toBe(11);
    // Born on 29th -> 2+9 = 11 (Master)
    expect(calculateBirthday('1992-03-29')).toBe(11);
    // Born on 14th -> 1+4 = 5
    expect(calculateBirthday('1988-07-14')).toBe(5);

    // Maturity = Life Path + Expression
    expect(calculateMaturity(7, 4)).toBe(11);
    expect(calculateMaturity(1, 8)).toBe(9);
    expect(calculateMaturity(11, 22)).toBe(33);
  });

  it('builds complete cosmic interpretation for standard profile in Portuguese', () => {
    const profile = calculateFullNumerology('Clarice Lispector', '1920-12-10');
    expect(profile.birthday).toBe(1);
    expect(profile.maturity).toBeDefined();

    const interpretation = buildCosmicInterpretation(profile, 'pt-BR');

    expect(interpretation.destinyOverview).toBeTruthy();
    expect(interpretation.destinyOverview.split('\n\n').length).toBe(6);

    expect(interpretation.hiddenTalents).toBeTruthy();
    expect(interpretation.hiddenTalents.split('\n\n').length).toBe(6);

    expect(interpretation.shadowAndChallenges).toBeTruthy();
    expect(interpretation.shadowAndChallenges.split('\n\n').length).toBe(6);

    expect(interpretation.yearlyForecast).toBeTruthy();
    expect(interpretation.monthlyForecast).toBeTruthy();
    expect(interpretation.dailyForecast).toBeTruthy();
    expect(interpretation.cosmicMotto).toBeTruthy();
    expect(interpretation.birthdayTalent).toBeTruthy();
    expect(interpretation.maturityMission).toBeTruthy();
  });

  it('builds complete cosmic interpretation for master numbers in English', () => {
    const profile = calculateFullNumerology('Leonardo da Vinci', '1452-04-15');
    const interpretation = buildCosmicInterpretation(profile, 'en');

    expect(interpretation.destinyOverview).toBeTruthy();
    expect(interpretation.hiddenTalents).toBeTruthy();
    expect(interpretation.shadowAndChallenges).toBeTruthy();
    expect(interpretation.yearlyForecast).toBeTruthy();
    expect(interpretation.cosmicMotto).toBeTruthy();
    expect(interpretation.birthdayTalent).toBeTruthy();
    expect(interpretation.maturityMission).toBeTruthy();
  });

  it('builds complete cosmic interpretation in Spanish', () => {
    const profile = calculateFullNumerology('Jorge Luis Borges', '1899-08-24');
    const interpretation = buildCosmicInterpretation(profile, 'es');

    expect(interpretation.destinyOverview).toBeTruthy();
    expect(interpretation.hiddenTalents).toBeTruthy();
    expect(interpretation.shadowAndChallenges).toBeTruthy();
    expect(interpretation.yearlyForecast).toBeTruthy();
    expect(interpretation.cosmicMotto).toBeTruthy();
    expect(interpretation.birthdayTalent).toBeTruthy();
    expect(interpretation.maturityMission).toBeTruthy();
  });

  it('personalizes all English interpretations with the first name and leaves no leftover {name} tags', () => {
    const profile = calculateFullNumerology('Marie Curie', '1867-11-07');
    const interpretation = buildCosmicInterpretation(profile, 'en');

    // First name should be "Marie"
    expect(interpretation.destinyOverview).toContain('Marie');
    expect(interpretation.destinyOverview).not.toContain('{name}');

    expect(interpretation.hiddenTalents).toContain('Marie');
    expect(interpretation.hiddenTalents).not.toContain('{name}');

    expect(interpretation.shadowAndChallenges).toContain('Marie');
    expect(interpretation.shadowAndChallenges).not.toContain('{name}');

    expect(interpretation.yearlyForecast).toContain('Marie');
    expect(interpretation.yearlyForecast).not.toContain('{name}');

    expect(interpretation.monthlyForecast).toContain('Marie');
    expect(interpretation.monthlyForecast).not.toContain('{name}');

    expect(interpretation.dailyForecast).toContain('Marie');
    expect(interpretation.dailyForecast).not.toContain('{name}');

    const soulUrge = getSoulUrgeDeep(profile.soulUrge, 'en', profile.fullName);
    expect(soulUrge).toContain('Marie');
    expect(soulUrge).not.toContain('{name}');

    const personality = getPersonalityDeep(profile.personality, 'en', profile.fullName);
    expect(personality).toContain('Marie');
    expect(personality).not.toContain('{name}');

    const birthday = getBirthdayDeep(profile.birthday, 'en', profile.fullName);
    expect(birthday).not.toContain('{name}');

    const maturity = getMaturityDeep(profile.maturity, 'en', profile.fullName);
    expect(maturity).not.toContain('{name}');
  });

  it('verifies that every single English interpretation contains {name}', () => {
    const requiredNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

    for (const num of requiredNumbers) {
      expect(LIFE_PATH_INTERPRETATIONS.en[num], `Life Path #${num} en`).toContain('{name}');
      expect(EXPRESSION_INTERPRETATIONS.en[num], `Expression #${num} en`).toContain('{name}');
      expect(SHADOW_INTERPRETATIONS.en[num], `Shadow #${num} en`).toContain('{name}');
      expect(SOUL_URGE_INTERPRETATIONS.en[num], `Soul Urge #${num} en`).toContain('{name}');
      expect(PERSONALITY_INTERPRETATIONS.en[num], `Personality #${num} en`).toContain('{name}');
    }

    for (let c = 1; c <= 9; c++) {
      expect(YEARLY_FORECAST_INTERPRETATIONS.en[c], `Yearly #${c} en`).toContain('{name}');
      expect(MONTHLY_FORECAST_INTERPRETATIONS.en[c]!('April'), `Monthly #${c} en`).toContain('{name}');
      expect(DAILY_FORECAST_INTERPRETATIONS.en[c], `Daily #${c} en`).toContain('{name}');
    }
  });
});
