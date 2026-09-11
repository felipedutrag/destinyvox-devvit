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
    birthdayLabel?: string;
    maturityLabel?: string;
    personalYearLabel: (year: number) => string;
    postCommentSuccess: string;
    postingCommentBtn: string;
    postedCommentBtn: string;
    postCommentBtn: string;
    shareBtn?: string;
    joinCommunityBtn?: string;
    joiningCommunityBtn?: string;
    joinedCommunityBtn?: string;
    joinCommunitySuccess?: string;
    joinCommunityError?: string;
    calculateForOtherBtn: string;
  };
  commentSuccess: boolean;
  commentError: string;
  isPostingComment: boolean;
  isJoining?: boolean;
  isMember?: boolean;
  joinSuccess?: boolean;
  joinError?: string;
  onPostToRedditComments: () => void;
  onShareToOtherSubs?: () => void;
  onJoinCommunity?: () => void;
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
  onPostToRedditComments,
  onOpenPortal,
  onResetChart,
}) => {
  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="border border-[var(--border-main)] p-6 sm:p-8 bg-[var(--bg-card)] space-y-6 max-w-lg mx-auto">
        {/* Cabecalho do Recibo */}
        <div className="border-b border-dashed border-[var(--border-main)] pb-4 text-center space-y-1">
          <div className="font-editorial text-2xl sm:text-3xl tracking-[0.15em] uppercase text-[var(--text-main)] font-normal">
            {t.dossierTitle}
          </div>
          <div className="font-mono text-[10px] sm:text-xs text-[var(--text-subtle)] tracking-widest uppercase font-medium">
            {t.dossierSub}
          </div>
        </div>

        {/* Dados do Usuario */}
        <div className="space-y-2.5 text-sm sm:text-base">
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-subtle)]">{t.subjectLabel}</span>
            <span className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-medium">{profile.fullName}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-subtle)]">{t.birthDateLabel}</span>
            <span className="font-editorial text-lg sm:text-xl text-[var(--text-main)]">{formatAmericanDate(profile.birthDate)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-subtle)]">{t.systemLabel}</span>
            <span className="font-editorial text-lg sm:text-xl text-[var(--text-main)]">{t.systemValue}</span>
          </div>
        </div>

        {/* Matriz dos Numeros */}
        <div className="border-t border-b border-dashed border-[var(--border-main)] py-4 space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.lifePathLabel}</span>
            <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.lifePath}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.expressionLabel}</span>
            <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.expression}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.soulUrgeLabel}</span>
            <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.soulUrge}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.personalityLabel}</span>
            <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.personality}</span>
          </div>
          {profile.birthday !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.birthdayLabel || 'Birthday'}</span>
              <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.birthday}</span>
            </div>
          )}
          {profile.maturity !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.maturityLabel || 'Maturity'}</span>
              <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.maturity}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium">{t.personalYearLabel(new Date().getFullYear())}</span>
            <span className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-semibold">#{profile.personalYear}</span>
          </div>
        </div>

        {/* Citacao */}
        <div className="space-y-4 pt-1">
          <blockquote className="font-editorial italic text-lg sm:text-xl md:text-2xl text-[var(--text-main)] text-center leading-relaxed">
            &ldquo;{interpretation.cosmicMotto}&rdquo;
          </blockquote>

          {/* Feedback de postagem de comentario */}
          {commentSuccess && (
            <div className="font-mono text-xs text-[var(--accent-gold)] text-center tracking-wider py-2 border border-[var(--border-main)] bg-[var(--bg-card-alt)] animate-fadeIn font-medium">
              {t.postCommentSuccess}
            </div>
          )}
          {commentError && (
            <div className="font-mono text-xs text-[var(--text-subtle)] text-center tracking-wider py-2 border border-[var(--border-main)] bg-[var(--bg-card-alt)] animate-fadeIn">
              [ {commentError} ]
            </div>
          )}

          {/* Botoes de Acao */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Portal Externo (Destaque Principal / Preto) */}
            <button
              type="button"
              onClick={onOpenPortal}
              className="w-full h-12 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-80 font-mono text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>✦ ORACLE AI ↗</span>
            </button>

            {/* 2. Publicar nos comentarios do Reddit (Branco / Card) */}
            <button
              onClick={onPostToRedditComments}
              disabled={isPostingComment || commentSuccess}
              className="w-full h-11 border border-[var(--border-main)] hover:border-[var(--text-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)] font-mono text-xs font-medium tracking-[0.15em] text-[var(--text-main)] uppercase transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>
                {isPostingComment
                  ? t.postingCommentBtn
                  : commentSuccess
                  ? t.postedCommentBtn
                  : t.postCommentBtn}
              </span>
            </button>

            {/* 5. Calcular para outra pessoa / Novo Mapa */}
            <button
              onClick={onResetChart}
              className="w-full py-2.5 font-mono text-[10px] sm:text-xs text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block pt-2 font-medium"
            >
              {t.calculateForOtherBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
