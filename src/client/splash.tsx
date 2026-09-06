import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useState, useEffect, type MouseEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import type { CosmicReadingResult } from '../server/destinyVoxEngine';

export const Splash = () => {
  // Detector de Idioma do Usuário - Padrão: English (en)
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('destinyvox_lang') as 'pt' | 'en' | 'es' | null;
      if (stored && ['en', 'pt', 'es'].includes(stored)) return stored;
    }
    return 'en';
  });

  // Perfil Salvo no Redis e Múltiplos Mapas
  const [savedUser, setSavedUser] = useState<string>('');
  const [savedCharts, setSavedCharts] = useState<Array<{ id: string; name: string; birthDate: string; data: CosmicReadingResult }>>(() => {
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

  // Formulário do Consulente (Formato Americano: MM/DD/YYYY)
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tema Dark / Light sincronizado com sistema e com toggle manual no mobile
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('destinyvox_theme');
    if (saved === 'light') return false;
    if (saved === 'dark') return true;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [isDarkMode]);

  // Sincronizar em tempo real quando o usuário clica no toggle de tema do Reddit (fora do iframe)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('destinyvox_theme');
      if (!saved) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('destinyvox_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Verificar perfil salvo no Redis
  useEffect(() => {
    // Checar perfil salvo no Redis
    const checkRedis = async () => {
      try {
        const res = await trpc.destinyvox.getSavedProfile.query();
        if (res.username) setSavedUser(res.username);
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

  // Textos Minimalistas Estilo Co—Star com Inglês Padrão por Default
  const t = {
    en: {
      brand: 'DESTINYVOX',
      subtitleTag: 'NUMEROLOGICAL EPHEMERIS',
      headline: 'The secret geometry of who you are.',
      quoteLine1: 'Numbers do not predict destiny; they reveal who you are',
      quoteLine2: 'when no one is watching.',
      nameLabel: 'Full Name at Birth',
      namePlaceholder: 'e.g. Nikola Tesla',
      birthLabel: 'Date of Birth (MM/DD/YYYY)',
      birthPlaceholder: 'MM/DD/YYYY',
      cta: 'CALCULATE CHART ⟶',
      ctaResume: 'OPEN MY CHART ⟶',
      ctaNew: 'CALCULATE FOR SOMEONE ELSE / NEW CHART',
      welcomeBack: 'CHART RECOGNIZED IN THE COSMOS',
      savedProfileTag: 'SAVED PROFILE',
      savedChartDropdown: 'Saved Chart',
      consultant: 'Subject:',
      lifePath: 'Life Path:',
      expression: 'Expression:',
      soulUrge: 'Soul Urge:',
      personality: 'Personality:',
      personalYear: 'Personal Year',
      backToSaved: '← RETURN TO MY SAVED CHART',
      footer: 'PYTHAGOREAN ARCHETYPES',
      errName: 'Enter your full name.',
      errBirth: 'Enter a valid date in MM/DD/YYYY format.',
      toggleTheme: 'Toggle Theme',
    },
    pt: {
      brand: 'DESTINYVOX',
      subtitleTag: 'EFEMÉRIDES NUMEROLÓGICA',
      headline: 'A geometria oculta da sua alma.',
      quoteLine1: 'Os números não prevêem o destino; revelam quem você é',
      quoteLine2: 'quando ninguém está olhando.',
      nameLabel: 'Nome Completo de Nascimento',
      namePlaceholder: 'ex. Clarice Lispector',
      birthLabel: 'Data de Nascimento (MM/DD/AAAA)',
      birthPlaceholder: 'MM/DD/AAAA',
      cta: 'CALCULAR MAPA ⟶',
      ctaResume: 'ABRIR MEU MAPA ⟶',
      ctaNew: 'CALCULAR PARA OUTRA PESSOA / NOVO MAPA',
      welcomeBack: 'MAPA RECONHECIDO NO COSMOS',
      savedProfileTag: 'PERFIL SALVO',
      savedChartDropdown: 'Mapa Salvo',
      consultant: 'Consulente:',
      lifePath: 'Caminho de Vida:',
      expression: 'Expressão:',
      soulUrge: 'Desejo da Alma:',
      personality: 'Personalidade:',
      personalYear: 'Ano Pessoal',
      backToSaved: '← VOLTAR AO MEU MAPA SALVO',
      footer: 'ARQUÉTIPOS PITAGÓRICOS',
      errName: 'Insira seu nome completo.',
      errBirth: 'Insira uma data válida no formato MM/DD/AAAA.',
      toggleTheme: 'Alternar Tema',
    },
    es: {
      brand: 'DESTINYVOX',
      subtitleTag: 'EFEMÉRIDES NUMEROLÓGICA',
      headline: 'La geometría secreta de tu alma.',
      quoteLine1: 'Los números no predicen el destino; revelan quién eres',
      quoteLine2: 'cuando nadie está mirando.',
      nameLabel: 'Nombre Completo de Nacimiento',
      namePlaceholder: 'ej. Jorge Luis Borges',
      birthLabel: 'Fecha de Nacimiento (MM/DD/AAAA)',
      birthPlaceholder: 'MM/DD/AAAA',
      cta: 'CALCULAR CARTA ⟶',
      ctaResume: 'ABRIR MI CARTA ⟶',
      ctaNew: 'CALCULAR PARA OTRA PERSONA / NUEVA CARTA',
      welcomeBack: 'CARTA RECONOCIDA EN EL COSMOS',
      savedProfileTag: 'PERFIL GUARDADO',
      savedChartDropdown: 'Carta Guardada',
      consultant: 'Consultante:',
      lifePath: 'Camino de Vida:',
      expression: 'Expresión:',
      soulUrge: 'Deseo del Alma:',
      personality: 'Personalidad:',
      personalYear: 'Año Personal',
      backToSaved: '← VOLVER A MI CARTA GUARDADA',
      footer: 'ARQUETIPOS PITAGÓRICOS',
      errName: 'Ingresa tu nombre completo.',
      errBirth: 'Ingresa una fecha válida en formato MM/DD/AAAA.',
      toggleTheme: 'Alternar Tema',
    },
  }[lang];

  // Retomar mapa salvo direto
  const handleResume = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    if (!savedProfile) return;
    sessionStorage.setItem('destinyvox_name', savedProfile.profile.fullName);
    sessionStorage.setItem('destinyvox_birth', savedProfile.profile.birthDate);
    sessionStorage.setItem('destinyvox_lang', lang);
    requestExpandedMode(ev.nativeEvent, 'game');
  };

  // Máscara e controle de entrada para formato de data americano (MM/DD/YYYY)
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

  // Submeter novos dados para gerar o Mapa
  const handleStart = (ev: MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(t.errName);
      return;
    }

    // Validação do formato americano MM/DD/YYYY
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

    try {
      sessionStorage.setItem('destinyvox_name', fullName.trim());
      sessionStorage.setItem('destinyvox_birth', birthDate);
      sessionStorage.setItem('destinyvox_lang', lang);

      // Abrir a tela do jogo expandida passando diretamente o MouseEvent nativo confiável
      requestExpandedMode(ev.nativeEvent, 'game');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : (lang === 'en' ? 'Connection error' : 'Erro ao conectar ao oráculo'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen sm:min-h-full bg-[var(--bg-main)] text-[var(--text-main)] select-none flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Header: Monospace Branding + Minimalist Language Selector + Mobile Theme Toggle */}
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

        {/* Right Controls: Mobile Theme Toggle + Language Switcher */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          {/* Theme Toggle - Desktop & Mobile */}
          <button
            type="button"
            onClick={toggleTheme}
            className="px-2 py-0.5 border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-card)] cursor-pointer text-xs font-mono flex items-center justify-center transition-colors"
            title={t.toggleTheme}
            aria-label={t.toggleTheme}
          >
            {isDarkMode ? '☼' : '☽'}
          </button>

          {/* Minimalist Switcher */}
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

      {/* Main Editorial Hero & Inputs */}
      <main className="relative z-10 w-full max-w-lg mx-auto my-auto flex flex-col space-y-2">
        {/* Editorial Headline */}
        <div className="text-center pt-1 pb-1 space-y-1 sm:space-y-1.5">
          <h1 className="font-editorial text-2xl sm:text-3xl md:text-[2.2rem] tracking-tight text-[var(--text-main)] leading-tight font-normal whitespace-nowrap">
            {t.headline}
          </h1>
          <p className="font-editorial italic font-medium text-base sm:text-lg text-[var(--text-muted)] max-w-lg mx-auto px-2 sm:px-4 leading-relaxed">
            &ldquo;{t.quoteLine1}
            <span className="block">{t.quoteLine2}&rdquo;</span>
          </p>
        </div>

        {/* Cenário 1: Usuário já possui cálculo salvo no Redis */}
        {!isCheckingSaved && savedProfile && !showManualForm ? (
          <div className="w-full max-w-sm mx-auto space-y-2 animate-fadeIn">
            {/* Dropdown se houver mais de um mapa salvo */}
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
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setSelectedChartIndex(idx);
                    if (savedCharts[idx]) {
                      setSavedProfile(savedCharts[idx].data);
                    }
                  }}
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
              onClick={handleResume}
              className="w-full h-10 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-75 font-mono text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.ctaResume}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualForm(true)}
              className="w-full py-1 font-mono text-[9px] text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block"
            >
              {t.ctaNew}
            </button>
          </div>
        ) : (
          /* Cenário 2: Formulário Manual Minimalista com Data em Formato Americano */
          <div className="w-full max-w-sm mx-auto space-y-2.5 pt-1 animate-fadeIn">
            <div className="space-y-1 text-left">
              <label className="block font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
                {t.nameLabel}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] transition-colors font-mono"
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="block font-mono text-[10px] tracking-[0.1em] text-[var(--text-muted)]">
                {t.birthLabel}
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={10}
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                placeholder={t.birthPlaceholder}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] transition-colors font-mono cursor-pointer"
              />
            </div>

            {errorMessage && (
              <div className="font-mono text-[10px] text-[var(--accent-gold)] text-center tracking-wide">
                [ {errorMessage} ]
              </div>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={isSubmitting}
              className="w-full h-10 mt-1 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-75 font-mono text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{t.cta}</span>
            </button>

            {savedProfile && (
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="w-full py-1 font-mono text-[9px] text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block"
              >
                {t.backToSaved}
              </button>
            )}
          </div>
        )}
      </main>

      {/* Bottom Editorial Coordinates */}
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
