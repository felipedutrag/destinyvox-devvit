import './index.css';

import {
  Component,
  useEffect,
  useState,
  useRef,
  type ReactNode,
  type ErrorInfo,
  type MouseEvent,
  type FormEvent,
} from 'react';
import { createRoot } from 'react-dom/client';
import { trpc } from './trpc';
import type { CosmicReadingResult, SynastryResult } from '../server/destinyVoxEngine';
import { calculatePersonalMonth, calculatePersonalDay, getArchetype } from '../shared/numerology';
import {
  i18n,
  dayInterpretationsByLang,
  monthInterpretationsByLang,
  monthNamesByLang,
  formatAmericanDate,
  type SupportedLang,
} from './i18n';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DestinyVox Crash:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-[#050505] text-[#f5f5f5] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="border border-neutral-800 p-6 max-w-md bg-[#080808] space-y-3">
            <span className="text-neutral-500 text-xs tracking-widest uppercase block">[ RENDERING ANOMALY ]</span>
            <p className="font-editorial text-sm text-neutral-300">
              {this.state.error || 'An error occurred while formatting the chart.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 border border-neutral-700 bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-neutral-200 transition-colors uppercase tracking-widest cursor-pointer"
            >
              RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Utilitário para formatar textos longos gerados por IA em parágrafos elegantes e arejados
const renderParagraphs = (rawText: string, className: string = '') => {
  if (!rawText) return null;

  // Primeiro divide por quebras de linha duplas ou simples
  let parts = rawText
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Se a IA retornou um bloco monolítico único sem quebras de linha mas com mais de 320 caracteres,
  // divide de forma inteligente a cada 2-3 frases para garantir parágrafos escaneáveis e agradáveis.
  if (parts.length === 1 && parts[0] && parts[0].length > 320) {
    const sentences = parts[0].match(/[^.!?]+[.!?]+["']?|\s*[^.!?]+$/g) || [parts[0]];
    const reconstructed: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
      if (currentChunk.length >= 220) {
        reconstructed.push(currentChunk);
        currentChunk = '';
      }
    }
    if (currentChunk) {
      if (reconstructed.length > 0 && currentChunk.length < 100) {
        reconstructed[reconstructed.length - 1] += ' ' + currentChunk;
      } else {
        reconstructed.push(currentChunk);
      }
    }
    parts = reconstructed;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((p, idx) => (
        <p key={idx} className="leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
};

export const DestinyVoxApp = () => {
  const [readingData, setReadingData] = useState<CosmicReadingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>('Decoding Pythagorean geometry...');
  const [error, setError] = useState<string>('');
  const [isVip, setIsVip] = useState<boolean>(false);

  // Idioma - Padrão Default: English (en)
  const [lang, setLang] = useState<SupportedLang>('en');
  const t = i18n[lang];

  // Tema Dark/Light e Toggle no Mobile
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
      // Se o usuário não tiver uma preferência manual gravada nesta sessão, segue o Reddit
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

  // Pilar selecionado para inspeção detalhada
  const [selectedPillar, setSelectedPillar] = useState<'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'personalYear'>('lifePath');

  // Lista de mapas salvos
  const [chartsList, setChartsList] = useState<Array<{ id: string; name: string; birthDate: string; data: CosmicReadingResult }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showNewChartModal, setShowNewChartModal] = useState<boolean>(false);
  const [chartToDelete, setChartToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingChart, setIsDeletingChart] = useState<boolean>(false);
  const [newChartName, setNewChartName] = useState<string>('');
  const [newChartBirth, setNewChartBirth] = useState<string>('');
  const [newChartError, setNewChartError] = useState<string>('');
  const [isCalculatingNewChart, setIsCalculatingNewChart] = useState<boolean>(false);

  // Estados do Oráculo Chat
  const [oracleQuestion, setOracleQuestion] = useState<string>('');
  const [oracleChat, setOracleChat] = useState<Array<{ sender: 'user' | 'oracle'; text: string }>>([]);
  const [isAskingOracle, setIsAskingOracle] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const oracleFormRef = useRef<HTMLFormElement>(null);
  const mainScrollRef = useRef<HTMLElement>(null);

  // Aba selecionada (inclui aba invisível 'vip')
  const [activeTab, setActiveTab] = useState<'overview' | 'talents' | 'year' | 'synastry' | 'oracle' | 'share' | 'vip'>('overview');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isPostingComment, setIsPostingComment] = useState<boolean>(false);
  const [commentSuccess, setCommentSuccess] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>('');

  // Estados de Sinastria Cósmica
  const [synastryTarget, setSynastryTarget] = useState<string>('');
  const [synastryResult, setSynastryResult] = useState<SynastryResult | null>(null);
  const [isCalculatingSynastry, setIsCalculatingSynastry] = useState<boolean>(false);
  const [synastryError, setSynastryError] = useState<string>('');
  const [userNotFoundName, setUserNotFoundName] = useState<string>('');
  const [synastryCommentSuccess, setSynastryCommentSuccess] = useState<boolean>(false);

  // Máscara e controle de entrada para formato de data americano (MM/DD/YYYY) no modal
  const handleNewChartBirthChange = (val: string) => {
    const cleaned = val.replace(/[^\d/]/g, '');
    if (cleaned.length < newChartBirth.length) {
      setNewChartBirth(cleaned);
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
    setNewChartBirth(formatted);
  };

  // Selecionar um mapa da lista
  const handleSelectChart = (chart: { id: string; name: string; birthDate: string; data: CosmicReadingResult }) => {
    setReadingData(chart.data);
    setIsDropdownOpen(false);
    sessionStorage.setItem('destinyvox_name', chart.name);
    sessionStorage.setItem('destinyvox_birth', chart.birthDate);
  };

  // Abrir modal de confirmação para excluir mapa
  const handleRequestDelete = (e: MouseEvent, chart: { id: string; name: string }) => {
    e.stopPropagation();
    setChartToDelete(chart);
  };

  // Executar exclusão após confirmação no modal
  const handleConfirmDelete = async () => {
    if (!chartToDelete || isDeletingChart) return;
    setIsDeletingChart(true);

    try {
      const res = await trpc.destinyvox.deleteChart.mutate({ chartId: chartToDelete.id });
      if (res.success && res.charts) {
        setChartsList(res.charts);
        localStorage.setItem('destinyvox_cached_charts', JSON.stringify(res.charts));
        // Se ainda sobraram outros mapas
        if (res.charts.length > 0 && res.charts[0]) {
          const next = res.charts[0];
          setReadingData(next.data);
          sessionStorage.setItem('destinyvox_name', next.name);
          sessionStorage.setItem('destinyvox_birth', next.birthDate);
        } else {
          // Não tem mais nenhum mapa cadastrado -> limpa e volta para a página do formulário (splash)
          sessionStorage.removeItem('destinyvox_name');
          sessionStorage.removeItem('destinyvox_birth');
          localStorage.removeItem('destinyvox_cached_charts');
          window.location.href = 'splash.html';
          return;
        }
      } else if (res.success) {
        sessionStorage.removeItem('destinyvox_name');
        sessionStorage.removeItem('destinyvox_birth');
        localStorage.removeItem('destinyvox_cached_charts');
        window.location.href = 'splash.html';
        return;
      }
    } catch (err) {
      console.error('Erro ao excluir mapa:', err);
    } finally {
      setIsDeletingChart(false);
      setChartToDelete(null);
    }
  };

  // Submeter novo mapa pelo modal
  const handleCreateNewChart = async (e: FormEvent) => {
    e.preventDefault();
    if (!newChartName.trim() || newChartName.trim().length < 2) {
      setNewChartError(t.errFullName);
      return;
    }
    if (!newChartBirth || newChartBirth.length !== 10) {
      setNewChartError(t.errBirthDate);
      return;
    }
    const [mm, dd, yyyy] = newChartBirth.split('/').map(Number);
    const currYear = new Date().getFullYear();
    if (!mm || mm < 1 || mm > 12 || !dd || dd < 1 || dd > 31 || !yyyy || yyyy < 1900 || yyyy > currYear) {
      setNewChartError(t.errBirthDate);
      return;
    }

    setNewChartError('');
    setIsCalculatingNewChart(true);

    try {
      const res = await trpc.destinyvox.generateReading.mutate({
        fullName: newChartName.trim(),
        birthDate: newChartBirth,
        language: lang,
      });

      if (res.success && res.result) {
        const newChartObj = {
          id: `chart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: newChartName.trim(),
          birthDate: newChartBirth,
          data: res.result,
        };

        // Salvar no backend
        const saveRes = await trpc.destinyvox.saveChart.mutate({ chart: newChartObj });
        if (saveRes.success && saveRes.charts) {
          setChartsList(saveRes.charts);
          localStorage.setItem('destinyvox_cached_charts', JSON.stringify(saveRes.charts));
        } else {
          setChartsList((prev) => [newChartObj, ...prev.filter(c => c.name.toLowerCase() !== newChartObj.name.toLowerCase())]);
        }

        // Definir como mapa ativo
        setReadingData(res.result);
        sessionStorage.setItem('destinyvox_name', newChartName.trim());
        sessionStorage.setItem('destinyvox_birth', newChartBirth);

        // Limpar form e fechar modal
        setNewChartName('');
        setNewChartBirth('');
        setShowNewChartModal(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setNewChartError(msg || (lang === 'en' ? 'Failed to calculate new chart.' : 'Falha ao calcular novo mapa.'));
    } finally {
      setIsCalculatingNewChart(false);
    }
  };

  // Gerar novo mapa (abrir o modal diretamente)
  const handleResetChart = () => {
    setNewChartError('');
    setShowNewChartModal(true);
  };

  // Gerar texto formatado em Markdown do Reddit
  const getShareMarkdown = () => {
    if (!readingData) return '';
    const { profile, archetypes, interpretation } = readingData;
    const isEn = lang === 'en';
    const isEs = lang === 'es';
    return (
      `### ✦ DESTINYVOX // ${isEn ? 'NUMEROLOGICAL DOSSIER' : isEs ? 'DOSSIER NUMEROLÓGICO' : 'DOSSIÊ NUMEROLÓGICO'}\n\n` +
      `**${isEn ? 'Subject' : isEs ? 'Consultante' : 'Consulente'}:** ${profile.fullName}\n\n` +
      `* **${isEn ? 'Life Path (Birth Purpose)' : isEs ? 'Camino de Vida (Propósito)' : 'Caminho de Vida (Propósito)'}:** #${profile.lifePath} — *${archetypes.lifePath.title}*\n` +
      `* **${isEn ? 'Expression / Destiny (Name)' : isEs ? 'Expresión / Destino (Nombre)' : 'Expressão / Destino (Nome)'}:** #${profile.expression} — *${archetypes.expression.title}*\n` +
      `* **${isEn ? 'Soul Urge' : isEs ? 'Deseo del Alma' : 'Desejo da Alma'}:** #${profile.soulUrge} — *${archetypes.soulUrge.title}*\n` +
      `* **${isEn ? 'Personality' : isEs ? 'Personalidad' : 'Personalidade'}:** #${profile.personality}\n` +
      `* **${isEn ? 'Current Cycle' : isEs ? 'Ciclo Actual' : 'Ciclo Atual'} (${new Date().getFullYear()}):** ${isEn ? 'Personal Year' : isEs ? 'Año Personal' : 'Ano Pessoal'} #${profile.personalYear} — *${archetypes.personalYear.title}*\n\n` +
      `> *"${interpretation.cosmicMotto}"*\n\n` +
      `---\n` +
      `*${isEn ? 'Calculated via DestinyVox Calculator in r/DestinyVox' : isEs ? 'Calculado vía DestinyVox en r/DestinyVox' : 'Calculado via DestinyVox Calculator em r/DestinyVox'}*`
    );
  };

  // Postar diretamente nos comentários do post do Reddit
  const handlePostToRedditComments = async () => {
    if (!readingData || isPostingComment) return;
    setIsPostingComment(true);
    setCommentError('');
    setCommentSuccess(false);

    try {
      const markdown = getShareMarkdown();
      const res = await trpc.destinyvox.postComment.mutate({
        commentText: markdown,
      });

      if (res.success) {
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 5000);
      } else {
        setCommentError(res.error || 'Falha ao postar comentário.');
        setTimeout(() => setCommentError(''), 4000);
      }
    } catch {
      setCommentError('Erro de conexão ao postar comentário.');
      setTimeout(() => setCommentError(''), 4000);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Copiar recibo minimalista para área de transferência
  const handleCopyShare = () => {
    const text = getShareMarkdown();
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  // Compartilhar em outros subs (copia texto e abre Reddit Submit)
  const handleShareToOtherSubs = () => {
    const text = getShareMarkdown();
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopySuccess(true);
    // Abrir o submit do reddit em nova aba
    window.open(
      'https://www.reddit.com/submit?title=' +
        encodeURIComponent(`Meu Dossiê Numerológico DestinyVox (#${readingData?.profile.lifePath})`),
      '_blank'
    );
  };

  // Calcular Sinastria com outro usuário do Reddit
  const handleCalculateSynastry = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!synastryTarget.trim() || isCalculatingSynastry) return;

    setIsCalculatingSynastry(true);
    setSynastryError('');
    setUserNotFoundName('');
    setSynastryResult(null);

    const cleanUser = synastryTarget.replace(/^u\//i, '').trim();

    try {
      const res = await trpc.destinyvox.calculateSynastry.mutate({
        targetUsername: cleanUser,
        language: lang,
      });

      if (res.success && res.synastry) {
        setSynastryResult(res.synastry);
      } else {
        if (res.userNotFound) {
          setUserNotFoundName(res.targetUsername || cleanUser);
        }
        setSynastryError(res.error || 'Erro ao calcular sinastria.');
      }
    } catch {
      setSynastryError('Erro ao consultar o cosmos para esta sinastria.');
    } finally {
      setIsCalculatingSynastry(false);
    }
  };

  // Convidar outro usuário do Reddit nos comentários do post
  const handleInviteUserToSynastry = async (targetUser: string) => {
    if (!targetUser) return;
    try {
      const inviteMsg =
        `✦ **DESTINYVOX // CONVITE DE SINASTRIA CÓSMICA**\n\n` +
        `Olá u/${targetUser}! O usuário u/${readingData?.profile.fullName} calculou seu mapa numerológico no DestinyVox e tentou ver a compatibilidade cósmica com você.\n\n` +
        `Calcule seu mapa gratuitamente no post para revelarem sua pontuação de harmonia e dinâmica de conexão!\n\n` +
        `*r/DestinyVox*`;

      await trpc.destinyvox.postComment.mutate({
        commentText: inviteMsg,
      });
      setSynastryCommentSuccess(true);
      setTimeout(() => setSynastryCommentSuccess(false), 5000);
    } catch (err) {
      console.error('Erro ao convidar usuário:', err);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const savedName = sessionStorage.getItem('destinyvox_name');
      const savedBirth = sessionStorage.getItem('destinyvox_birth');
      const storedLang = sessionStorage.getItem('destinyvox_lang');
      const savedLang: SupportedLang = storedLang && ['en', 'pt', 'es'].includes(storedLang) ? (storedLang as SupportedLang) : 'en';
      setLang(savedLang);

      // Carregar cache local de mapas
      try {
        const cached = localStorage.getItem('destinyvox_cached_charts');
        if (cached) {
          setChartsList(JSON.parse(cached));
        }
      } catch {
        // Ignorar cache corrompido
      }

      // 1. Checar se já existia perfil e flag VIP no Redis
      try {
        const saved = await trpc.destinyvox.getSavedProfile.query();
        if (saved.isVip) setIsVip(true);
        if (saved.charts && saved.charts.length > 0) {
          setChartsList(saved.charts);
          localStorage.setItem('destinyvox_cached_charts', JSON.stringify(saved.charts));
        }

        if (!savedName && saved.exists && saved.data) {
          setReadingData(saved.data);
          setIsLoading(false);
          return;
        }
      } catch {
        // Ignorar falha ao checar Redis
      }

      // 2. Se veio da Splash com novos dados
      if (savedName && savedBirth) {
        setLoadingStep(
          savedLang === 'en'
            ? 'Consulting the Oracle (Gemini 3.1)...'
            : savedLang === 'es'
            ? 'Consultando al Oráculo (Gemini 3.1)...'
            : 'Consultando o Oráculo (Gemini 3.1)...'
        );

        try {
          const res = await trpc.destinyvox.generateReading.mutate({
            fullName: savedName,
            birthDate: savedBirth,
            language: savedLang,
          });

          if (res.success && res.result) {
            setReadingData(res.result);
            const newChartObj = {
              id: `chart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: savedName,
              birthDate: savedBirth,
              data: res.result,
            };
            try {
              const saveRes = await trpc.destinyvox.saveChart.mutate({ chart: newChartObj });
              if (saveRes.success && saveRes.charts) {
                setChartsList(saveRes.charts);
                localStorage.setItem('destinyvox_cached_charts', JSON.stringify(saveRes.charts));
              }
            } catch {
              // Ignorar falha ao salvar novo mapa
            }
            setIsLoading(false);
            return;
          }
        } catch (err: unknown) {
          console.error('Erro ao gerar:', err);
        }
      }

      // Fallback Padrão se abriu direto
      try {
        const res = await trpc.destinyvox.generateReading.mutate({
          fullName: savedLang === 'en' ? 'Cosmic Seeker' : savedLang === 'es' ? 'Buscador de Estrellas' : 'Buscador das Estrelas',
          birthDate: '07/07/1995',
          language: savedLang,
        });
        setReadingData(res.result);
      } catch {
        setError(savedLang === 'en' ? 'Failed to connect with the cosmos. Try reloading.' : 'Falha ao conectar com o cosmos. Tente recarregar a página.');
      } finally {
        setIsLoading(false);
      }
    };

    void initApp();
  }, []);

  // Fazer pergunta ao Oráculo
  const handleAskOracle = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!oracleQuestion.trim() || !readingData) return;

    const q = oracleQuestion.trim();
    setOracleQuestion('');
    setOracleChat((prev) => [...prev, { sender: 'user', text: q }]);
    setIsAskingOracle(true);

    try {
      const res = await trpc.destinyvox.askOracle.mutate({
        question: q,
        profile: readingData.profile,
        language: lang,
      });

      setOracleChat((prev) => [...prev, { sender: 'oracle', text: res.answer }]);
    } catch {
      setOracleChat((prev) => [
        ...prev,
        {
          sender: 'oracle',
          text:
            lang === 'en'
              ? 'Cosmic silence intervened. Re-center your intent and ask again.'
              : lang === 'es'
              ? 'El silencio cósmico intervino. Concéntrate y pregunta de nuevo.'
              : 'O silêncio cósmico interveio. Re-centralize sua intenção e pergunte novamente.',
        },
      ]);
    } finally {
      setIsAskingOracle(false);
    }
  };

  // Rolar suavemente para a última mensagem do Oráculo
  useEffect(() => {
    if (activeTab === 'oracle') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [oracleChat, isAskingOracle, activeTab]);

  // Detectar abertura do teclado virtual em dispositivos móveis (visualViewport)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const heightDiff = window.innerHeight - vv.height;
      if (heightDiff > 100) {
        setKeyboardHeight(heightDiff);
        if (activeTab === 'oracle') {
          setTimeout(() => {
            oracleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 80);
        }
      } else {
        setKeyboardHeight(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleVisualResize);
    window.visualViewport.addEventListener('scroll', handleVisualResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleVisualResize);
      window.visualViewport?.removeEventListener('scroll', handleVisualResize);
    };
  }, [activeTab]);

  // Tela de Carregamento Estilo Co—Star
  if (isLoading) {
    return (
      <div className="w-full h-full min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-6 select-none font-mono">
        <div className="text-center space-y-4 max-w-xs">
          <div className="text-xs text-[var(--text-subtle)] tracking-[0.3em] uppercase">✦ DESTINYVOX</div>
          <div className="w-12 h-[1px] bg-[var(--border-main)] mx-auto my-4" />
          <div className="font-editorial italic text-base text-[var(--text-muted)]">
            &ldquo;Tudo no universo é número e proporção.&rdquo;
          </div>
          <div className="text-[10px] text-[var(--text-subtle)] tracking-widest uppercase pt-2 animate-pulse">
            [ {loadingStep} ]
          </div>
        </div>
      </div>
    );
  }

  if (error || !readingData) {
    return (
      <div className="w-full h-full min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-6 text-center font-mono">
        <span className="text-[var(--text-subtle)] text-xs tracking-widest uppercase mb-2">[ ERRO DE SINCRONIZAÇÃO ]</span>
        <p className="font-editorial text-sm text-[var(--text-muted)] max-w-sm mb-4">{error || 'Não foi possível ler as efemérides.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] transition-colors uppercase tracking-widest cursor-pointer"
        >
          RECONECTAR
        </button>
      </div>
    );
  }

  const { profile, interpretation } = readingData;

  const tabs = [
    { id: 'overview', label: lang === 'en' ? 'ARCHETYPE' : lang === 'es' ? 'ARQUETIPO' : 'ARQUÉTIPO' },
    { id: 'talents', label: lang === 'en' ? 'POLARITY' : lang === 'es' ? 'POLARIDAD' : 'POLARIDADE' },
    { id: 'year', label: lang === 'en' ? 'CYCLES' : lang === 'es' ? 'CICLOS' : 'CICLOS' },
    { id: 'share', label: lang === 'en' ? 'DOSSIER' : lang === 'es' ? 'DOSSIER' : 'DOSSIÊ' },
    ...(isVip ? [{ id: 'vip', label: '✦ VIP 360°' } as const] : []),
  ] as const;

  return (
    <div className="relative w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] select-none flex flex-col overflow-hidden">
      {/* 1. HEADER EDITORIAL MINIMALISTA */}
      <header className="h-12 border-b border-[var(--border-subtle)] px-3 sm:px-6 flex items-center justify-between z-30 bg-[var(--bg-main)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-[var(--text-subtle)] text-xs">✦</span>
          <span className="font-mono text-[11px] tracking-[0.25em] text-[var(--text-main)] font-medium uppercase truncate">
            {t.brand}
          </span>
          <span className="hidden sm:inline-block text-neutral-600 font-mono text-[10px] tracking-widest truncate">
            / {profile.fullName.toUpperCase()}
          </span>
        </div>

        {/* Botões do Topo: Theme Toggle, Language Switcher, Novo Mapa & Dropdown de Mapas */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px]">
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

          <button
            onClick={handleResetChart}
            title="Calcular para outra pessoa ou gerar novo mapa"
            className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-[var(--border-subtle)] px-2 sm:px-2.5 py-1 text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:border-[var(--border-main)] transition-colors cursor-pointer whitespace-nowrap"
          >
            {t.newChartBtn}
          </button>

          {/* DROPDOWN COM MAPAS GERADOS (SUBSTITUI O BOTÃO DOSSIÊ) */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-[var(--border-main)] px-2 sm:px-3 py-1 text-[var(--text-main)] hover:border-[var(--text-main)] bg-[var(--bg-card)] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>{t.chartsBtn}</span>
              <span className="text-[var(--text-subtle)] text-[9px]">({chartsList.length || 1})</span>
              <span className="text-[var(--text-subtle)] text-[8px] transform transition-transform duration-200">
                {isDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Menu Dropdown Flutuante */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-64 sm:w-72 bg-[var(--bg-main)] border border-[var(--border-main)] shadow-2xl z-50 py-1.5 font-mono text-[11px] animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-[var(--border-subtle)] flex items-center justify-between text-[9px] text-[var(--text-subtle)] uppercase tracking-wider">
                    <span>{t.savedChartsTitle}</span>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleResetChart();
                      }}
                      className="text-[var(--accent-gold)] hover:underline cursor-pointer"
                    >
                      + {t.newWord}
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                    {chartsList.length === 0 ? (
                      <div
                        onClick={() => setIsDropdownOpen(false)}
                        className="px-3 py-2 text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg-card)] flex items-center justify-between"
                      >
                        <div className="truncate">
                          <span className="text-[var(--text-main)] font-medium block truncate">{profile.fullName}</span>
                          <span className="text-[9px] text-[var(--text-subtle)]">#{profile.lifePath} • {formatAmericanDate(profile.birthDate)}</span>
                        </div>
                        <span className="text-[9px] text-[var(--accent-gold)] uppercase tracking-widest font-semibold ml-2">{t.currentTag}</span>
                      </div>
                    ) : (
                      chartsList.map((c) => {
                        const isSelected = c.name.toLowerCase() === profile.fullName.toLowerCase();
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectChart(c)}
                            className={`px-3 py-2 flex items-center justify-between hover:bg-[var(--bg-card)] transition-colors cursor-pointer group ${
                              isSelected ? 'bg-[var(--bg-card-alt)]' : ''
                            }`}
                          >
                            <div className="truncate flex-1 pr-2">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="text-[var(--text-main)] font-medium truncate">{c.name}</span>
                                {isSelected && (
                                  <span className="text-[8px] text-[var(--accent-gold)] uppercase tracking-widest font-bold">●</span>
                                )}
                              </div>
                              <span className="text-[9px] text-[var(--text-subtle)] block">
                                #{c.data?.profile?.lifePath || '?'} • {formatAmericanDate(c.birthDate)}
                              </span>
                            </div>

                            {/* Botão de Excluir Mapa */}
                            <button
                              onClick={(e) => handleRequestDelete(e, { id: c.id, name: c.name })}
                              title={t.deleteChartTooltip}
                              className="text-[var(--text-subtle)] hover:text-[var(--text-main)] p-1.5 opacity-70 hover:opacity-100 transition-all cursor-pointer text-xs flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Rodapé do Menu com atalho para Dossiê completo */}
                  <div className="border-t border-[var(--border-subtle)] p-2 bg-[var(--bg-card)]">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setActiveTab('share');
                      }}
                      className="w-full text-center py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>{t.viewFullDossier}</span>
                      <span className="text-xs">↗</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (100% IN-APP, SEM DEPENDER DE WINDOW.CONFIRM) */}
      {chartToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
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
                onClick={() => setChartToDelete(null)}
                disabled={isDeletingChart}
                className="py-2 border border-[var(--border-main)] text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingChart}
                className="py-2 bg-[var(--btn-bg)] hover:bg-[var(--btn-hover)] text-[var(--btn-text)] text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingChart ? t.deleting : t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA "+ NOVO MAPA" */}
      {showNewChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[var(--bg-main)] border border-[var(--border-main)] p-6 shadow-2xl relative font-mono">
            <button
              onClick={() => setShowNewChartModal(false)}
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

            <form onSubmit={handleCreateNewChart} className="space-y-4">
              <div>
                <label className="text-[9px] text-[var(--text-subtle)] uppercase tracking-widest block mb-1">
                  {t.newModalNameLabel}
                </label>
                <input
                  type="text"
                  value={newChartName}
                  onChange={(e) => setNewChartName(e.target.value)}
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
                  onChange={(e) => handleNewChartBirthChange(e.target.value)}
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
      )}

      {/* 2. OS 5 PILARES (MATRIZ NUMEROLÓGICA CO-STAR - CLICÁVEIS) */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] z-20">
        <div className="max-w-5xl mx-auto grid grid-cols-5 divide-x divide-[var(--border-subtle)] text-center">
          {/* 1. Caminho de Vida (Destino) */}
          <button
            type="button"
            onClick={() => {
              setSelectedPillar('lifePath');
              setActiveTab('overview');
            }}
            title="Life Path"
            className={`p-2 sm:p-3.5 transition-colors cursor-pointer text-center relative ${
              activeTab === 'overview' && selectedPillar === 'lifePath'
                ? 'bg-[var(--bg-card-alt)] ring-1 ring-inset ring-[var(--border-main)]'
                : 'hover:bg-[var(--bg-card-alt)]'
            }`}
          >
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest block truncate ${
              activeTab === 'overview' && selectedPillar === 'lifePath' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'
            }`}>
              {t.pillarLifePath}
            </span>
            <div className="font-editorial text-xl sm:text-3xl text-[var(--text-main)] font-normal mt-0.5">
              {profile.lifePath}
            </div>
            <span className="font-mono text-[8px] sm:text-[9px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight">
              {getArchetype(profile.lifePath, lang).title.split('/')[0]}
            </span>
            {activeTab === 'overview' && selectedPillar === 'lifePath' && (
              <div className="w-4 h-[2px] bg-[var(--accent-gold-line)] mx-auto mt-1" />
            )}
          </button>

          {/* 2. Expressão */}
          <button
            type="button"
            onClick={() => {
              setSelectedPillar('expression');
              setActiveTab('overview');
            }}
            title="Expression"
            className={`p-2 sm:p-3.5 transition-colors cursor-pointer text-center relative ${
              activeTab === 'overview' && selectedPillar === 'expression'
                ? 'bg-[var(--bg-card-alt)] ring-1 ring-inset ring-[var(--border-main)]'
                : 'hover:bg-[var(--bg-card-alt)]'
            }`}
          >
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest block truncate ${
              activeTab === 'overview' && selectedPillar === 'expression' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'
            }`}>
              {t.pillarExpression}
            </span>
            <div className="font-editorial text-xl sm:text-3xl text-[var(--text-main)] font-normal mt-0.5">
              {profile.expression}
            </div>
            <span className="font-mono text-[8px] sm:text-[9px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight">
              {getArchetype(profile.expression, lang).title.split('/')[0]}
            </span>
            {activeTab === 'overview' && selectedPillar === 'expression' && (
              <div className="w-4 h-[2px] bg-[var(--accent-gold-line)] mx-auto mt-1" />
            )}
          </button>

          {/* 3. Alma */}
          <button
            type="button"
            onClick={() => {
              setSelectedPillar('soulUrge');
              setActiveTab('overview');
            }}
            title="Soul Urge"
            className={`p-2 sm:p-3.5 transition-colors cursor-pointer text-center relative ${
              activeTab === 'overview' && selectedPillar === 'soulUrge'
                ? 'bg-[var(--bg-card-alt)] ring-1 ring-inset ring-[var(--border-main)]'
                : 'hover:bg-[var(--bg-card-alt)]'
            }`}
          >
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest block truncate ${
              activeTab === 'overview' && selectedPillar === 'soulUrge' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'
            }`}>
              {t.pillarSoulUrge}
            </span>
            <div className="font-editorial text-xl sm:text-3xl text-[var(--text-main)] font-normal mt-0.5">
              {profile.soulUrge}
            </div>
            <span className="font-mono text-[8px] sm:text-[9px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight">
              {getArchetype(profile.soulUrge, lang).title.split('/')[0]}
            </span>
            {activeTab === 'overview' && selectedPillar === 'soulUrge' && (
              <div className="w-4 h-[2px] bg-[var(--accent-gold-line)] mx-auto mt-1" />
            )}
          </button>

          {/* 4. Exterior */}
          <button
            type="button"
            onClick={() => {
              setSelectedPillar('personality');
              setActiveTab('overview');
            }}
            title="Personality"
            className={`p-2 sm:p-3.5 transition-colors cursor-pointer text-center relative ${
              activeTab === 'overview' && selectedPillar === 'personality'
                ? 'bg-[var(--bg-card-alt)] ring-1 ring-inset ring-[var(--border-main)]'
                : 'hover:bg-[var(--bg-card-alt)]'
            }`}
          >
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest block truncate ${
              activeTab === 'overview' && selectedPillar === 'personality' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'
            }`}>
              {t.pillarPersonality}
            </span>
            <div className="font-editorial text-xl sm:text-3xl text-[var(--text-main)] font-normal mt-0.5">
              {profile.personality}
            </div>
            <span className="font-mono text-[8px] sm:text-[9px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight">
              {getArchetype(profile.personality, lang).title.split('/')[0]}
            </span>
            {activeTab === 'overview' && selectedPillar === 'personality' && (
              <div className="w-4 h-[2px] bg-[var(--accent-gold-line)] mx-auto mt-1" />
            )}
          </button>

          {/* 5. Ano Pessoal */}
          <button
            type="button"
            onClick={() => {
              setSelectedPillar('personalYear');
              setActiveTab('overview');
            }}
            title="Personal Year"
            className={`p-2 sm:p-3.5 transition-colors cursor-pointer text-center relative ${
              activeTab === 'overview' && selectedPillar === 'personalYear'
                ? 'bg-[var(--bg-card-alt)] ring-1 ring-inset ring-[var(--border-main)]'
                : 'hover:bg-[var(--bg-card-alt)]'
            }`}
          >
            <span className={`font-mono text-[8px] sm:text-[9px] uppercase tracking-widest block truncate ${
              activeTab === 'overview' && selectedPillar === 'personalYear' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'
            }`}>
              {t.pillarPersonalYear}
            </span>
            <div className="font-editorial text-xl sm:text-3xl text-[var(--text-main)] font-normal mt-0.5">
              {profile.personalYear}
            </div>
            <span className="font-mono text-[8px] sm:text-[9px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight">
              {getArchetype(profile.personalYear, lang).title.split('/')[0]}
            </span>
            {activeTab === 'overview' && selectedPillar === 'personalYear' && (
              <div className="w-4 h-[2px] bg-[var(--accent-gold-line)] mx-auto mt-1" />
            )}
          </button>
        </div>
      </section>

      {/* 3. NAVEGAÇÃO ENTRE ABAS (SCROLL HORIZONTAL INTUITIVO NO MOBILE COM FADE NAS BORDAS) */}
      <nav className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-main)] z-20">
        {/* Container com scroll horizontal fluido, sem quebra e com espaçamento confortável */}
        <div className="max-w-3xl mx-auto flex items-center overflow-x-auto no-scrollbar scroll-smooth px-3 sm:px-6 sm:justify-center gap-2 sm:gap-6 font-mono text-[10px] sm:text-[11px] tracking-[0.16em] uppercase whitespace-nowrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition-all duration-150 cursor-pointer flex-shrink-0 text-center ${
                  isActive
                    ? 'border-[var(--accent-gold-line)] text-[var(--text-main)] font-semibold'
                    : 'border-transparent text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:border-neutral-400'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. CONTEÚDO PRINCIPAL COM ROLAGEM */}
      <main
        ref={mainScrollRef}
        style={{
          paddingBottom:
            activeTab === 'oracle'
              ? keyboardHeight > 0
                ? `${keyboardHeight + 20}px`
                : isInputFocused
                ? '280px'
                : undefined
              : undefined,
        }}
        className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 z-10 max-w-3xl mx-auto w-full transition-[padding] duration-150 ${
          activeTab === 'oracle' ? 'flex flex-col h-full space-y-0 pb-4' : 'space-y-6'
        }`}
      >
        {/* ABA 1: ARQUÉTIPO / ANÁLISE DINÂMICA DO PILAR SELECIONADO */}
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fadeIn">
            {/* O Ditame / Mantra Co—Star */}
            <div className="border border-[var(--border-main)] p-4 sm:p-5 bg-[var(--bg-card)] space-y-2">
              <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                {t.dictumBadge}
              </span>
              <blockquote className="font-editorial italic text-sm sm:text-base text-[var(--text-main)] leading-relaxed">
                &ldquo;{interpretation.cosmicMotto}&rdquo;
              </blockquote>
            </div>

            {/* Texto Editorial do Pilar Selecionado (Destino, Expressão, Alma, Exterior ou Ano) */}
            <div className="border border-[var(--border-subtle)] p-5 sm:p-6 space-y-4 bg-[var(--bg-card-alt)]">
              <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                  {selectedPillar === 'lifePath' && t.pillar01Badge}
                  {selectedPillar === 'expression' && t.pillar02Badge}
                  {selectedPillar === 'soulUrge' && t.pillar03Badge}
                  {selectedPillar === 'personality' && t.pillar04Badge}
                  {selectedPillar === 'personalYear' && t.pillar05Badge(new Date().getFullYear())}
                </span>
                <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                  {selectedPillar === 'lifePath' && `${t.archWord} #${profile.lifePath}: ${getArchetype(profile.lifePath, lang).title}`}
                  {selectedPillar === 'expression' && `${t.archWord} #${profile.expression}: ${getArchetype(profile.expression, lang).title}`}
                  {selectedPillar === 'soulUrge' && `${t.archWord} #${profile.soulUrge}: ${getArchetype(profile.soulUrge, lang).title}`}
                  {selectedPillar === 'personality' && `${t.archWord} #${profile.personality}: ${getArchetype(profile.personality, lang).title}`}
                  {selectedPillar === 'personalYear' && `${t.yearVibrationWord} #${profile.personalYear}: ${getArchetype(profile.personalYear, lang).title}`}
                </h3>
              </div>

              {/* Conteúdo específico conforme o pilar clicado */}
              <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] leading-relaxed space-y-3 font-normal">
                {selectedPillar === 'lifePath' && (
                  <div className="space-y-3">
                    <p>{t.lifePathExplanation(profile.lifePath)}</p>
                    {renderParagraphs(interpretation.destinyOverview)}
                  </div>
                )}

                {selectedPillar === 'expression' && (
                  <div className="space-y-3">
                    <p>
                      {t.expressionExplanation(profile.expression)}
                    </p>
                    <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
                      <span className="font-mono text-[9px] tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">{t.expressionGiftsLabel}</span>
                      <div className="text-[var(--text-main)] font-editorial text-base">
                        {renderParagraphs(interpretation.hiddenTalents)}
                      </div>
                    </div>
                  </div>
                )}

                {selectedPillar === 'soulUrge' && (
                  <div className="space-y-3">
                    <p>
                      {t.soulUrgeExplanation(profile.soulUrge)}
                    </p>
                    <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
                      <span className="font-mono text-[9px] tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">{t.soulUrgeMotivationLabel}</span>
                      <p className="text-[var(--text-main)] font-editorial text-base">
                        {t.soulUrgeMotivationText(getArchetype(profile.soulUrge, lang).title.split('/')[0] ?? '', getArchetype(profile.soulUrge, lang).keywords.join(', '))}
                      </p>
                    </div>
                  </div>
                )}

                {selectedPillar === 'personality' && (
                  <div className="space-y-3">
                    <p>
                      {t.personalityExplanation(profile.personality)}
                    </p>
                    <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
                      <span className="font-mono text-[9px] tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">{t.personalityAuricLabel}</span>
                      <p className="text-[var(--text-main)] font-editorial text-base">
                        {t.personalityAuricText(getArchetype(profile.personality, lang).title.split('/')[0] ?? '', getArchetype(profile.personality, lang).keywords.join(', '))}
                      </p>
                    </div>
                  </div>
                )}

                {selectedPillar === 'personalYear' && (
                  <div className="space-y-3">
                    <p>
                      {t.personalYearExplanation(new Date().getFullYear(), profile.personalYear)}
                    </p>
                    <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-1">
                      <span className="font-mono text-[9px] tracking-widest text-[var(--accent-gold)] block font-semibold uppercase">{t.personalYearDirectiveLabel}</span>
                      <p className="text-[var(--text-main)] font-editorial text-base">{interpretation.yearlyForecast}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags de Palavras-Chave do Arquétipo Ativo */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                {(() => {
                  const arch = getArchetype(profile[selectedPillar], lang);
                  return arch.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
                    >
                      {kw}
                    </span>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: POLARIDADE (DONS & SOMBRA) */}
        {activeTab === 'talents' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Luz / Potencial */}
            <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
              <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                  {t.polarityHighBadge}
                </span>
                <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                  {t.polarityHighTitle}
                </h3>
              </div>
              <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] font-normal">
                {renderParagraphs(interpretation.hiddenTalents)}
              </div>
            </div>

            {/* Sombra / Inibições */}
            <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
              <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                  {t.polarityShadowBadge}
                </span>
                <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                  {t.polarityShadowTitle}
                </h3>
              </div>
              <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] font-normal">
                {renderParagraphs(interpretation.shadowAndChallenges)}
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: CICLOS TEMPORAIS (DIA, MÊS, ANO) */}
        {activeTab === 'year' && (() => {
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonthNum = now.getMonth() + 1;
          const currentDayNum = now.getDate();
          const personalMonth = calculatePersonalMonth(profile.personalYear, currentMonthNum);
          const personalDay = calculatePersonalDay(personalMonth, currentDayNum);

          const currentMonthName = monthNamesByLang[lang][currentMonthNum - 1] || 'Current';
          const dayArch = getArchetype(personalDay, lang);
          const monthArch = getArchetype(personalMonth, lang);
          const yearArch = getArchetype(profile.personalYear, lang);

          return (
            <div className="space-y-6 animate-fadeIn">
              {/* 1. DIA PESSOAL (PRIMEIRO) */}
              <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
                <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                  <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                    {t.dailyCycleBadge(currentDayNum, currentMonthName)}
                  </span>
                  <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                    {t.personalDayTitle(personalDay, dayArch.title)}
                  </h3>
                </div>

                <p className="font-editorial text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-normal">
                  {interpretation.dailyForecast || dayInterpretationsByLang[lang][personalDay] || dayInterpretationsByLang.en[1]}
                </p>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                  {dayArch.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* 2. MÊS PESSOAL (SEGUNDO) */}
              <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
                <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                  <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                    {t.monthlyCycleBadge(currentMonthName)}
                  </span>
                  <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                    {t.personalMonthTitle(personalMonth, monthArch.title)}
                  </h3>
                </div>

                <p className="font-editorial text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-normal">
                  {interpretation.monthlyForecast || (monthInterpretationsByLang[lang]?.[personalMonth]?.(currentMonthName) ?? monthInterpretationsByLang.en[1]!(currentMonthName))}
                </p>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                  {monthArch.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. ANO PESSOAL (TERCEIRO) */}
              <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
                <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                  <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)]">
                    {t.annualCycleBadge(currentYear)}
                  </span>
                  <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                    {t.personalYearTitle(profile.personalYear, yearArch.title)}
                  </h3>
                </div>

                <div className="font-editorial text-sm sm:text-base text-[var(--text-muted)] font-normal">
                  {renderParagraphs(interpretation.yearlyForecast)}
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
                  {yearArch.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="font-mono text-[9px] tracking-widest uppercase border border-[var(--border-main)] px-2 py-0.5 text-[var(--text-subtle)]"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ABA 4: SINASTRIA CÓSMICA ENTRE REDDITORS */}
        {activeTab === 'synastry' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Bloco de Busca / Entrada do Username */}
            <div className="border border-[var(--border-main)] p-5 sm:p-6 bg-[var(--bg-card)] space-y-4">
              <div className="border-b border-[var(--border-main)] pb-3 space-y-2">
                <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)] uppercase">
                  COMPATIBILIDADE CÓSMICA
                </span>
                <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal">
                  Sinastria Cósmica no Reddit
                </h3>
              </div>

              <div className="space-y-2">
                <p className="font-editorial text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  Digite o nome de qualquer usuário do Reddit para cruzar seus números de destino, expressão e desejo da alma em busca de afinidades e lições cármicas.
                </p>

                <form onSubmit={handleCalculateSynastry} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 font-mono text-xs text-[var(--text-subtle)]">u/</span>
                    <input
                      type="text"
                      required
                      value={synastryTarget}
                      onChange={(e) => setSynastryTarget(e.target.value)}
                      placeholder="nome_do_usuario"
                      className="w-full bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none pl-8 pr-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCalculatingSynastry}
                    className="bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 px-5 py-2 font-mono text-xs font-semibold tracking-widest uppercase cursor-pointer disabled:opacity-50 transition-opacity whitespace-nowrap"
                  >
                    {isCalculatingSynastry ? 'CRUZANDO MAPAS...' : 'CALCULAR SINASTRIA ⟶'}
                  </button>
                </form>
              </div>

              {/* Erro ou usuário não encontrado com botão de convite */}
              {synastryError && (
                <div className="border border-[var(--border-main)] p-4 bg-[var(--bg-card-alt)] space-y-2 text-left animate-fadeIn">
                  <div className="font-mono text-[10px] text-[var(--accent-gold)] tracking-wide">
                    [ {synastryError} ]
                  </div>
                  {userNotFoundName && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="font-editorial text-xs text-[var(--text-muted)]">
                        Convide u/{userNotFoundName} nos comentários deste post para ele calcular o mapa dele!
                      </span>
                      <button
                        type="button"
                        onClick={() => handleInviteUserToSynastry(userNotFoundName)}
                        disabled={synastryCommentSuccess}
                        className="bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 px-3 py-1.5 font-mono text-[9px] font-semibold tracking-widest uppercase cursor-pointer whitespace-nowrap"
                      >
                        {synastryCommentSuccess ? '✓ CONVITE POSTADO!' : 'MARCAR NOS COMENTÁRIOS ↗'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resultado da Sinastria */}
            {synastryResult && (
              <div className="border border-[var(--border-main)] p-5 sm:p-7 bg-[var(--bg-card)] space-y-5 animate-fadeIn">
                {/* Placar de Ressonância */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashed border-[var(--border-main)] pb-4">
                  <div>
                    <span className="font-mono text-[9px] tracking-widest text-[var(--text-subtle)] uppercase block">
                      DIAGNÓSTICO DA CONEXÃO
                    </span>
                    <h4 className="font-editorial text-xl sm:text-2xl text-[var(--text-main)] font-normal mt-0.5">
                      {synastryResult.harmonyTitle}
                    </h4>
                    <span className="font-mono text-[10px] text-[var(--text-muted)] tracking-wider block mt-1">
                      u/{synastryResult.user1.username} (#{synastryResult.user1.profile.lifePath}) ✕ u/{synastryResult.user2.username} (#{synastryResult.user2.profile.lifePath})
                    </span>
                  </div>

                  <div className="border border-[var(--border-main)] px-5 py-3 text-center bg-[var(--bg-card-alt)] self-start sm:self-auto">
                    <span className="font-mono text-[9px] tracking-widest text-[var(--text-subtle)] uppercase block">
                      RESSONÂNCIA
                    </span>
                    <span className="font-editorial text-3xl sm:text-4xl text-[var(--text-main)] font-bold">
                      {synastryResult.compatibilityScore}%
                    </span>
                  </div>
                </div>

                {/* Análise da Conexão */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] tracking-[0.2em] text-[var(--text-subtle)] uppercase">
                    DINÂMICA DAS ENERGIAS
                  </span>
                  <p className="font-editorial text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                    {synastryResult.connectionAnalysis}
                  </p>
                </div>

                {/* Forças e Desafios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="border border-[var(--border-subtle)] p-4 bg-[var(--bg-main)] space-y-1">
                    <span className="font-mono text-[9px] tracking-widest text-[var(--text-main)] uppercase font-semibold block">
                      ✦ PONTOS DE FLUIDEZ
                    </span>
                    <p className="font-editorial text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                      {synastryResult.strengths}
                    </p>
                  </div>

                  <div className="border border-[var(--border-subtle)] p-4 bg-[var(--bg-main)] space-y-1">
                    <span className="font-mono text-[9px] tracking-widest text-[var(--text-subtle)] uppercase font-semibold block">
                      ⚹ DESAFIOS EVOLUTIVOS
                    </span>
                    <p className="font-editorial text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                      {synastryResult.challenges}
                    </p>
                  </div>
                </div>

                {/* Conselho Cósmico */}
                <blockquote className="border-l-2 border-[var(--border-main)] pl-4 py-1 font-editorial italic text-sm text-[var(--text-main)]">
                  &ldquo;{synastryResult.cosmicAdvice}&rdquo;
                </blockquote>
              </div>
            )}
          </div>
        )}

        {/* ABA 5: CHAT ORÁCULO INTERATIVO (TERMINAL MINIMALISTA) */}
        {activeTab === 'oracle' && (
          <div className="border border-[var(--border-main)] bg-[var(--bg-card)] flex flex-col flex-1 min-h-[260px] sm:min-h-[480px] h-full shadow-lg">
            <div className="p-3 sm:p-4 border-b border-[var(--border-main)] bg-[var(--bg-card-alt)] flex items-center gap-3 flex-shrink-0">
              {/* Foto de perfil / Círculo estilo chat */}
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-5 h-5 text-[var(--accent-gold)]"
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
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[var(--bg-card-alt)]"
                  title="Online"
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-block font-mono text-[8px] sm:text-[9px] tracking-widest border border-[var(--border-main)] px-2 py-0.5 text-[var(--accent-gold)] uppercase mb-0.5">
                  {t.oracleInteractive}
                </span>
                <h3 className="font-editorial text-lg sm:text-xl text-[var(--text-main)] font-normal truncate">
                  {t.oracleTitle}
                </h3>
              </div>
            </div>

            {/* Histórico do Diálogo */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              <div className="border-l-2 border-[var(--accent-gold-line)] pl-3.5 py-1">
                <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--accent-gold)] mb-1 font-semibold">
                  {t.oracleTitle.toUpperCase()} ⟶ {profile.fullName.toUpperCase()}
                </div>
                <div className="font-editorial text-base text-[var(--text-main)] leading-relaxed">
                  {lang === 'en'
                    ? `Greetings, ${profile.fullName.split(' ')[0]}. What would you like to explore regarding your Path ${profile.lifePath}, relationships, or timing?`
                    : lang === 'es'
                    ? `Saludos, ${profile.fullName.split(' ')[0]}. ¿Qué te gustaría develar sobre tu Camino ${profile.lifePath}, vocación o ciclos?`
                    : `Saudações, ${profile.fullName.split(' ')[0]}. O que você deseja desvendar sobre seu Caminho ${profile.lifePath}, vocação ou propósitos?`}
                </div>
              </div>

              {oracleChat.map((msg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="font-mono text-[9px] tracking-widest uppercase text-[var(--text-subtle)]">
                    {msg.sender === 'user' ? t.youWord : t.oracleTitle.toUpperCase()}
                  </div>
                  <div
                    className={
                      msg.sender === 'user'
                        ? 'bg-[var(--bg-card-alt)] border border-[var(--border-main)] p-3 text-[var(--text-main)] text-sm font-normal'
                        : 'border-l-2 border-[var(--accent-gold-line)] pl-3.5 py-1 font-editorial text-base text-[var(--text-main)] leading-relaxed'
                    }
                  >
                    {msg.sender === 'user' ? msg.text : renderParagraphs(msg.text)}
                  </div>
                </div>
              ))}

              {isAskingOracle && (
                <div className="font-mono text-[10px] text-[var(--accent-gold)] tracking-widest uppercase animate-pulse flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-ping" />
                  {t.oracleConsulting}
                </div>
              )}

              {/* Âncora invisível para rolagem automática */}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Minimalista fixado no rodapé do chat */}
            <form
              ref={oracleFormRef}
              onSubmit={handleAskOracle}
              className="p-3 border-t border-[var(--border-main)] flex gap-2 bg-[var(--bg-main)] flex-shrink-0"
            >
              <input
                type="text"
                placeholder={t.oraclePlaceholder}
                value={oracleQuestion}
                onChange={(e) => setOracleQuestion(e.target.value)}
                onFocus={() => {
                  setIsInputFocused(true);
                  [50, 150, 300, 500].forEach((delay) => {
                    setTimeout(() => {
                      oracleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, delay);
                  });
                }}
                onBlur={() => {
                  setIsInputFocused(false);
                }}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-main)] rounded-none px-3 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-[var(--text-main)] font-mono"
              />
              <button
                type="submit"
                disabled={isAskingOracle}
                className="bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 px-4 py-2 font-mono text-xs font-semibold tracking-widest uppercase cursor-pointer disabled:opacity-50 transition-opacity"
              >
                ⟶
              </button>
            </form>
          </div>
        )}

        {/* ABA 5: O RECIBO / DOSSIÊ MINIMALISTA */}
        {activeTab === 'share' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="border border-[var(--border-main)] p-6 sm:p-8 bg-[var(--bg-card)] space-y-6 max-w-lg mx-auto">
              {/* Cabeçalho do Recibo */}
              <div className="border-b border-dashed border-[var(--border-main)] pb-4 text-center space-y-1">
                <div className="font-mono text-xs tracking-[0.3em] uppercase text-[var(--text-main)] font-medium">
                  {t.dossierTitle}
                </div>
                <div className="font-mono text-[9px] text-[var(--text-subtle)] tracking-widest">
                  {t.dossierSub}
                </div>
              </div>

              {/* Dados do Usuário */}
              <div className="font-mono text-[11px] space-y-2 text-[var(--text-muted)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-subtle)]">{t.subjectLabel}</span>
                  <span className="text-[var(--text-main)] font-medium">{profile.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-subtle)]">{t.birthDateLabel}</span>
                  <span className="text-[var(--text-main)]">{formatAmericanDate(profile.birthDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-subtle)]">{t.systemLabel}</span>
                  <span className="text-[var(--text-main)]">{t.systemValue}</span>
                </div>
              </div>

              {/* Matriz dos Números */}
              <div className="border-t border-b border-dashed border-[var(--border-main)] py-3.5 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">{t.lifePathLabel}</span>
                  <span className="text-[var(--text-main)] font-semibold">#{profile.lifePath}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">{t.expressionLabel}</span>
                  <span className="text-[var(--text-main)] font-semibold">#{profile.expression}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">{t.soulUrgeLabel}</span>
                  <span className="text-[var(--text-main)] font-semibold">#{profile.soulUrge}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">{t.personalityLabel}</span>
                  <span className="text-[var(--text-main)] font-semibold">#{profile.personality}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">{t.personalYearLabel(new Date().getFullYear())}</span>
                  <span className="text-[var(--text-main)] font-semibold">#{profile.personalYear}</span>
                </div>
              </div>

              {/* Citação */}
              <div className="space-y-3 pt-1">
                <blockquote className="font-editorial italic text-sm text-[var(--text-muted)] text-center leading-relaxed">
                  &ldquo;{interpretation.cosmicMotto}&rdquo;
                </blockquote>

                {/* Feedback de postagem de comentário */}
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

                {/* Botões de Ação de Compartilhamento */}
                <div className="space-y-2 pt-0.5">
                  {/* 1. Publicar diretamente nos comentários do Reddit */}
                  <button
                    onClick={handlePostToRedditComments}
                    disabled={isPostingComment || commentSuccess}
                    className="w-full h-11 bg-[var(--btn-bg)] text-[var(--btn-text)] hover:opacity-90 active:opacity-80 font-mono text-xs font-semibold tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                    {/* 2. Compartilhar em outros subs */}
                    <button
                      onClick={handleShareToOtherSubs}
                      className="h-10 border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] font-mono text-[10px] font-medium tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{t.shareBtn}</span>
                      <span className="text-[var(--text-subtle)]">↗</span>
                    </button>

                    {/* 3. Copiar Markdown para Área de Transferência */}
                    <button
                      onClick={handleCopyShare}
                      className="h-10 border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] font-mono text-[10px] font-medium tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{copySuccess ? t.copiedTextBtn : t.copyTextBtn}</span>
                    </button>
                  </div>

                  {/* 4. Calcular para outra pessoa / Novo Mapa */}
                  <button
                    onClick={handleResetChart}
                    className="w-full py-2 font-mono text-[9px] text-[var(--text-subtle)] hover:text-[var(--text-main)] tracking-widest uppercase transition-colors text-center cursor-pointer block pt-2"
                  >
                    {t.calculateForOtherBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA SECRETA: VIP 360° (DESBLOQUEADA AUTOMATICAMENTE APÓS PAGAMENTO) */}
        {activeTab === 'vip' && isVip && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border border-amber-500/40 bg-[#090805] p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
              <div className="border-b border-amber-500/30 pb-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[9px] tracking-widest text-amber-400 uppercase block font-semibold">
                    ★ RECURSO EXCLUSIVO DE INICIADO VIP
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl text-white font-normal mt-1">
                    Arcanos Maiores & Pináculos Cármicos
                  </h3>
                </div>
                <span className="font-mono text-[10px] tracking-widest border border-amber-400/50 px-2.5 py-1 text-amber-300 uppercase bg-amber-500/10">
                  ATIVO
                </span>
              </div>

              <div className="space-y-4">
                <div className="border border-neutral-800 p-5 bg-[#050505] space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="font-mono text-[10px] text-amber-400 tracking-wider uppercase font-semibold">
                      ✦ O 1º PINÁCULO (FUNDAÇÃO DA VIDA)
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500">IDADE 0 A 28 ANOS</span>
                  </div>
                  <p className="font-editorial text-sm text-neutral-300 leading-relaxed">
                    Seu primeiro grande teste arquetípico consolida a independência emocional e a superação das expectativas familiares inconscientes.
                  </p>
                </div>

                <div className="border border-neutral-800 p-5 bg-[#050505] space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="font-mono text-[10px] text-amber-400 tracking-wider uppercase font-semibold">
                      ✦ O 2º PINÁCULO (CONQUISTA DO PROPÓSITO)
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500">IDADE 29 A 56 ANOS</span>
                  </div>
                  <p className="font-editorial text-sm text-neutral-300 leading-relaxed">
                    A fase de expansão máxima onde sua Expressão #{profile.expression} e Desejo da Alma #{profile.soulUrge} se unem para materializar prosperidade e autoridade pública.
                  </p>
                </div>

                <div className="border border-neutral-800 p-5 bg-[#050505] space-y-2">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                    <span className="font-mono text-[10px] text-amber-400 tracking-wider uppercase font-semibold">
                      ✦ A PIRÂMIDE INVERTIDA (DÍVIDA CÁRMICA SECRETA)
                    </span>
                    <span className="font-mono text-[9px] text-neutral-500">CABALA HERMÉTICA</span>
                  </div>
                  <p className="font-editorial text-sm text-neutral-300 leading-relaxed">
                    Você carrega a ressonância da maestria no Caminho {profile.lifePath}. Suas decisões financeiras e afetivas fluem com poder triplicado quando sua mente se alinha com a verdade.
                  </p>
                </div>
              </div>

              <div className="p-4 border border-dashed border-amber-500/30 bg-amber-500/5 text-center font-mono text-xs text-amber-300">
                ✦ Todas as perguntas ao Oráculo Gemini agora são processadas com tokens expandidos e prioridade máxima no cosmos.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer com versão do app */}
      <footer className="h-6 border-t border-[var(--border-subtle)] px-4 flex items-center justify-between z-20 bg-[var(--bg-main)] font-mono text-[8px] text-[var(--text-subtle)] tracking-widest">
        <span>DESTINYVOX EPHEMERIS</span>
        <span className="border border-[var(--border-main)] px-1 py-0.2 text-[7px] text-[var(--text-muted)]">v0.0.31</span>
      </footer>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <DestinyVoxApp />
  </ErrorBoundary>
);
