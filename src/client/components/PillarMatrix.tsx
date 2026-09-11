import React, { useRef, useEffect } from 'react';
import type { SupportedLang } from '../i18n';

export type PillarId =
  | 'lifePath'
  | 'expression'
  | 'soulUrge'
  | 'personality'
  | 'birthday'
  | 'maturity'
  | 'personalYear';

interface PillarMatrixProps {
  profile: {
    lifePath: number;
    expression: number;
    soulUrge: number;
    personality: number;
    birthday?: number;
    maturity?: number;
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
    pillarBirthday: string;
    pillarMaturity: string;
    pillarPersonalYear: string;
  };
}

export const PillarMatrix: React.FC<PillarMatrixProps> = ({
  profile,
  selectedPillar,
  activeTab,
  lang,
  onSelectPillar,
  t,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const pillars: Array<{
    id: PillarId;
    label: string;
    tag: string;
    number: number;
  }> = [
    {
      id: 'lifePath',
      label: t.pillarLifePath,
      tag: lang === 'en' ? 'PATH' : lang === 'es' ? 'DESTINO' : 'DESTINO',
      number: profile.lifePath,
    },
    {
      id: 'expression',
      label: t.pillarExpression,
      tag: lang === 'en' ? 'MISSION' : lang === 'es' ? 'MISIÓN' : 'MISSÃO',
      number: profile.expression,
    },
    {
      id: 'soulUrge',
      label: t.pillarSoulUrge,
      tag: lang === 'en' ? 'SOUL' : lang === 'es' ? 'ALMA' : 'ALMA',
      number: profile.soulUrge,
    },
    {
      id: 'personality',
      label: t.pillarPersonality,
      tag: lang === 'en' ? 'AURA' : lang === 'es' ? 'AURA' : 'AURA',
      number: profile.personality,
    },
    {
      id: 'birthday',
      label: t.pillarBirthday,
      tag: lang === 'en' ? 'TALENT' : lang === 'es' ? 'DON NATO' : 'DOM NATO',
      number: profile.birthday ?? 1,
    },
    {
      id: 'maturity',
      label: t.pillarMaturity,
      tag: lang === 'en' ? 'GOAL' : lang === 'es' ? 'MADUREZ' : 'MATURIDADE',
      number: profile.maturity ?? 1,
    },
    {
      id: 'personalYear',
      label: t.pillarPersonalYear,
      tag: lang === 'en' ? 'CYCLE' : lang === 'es' ? 'CICLO' : 'CICLO',
      number: profile.personalYear,
    },
  ];

  // Auto-centraliza o pilar selecionado no carrossel
  useEffect(() => {
    if (!scrollRef.current) return;
    const selectedEl = scrollRef.current.querySelector<HTMLElement>(`[data-pillar-id="${selectedPillar}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedPillar]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-card)] z-10 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-3xl mx-auto relative flex items-center w-full min-w-0 overflow-hidden">
        {/* Botão de Scroll Esquerda (Desktop/Tablet) */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
          className="hidden sm:flex absolute left-1 z-30 w-6 h-6 items-center justify-center rounded-full bg-[var(--bg-main)]/90 border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] transition-colors shadow-sm cursor-pointer"
        >
          <span className="leading-none text-xs font-bold">‹</span>
        </button>

        {/* Trilho de Scroll do Carrossel */}
        <div
          ref={scrollRef}
          className="w-full min-w-0 flex-1 flex items-stretch gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar scroll-smooth px-2.5 sm:px-9 py-2 sm:py-2.5 snap-x snap-mandatory select-none"
        >
          {pillars.map((pillar) => {
            const isSelected = activeTab === 'overview' && selectedPillar === pillar.id;
            return (
              <button
                key={pillar.id}
                data-pillar-id={pillar.id}
                type="button"
                onClick={() => onSelectPillar(pillar.id)}
                className={`flex-shrink-0 w-[92px] sm:w-[104px] md:w-[108px] snap-center py-2 px-1.5 sm:py-2.5 sm:px-2 rounded transition-all duration-150 cursor-pointer text-center relative flex flex-col items-center justify-between ${
                  isSelected
                    ? 'bg-[var(--bg-card-alt)] border-[0.75px] border-[var(--accent-gold)] shadow-none'
                    : 'bg-[var(--bg-main)] border-[0.75px] border-[var(--border-subtle)] hover:border-[var(--border-main)] hover:bg-[var(--bg-card-alt)]/60 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Tag de categoria superior */}
                <span
                  className={`font-mono text-[7px] sm:text-[8px] tracking-widest uppercase block truncate max-w-full leading-tight ${
                    isSelected
                      ? 'text-[var(--accent-gold)] font-semibold'
                      : 'text-[var(--text-subtle)]'
                  }`}
                >
                  {pillar.tag}
                </span>

                {/* Número editorial principal */}
                <span
                  className={`font-editorial text-xl sm:text-2xl my-0.5 font-normal leading-none tracking-tight transition-transform duration-150 ${
                    isSelected
                      ? 'text-[var(--text-main)] font-semibold scale-105'
                      : 'text-[var(--text-main)]'
                  }`}
                >
                  {pillar.number}
                </span>

                {/* Rótulo descritivo do pilar */}
                <span
                  className={`font-mono text-[8px] sm:text-[9.5px] tracking-wider uppercase block truncate max-w-full leading-tight ${
                    isSelected
                      ? 'text-[var(--text-main)] font-bold'
                      : 'text-[var(--text-subtle)]'
                  }`}
                >
                  {pillar.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Botão de Scroll Direita (Desktop/Tablet) */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
          className="hidden sm:flex absolute right-1 z-30 w-6 h-6 items-center justify-center rounded-full bg-[var(--bg-main)]/90 border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] transition-colors shadow-sm cursor-pointer"
        >
          <span className="leading-none text-xs font-bold">›</span>
        </button>
      </div>
    </section>
  );
};
