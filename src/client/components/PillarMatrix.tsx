import React from 'react';
import type { SupportedLang } from '../i18n';

export type PillarId = 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'personalYear';

interface PillarMatrixProps {
  profile: {
    lifePath: number;
    expression: number;
    soulUrge: number;
    personality: number;
    personalYear: number;
  };
  selectedPillar: PillarId;
  activeTab: string;
  lang: SupportedLang;
  onSelectPillar: (pillar: PillarId) => void;
  t: {
    pillarLifePath: string;
    pillarExpression: string;
    pillarSoulUrge: string;
    pillarPersonality: string;
    pillarPersonalYear: string;
  };
}

export const PillarMatrix: React.FC<PillarMatrixProps> = ({
  profile,
  selectedPillar,
  activeTab,
  lang: _lang,
  onSelectPillar,
  t,
}) => {
  const pillars: Array<{
    id: PillarId;
    label: string;
    number: number;
  }> = [
    { id: 'lifePath', label: t.pillarLifePath, number: profile.lifePath },
    { id: 'expression', label: t.pillarExpression, number: profile.expression },
    { id: 'soulUrge', label: t.pillarSoulUrge, number: profile.soulUrge },
    { id: 'personality', label: t.pillarPersonality, number: profile.personality },
    { id: 'personalYear', label: t.pillarPersonalYear, number: profile.personalYear },
  ];

  return (
    <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] z-20 shadow-xs">
      <div className="max-w-3xl mx-auto grid grid-cols-5 divide-x divide-[var(--border-subtle)] text-center">
        {pillars.map((pillar) => {
          const isSelected = activeTab === 'overview' && selectedPillar === pillar.id;
          return (
            <button
              key={pillar.id}
              type="button"
              onClick={() => onSelectPillar(pillar.id)}
              className={`py-2 px-1 sm:py-2.5 sm:px-2 transition-all duration-150 cursor-pointer text-center relative flex flex-col items-center justify-center ${
                isSelected
                  ? 'bg-[var(--bg-card-alt)]'
                  : 'hover:bg-[var(--bg-card-alt)]/70 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Número de destaque proporcional e sofisticado */}
              <span
                className={`font-editorial text-lg sm:text-2xl font-normal leading-none tracking-tight transition-transform duration-150 ${
                  isSelected
                    ? 'text-[var(--text-main)] font-medium scale-105'
                    : 'text-[var(--text-main)]'
                }`}
              >
                {pillar.number}
              </span>

              {/* Rótulo tipográfico mono, enxuto e sem truncamento */}
              <span
                className={`font-mono text-[8.5px] sm:text-[10px] tracking-wider uppercase mt-1 block truncate max-w-full leading-tight ${
                  isSelected
                    ? 'text-[var(--accent-gold)] font-bold'
                    : 'text-[var(--text-subtle)]'
                }`}
              >
                {pillar.label}
              </span>

              {/* Indicador de foco dourado sutil e limpo */}
              {isSelected && (
                <span className="absolute bottom-0 left-2 right-2 sm:left-4 sm:right-4 h-[2px] bg-[var(--accent-gold)] rounded-full animate-in fade-in duration-150" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
};
