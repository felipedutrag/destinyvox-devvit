import './index.css';

import { requestExpandedMode, navigateTo, getWebViewMode } from '@devvit/web/client';
import { StrictMode, useState, useEffect, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import type { CosmicReadingResult } from '../server/destinyVoxEngine';
import { splashI18n, type SplashLang } from './splashI18n';
import { useTheme } from './hooks/useTheme';
import { PortalModal } from './components/PortalModal';
import { SavedProfilesList, type SavedChartEntry } from './components/SavedProfilesList';
import { BirthChartForm } from './components/BirthChartForm';
import { ThemeToggle } from './components/ThemeToggle';

export const Splash = () => {
  const [lang, setLang] = useState<SplashLang>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('destinyvox_lang') as SplashLang | null;
      if (stored && ['en', 'pt', 'es'].includes(stored)) return stored;
    }
    return 'en';
  });

  const [savedUser, setSavedUser] = useState<string>('');
  const [savedCharts, setSavedCharts] = useState<SavedChartEntry[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('destinyvox_cached_charts');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  });
  const [savedProfile, setSavedProfile] = useState<CosmicReadingResult | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('destinyvox_cached_charts');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.data) return parsed[0].data;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });
  const [selectedChartIndex, setSelectedChartIndex] = useState<number>(0);
  const [isCheckingSaved, setIsCheckingSaved] = useState<boolean>(true);
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [userToken, setUserToken] = useState<string>('');
  const [portalUsername, setPortalUsername] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const u = searchParams.get('u') || searchParams.get('user');
        if (u) return u.replace(/^u\//i, '').trim();
      } catch {
        // ignore
      }
    }
    return '';
  });
  const [showPortalModal, setShowPortalModal] = useState<boolean>(false);

  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { isDarkMode, toggleTheme } = useTheme();
  const t = splashI18n[lang];

  useEffect(() => {
    const checkRedis = async () => {
      try {
        const res = await trpc.destinyvox.getSavedProfile.query();
        if (res.username) {
          setSavedUser(res.username);
          setPortalUsername((prev) => prev || res.username);
        }
        if (res.userToken) {
          setUserToken(res.userToken);
        }
        if (res.charts && res.charts.length > 0 && res.charts[0]) {
          setSavedCharts(res.charts);
          setSavedProfile(res.charts[0].data);
          localStorage.setItem('destinyvox_cached_charts', JSON.stringify(res.charts));
        } else if (res.exists && res.data) {
          setSavedProfile(res.data);
        }
      } catch (err) {
        console.error('Erro ao verificar Redis:', err);
      } finally {
        setIsCheckingSaved(false);
      }
    };
    void checkRedis();
  }, []);

  const isAlreadyExpanded = (): boolean => {
    try {
      return typeof getWebViewMode === 'function' && getWebViewMode() === 'expanded';
    } catch {
      return false;
    }
  };

  const navigateToGame = (ev: MouseEvent<HTMLButtonElement>) => {
    if (isAlreadyExpanded()) {
      window.location.href = 'game.html';
      return;
    }
    try {
      requestExpandedMode(ev.nativeEvent, 'game');
    } catch (err: unknown) {
      if (err instanceof Error && err.message.toLowerCase().includes('already expanded')) {
        window.location.href = 'game.html';
        return;
      }
      throw err;
    }
  };

  const handleResume = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    if (!savedProfile) return;
    sessionStorage.setItem('destinyvox_name', savedProfile.profile.fullName);
    sessionStorage.setItem('destinyvox_birth', savedProfile.profile.birthDate);
    sessionStorage.setItem('destinyvox_lang', lang);
    navigateToGame(ev);
  };

  const handleOpenPortal = (ev?: MouseEvent<HTMLElement>) => {
    if (ev) ev.preventDefault();
    const effectiveUser = portalUsername.trim() || savedUser.trim();

    if (!effectiveUser && !userToken) {
      setShowPortalModal(true);
      return;
    }

    const portalUrl = new URL('https://destinyvox.online/');
    if (effectiveUser) {
      portalUrl.searchParams.set('u', effectiveUser);
    } else if (userToken) {
      portalUrl.searchParams.set('ref', userToken);
    }
    if (lang) {
      portalUrl.searchParams.set('lang', lang);
    }

    const targetUrl = portalUrl.toString();

    try {
      navigateTo(targetUrl);
    } catch {
      try {
        const win = window.open(targetUrl, '_blank');
        if (!win) {
          window.location.href = targetUrl;
        }
      } catch {
        window.location.href = targetUrl;
      }
    }
  };

  const handleBirthDateChange = (val: string) => {
    const cleaned = val.replace(/[^\d/]/g, '');
    if (cleaned.length < birthDate.length) {
      setBirthDate(cleaned);
      return;
    }
    const digits = cleaned.replace(/\D/g, '').slice(0, 8);
    let formatted: string;
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    setBirthDate(formatted);
  };

  const handleStart = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(t.errName);
      return;
    }

    const dateParts = birthDate.split('/');
    if (dateParts.length !== 3 || (dateParts[2] && dateParts[2].length !== 4)) {
      setErrorMessage(t.errBirth);
      return;
    }
    const m = parseInt(dateParts[0] ?? '', 10);
    const d = parseInt(dateParts[1] ?? '', 10);
    const y = parseInt(dateParts[2] ?? '', 10);
    const currentYear = new Date().getFullYear();

    if (isNaN(m) || m < 1 || m > 12 || isNaN(d) || d < 1 || d > 31 || isNaN(y) || y < 1900 || y > currentYear) {
      setErrorMessage(t.errBirth);
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const cleanName = fullName.trim();
      sessionStorage.setItem('destinyvox_name', cleanName);
      sessionStorage.setItem('destinyvox_birth', birthDate);
      sessionStorage.setItem('destinyvox_lang', lang);

      localStorage.setItem('destinyvox_name', cleanName);
      localStorage.setItem('destinyvox_birth', birthDate);
      localStorage.setItem('destinyvox_lang', lang);

      // Gera e salva a leitura diretamente no Redis antes de expandir
      void trpc.destinyvox.generateReading.mutate({
        fullName: cleanName,
        birthDate: birthDate,
        language: lang,
      }).catch((err) => {
        console.warn('Pré-geração em background:', err);
      });

      navigateToGame(ev);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : (lang === 'en' ? 'Connection error' : 'Erro ao conectar ao oráculo'));
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`relative w-full h-full text-[var(--text-main)] select-none flex flex-col justify-between px-4 sm:px-7 md:px-10 py-3.5 sm:py-4 overflow-hidden transition-colors duration-300 ${
        isDarkMode ? 'bg-[#08080c]' : 'bg-[#f7f5ef]'
      }`}
    >
      {/* Halo Cósmico Superior Vibrante e Elegante */}
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[540px] sm:w-[700px] h-[360px] rounded-full blur-[80px] transition-opacity duration-300"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(204, 164, 59, 0.26) 0%, rgba(161, 120, 27, 0.12) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(180, 83, 9, 0.15) 0%, rgba(217, 119, 6, 0.06) 50%, transparent 75%)',
        }}
      />
      {/* Brilho Ambiente Inferior */}
      <div
        className="pointer-events-none absolute -bottom-24 right-[-5%] w-[400px] h-[280px] rounded-full blur-[70px]"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(204, 164, 59, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(180, 83, 9, 0.08) 0%, transparent 70%)',
        }}
      />
      {/* Grade pontilhada cósmica visível */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09] [background-size:22px_22px]"
        style={{
          backgroundImage: isDarkMode
            ? 'radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 1px)'
            : 'radial-gradient(rgba(0, 0, 0, 0.7) 1px, transparent 1px)',
        }}
      />

      {/* Top Header */}
      <header
        className={`relative z-20 -mx-4 sm:-mx-7 md:-mx-10 -mt-3.5 sm:-mt-4 px-4 sm:px-7 md:px-10 py-2.5 sm:py-3 flex items-center justify-between border-b shadow-sm transition-colors duration-200 ${
          isDarkMode
            ? 'bg-[#050507] border-[#1d1c24]'
            : 'bg-[#ebe7dc] border-[#d4cfbf]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent-gold)] text-xs">✦</span>
          <span className="font-mono text-[10px] sm:text-[10.5px] tracking-[0.25em] text-[var(--text-main)] font-semibold uppercase">
            {t.brand}
          </span>
          <span className="hidden sm:inline-block text-[var(--text-subtle)] font-mono text-[9px] tracking-widest pl-1">
            / {t.subtitleTag}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {/* Botao de Alternar Tema (Dark / Light) */}
          <ThemeToggle
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            title={t.toggleTheme}
          />

          <div className="flex items-center gap-1 font-mono text-[10px]">
            {(['en', 'pt', 'es'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  sessionStorage.setItem('destinyvox_lang', l);
                  localStorage.setItem('destinyvox_lang', l);
                }}
                className={`px-1.5 py-0.5 tracking-wider uppercase transition-colors cursor-pointer ${
                  lang === l
                    ? 'text-[var(--text-main)] font-bold border-b border-[var(--text-main)]'
                    : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-xl mx-auto my-auto flex flex-col space-y-3 sm:space-y-4">
        <div className="text-center pt-1 pb-1 space-y-2.5 sm:space-y-1.5 flex flex-col items-center">
          <h1 className="font-editorial text-2xl sm:text-3xl md:text-[2.2rem] tracking-tight text-[var(--text-main)] leading-tight font-normal">
            {t.headline}
          </h1>
          <p className="font-editorial italic font-medium text-base sm:text-lg md:text-[1.125rem] text-[var(--text-muted)] max-w-sm sm:max-w-md md:max-w-lg mx-auto px-4 leading-relaxed text-balance">
            &ldquo;{t.quote}&rdquo;
          </p>
        </div>

        {!isCheckingSaved && savedProfile && !showManualForm ? (
          <SavedProfilesList
            savedCharts={savedCharts}
            savedProfile={savedProfile}
            savedUser={savedUser}
            selectedChartIndex={selectedChartIndex}
            onSelectChartIndex={(idx) => {
              setSelectedChartIndex(idx);
              if (savedCharts[idx]) setSavedProfile(savedCharts[idx].data);
            }}
            onResume={handleResume}
            onCalculateNew={() => setShowManualForm(true)}
            t={t}
          />
        ) : (
          <BirthChartForm
            fullName={fullName}
            birthDate={birthDate}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            hasSavedProfile={Boolean(savedProfile)}
            onFullNameChange={setFullName}
            onBirthDateChange={handleBirthDateChange}
            onSubmit={handleStart}
            onBackToSaved={() => setShowManualForm(false)}
            t={t}
          />
        )}
      </main>

      <PortalModal
        show={showPortalModal}
        portalUsername={portalUsername}
        onUsernameChange={setPortalUsername}
        onConfirm={() => {
          if (!portalUsername.trim()) return;
          setShowPortalModal(false);
          void handleOpenPortal();
        }}
        onClose={() => setShowPortalModal(false)}
        t={t}
      />

      <footer className="relative z-10 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[9px] font-mono text-[var(--text-subtle)] tracking-widest">
        <span>{t.footer}</span>
        <span className="flex items-center gap-1.5">
          <span className="border border-[var(--border-main)] px-1.5 py-0.2 text-[8px] text-[var(--text-muted)]">v0.0.31</span>
        </span>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
