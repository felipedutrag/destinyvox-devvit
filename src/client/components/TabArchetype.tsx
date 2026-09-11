import React from 'react';
import type { SupportedLang } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { getArchetype, getSoulDictum, getSoulUrgeDeep, getPersonalityDeep } from '../../shared/numerology';
import { renderParagraphs } from './renderParagraphs';
import type { PillarId } from './PillarMatrix';

interface TabArchetypeProps {
  profile: CosmicReadingResult['profile'];
  interpretation: CosmicReadingResult['interpretation'];
  selectedPillar: PillarId;
  lang: SupportedLang;
  t: {
    dictumBadge: string;
    pillar01Badge: string;
    pillar02Badge: string;
    pillar03Badge: string;
    pillar04Badge: string;
    pillar05Badge: (year: number) => string;
    archWord: string;
    yearVibrationWord: string;
    lifePathExplanation: (num: number) => string;
    lifePathPurposeLabel: string;
    expressionExplanation: (num: number) => string;
    expressionGiftsLabel: string;
    soulUrgeExplanation: (num: number) => string;
    soulUrgeMotivationLabel: string;
    soulUrgeMotivationText: (title: string, keywords: string) => string;
    personalityExplanation: (num: number) => string;
    personalityAuricLabel: string;
    personalityAuricText: (title: string, keywords: string) => string;
    personalYearExplanation: (year: number, num: number) => string;
    personalYearDirectiveLabel: string;
  };
}

export const TabArchetype: React.FC<TabArchetypeProps> = ({
  profile,
  interpretation,
  selectedPillar,
  lang,
  t,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* O Ditame / Mantra Co-Star */}
      <div className="border border-[var(--border-main)] p-4 sm:p-6 bg-[var(--bg-card)] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-block font-mono text-[9px] sm:text-[11px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium">
            {t.dictumBadge} #{profile[selectedPillar]}
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-[var(--text-subtle)] tracking-wider">
            {getArchetype(profile[selectedPillar], lang).title.split('/')[0]}
          </span>
        </div>
        <blockquote className="font-editorial italic text-base sm:text-lg md:text-xl text-[var(--text-main)] leading-relaxed">
          &ldquo;{selectedPillar === 'lifePath' ? (interpretation.cosmicMotto || getSoulDictum(profile.lifePath, lang)) : getSoulDictum(profile[selectedPillar], lang)}&rdquo;
        </blockquote>
      </div>

      {/* Texto Editorial do Pilar Selecionado (Destino, Expressao, Alma, Exterior ou Ano) */}
      <div className="border border-[var(--border-subtle)] p-5 sm:p-7 md:p-8 space-y-5 bg-[var(--bg-card-alt)]">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[11px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium">
            {selectedPillar === 'lifePath' && t.pillar01Badge}
            {selectedPillar === 'expression' && t.pillar02Badge}
            {selectedPillar === 'soulUrge' && t.pillar03Badge}
            {selectedPillar === 'personality' && t.pillar04Badge}
            {selectedPillar === 'personalYear' && t.pillar05Badge(new Date().getFullYear())}
          </span>
          <h3 className="font-editorial text-xl sm:text-2xl md:text-3xl text-[var(--text-main)] font-normal tracking-tight">
            {selectedPillar === 'lifePath' && `${t.archWord} #${profile.lifePath}: ${getArchetype(profile.lifePath, lang).title}`}
            {selectedPillar === 'expression' && `${t.archWord} #${profile.expression}: ${getArchetype(profile.expression, lang).title}`}
            {selectedPillar === 'soulUrge' && `${t.archWord} #${profile.soulUrge}: ${getArchetype(profile.soulUrge, lang).title}`}
            {selectedPillar === 'personality' && `${t.archWord} #${profile.personality}: ${getArchetype(profile.personality, lang).title}`}
            {selectedPillar === 'personalYear' && `${t.yearVibrationWord} #${profile.personalYear}: ${getArchetype(profile.personalYear, lang).title}`}
          </h3>
        </div>

        {/* Conteudo especifico conforme o pilar clicado */}
        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] leading-relaxed space-y-4 font-normal">
          {selectedPillar === 'lifePath' && (
            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl">{t.lifePathExplanation(profile.lifePath)}</p>
              <div className="p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                  {t.lifePathPurposeLabel}
                </span>
                <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl leading-relaxed">
                  {renderParagraphs(interpretation.destinyOverview)}
                </div>
              </div>
            </div>
          )}

          {selectedPillar === 'expression' && (
            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl">{t.expressionExplanation(profile.expression)}</p>
              <div className="p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                  {t.expressionGiftsLabel}
                </span>
                <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl leading-relaxed">
                  {renderParagraphs(interpretation.hiddenTalents)}
                </div>
              </div>
            </div>
          )}

          {selectedPillar === 'soulUrge' && (
            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl">{t.soulUrgeExplanation(profile.soulUrge)}</p>
              <div className="p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                  {t.soulUrgeMotivationLabel}
                </span>
                <p className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl font-medium">
                  {t.soulUrgeMotivationText(
                    getArchetype(profile.soulUrge, lang).title.split('/')[0] ?? '',
                    getArchetype(profile.soulUrge, lang).keywords.join(', ')
                  )}
                </p>
                <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl border-t border-[var(--border-subtle)] pt-3 leading-relaxed">
                  {renderParagraphs(getSoulUrgeDeep(profile.soulUrge, lang))}
                </div>
              </div>
            </div>
          )}

          {selectedPillar === 'personality' && (
            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl">{t.personalityExplanation(profile.personality)}</p>
              <div className="p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                  {t.personalityAuricLabel}
                </span>
                <p className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl font-medium">
                  {t.personalityAuricText(
                    getArchetype(profile.personality, lang).title.split('/')[0] ?? '',
                    getArchetype(profile.personality, lang).keywords.join(', ')
                  )}
                </p>
                <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl border-t border-[var(--border-subtle)] pt-3 leading-relaxed">
                  {renderParagraphs(getPersonalityDeep(profile.personality, lang))}
                </div>
              </div>
            </div>
          )}

          {selectedPillar === 'personalYear' && (
            <div className="space-y-4">
              <p className="text-base sm:text-lg md:text-xl">{t.personalYearExplanation(new Date().getFullYear(), profile.personalYear)}</p>
              <div className="p-4 sm:p-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
                <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                  {t.personalYearDirectiveLabel}
                </span>
                <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl leading-relaxed">
                  {renderParagraphs(interpretation.yearlyForecast)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tags de Palavras-Chave do Arquetipo Ativo */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {(() => {
            const arch = getArchetype(profile[selectedPillar], lang);
            return arch.keywords.map((kw, i) => (
              <span
                key={i}
                className="font-mono text-[10px] sm:text-xs tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-1 text-[var(--text-subtle)] font-medium"
              >
                {kw}
              </span>
            ));
          })()}
        </div>
      </div>
    </div>
  );
};
