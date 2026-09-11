import { useState, useEffect, useRef, type FormEvent } from 'react';
import { trpc } from '../trpc';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import type { SupportedLang } from '../i18n';
import type { OracleChatMessage } from '../components/OracleChat';

export function useOracle(
  readingData: CosmicReadingResult | null,
  lang: SupportedLang,
  initialCredits: number = 0
) {
  const [isOracleOpen, setIsOracleOpen] = useState<boolean>(false);
  const [serverCredits, setServerCredits] = useState<number | null>(null);
  const credits = serverCredits !== null ? serverCredits : initialCredits;
  const setCredits = (val: number | ((prev: number) => number)) => {
    setServerCredits((current) => {
      const base = current !== null ? current : initialCredits;
      return typeof val === 'function' ? val(base) : val;
    });
  };

  const [oracleQuestion, setOracleQuestion] = useState<string>('');
  const [oracleChat, setOracleChat] = useState<OracleChatMessage[]>([]);
  const [isAskingOracle, setIsAskingOracle] = useState<boolean>(false);
  const [isOracleExpanded, setIsOracleExpanded] = useState<boolean>(true);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.height : 0
  );
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const oracleFormRef = useRef<HTMLFormElement>(null);

  // Sincronização em tempo real (Realtime Polling) enquanto o chat do Oráculo estiver aberto
  useEffect(() => {
    if (!isOracleOpen) return;

    let isMounted = true;

    const syncCredits = async () => {
      try {
        const res = await trpc.destinyvox.getMyCredits.query();
        if (isMounted && typeof res.credits === 'number') {
          setServerCredits(res.credits);
        }
      } catch {
        // Ignora erros momentâneos de rede em background
      }
    };

    // Consulta imediata ao abrir o modal
    void syncCredits();

    // Polling contínuo em tempo real a cada 3 segundos
    const interval = setInterval(() => {
      void syncCredits();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOracleOpen]);

  const handleAskOracle = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!oracleQuestion.trim() || !readingData) return;

    if (credits <= 0) {
      setOracleChat((prev) => [
        ...prev,
        {
          sender: 'oracle',
          text:
            lang === 'en'
              ? '✦ You have 0 Oracle credits. Please acquire more question credits to continue consulting.'
              : lang === 'es'
              ? '✦ Tienes 0 créditos para el Oráculo. Por favor adquiere más preguntas para continuar consultando.'
              : '✦ Você possui 0 créditos para o Oráculo. Adquira mais perguntas para continuar consultando.',
        },
      ]);
      return;
    }

    const q = oracleQuestion.trim();
    setOracleQuestion('');
    setOracleChat((prev) => [...prev, { sender: 'user', text: q }]);
    setIsAskingOracle(true);

    try {
      const res = await trpc.destinyvox.askOracle.mutate({
        question: q,
        profile: readingData.profile,
        reading: readingData,
        history: oracleChat.slice(-6),
        language: lang,
      });

      setOracleChat((prev) => [...prev, { sender: 'oracle', text: res.answer }]);
      if (typeof res.remainingCredits === 'number') {
        setCredits(res.remainingCredits);
      }
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

  useEffect(() => {
    if (isOracleOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [oracleChat, isAskingOracle, isOracleOpen, isOracleExpanded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisualResize = () => {
      const vv = window.visualViewport;
      if (vv) {
        setViewportHeight(vv.height);
        const heightDiff = window.innerHeight - vv.height;
        if (heightDiff > 60) {
          setKeyboardHeight(heightDiff);
        } else {
          setKeyboardHeight(0);
        }
      } else {
        setViewportHeight(window.innerHeight);
        setKeyboardHeight(0);
      }

      if (isOracleOpen) {
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    };

    handleVisualResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualResize);
      window.visualViewport.addEventListener('scroll', handleVisualResize);
    }
    window.addEventListener('resize', handleVisualResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualResize);
        window.visualViewport.removeEventListener('scroll', handleVisualResize);
      }
      window.removeEventListener('resize', handleVisualResize);
    };
  }, [isOracleOpen]);

  const openOracle = () => {
    setIsOracleOpen(true);
    setIsOracleExpanded(true);
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const closeOracle = () => {
    setIsOracleOpen(false);
  };

  const toggleExpand = () => setIsOracleExpanded((prev) => !prev);

  return {
    isOracleOpen,
    isOracleExpanded,
    viewportHeight,
    keyboardHeight,
    oracleQuestion,
    oracleChat,
    isAskingOracle,
    chatBottomRef,
    oracleFormRef,
    openOracle,
    closeOracle,
    toggleExpand,
    handleAskOracle,
    setOracleQuestion,
    credits,
    setCredits,
  };
}
