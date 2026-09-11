import React from 'react';
import type { SupportedLang, I18nDictionary } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import {
  getArchetype,
  getSoulDictum,
  getSoulUrgeDeep,
  getPersonalityDeep,
  getBirthdayDeep,
  getMaturityDeep,
} from '../../shared/numerology';
import { renderParagraphs } from './renderParagraphs';
import type { PillarId } from './PillarMatrix';

type TabArchetypeProps = {
  profile: CosmicReadingResult['profile'];
  interpretation: CosmicReadingResult['interpretation'];
  selectedPillar: PillarId;
  lang: SupportedLang;
  t: I18nDictionary;
};

export const TabArchetype: React.FC<TabArchetypeProps> = ({
  profile,
  interpretation,
  selectedPillar,
  lang,
  t,
}) => {
  const currentPillarNumber = profile[selectedPillar] ?? 1;
  const currentArchetype = getArchetype(currentPillarNumber, lang);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* O Ditame / Mantra Co-Star */}
      <div className="border border-[var(--border-main)] px-3.5 sm:px-5 py-3 sm:py-4 bg-[var(--bg-card)] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-block font-mono text-[9px] sm:text-[11px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium">
            {t.dictumBadge} #{currentPillarNumber}
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-[var(--text-subtle)] tracking-wider">
            {currentArchetype.title.split('/')[0]}
          </span>
        </div>
        <blockquote className="font-editorial italic text-base sm:text-lg md:text-xl text-[var(--text-main)] leading-relaxed">
          &ldquo;
          {selectedPillar === 'lifePath'
            ? interpretation.cosmicMotto || getSoulDictum(profile.lifePath, lang)
            : getSoulDictum(currentPillarNumber, lang)}
          &rdquo;
        </blockquote>
      </div>

      {/* Texto Editorial do Pilar Selecionado */}
      <div className="border border-[var(--border-subtle)] px-3.5 sm:px-5 md:px-6 py-4 sm:py-5 space-y-4 bg-[var(--bg-card-alt)]">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium whitespace-nowrap">
            {selectedPillar === 'lifePath' && t.pillar01Badge}
            {selectedPillar === 'expression' && t.pillar02Badge}
            {selectedPillar === 'soulUrge' && t.pillar03Badge}
            {selectedPillar === 'personality' && t.pillar04Badge}
            {selectedPillar === 'birthday' && t.pillar05Badge}
            {selectedPillar === 'maturity' && t.pillar06Badge}
            {selectedPillar === 'personalYear' && t.pillar07Badge(new Date().getFullYear())}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl md:text-2xl text-[var(--text-main)] font-normal tracking-tight">
            {selectedPillar === 'personalYear'
              ? `${t.yearVibrationWord} #${profile.personalYear}: ${currentArchetype.title}`
              : `${t.archWord} #${currentPillarNumber}: ${currentArchetype.title}`}
          </h3>
        </div>

        {/* Cartão de Contexto do Pilar Pitagórico (O que é e O que analisa) */}
        <div className="px-3 sm:px-3.5 py-2.5 sm:py-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2 rounded-sm text-[13px] sm:text-[15px] text-[var(--text-main)] font-editorial leading-relaxed">
          <p>
            <strong className="font-mono text-[10.5px] sm:text-xs text-[var(--accent-gold)] uppercase tracking-wider block sm:inline sm:mr-1.5 font-semibold">
              {t.whatIsLabel}:
            </strong>
            <span className="text-[var(--text-muted)]">
              {t.pillarContext[selectedPillar].whatIs}
            </span>
          </p>
          <p>
            <strong className="font-mono text-[10.5px] sm:text-xs text-[var(--accent-gold)] uppercase tracking-wider block sm:inline sm:mr-1.5 font-semibold">
              {t.whatItAnalyzesLabel}:
            </strong>
            <span className="text-[var(--text-muted)]">
              {t.pillarContext[selectedPillar].analyzes}
            </span>
          </p>
        </div>

        {/* Conteudo especifico conforme o pilar clicado */}
        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] leading-relaxed space-y-4 font-normal">
          {selectedPillar === 'lifePath' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                {t.lifePathPurposeLabel}
              </span>
              <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl leading-relaxed">
                {renderParagraphs(interpretation.destinyOverview)}
              </div>
            </div>
          )}

          {selectedPillar === 'expression' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                {t.expressionGiftsLabel}
              </span>
              <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl leading-relaxed">
                {renderParagraphs(interpretation.hiddenTalents)}
              </div>
            </div>
          )}

          {selectedPillar === 'soulUrge' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
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
                {renderParagraphs(getSoulUrgeDeep(profile.soulUrge, lang, profile.fullName))}
              </div>
            </div>
          )}

          {selectedPillar === 'personality' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
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
                {renderParagraphs(getPersonalityDeep(profile.personality, lang, profile.fullName))}
              </div>
            </div>
          )}

          {selectedPillar === 'birthday' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                {t.birthdayGiftsLabel}
              </span>
              <p className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl font-medium">
                {t.birthdayGiftsText(
                  getArchetype(profile.birthday ?? 1, lang).title.split('/')[0] ?? '',
                  getArchetype(profile.birthday ?? 1, lang).keywords.join(', ')
                )}
              </p>
              <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl border-t border-[var(--border-subtle)] pt-3 leading-relaxed">
                {renderParagraphs(
                  interpretation.birthdayTalent ||
                    getBirthdayDeep(profile.birthday ?? 1, lang, profile.fullName)
                )}
              </div>
            </div>
          )}

          {selectedPillar === 'maturity' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                {t.maturityDirectiveLabel}
              </span>
              <p className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl font-medium">
                {t.maturityDirectiveText(
                  getArchetype(profile.maturity ?? 1, lang).title.split('/')[0] ?? '',
                  getArchetype(profile.maturity ?? 1, lang).keywords.join(', ')
                )}
              </p>
              <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl border-t border-[var(--border-subtle)] pt-3 leading-relaxed">
                {renderParagraphs(
                  interpretation.maturityMission ||
                    getMaturityDeep(profile.maturity ?? 1, lang, profile.fullName)
                )}
              </div>
            </div>
          )}

          {selectedPillar === 'personalYear' && (
            <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-2.5">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">
                {t.personalYearDirectiveLabel}
              </span>
              <div className="text-[var(--text-main)] font-editorial text-base sm:text-lg md:text-xl leading-relaxed">
                {renderParagraphs(interpretation.yearlyForecast)}
              </div>
            </div>
          )}
        </div>

        {/* Tags de Palavras-Chave do Arquetipo Ativo */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          {currentArchetype.keywords.map((kw, i) => (
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
