import { useState, useEffect, useRef, type Dispatch, type SetStateAction, type FormEvent } from 'react';
import { trpc } from '../trpc';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import type { SavedChart } from '../components/Header';
import { i18n, type SupportedLang } from '../i18n';
import { calculatePersonalYear, getArchetype } from '../../shared/numerology';

function getInitialLang(): SupportedLang {
  if (typeof window !== 'undefined') {
    const storedLang = sessionStorage.getItem('destinyvox_lang') || localStorage.getItem('destinyvox_lang');
    if (storedLang && ['en', 'pt', 'es'].includes(storedLang)) {
      return storedLang as SupportedLang;
    }
  }
  return 'en';
}

// Garante que o perfil salvo tenha o Ano Pessoal e Arquétipo anual atualizados conforme a data corrente (ano, mês e dia)
function syncProfileCycles(data: CosmicReadingResult, lang: SupportedLang): CosmicReadingResult {
  const currentYear = new Date().getFullYear();
  if (!data?.profile?.birthDate) return data;

  const currentPersonalYear = calculatePersonalYear(data.profile.birthDate, currentYear);
  if (data.profile.personalYear === currentPersonalYear) {
    return data;
  }

  const yearArch = getArchetype(currentPersonalYear, lang);
  return {
    ...data,
    profile: {
      ...data.profile,
      personalYear: currentPersonalYear,
    },
    archetypes: {
      ...data.archetypes,
      personalYear: yearArch,
    },
  };
}

export function useProfileInit(
  setChartsList: Dispatch<SetStateAction<SavedChart[]>>,
  charts: {
    newChartName: string;
    newChartBirth: string;
    setNewChartName: (val: string) => void;
    setNewChartBirth: (val: string) => void;
    setNewChartError: (val: string) => void;
    setIsCalculatingNewChart: (val: boolean) => void;
    setShowNewChartModal: (val: boolean) => void;
  }
) {
  const [readingData, setReadingData] = useState<CosmicReadingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingStep, setLoadingStep] = useState<string>(() => i18n[getInitialLang()].loadingStep);
  const [error, setError] = useState<string>('');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [credits, setCredits] = useState<number>(0);
  const [redditUsername, setRedditUsername] = useState<string>('');
  const [userToken, setUserToken] = useState<string>('');
  const [lang, setLang] = useState<SupportedLang>(getInitialLang);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initApp = async () => {
      const savedName = sessionStorage.getItem('destinyvox_name') || localStorage.getItem('destinyvox_name');
      const savedBirth = sessionStorage.getItem('destinyvox_birth') || localStorage.getItem('destinyvox_birth');
      const storedLang = sessionStorage.getItem('destinyvox_lang') || localStorage.getItem('destinyvox_lang');
      const savedLang: SupportedLang = storedLang && ['en', 'pt', 'es'].includes(storedLang) ? (storedLang as SupportedLang) : 'en';
      setLang(savedLang);
      setLoadingStep(i18n[savedLang].loadingStep);

      try {
        const cached = localStorage.getItem('destinyvox_cached_charts');
        if (cached) setChartsList(JSON.parse(cached));
      } catch {
        // ignore
      }

      try {
        const saved = await trpc.destinyvox.getSavedProfile.query();
        setIsVip(Boolean(saved.isVip));
        setCredits(typeof saved.credits === 'number' ? saved.credits : 0);
        if (saved.username) setRedditUsername(saved.username);
        if (saved.userToken) setUserToken(saved.userToken);
        if (saved.charts && saved.charts.length > 0) {
          setChartsList(saved.charts);
          localStorage.setItem('destinyvox_cached_charts', JSON.stringify(saved.charts));
        }

        // 1. Prioriza reutilizar perfil salvo existente se o usuário já tem mapa cadastrado
        if (saved.charts && saved.charts.length > 0) {
          const matched = savedName 
            ? saved.charts.find(c => c.name.toLowerCase() === savedName.toLowerCase() || (savedBirth && c.birthDate === savedBirth))
            : saved.charts[0];
          if (matched && matched.data) {
            const synced = syncProfileCycles(matched.data, savedLang);
            setReadingData(synced);
            setIsLoading(false);
            return;
          }
        }

        if (saved.exists && saved.data) {
          const synced = syncProfileCycles(saved.data, savedLang);
          setReadingData(synced);
          setIsLoading(false);
          return;
        }
      } catch {
        // ignore
      }

      // 2. Se tem dados no sessionStorage ou localStorage (enviados via splash)
      if (savedName && savedBirth) {
        setLoadingStep(
          savedLang === 'en'
            ? 'Consulting the Oracle...'
            : savedLang === 'es'
            ? 'Consultando al Oráculo...'
            : 'Consultando o Oráculo...'
        );

        try {
          const res = await trpc.destinyvox.generateReading.mutate({
            fullName: savedName,
            birthDate: savedBirth,
            language: savedLang,
          });

          if (res.success && res.result) {
            const synced = syncProfileCycles(res.result, savedLang);
            setReadingData(synced);
            const newChartObj: SavedChart = {
              id: `chart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: savedName,
              birthDate: savedBirth,
              data: synced,
            };
            try {
              const saveRes = await trpc.destinyvox.saveChart.mutate({ chart: newChartObj });
              if (saveRes.success && saveRes.charts) {
                setChartsList(saveRes.charts);
                localStorage.setItem('destinyvox_cached_charts', JSON.stringify(saveRes.charts));
              }
            } catch {
              // ignore
            }
            setIsLoading(false);
            return;
          }
        } catch (err: unknown) {
          console.error('Erro ao gerar:', err);
          setError(
            savedLang === 'en'
              ? 'Failed to connect with the cosmos. Try reloading.'
              : savedLang === 'es'
              ? 'Fallo al conectar con el cosmos. Intenta recargar la página.'
              : 'Falha ao conectar com o cosmos. Tente recarregar a página.'
          );
        }
      }

      // 3. Caso nenhum dado tenha sido preenchido pelo usuário, abre o modal de criação diretamente
      charts.setShowNewChartModal(true);
      setIsLoading(false);
    };

    void initApp();
  }, [charts, setChartsList]);

  const handleCreateNewChart = async (e: FormEvent, errFullName: string, errBirthDate: string) => {
    e.preventDefault();
    if (!charts.newChartName.trim() || charts.newChartName.trim().length < 2) {
      charts.setNewChartError(errFullName);
      return;
    }
    if (!charts.newChartBirth || charts.newChartBirth.length !== 10) {
      charts.setNewChartError(errBirthDate);
      return;
    }
    const [mm, dd, yyyy] = charts.newChartBirth.split('/').map(Number);
    const currYear = new Date().getFullYear();
    if (!mm || mm < 1 || mm > 12 || !dd || dd < 1 || dd > 31 || !yyyy || yyyy < 1900 || yyyy > currYear) {
      charts.setNewChartError(errBirthDate);
      return;
    }

    charts.setNewChartError('');
    charts.setIsCalculatingNewChart(true);

    try {
      const res = await trpc.destinyvox.generateReading.mutate({
        fullName: charts.newChartName.trim(),
        birthDate: charts.newChartBirth,
        language: lang,
      });

      if (res.success && res.result) {
        const newChartObj: SavedChart = {
          id: `chart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: charts.newChartName.trim(),
          birthDate: charts.newChartBirth,
          data: res.result,
        };

        const saveRes = await trpc.destinyvox.saveChart.mutate({ chart: newChartObj });
        if (saveRes.success && saveRes.charts) {
          setChartsList(saveRes.charts);
          localStorage.setItem('destinyvox_cached_charts', JSON.stringify(saveRes.charts));
        } else {
          setChartsList((prev) => [newChartObj, ...prev.filter(c => c.name.toLowerCase() !== newChartObj.name.toLowerCase())]);
        }

        setReadingData(res.result);
        sessionStorage.setItem('destinyvox_name', charts.newChartName.trim());
        sessionStorage.setItem('destinyvox_birth', charts.newChartBirth);

        charts.setNewChartName('');
        charts.setNewChartBirth('');
        charts.setShowNewChartModal(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      charts.setNewChartError(
        msg || (lang === 'en'
          ? 'Failed to calculate new chart.'
          : lang === 'es'
          ? 'Fallo al calcular el nuevo mapa.'
          : 'Falha ao calcular novo mapa.')
      );
    } finally {
      charts.setIsCalculatingNewChart(false);
    }
  };

  return {
    readingData,
    setReadingData,
    isLoading,
    loadingStep,
    error,
    isVip,
    credits,
    setCredits,
    redditUsername,
    userToken,
    lang,
    handleCreateNewChart,
  };
}
