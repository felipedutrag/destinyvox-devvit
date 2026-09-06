import React from 'react';
import type { CosmicReadingResult } from '../../server/destinyVoxEngine';
import { formatAmericanDate } from '../i18n';

export interface SavedChart {
  id: string;
  name: string;
  birthDate: string;
  data: CosmicReadingResult;
}

interface HeaderProps {
  brand: string;
  fullName: string;
  birthDate: string;
  lifePath: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onResetChart: () => void;
  chartsList: SavedChart[];
  isDropdownOpen: boolean;
  setIsDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectChart: (chart: SavedChart) => void;
  onRequestDelete: (e: React.MouseEvent, chart: { id: string; name: string }) => void;
  onNavigateToShare: () => void;
  t: {
    toggleTheme: string;
    newChartBtn: string;
    chartsBtn: string;
    savedChartsTitle: string;
    newWord: string;
    currentTag: string;
    deleteChartTooltip: string;
    viewFullDossier: string;
  };
}

export const Header: React.FC<HeaderProps> = ({
  brand,
  fullName,
  birthDate,
  lifePath,
  isDarkMode,
  onToggleTheme,
  onResetChart,
  chartsList,
  isDropdownOpen,
  setIsDropdownOpen,
  onSelectChart,
  onRequestDelete,
  onNavigateToShare,
  t,
}) => {
  return (
    <header className="h-12 border-b border-[var(--border-subtle)] px-3 sm:px-6 flex items-center justify-between z-30 bg-[var(--bg-main)]">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <span className="text-[var(--text-subtle)] text-xs">✦</span>
        <span className="font-mono text-[11px] tracking-[0.25em] text-[var(--text-main)] font-medium uppercase truncate">
          {brand}
        </span>
        <span className="hidden sm:inline-block text-neutral-600 font-mono text-[10px] tracking-widest truncate">
          / {fullName.toUpperCase()}
        </span>
      </div>

      {/* Botoes do Topo: Theme Toggle, Novo Mapa & Dropdown de Mapas */}
      <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[10px]">
        {/* Theme Toggle - Desktop & Mobile */}
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-6 h-6 border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-card)] cursor-pointer inline-flex items-center justify-center transition-colors rounded-xs"
          title={t.toggleTheme}
          aria-label={t.toggleTheme}
        >
          {isDarkMode ? (
            /* Sun Icon */
            <svg
              className="w-3.5 h-3.5 stroke-[var(--text-main)] fill-none stroke-[1.5]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg
              className="w-3.5 h-3.5 stroke-[var(--text-main)] fill-none stroke-[1.5]"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          )}
        </button>

        <button
          onClick={onResetChart}
          title="Calcular para outra pessoa ou gerar novo mapa"
          className="font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-[var(--border-subtle)] px-2 sm:px-2.5 py-1 text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:border-[var(--border-main)] transition-colors cursor-pointer whitespace-nowrap"
        >
          {t.newChartBtn}
        </button>

        {/* DROPDOWN COM MAPAS GERADOS */}
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
                      onResetChart();
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
                        <span className="text-[var(--text-main)] font-medium block truncate">{fullName}</span>
                        <span className="text-[9px] text-[var(--text-subtle)]">#{lifePath} • {formatAmericanDate(birthDate)}</span>
                      </div>
                      <span className="text-[9px] text-[var(--accent-gold)] uppercase tracking-widest font-semibold ml-2">{t.currentTag}</span>
                    </div>
                  ) : (
                    chartsList.map((c) => {
                      const isSelected = c.name.toLowerCase() === fullName.toLowerCase();
                      return (
                        <div
                          key={c.id}
                          onClick={() => onSelectChart(c)}
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

                          {/* Botao de Excluir Mapa */}
                          <button
                            onClick={(e) => onRequestDelete(e, { id: c.id, name: c.name })}
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

                {/* Rodape do Menu com atalho para Dossie completo */}
                <div className="border-t border-[var(--border-subtle)] p-2 bg-[var(--bg-card)]">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onNavigateToShare();
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
  );
};
