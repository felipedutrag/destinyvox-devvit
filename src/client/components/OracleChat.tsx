import React, { type RefObject } from 'react';
import type { SupportedLang } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { renderParagraphs } from './renderParagraphs';

export interface OracleChatMessage {
  sender: 'user' | 'oracle';
  text: string;
}

interface OracleChatProps {
  isOracleOpen: boolean;
  viewportHeight: number;
  oracleQuestion: string;
  oracleChat: OracleChatMessage[];
  isAskingOracle: boolean;
  chatBottomRef: RefObject<HTMLDivElement | null>;
  oracleFormRef: RefObject<HTMLFormElement | null>;
  profile: CosmicReadingResult['profile'];
  lang: SupportedLang;
  isVip: boolean;
  credits: number;
  username: string;
  onOpen: () => void;
  onClose: () => void;
  onAskOracle: (e: React.FormEvent) => void;
  onQuestionChange: (value: string) => void;
  t: {
    oracleTitle: string;
    oracleButton: string;
    oracleOnline: string;
    oracleInteractive: string;
    oracleMinimize: string;
    oracleExpand: string;
    oracleClose: string;
    youWord: string;
    oracleConsulting: string;
    oraclePlaceholder: string;
  };
}

export const OracleChat: React.FC<OracleChatProps> = ({
  isOracleOpen,
  viewportHeight,
  oracleQuestion,
  oracleChat,
  isAskingOracle,
  chatBottomRef,
  oracleFormRef,
  profile,
  lang,
  isVip,
  credits,
  username,
  onOpen,
  onClose,
  onAskOracle,
  onQuestionChange,
  t,
}) => {
  if (!isVip && credits <= 0) {
    return null;
  }

  return (
    <>
      {/* BALAO FLUTUANTE DO ORACULO (CANTO INFERIOR DIREITO) */}
      <div className="fixed bottom-8 sm:bottom-10 right-4 sm:right-6 z-40">
        {!isOracleOpen && (
          <button
            type="button"
            onClick={onOpen}
            aria-label={t.oracleTitle}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] border border-[var(--border-main)] rounded-full shadow-2xl hover:opacity-95 active:scale-95 transition-all cursor-pointer group"
          >
            <span className="font-mono text-[11px] tracking-widest uppercase font-semibold">
              ORACLE AI
            </span>
            {credits > 0 && (
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-gold)] text-black font-bold">
                {credits}
              </span>
            )}
          </button>
        )}
      </div>

      {/* JANELA / MODAL DO ORACULO (SEMPRE FULL SCREEN) */}
      {isOracleOpen && (
        <div
          style={{
            height: viewportHeight > 0 ? `${viewportHeight}px` : undefined,
          }}
          className="fixed inset-0 z-50 bg-[var(--bg-main)] flex flex-col p-2 sm:p-4 shadow-2xl animate-fadeIn"
        >
          {/* Cabecalho do Oraculo */}
          <div className="p-3 sm:p-3.5 border-b border-[var(--border-main)] bg-[var(--bg-card-alt)] flex items-center justify-between gap-2 flex-shrink-0 z-10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-8 h-8 rounded-full border border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-[var(--accent-gold)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                </svg>
                <span
                  className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-[var(--bg-card-alt)]"
                  title="Online"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-editorial text-base sm:text-lg text-[var(--text-main)] font-normal truncate">
                    {t.oracleTitle}
                  </span>
                  <span className="font-mono text-[8px] text-[var(--accent-gold)] uppercase tracking-wider">
                    • {t.oracleOnline}
                  </span>
                  {isVip && (
                    <span className="font-mono text-[7px] border border-[var(--accent-gold)] px-1 py-0.2 text-[var(--accent-gold)] tracking-widest">
                      VIP
                    </span>
                  )}
                </div>
                <span className="font-mono text-[8px] tracking-widest text-[var(--text-subtle)] uppercase block truncate">
                  {t.oracleInteractive}
                </span>
              </div>
            </div>

            {/* Controle de Fechar e Créditos em Tempo Real */}
            <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px]">
              {/* Badge de Créditos em Tempo Real */}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-full text-[10px] shadow-sm"
                title={
                  lang === 'en'
                    ? `${credits} Oracle credit${credits === 1 ? '' : 's'} available`
                    : lang === 'es'
                    ? `${credits} crédito${credits === 1 ? '' : 's'} disponible${credits === 1 ? '' : 's'}`
                    : `${credits} crédito${credits === 1 ? '' : 's'} disponível${credits === 1 ? '' : 'is'}`
                }
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                <span className="text-[var(--text-subtle)] uppercase tracking-wider text-[8px] sm:text-[9px]">
                  {lang === 'en' ? 'Credits' : lang === 'es' ? 'Créditos' : 'Créditos'}
                </span>
                <span className="font-bold text-[var(--accent-gold)] font-mono text-xs">
                  {credits}
                </span>
              </div>

              {/* Botão de Adquirir Mais Créditos */}
              <a
                href={`https://destinyvox.online/?u=${encodeURIComponent(username || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                title={
                  lang === 'en'
                    ? 'Get more Oracle credits'
                    : lang === 'es'
                    ? 'Obtener más créditos'
                    : 'Adquirir mais créditos'
                }
                className="px-2.5 py-1 bg-[var(--btn-bg)] text-[var(--btn-text)] border border-[var(--border-main)] rounded text-[9px] font-mono font-semibold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all flex items-center gap-1"
              >
                <span>+</span>
                <span className="hidden sm:inline">
                  {lang === 'en' ? 'Refill' : lang === 'es' ? 'Recargar' : 'Recarga'}
                </span>
              </a>

              <button
                type="button"
                onClick={onClose}
                title={t.oracleClose}
                aria-label={t.oracleClose}
                className="p-1.5 border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)] text-[var(--text-main)] transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="text-xs leading-none font-bold">✕</span>
              </button>
            </div>
          </div>

          {/* Historico do Dialogo - Scroll Exclusivo Aqui */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 overscroll-contain">
            <div className="border-l-2 border-[var(--accent-gold-line)] pl-3 py-1">
              <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--accent-gold)] mb-1 font-semibold">
                {t.oracleTitle.toUpperCase()} ⟶ {profile.fullName.toUpperCase()}
              </div>
              <div className="font-editorial text-sm sm:text-base text-[var(--text-main)] leading-relaxed">
                {lang === 'en'
                  ? `Greetings, ${profile.fullName.split(' ')[0]}. What would you like to explore regarding your Path ${profile.lifePath}, relationships, or timing?`
                  : lang === 'es'
                  ? `Saludos, ${profile.fullName.split(' ')[0]}. ¿Qué te gustaría develar sobre tu Camino ${profile.lifePath}, vocación o ciclos?`
                  : `Saudações, ${profile.fullName.split(' ')[0]}. O que você deseja desvendar sobre seu Caminho ${profile.lifePath}, vocação ou propósitos?`}
              </div>
            </div>

            {oracleChat.map((msg, idx) => (
              <div key={idx} className="space-y-1">
                <div className="font-mono text-[8px] tracking-widest uppercase text-[var(--text-subtle)]">
                  {msg.sender === 'user' ? t.youWord : t.oracleTitle.toUpperCase()}
                </div>
                <div
                  className={
                    msg.sender === 'user'
                      ? 'bg-[var(--bg-card-alt)] border border-[var(--border-main)] p-2.5 text-[var(--text-main)] text-xs sm:text-sm font-normal'
                      : 'border-l-2 border-[var(--accent-gold-line)] pl-3 py-1 font-editorial text-sm sm:text-base text-[var(--text-main)] leading-relaxed'
                  }
                >
                  {msg.sender === 'user' ? msg.text : renderParagraphs(msg.text)}
                </div>
              </div>
            ))}

            {isAskingOracle && (
              <div className="font-mono text-[9px] text-[var(--accent-gold)] tracking-widest uppercase animate-pulse flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-ping" />
                {t.oracleConsulting}
              </div>
            )}

            {/* Ancora invisivel para rolagem automatica */}
            <div ref={chatBottomRef} />
          </div>

          {/* Rodapé do Chat: Formulário de pergunta ou Banner de recarga de créditos */}
          {credits <= 0 ? (
            <div className="p-3 sm:p-4 border-t border-[var(--border-main)] bg-[var(--bg-card-alt)] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 z-10 font-mono text-xs">
              <div className="text-center sm:text-left">
                <span className="font-semibold text-[var(--accent-gold)] block text-xs">
                  {lang === 'en'
                    ? '✦ 0 credits remaining'
                    : lang === 'es'
                    ? '✦ 0 créditos disponibles'
                    : '✦ 0 créditos restantes'}
                </span>
                <span className="text-[10px] text-[var(--text-subtle)]">
                  {lang === 'en'
                    ? 'Acquire question packs to consult the Oracle in real time.'
                    : lang === 'es'
                    ? 'Adquiere un paquete para consultar al Oráculo en tiempo real.'
                    : 'Adquira um pacote de perguntas para consultar o Oráculo em tempo real.'}
                </span>
              </div>
              <a
                href={`https://destinyvox.online/?u=${encodeURIComponent(username || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--btn-bg)] text-[var(--btn-text)] text-xs font-semibold tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
              >
                {lang === 'en' ? 'Get Credits ↗' : lang === 'es' ? 'Recargar ↗' : 'Recarregar ↗'}
              </a>
            </div>
          ) : (
            <form
              ref={oracleFormRef}
              onSubmit={onAskOracle}
              className="p-2 sm:p-2.5 border-t border-[var(--border-main)] flex gap-2 bg-[var(--bg-main)] flex-shrink-0 z-10"
            >
              <input
                type="text"
                placeholder={t.oraclePlaceholder}
                value={oracleQuestion}
                onChange={(e) => onQuestionChange(e.target.value)}
                onFocus={() => {
                  setTimeout(() => {
                    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              />
              <button
                type="submit"
                disabled={isAskingOracle || credits <= 0}
                className="bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 px-3.5 py-2 font-mono text-xs font-semibold tracking-widest uppercase cursor-pointer disabled:opacity-50 transition-opacity"
              >
                ⟶
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
};
