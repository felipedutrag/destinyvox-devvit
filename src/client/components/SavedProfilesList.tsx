import React, { type MouseEvent } from 'react';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';

export interface SavedChartEntry {
  id: string;
  name: string;
  birthDate: string;
  data: CosmicReadingResult;
}

interface SavedProfilesListProps {
  savedCharts: SavedChartEntry[];
  savedProfile: CosmicReadingResult;
  savedUser: string;
  selectedChartIndex: number;
  onSelectChartIndex: (index: number) => void;
  onResume: (e: MouseEvent<HTMLButtonElement>) => void;
  onCalculateNew: () => void;
  t: {
    savedChartDropdown: string;
    savedProfileTag: string;
    consultant: string;
    lifePath: string;
    expression: string;
    soulUrge: string;
    personality: string;
    ctaResume: string;
    ctaNew: string;
  };
}

export const SavedProfilesList: React.FC<SavedProfilesListProps> = ({
  savedCharts,
  savedProfile,
  savedUser,
  selectedChartIndex,
  onSelectChartIndex,
  onResume,
  onCalculateNew,
  t,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto space-y-2 animate-fadeIn">
      {savedCharts.length > 1 && (
        <div className="space-y-0.5 text-left">
          <div className="flex justify-between items-center">
            <label className="block font-mono text-[9px] tracking-[0.15em] text-[var(--text-subtle)]">
              {t.savedChartDropdown} ({savedCharts.length})
            </label>
            <span className="font-mono text-[9px] text-[var(--text-subtle)]">u/{savedUser}</span>
          </div>
          <select
            value={selectedChartIndex}
            onChange={(e) => onSelectChartIndex(Number(e.target.value))}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] rounded-none px-2 py-1 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)] cursor-pointer"
          >
            {savedCharts.map((c, i) => (
              <option key={c.id || i} value={i} className="bg-[var(--bg-main)] text-[var(--text-main)]">
                {c.name} (#{c.data?.profile?.lifePath || '?'})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="border border-[var(--border-main)] p-3.5 bg-[var(--bg-card)] text-left">
        {savedCharts.length <= 1 && (
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5 mb-2">
            <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-subtle)] uppercase">
              {t.savedProfileTag}
            </span>
            <span className="font-mono text-[9px] text-[var(--text-main)] font-semibold">
              u/{savedUser}
            </span>
          </div>
        )}

        <div className="font-mono text-xs text-[var(--text-muted)] space-y-3">
          <div className="flex justify-between border-b border-[var(--border-subtle)]/40 pb-2">
            <span className="text-[var(--text-subtle)]">{t.consultant}</span>
            <span className="text-[var(--text-main)] font-medium">
              {savedProfile.profile.fullName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-subtle)]">{t.lifePath}</span>
            <span className="text-[var(--text-main)] font-semibold">
              #{savedProfile.profile.lifePath}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-subtle)]">{t.expression}</span>
            <span className="text-[var(--text-main)] font-semibold">
              #{savedProfile.profile.expression}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-subtle)]">{t.soulUrge}</span>
            <span className="text-[var(--text-main)] font-semibold">
              #{savedProfile.profile.soulUrge}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-subtle)]">{t.personality}</span>
            <span className="text-[var(--text-main)] font-semibold">
              #{savedProfile.profile.personality}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onResume}
        className="w-full h-10 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-75 font-mono text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>{t.ctaResume}</span>
      </button>

      <button
        type="button"
        onClick={onCalculateNew}
        className="w-full py-1 font-mono text-[9px] text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block"
      >
        {t.ctaNew}
      </button>
    </div>
  );
};
