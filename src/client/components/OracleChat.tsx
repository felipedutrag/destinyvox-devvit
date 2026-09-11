import React, { useState, useEffect, useRef, type RefObject } from 'react';
import type { SupportedLang } from '../i18n';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { renderParagraphs } from './renderParagraphs';
import { HermeticStarIcon } from './HermeticStarIcon';

export interface OracleChatMessage {
  sender: 'user' | 'oracle';
  text: string;
}

interface OracleChatProps {
  isOracleOpen: boolean;
  viewportHeight?: number;
  oracleQuestion?: string;
  oracleChat: OracleChatMessage[];
  isAskingOracle: boolean;
  chatBottomRef: RefObject<HTMLDivElement | null>;
  oracleFormRef: RefObject<HTMLFormElement | null>;
  profile: CosmicReadingResult['profile'];
  lang: SupportedLang;
  isVip: boolean;
  credits: number;
  username: string;
  onClose: () => void;
  onAskOracle: (questionOrEvent?: React.FormEvent | string) => void;
  onQuestionChange?: (value: string) => void;
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
  oracleQuestion = '',
  oracleChat,
  isAskingOracle,
  chatBottomRef,
  oracleFormRef,
  profile,
  lang,
  isVip,
  credits,
  username,
  onClose,
  onAskOracle,
  onQuestionChange,
  t,
}) => {
  const [localQuestion, setLocalQuestion] = useState<string>(oracleQuestion);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 640 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sincronização ultra-fluida do viewport móvel sem provocar re-renders do React
  useEffect(() => {
    if (typeof window === 'undefined' || !isOracleOpen) return;
    const vv = window.visualViewport;

    const updateBounds = () => {
      const el = containerRef.current;
      if (!el) return;

      if (window.innerWidth < 640) {
        if (vv) {
          el.style.height = `${vv.height}px`;
          el.style.top = `${vv.offsetTop}px`;
        } else {
          el.style.height = '100dvh';
          el.style.top = '0px';
        }
      } else {
        el.style.height = '';
        el.style.top = '';
      }
    };

    updateBounds();

    if (vv) {
      vv.addEventListener('resize', updateBounds, { passive: true });
      vv.addEventListener('scroll', updateBounds, { passive: true });
    }
    window.addEventListener('resize', updateBounds, { passive: true });

    return () => {
      if (vv) {
        vv.removeEventListener('resize', updateBounds);
        vv.removeEventListener('scroll', updateBounds);
      }
      window.removeEventListener('resize', updateBounds);
    };
  }, [isOracleOpen]);

  // Rolagem suave automática ao receber mensagens ou iniciar consulta
  useEffect(() => {
    if (isOracleOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [oracleChat.length, isAskingOracle, isOracleOpen, chatBottomRef]);

  const handleInputFocus = () => {
    // Ao abrir teclado virtual no mobile, aguarda acomodação nativa da animação antes do scroll
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 280);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = localQuestion.trim();
    if (!q || isAskingOracle || credits <= 0) return;
    setLocalQuestion('');
    onAskOracle(q);
  };

  if (!isVip && credits <= 0) {
    return null;
  }

  return (
    <>
      {/* JANELA DO ORACULO (FULLSCREEN NO MOBILE, CHAT FLUTUANTE NO DESKTOP) */}
      {isOracleOpen && (
        <div
          ref={containerRef}
          style={{
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
          }}
          className={`fixed z-50 bg-[var(--bg-main)] flex flex-col shadow-2xl overflow-hidden p-0 m-0 will-change-[height,top] ${
            isDesktop
              ? 'sm:inset-auto sm:bottom-16 sm:right-6 sm:w-[420px] sm:h-[580px] sm:max-h-[calc(100vh-5rem)] sm:rounded-xl sm:border sm:border-[var(--border-main)]'
              : 'inset-0 w-full h-[100dvh] rounded-none border-0'
          }`}
        >
          {/* Cabecalho do Oraculo */}
          <div className="p-2.5 sm:p-3.5 border-b border-[var(--border-main)] bg-[var(--bg-card-alt)] flex items-center justify-between gap-2 flex-shrink-0 z-10">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm border border-[var(--border-main)]">
                <HermeticStarIcon className="w-full h-full" />
                <span
                  className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-[var(--bg-card-alt)]"
                  title="Online"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-editorial text-sm sm:text-base text-[var(--text-main)] font-medium truncate">
                    {t.oracleTitle}
                  </span>
                  <span className="font-mono text-[8px] text-[var(--accent-gold)] uppercase tracking-wider shrink-0">
                    • {t.oracleOnline}
                  </span>
                  {isVip && (
                    <span className="font-mono text-[7px] border border-[var(--accent-gold)] px-1 py-0.2 text-[var(--accent-gold)] tracking-widest shrink-0">
                      VIP
                    </span>
                  )}
                </div>
                <span className="font-mono text-[7px] sm:text-[8px] tracking-widest text-[var(--text-subtle)] uppercase block truncate">
                  {t.oracleInteractive}
                </span>
              </div>
            </div>

            {/* Controle de Fechar e Créditos em Tempo Real */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Badge Elegante de Creditos do Oraculo */}
              <div
                className="flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-main)]"
                title={
                  lang === 'en'
                    ? `${credits} Oracle credit${credits === 1 ? '' : 's'} available`
                    : lang === 'es'
                    ? `${credits} crédito${credits === 1 ? '' : 's'} disponible${credits === 1 ? '' : 's'}`
                    : `${credits} crédito${credits === 1 ? '' : 's'} disponível${credits === 1 ? '' : 'is'}`
                }
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse shrink-0" />
                <span className="text-[var(--text-subtle)] uppercase tracking-wider text-[8px] sm:text-[9px]">
                  {lang === 'en' ? 'Credits' : 'Créditos'}
                </span>
                <span className="font-bold text-[var(--accent-gold)] font-mono text-xs">
                  {credits}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                title={t.oracleClose}
                aria-label={t.oracleClose}
                className="p-1.5 border border-[var(--border-main)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-alt)] text-[var(--text-main)] transition-colors cursor-pointer flex items-center justify-center rounded"
              >
                <span className="text-xs leading-none font-bold">✕</span>
              </button>
            </div>
          </div>

          {/* Historico do Dialogo - Scroll Exclusivo Aqui */}
          <div
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
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
              <div key={idx} className="space-y-1.5">
                <div className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase text-[var(--text-subtle)] font-medium">
                  {msg.sender === 'user' ? t.youWord : t.oracleTitle.toUpperCase()}
                </div>
                <div
                  className={
                    msg.sender === 'user'
                      ? 'bg-[var(--bg-card-alt)] border border-[var(--border-main)] p-3 text-[var(--text-main)] text-sm sm:text-base font-normal'
                      : 'border-l-2 border-[var(--accent-gold-line)] pl-3.5 py-1 font-editorial text-base sm:text-lg md:text-xl text-[var(--text-main)] leading-relaxed'
                  }
                >
                  {msg.sender === 'user' ? msg.text : renderParagraphs(msg.text)}
                </div>
              </div>
            ))}

            {isAskingOracle && (
              <div className="font-mono text-[10px] sm:text-xs text-[var(--accent-gold)] tracking-widest uppercase animate-pulse flex items-center gap-2 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-ping" />
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
              onSubmit={handleSubmit}
              className="p-2 sm:p-2.5 border-t border-[var(--border-main)] flex gap-2 bg-[var(--bg-main)] flex-shrink-0 z-10"
            >
              <input
                type="text"
                placeholder={t.oraclePlaceholder}
                value={localQuestion}
                onChange={(e) => {
                  setLocalQuestion(e.target.value);
                  if (onQuestionChange) onQuestionChange(e.target.value);
                }}
                onFocus={handleInputFocus}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              />
              <button
                type="submit"
                disabled={isAskingOracle || credits <= 0 || !localQuestion.trim()}
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
