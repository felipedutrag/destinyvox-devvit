import React, { type MouseEvent } from 'react';

interface BirthChartFormProps {
  fullName: string;
  birthDate: string;
  isSubmitting: boolean;
  errorMessage: string;
  hasSavedProfile: boolean;
  onFullNameChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onSubmit: (e: MouseEvent<HTMLButtonElement>) => void;
  onBackToSaved: () => void;
  t: {
    nameLabel: string;
    namePlaceholder: string;
    birthLabel: string;
    birthPlaceholder: string;
    cta: string;
    backToSaved: string;
  };
}

export const BirthChartForm: React.FC<BirthChartFormProps> = ({
  fullName,
  birthDate,
  isSubmitting,
  errorMessage,
  hasSavedProfile,
  onFullNameChange,
  onBirthDateChange,
  onSubmit,
  onBackToSaved,
  t,
}) => {
  return (
    <div className="w-full max-w-sm mx-auto animate-fadeIn">
      <div className="border border-[var(--border-main)] bg-[var(--bg-card)]/90 px-4 sm:px-6 py-4 sm:py-5 shadow-md space-y-3 text-left">
        <div className="space-y-1 text-left">
          <label className="block font-mono text-[10px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
            {t.nameLabel}
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3.5 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] transition-colors font-mono"
          />
        </div>

        <div className="space-y-1 text-left">
          <label className="block font-mono text-[10px] tracking-[0.12em] text-[var(--text-muted)] uppercase">
            {t.birthLabel}
          </label>
          <input
            type="text"
            inputMode="numeric"
            required
            maxLength={10}
            value={birthDate}
            onChange={(e) => onBirthDateChange(e.target.value)}
            placeholder={t.birthPlaceholder}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3.5 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] transition-colors font-mono cursor-pointer"
          />
        </div>

        {errorMessage && (
          <div className="font-mono text-[10px] text-[var(--accent-gold)] text-center tracking-wide py-1 border border-[var(--accent-gold)]/20 bg-[var(--accent-gold)]/5">
            [ {errorMessage} ]
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-10 mt-1 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-75 font-mono text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{t.cta}</span>
        </button>

        {hasSavedProfile && (
          <button
            type="button"
            onClick={onBackToSaved}
            className="w-full py-1 font-mono text-[9px] text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block"
          >
            {t.backToSaved}
          </button>
        )}
      </div>
    </div>
  );
};
