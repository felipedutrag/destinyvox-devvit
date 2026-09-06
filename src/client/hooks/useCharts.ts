import { useState, type Dispatch, type SetStateAction, type MouseEvent } from 'react';
import { trpc } from '../trpc';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import type { SavedChart } from '../components/Header';

export function useCharts(
  setChartsList: Dispatch<SetStateAction<SavedChart[]>>,
  setReadingData: Dispatch<SetStateAction<CosmicReadingResult | null>>
) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showNewChartModal, setShowNewChartModal] = useState<boolean>(false);
  const [chartToDelete, setChartToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingChart, setIsDeletingChart] = useState<boolean>(false);
  const [newChartName, setNewChartName] = useState<string>('');
  const [newChartBirth, setNewChartBirth] = useState<string>('');
  const [newChartError, setNewChartError] = useState<string>('');
  const [isCalculatingNewChart, setIsCalculatingNewChart] = useState<boolean>(false);

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

  const handleSelectChart = (chart: SavedChart) => {
    setReadingData(chart.data);
    setIsDropdownOpen(false);
    sessionStorage.setItem('destinyvox_name', chart.name);
    sessionStorage.setItem('destinyvox_birth', chart.birthDate);
  };

  const handleRequestDelete = (e: MouseEvent, chart: { id: string; name: string }) => {
    e.stopPropagation();
    setChartToDelete(chart);
  };

  const handleConfirmDelete = async () => {
    if (!chartToDelete || isDeletingChart) return;
    setIsDeletingChart(true);

    try {
      const res = await trpc.destinyvox.deleteChart.mutate({ chartId: chartToDelete.id });
      if (res.success && res.charts) {
        setChartsList(res.charts);
        localStorage.setItem('destinyvox_cached_charts', JSON.stringify(res.charts));
        if (res.charts.length > 0 && res.charts[0]) {
          const next = res.charts[0];
          setReadingData(next.data);
          sessionStorage.setItem('destinyvox_name', next.name);
          sessionStorage.setItem('destinyvox_birth', next.birthDate);
        } else {
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

  const handleResetChart = () => {
    setNewChartError('');
    setShowNewChartModal(true);
  };

  return {
    isDropdownOpen,
    setIsDropdownOpen,
    showNewChartModal,
    setShowNewChartModal,
    chartToDelete,
    setChartToDelete,
    isDeletingChart,
    newChartName,
    setNewChartName,
    newChartBirth,
    setNewChartBirth,
    newChartError,
    setNewChartError,
    isCalculatingNewChart,
    setIsCalculatingNewChart,
    handleNewChartBirthChange,
    handleSelectChart,
    handleRequestDelete,
    handleConfirmDelete,
    handleResetChart,
  };
}
