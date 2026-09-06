import React from 'react';
import type { SupportedLang } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { formatAmericanDate } from '../i18n';

interface TabDossierProps {
  profile: CosmicReadingResult['profile'];
  interpretation: CosmicReadingResult['interpretation'];
  lang?: SupportedLang;
  t: {
    dossierTitle: string;
    dossierSub: string;
    subjectLabel: string;
    birthDateLabel: string;
    systemLabel: string;
    systemValue: string;
    lifePathLabel: string;
    expressionLabel: string;
    soulUrgeLabel: string;
    personalityLabel: string;
    personalYearLabel: (year: number) => string;
    postCommentSuccess: string;
    postingCommentBtn: string;
    postedCommentBtn: string;
    postCommentBtn: string;
    shareBtn: string;
    copyTextBtn: string;
    copiedTextBtn: string;
    calculateForOtherBtn: string;
  };
  commentSuccess: boolean;
  commentError: string;
  isPostingComment: boolean;
  copySuccess: boolean;
  onPostToRedditComments: () => void;
  onShareToOtherSubs: () => void;
  onCopyShare: () => void;
  onOpenPortal: () => void;
  onResetChart: () => void;
}

export const TabDossier: React.FC<TabDossierProps> = ({
  profile,
  interpretation,
  t,
  commentSuccess,
  commentError,
  isPostingComment,
  copySuccess,
  onPostToRedditComments,
  onShareToOtherSubs,
  onCopyShare,
  onOpenPortal,
  onResetChart,
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="border border-[var(--border-main)] p-6 sm:p-8 bg-[var(--bg-card)] space-y-6 max-w-lg mx-auto">
        {/* Cabecalho do Recibo */}
        <div className="border-b border-dashed border-[var(--border-main)] pb-4 text-center space-y-1">
          <div className="font-editorial text-xl sm:text-2xl tracking-[0.15em] uppercase text-[var(--text-main)] font-normal">
            {t.dossierTitle}
          </div>
          <div className="font-mono text-[9px] text-[var(--text-subtle)] tracking-widest uppercase">
            {t.dossierSub}
          </div>
        </div>

        {/* Dados do Usuario */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">{t.subjectLabel}</span>
            <span className="font-editorial text-base text-[var(--text-main)] font-medium">{profile.fullName}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">{t.birthDateLabel}</span>
            <span className="font-editorial text-base text-[var(--text-main)]">{formatAmericanDate(profile.birthDate)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">{t.systemLabel}</span>
            <span className="font-editorial text-base text-[var(--text-main)]">{t.systemValue}</span>
          </div>
        </div>

        {/* Matriz dos Numeros */}
        <div className="border-t border-b border-dashed border-[var(--border-main)] py-3.5 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.lifePathLabel}</span>
            <span className="font-editorial text-lg text-[var(--text-main)] font-semibold">#{profile.lifePath}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.expressionLabel}</span>
            <span className="font-editorial text-lg text-[var(--text-main)] font-semibold">#{profile.expression}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.soulUrgeLabel}</span>
            <span className="font-editorial text-lg text-[var(--text-main)] font-semibold">#{profile.soulUrge}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.personalityLabel}</span>
            <span className="font-editorial text-lg text-[var(--text-main)] font-semibold">#{profile.personality}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t.personalYearLabel(new Date().getFullYear())}</span>
            <span className="font-editorial text-lg text-[var(--text-main)] font-semibold">#{profile.personalYear}</span>
          </div>
        </div>

        {/* Citacao */}
        <div className="space-y-3 pt-1">
          <blockquote className="font-editorial italic text-base sm:text-lg text-[var(--text-main)] text-center leading-relaxed">
            &ldquo;{interpretation.cosmicMotto}&rdquo;
          </blockquote>

          {/* Feedback de postagem de comentario */}
          {commentSuccess && (
            <div className="font-mono text-[10px] text-[var(--accent-gold)] text-center tracking-wider py-1.5 border border-[var(--border-main)] bg-[var(--bg-card-alt)] animate-fadeIn font-medium">
              {t.postCommentSuccess}
            </div>
          )}
          {commentError && (
            <div className="font-mono text-[10px] text-[var(--text-subtle)] text-center tracking-wider py-1.5 border border-[var(--border-main)] bg-[var(--bg-card-alt)] animate-fadeIn">
              [ {commentError} ]
            </div>
          )}

          {/* Botoes de Acao de Compartilhamento */}
          <div className="space-y-2 pt-0.5">
            {/* 1. Portal Externo DestinyVox 360 (Destaque Principal / Preto) */}
            <button
              type="button"
              onClick={onOpenPortal}
              className="w-full h-11 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-80 font-mono text-xs font-semibold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>✦ DESTINYVOX 360° ↗</span>
            </button>

            {/* 2. Publicar nos comentarios do Reddit (Branco / Card) */}
            <button
              onClick={onPostToRedditComments}
              disabled={isPostingComment || commentSuccess}
              className="w-full h-10 border border-[var(--border-main)] hover:border-[var(--text-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)] font-mono text-[10px] font-medium tracking-[0.15em] text-[var(--text-main)] uppercase transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>
                {isPostingComment
                  ? t.postingCommentBtn
                  : commentSuccess
                  ? t.postedCommentBtn
                  : t.postCommentBtn}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* 3. Compartilhar em outros subs */}
              <button
                onClick={onShareToOtherSubs}
                className="h-10 border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] font-mono text-[10px] font-medium tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.shareBtn}</span>
                <span className="text-[var(--text-subtle)]">↗</span>
              </button>

              {/* 4. Copiar Markdown para Area de Transferencia */}
              <button
                onClick={onCopyShare}
                className="h-10 border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] font-mono text-[10px] font-medium tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{copySuccess ? t.copiedTextBtn : t.copyTextBtn}</span>
              </button>
            </div>

            {/* 5. Calcular para outra pessoa / Novo Mapa */}
            <button
              onClick={onResetChart}
              className="w-full py-2 font-mono text-[9px] text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block pt-2"
            >
              {t.calculateForOtherBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
