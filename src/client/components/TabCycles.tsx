import React from 'react';
import type { SupportedLang } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { calculatePersonalMonth, calculatePersonalDay, getArchetype } from '../../shared/numerology';
import {
  dayInterpretationsByLang,
  monthInterpretationsByLang,
  monthNamesByLang,
} from '../i18n';
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
  const personalMonth = calculatePersonalMonth(profile.personalYear, currentMonthNum);
  const personalDay = calculatePersonalDay(personalMonth, currentDayNum);

  const currentMonthName = monthNamesByLang[lang][currentMonthNum - 1] || 'Current';
  const dayArch = getArchetype(personalDay, lang);
  const monthArch = getArchetype(personalMonth, lang);
  const yearArch = getArchetype(profile.personalYear, lang);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. DIA PESSOAL (PRIMEIRO) */}
      <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
        <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
          <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
            {t.dailyCycleBadge(currentDayNum, currentMonthName)}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
            {t.personalDayTitle(personalDay, dayArch.title)}
          </h3>
        </div>

        <p className="font-editorial text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-normal">
          {interpretation.dailyForecast || dayInterpretationsByLang[lang][personalDay] || dayInterpretationsByLang.en[1]}
        </p>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {dayArch.keywords.map((kw, i) => (
            <span
              key={i}
              className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 2. MES PESSOAL (SEGUNDO) */}
      <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
        <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
          <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
            {t.monthlyCycleBadge(currentMonthName)}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
            {t.personalMonthTitle(personalMonth, monthArch.title)}
          </h3>
        </div>

        <p className="font-editorial text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-normal">
          {interpretation.monthlyForecast || (monthInterpretationsByLang[lang]?.[personalMonth]?.(currentMonthName) ?? monthInterpretationsByLang.en[1]!(currentMonthName))}
        </p>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {monthArch.keywords.map((kw, i) => (
            <span
              key={i}
              className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 3. ANO PESSOAL (TERCEIRO) */}
      <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
        <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
          <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
            {t.annualCycleBadge(currentYear)}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
            {t.personalYearTitle(profile.personalYear, yearArch.title)}
          </h3>
        </div>

        <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] font-normal">
          {renderParagraphs(interpretation.yearlyForecast)}
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {yearArch.keywords.map((kw, i) => (
            <span
              key={i}
              className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
