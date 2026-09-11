import React from 'react';
import type { SupportedLang } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import {
  calculatePersonalYear,
  calculatePersonalMonth,
  calculatePersonalDay,
  getArchetype,
} from '../../shared/numerology';
import {
  DAILY_FORECAST_INTERPRETATIONS,
  MONTHLY_FORECAST_INTERPRETATIONS,
  YEARLY_FORECAST_INTERPRETATIONS,
  interpolateFirstName,
} from '../../shared/interpretations';
import { monthNamesByLang } from '../i18n';
import { renderParagraphs } from './renderParagraphs';

interface TabCyclesProps {
  profile: CosmicReadingResult['profile'];
  interpretation: CosmicReadingResult['interpretation'];
  lang: SupportedLang;
  t: {
    dailyCycleBadge: (day: number, monthName: string) => string;
    personalDayTitle: (num: number, title: string) => string;
    monthlyCycleBadge: (monthName: string) => string;
    personalMonthTitle: (num: number, title: string) => string;
    annualCycleBadge: (year: number) => string;
    personalYearTitle: (num: number, title: string) => string;
  };
}

export const TabCycles: React.FC<TabCyclesProps> = ({
  profile,
  interpretation,
  lang,
  t,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentDayNum = now.getDate();
  const currentPersonalYear = profile.birthDate
    ? calculatePersonalYear(profile.birthDate, currentYear)
    : profile.personalYear;
  const personalMonth = calculatePersonalMonth(currentPersonalYear, currentMonthNum);
  const personalDay = calculatePersonalDay(personalMonth, currentDayNum);

  const currentMonthName = monthNamesByLang[lang]?.[currentMonthNum - 1] || 'Current';
  const dayArch = getArchetype(personalDay, lang);
  const monthArch = getArchetype(personalMonth, lang);
  const yearArch = getArchetype(currentPersonalYear, lang);

  const rawDaily =
    DAILY_FORECAST_INTERPRETATIONS[lang]?.[personalDay] ||
    DAILY_FORECAST_INTERPRETATIONS.en[personalDay] ||
    interpretation.dailyForecast ||
    '';
  const dailyText = interpolateFirstName(rawDaily, profile.fullName);

  const monthlyFn =
    MONTHLY_FORECAST_INTERPRETATIONS[lang]?.[personalMonth] ||
    MONTHLY_FORECAST_INTERPRETATIONS.en[personalMonth];
  const rawMonthly =
    (monthlyFn ? monthlyFn(currentMonthName) : interpretation.monthlyForecast) || '';
  const monthlyText = interpolateFirstName(rawMonthly, profile.fullName);

  const rawYearly =
    YEARLY_FORECAST_INTERPRETATIONS[lang]?.[currentPersonalYear] ||
    YEARLY_FORECAST_INTERPRETATIONS.en[currentPersonalYear] ||
    interpretation.yearlyForecast ||
    '';
  const yearlyText = interpolateFirstName(rawYearly, profile.fullName);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. DIA PESSOAL (PRIMEIRO) */}
      <div className="border border-[var(--border-main)] p-5 sm:p-7 md:p-8 bg-[var(--bg-card)] space-y-5">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[11px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium">
            {t.dailyCycleBadge(currentDayNum, currentMonthName)}
          </span>
          <h3 className="font-editorial text-xl sm:text-2xl md:text-3xl text-[var(--text-main)] font-normal tracking-tight">
            {t.personalDayTitle(personalDay, dayArch.title)}
          </h3>
        </div>

        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-normal leading-relaxed">
          {renderParagraphs(dailyText)}
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {dayArch.keywords.map((kw, i) => (
            <span
              key={i}
              className="font-mono text-[10px] sm:text-xs tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-1 text-[var(--text-subtle)] font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 2. MES PESSOAL (SEGUNDO) */}
      <div className="border border-[var(--border-main)] p-5 sm:p-7 md:p-8 bg-[var(--bg-card)] space-y-5">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[11px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium">
            {t.monthlyCycleBadge(currentMonthName)}
          </span>
          <h3 className="font-editorial text-xl sm:text-2xl md:text-3xl text-[var(--text-main)] font-normal tracking-tight">
            {t.personalMonthTitle(personalMonth, monthArch.title)}
          </h3>
        </div>

        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-normal leading-relaxed">
          {renderParagraphs(monthlyText)}
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {monthArch.keywords.map((kw, i) => (
            <span
              key={i}
              className="font-mono text-[10px] sm:text-xs tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-1 text-[var(--text-subtle)] font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 3. ANO PESSOAL (TERCEIRO) */}
      <div className="border border-[var(--border-main)] p-5 sm:p-7 md:p-8 bg-[var(--bg-card)] space-y-5">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[11px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium">
            {t.annualCycleBadge(currentYear)}
          </span>
          <h3 className="font-editorial text-xl sm:text-2xl md:text-3xl text-[var(--text-main)] font-normal tracking-tight">
            {t.personalYearTitle(currentPersonalYear, yearArch.title)}
          </h3>
        </div>

        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-normal leading-relaxed">
          {renderParagraphs(yearlyText)}
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {yearArch.keywords.map((kw, i) => (
            <span
              key={i}
              className="font-mono text-[10px] sm:text-xs tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-1 text-[var(--text-subtle)] font-medium"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
