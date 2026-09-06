import { useState, useEffect, useRef, type FormEvent } from 'react';
import { trpc } from '../trpc';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import type { SupportedLang } from '../i18n';
import type { OracleChatMessage } from '../components/OracleChat';

export function useOracle(readingData: CosmicReadingResult | null, lang: SupportedLang) {
  const [isOracleOpen, setIsOracleOpen] = useState<boolean>(false);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setOracleChat((prev) => [
        ...prev,
        {
          sender: 'oracle',
          text: `[Erro Oráculo]: ${msg}`,
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

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
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
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: 'auto' });
        }, 30);
      }
    };

    handleVisualResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualResize);
    }
    window.addEventListener('resize', handleVisualResize);

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualResize);
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
  };
}
