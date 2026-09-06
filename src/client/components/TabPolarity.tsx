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
    <div className="space-y-5 animate-fadeIn">
      {/* Luz / Potencial */}
      <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
        <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
          <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
            {t.polarityHighBadge}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
            {t.polarityHighTitle}
          </h3>
        </div>
        <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] font-normal">
          {renderParagraphs(interpretation.hiddenTalents)}
        </div>
      </div>

      {/* Sombra / Inibicoes */}
      <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
        <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
          <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
            {t.polarityShadowBadge}
          </span>
          <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
            {t.polarityShadowTitle}
          </h3>
        </div>
        <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] font-normal">
          {renderParagraphs(interpretation.shadowAndChallenges)}
        </div>
      </div>
    </div>
  );
};
