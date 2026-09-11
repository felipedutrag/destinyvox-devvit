import React from 'react';

interface PortalModalProps {
  show: boolean;
  portalUsername: string;
  onUsernameChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: {
    portalModalTitle: string;
    portalModalDesc: string;
    portalLinkedBadge: string;
    portalPromptUser: string;
    portalUsernamePlaceholder: string;
    portalConfirmBtn: string;
    portalCancelBtn: string;
  };
}

export const PortalModal: React.FC<PortalModalProps> = ({
  show,
  portalUsername,
  onUsernameChange,
  onConfirm,
  onClose,
  t,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm border border-[var(--border-main)] bg-[var(--bg-main)] p-5 text-left space-y-4 shadow-2xl">
        <div className="space-y-1 border-b border-[var(--border-subtle)] pb-3">
          <span className="font-mono text-[9px] tracking-[0.25em] text-[var(--accent-gold)] uppercase block">
            ✦ DESTINYVOX 360°
          </span>
          <h3 className="font-editorial text-lg text-[var(--text-main)] font-normal">
            {t.portalModalTitle}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-editorial">
            {t.portalModalDesc}
          </p>
        </div>

        {portalUsername ? (
          <div className="border border-[var(--border-main)] p-3 bg-[var(--bg-card)] space-y-1 font-mono">
            <span className="text-[9px] text-[var(--text-subtle)] uppercase tracking-wider block">
              {t.portalLinkedBadge}
            </span>
            <span className="text-xs text-[var(--text-main)] font-semibold block">
              u/{portalUsername}
            </span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] text-[var(--text-muted)] tracking-wider">
              {t.portalPromptUser}
            </label>
            <input
              type="text"
              value={portalUsername}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder={t.portalUsernamePlaceholder}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] font-mono"
            />
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full h-10 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 font-mono text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
          >
            {t.portalConfirmBtn}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1 text-center font-mono text-[10px] text-[var(--text-subtle)] hover:text-[var(--text-main)] uppercase tracking-widest cursor-pointer"
          >
            {t.portalCancelBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
