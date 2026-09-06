import { useState, useEffect, type Dispatch, type SetStateAction, type FormEvent } from 'react';
import { trpc } from '../trpc';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import type { SavedChart } from '../components/Header';
import type { SupportedLang } from '../i18n';

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
  const [loadingStep, setLoadingStep] = useState<string>('Decoding Pythagorean geometry...');
  const [error, setError] = useState<string>('');
  const [isVip, setIsVip] = useState<boolean>(false);
  const [redditUsername, setRedditUsername] = useState<string>('');
  const [userToken, setUserToken] = useState<string>('');
  const [lang, setLang] = useState<SupportedLang>('en');

  useEffect(() => {
    const initApp = async () => {
      const savedName = sessionStorage.getItem('destinyvox_name');
      const savedBirth = sessionStorage.getItem('destinyvox_birth');
      const storedLang = sessionStorage.getItem('destinyvox_lang');
      const savedLang: SupportedLang = storedLang && ['en', 'pt', 'es'].includes(storedLang) ? (storedLang as SupportedLang) : 'en';
      setLang(savedLang);

      try {
        const cached = localStorage.getItem('destinyvox_cached_charts');
        if (cached) setChartsList(JSON.parse(cached));
      } catch {
        // ignore
      }

      try {
        const saved = await trpc.destinyvox.getSavedProfile.query();
        if (saved.isVip) setIsVip(true);
        if (saved.username) setRedditUsername(saved.username);
        if (saved.userToken) setUserToken(saved.userToken);
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
        // ignore
      }

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
            setReadingData(res.result);
            const newChartObj: SavedChart = {
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
              // ignore
            }
            setIsLoading(false);
            return;
          }
        } catch (err: unknown) {
          console.error('Erro ao gerar:', err);
        }
      }

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
  }, [setChartsList]);

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
      charts.setNewChartError(msg || (lang === 'en' ? 'Failed to calculate new chart.' : 'Falha ao calcular novo mapa.'));
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
    redditUsername,
    userToken,
    lang,
    handleCreateNewChart,
  };
}
