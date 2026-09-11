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
    <div className="relative w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] select-none flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Header */}
      <header className="relative z-20 w-full flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-subtle)] text-xs">✦</span>
          <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-main)] font-semibold uppercase">
            {t.brand}
          </span>
          <span className="hidden sm:inline-block text-[var(--text-subtle)] font-mono text-[9px] tracking-widest pl-1">
            / {t.subtitleTag}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">
          {/* Botao de Alternar Tema (Dark / Light) */}
          <button
            onClick={toggleTheme}
            aria-label={t.toggleTheme}
            title={t.toggleTheme}
            className="border border-[var(--border-subtle)] hover:border-[var(--border-main)] p-1 text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer flex items-center justify-center leading-none rounded"
          >
            <span className="text-[11px]">{isDarkMode ? '☼' : '☽'}</span>
          </button>

          <div className="flex items-center gap-1 font-mono text-[10px]">
            {(['en', 'pt', 'es'] as const).map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLang(l);
                  sessionStorage.setItem('destinyvox_lang', l);
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
      <main className="relative z-10 w-full max-w-xl mx-auto my-auto flex flex-col space-y-2">
        <div className="text-center pt-1 pb-1 space-y-1 sm:space-y-1.5 flex flex-col items-center">
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
