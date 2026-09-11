import React from 'react';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { renderParagraphs } from './renderParagraphs';

interface TabPolarityProps {
  interpretation: CosmicReadingResult['interpretation'];
  t: {
    polarityHighBadge: string;
    polarityHighTitle: string;
    polarityShadowBadge: string;
    polarityShadowTitle: string;
  };
}

export const TabPolarity: React.FC<TabPolarityProps> = ({ interpretation, t }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Luz / Potencial */}
      <div className="border border-[var(--border-main)] p-5 sm:p-7 md:p-8 bg-[var(--bg-card)] space-y-5">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium whitespace-nowrap">
            {t.polarityHighBadge}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl md:text-2xl text-[var(--text-main)] font-normal tracking-tight">
            {t.polarityHighTitle}
          </h3>
        </div>
        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-normal leading-relaxed">
          {renderParagraphs(interpretation.hiddenTalents)}
        </div>
      </div>

      {/* Sombra / Inibicoes */}
      <div className="border border-[var(--border-main)] p-5 sm:p-7 md:p-8 bg-[var(--bg-card)] space-y-5">
        <div className="border-b border-[var(--border-main)] pb-3.5 space-y-2">
          <span className="inline-block font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-[var(--border-main)] px-2.5 py-0.5 text-[var(--accent-gold)] font-medium whitespace-nowrap">
            {t.polarityShadowBadge}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl md:text-2xl text-[var(--text-main)] font-normal tracking-tight">
            {t.polarityShadowTitle}
          </h3>
        </div>
        <div className="font-editorial text-base sm:text-lg md:text-xl text-[var(--text-muted)] font-normal leading-relaxed">
          {renderParagraphs(interpretation.shadowAndChallenges)}
        </div>
      </div>
    </div>
  );
};
