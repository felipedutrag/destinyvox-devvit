import React from 'react';

interface DeleteChartModalProps {
  chartToDelete: { id: string; name: string } | null;
  isDeletingChart: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: {
    deleteModalTitle: string;
    deleteModalConfirm: (name: string) => string;
    deleteModalUndo: string;
    cancel: string;
    deleting: string;
    delete: string;
  };
}

export const DeleteChartModal: React.FC<DeleteChartModalProps> = ({
  chartToDelete,
  isDeletingChart,
  onConfirm,
  onCancel,
  t,
}) => {
  if (!chartToDelete) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-[var(--bg-card)] border border-[var(--border-main)] p-5 shadow-2xl relative font-mono text-center space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] text-[var(--accent-gold)] tracking-[0.2em] uppercase font-semibold">
            {t.deleteModalTitle}
          </span>
          <h4 className="font-editorial text-lg text-[var(--text-main)] font-normal pt-1">
            {t.deleteModalConfirm(chartToDelete.name)}
          </h4>
          <p className="text-[10px] text-[var(--text-subtle)] leading-relaxed">
            {t.deleteModalUndo}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeletingChart}
            className="py-2 border border-[var(--border-main)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeletingChart}
            className="py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeletingChart ? t.deleting : t.delete}
          </button>
        </div>
      </div>
    </div>
  );
};

interface NewChartModalProps {
  showNewChartModal: boolean;
  newChartName: string;
  newChartBirth: string;
  newChartError: string;
  isCalculatingNewChart: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNameChange: (value: string) => void;
  onBirthChange: (value: string) => void;
  t: {
    newModalTitle: string;
    newModalSubtitle: string;
    newModalNameLabel: string;
    newModalNamePlaceholder: string;
    newModalBirthLabel: string;
    newModalBirthPlaceholder: string;
    calculatingBtn: string;
    calculateBtn: string;
  };
}

export const NewChartModal: React.FC<NewChartModalProps> = ({
  showNewChartModal,
  newChartName,
  newChartBirth,
  newChartError,
  isCalculatingNewChart,
  onClose,
  onSubmit,
  onNameChange,
  onBirthChange,
  t,
}) => {
  if (!showNewChartModal) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[var(--bg-main)] border border-[var(--border-main)] p-6 shadow-2xl relative font-mono">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-subtle)] hover:text-[var(--text-main)] text-sm cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center space-y-1 mb-6">
          <span className="text-[10px] text-[var(--text-subtle)] tracking-[0.25em] uppercase">✦ DESTINYVOX</span>
          <h3 className="font-editorial text-xl text-[var(--text-main)] font-normal">
            {t.newModalTitle}
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] tracking-wider">
            {t.newModalSubtitle}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[9px] text-[var(--text-subtle)] uppercase tracking-widest block mb-1">
              {t.newModalNameLabel}
            </label>
            <input
              type="text"
              value={newChartName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={t.newModalNamePlaceholder}
              disabled={isCalculatingNewChart}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--text-main)]"
            />
          </div>

          <div>
            <label className="text-[9px] text-[var(--text-subtle)] uppercase tracking-widest block mb-1">
              {t.newModalBirthLabel}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder={t.newModalBirthPlaceholder}
              value={newChartBirth}
              onChange={(e) => onBirthChange(e.target.value)}
              disabled={isCalculatingNewChart}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] px-3 py-2 text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--text-main)] placeholder-[var(--text-subtle)]"
            />
          </div>

          {newChartError && (
            <div className="text-[10px] text-[var(--accent-gold)] tracking-wide text-center font-mono">
              [ {newChartError} ]
            </div>
          )}

          <button
            type="submit"
            disabled={isCalculatingNewChart}
            className="w-full bg-[var(--text-main)] text-[var(--bg-main)] py-2.5 text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isCalculatingNewChart ? (
              <span className="animate-pulse">{t.calculatingBtn}</span>
            ) : (
              <span>{t.calculateBtn}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
