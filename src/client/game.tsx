import './index.css';

import { Component, useState, useRef, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { i18n } from './i18n';

// Componentes da Interface
import { Header, type SavedChart } from './components/Header';
import { PillarMatrix, type PillarId } from './components/PillarMatrix';
import { TabArchetype } from './components/TabArchetype';
import { TabPolarity } from './components/TabPolarity';
import { TabCycles } from './components/TabCycles';
import { TabDossier } from './components/TabDossier';
import { OracleChat } from './components/OracleChat';
import { DeleteChartModal, NewChartModal } from './components/Modals';

// Custom Hooks
import { useTheme } from './hooks/useTheme';
import { useOracle } from './hooks/useOracle';
import { useCharts } from './hooks/useCharts';
import { useSharing } from './hooks/useSharing';
import { useProfileInit } from './hooks/useProfileInit';

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
        <div className="w-screen h-screen bg-[#050505] text-[#f5f5f5] flex flex-col items-center justify-center p-6 text-center font-mono">
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

export const DestinyVoxApp = () => {
  const [chartsList, setChartsList] = useState<SavedChart[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<PillarId>('lifePath');
  const [activeTab, setActiveTab] = useState<'overview' | 'talents' | 'year' | 'share'>('overview');
  const mainScrollRef = useRef<HTMLElement>(null);

  // Hooks especializados
  const { isDarkMode, toggleTheme } = useTheme();
  const charts = useCharts(setChartsList, () => { });
  const profileInit = useProfileInit(setChartsList, charts);
  const t = i18n[profileInit.lang];

  const oracle = useOracle(profileInit.readingData, profileInit.lang, profileInit.credits);
  const sharing = useSharing(profileInit.readingData, profileInit.lang, profileInit.redditUsername, profileInit.userToken);

  if (profileInit.isLoading) {
    return (
      <div className="w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-6 select-none font-mono">
        <div className="text-center space-y-4 max-w-xs">
          <div className="text-xs text-[var(--text-subtle)] tracking-[0.3em] uppercase">✦ DESTINYVOX</div>
          <div className="w-12 h-[1px] bg-[var(--border-main)] mx-auto my-4" />
          <div className="font-editorial italic text-base text-[var(--text-muted)]">
            &ldquo;Tudo no universo é número e proporção.&rdquo;
          </div>
          <div className="text-[10px] text-[var(--text-subtle)] tracking-widest uppercase pt-2 animate-pulse">
            [ {profileInit.loadingStep} ]
          </div>
        </div>
      </div>
    );
  }

  if (profileInit.error || !profileInit.readingData) {
    return (
      <div className="w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-6 text-center font-mono">
        <span className="text-[var(--text-subtle)] text-xs tracking-widest uppercase mb-2">[ ERRO DE SINCRONIZAÇÃO ]</span>
        <p className="font-editorial text-sm text-[var(--text-muted)] max-w-sm mb-4">{profileInit.error || 'Não foi possível ler as efemérides.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] transition-colors uppercase tracking-widest cursor-pointer"
        >
          RECONECTAR
        </button>
      </div>
    );
  }

  const { profile, interpretation } = profileInit.readingData;

  const tabs = [
    { id: 'overview', label: profileInit.lang === 'en' ? 'ARCHETYPE' : profileInit.lang === 'es' ? 'ARQUETIPO' : 'ARQUÉTIPO' },
    { id: 'talents', label: profileInit.lang === 'en' ? 'POLARITY' : profileInit.lang === 'es' ? 'POLARIDAD' : 'POLARIDADE' },
    { id: 'year', label: profileInit.lang === 'en' ? 'CYCLES' : profileInit.lang === 'es' ? 'CICLOS' : 'CICLOS' },
    { id: 'share', label: profileInit.lang === 'en' ? 'DOSSIER' : profileInit.lang === 'es' ? 'DOSSIER' : 'DOSSIÊ' },
  ] as const;

  return (
    <div className="relative w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] select-none flex flex-col overflow-hidden">
      {/* 1. HEADER EDITORIAL */}
      <Header
        brand={t.brand}
        fullName={profile.fullName}
        birthDate={profile.birthDate}
        lifePath={profile.lifePath}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onResetChart={charts.handleResetChart}
        chartsList={chartsList}
        isDropdownOpen={charts.isDropdownOpen}
        setIsDropdownOpen={charts.setIsDropdownOpen}
        onSelectChart={(c) => {
          profileInit.setReadingData(c.data);
          charts.handleSelectChart(c);
        }}
        onRequestDelete={charts.handleRequestDelete}
        onNavigateToShare={() => setActiveTab('share')}
        t={t}
      />

      {/* MODAIS DE APOIO */}
      <DeleteChartModal
        chartToDelete={charts.chartToDelete}
        isDeletingChart={charts.isDeletingChart}
        onConfirm={charts.handleConfirmDelete}
        onCancel={() => charts.setChartToDelete(null)}
        t={t}
      />

      <NewChartModal
        showNewChartModal={charts.showNewChartModal}
        newChartName={charts.newChartName}
        newChartBirth={charts.newChartBirth}
        newChartError={charts.newChartError}
        isCalculatingNewChart={charts.isCalculatingNewChart}
        onClose={() => charts.setShowNewChartModal(false)}
        onSubmit={(e) => profileInit.handleCreateNewChart(e, t.errFullName, t.errBirthDate)}
        onNameChange={charts.setNewChartName}
        onBirthChange={charts.handleNewChartBirthChange}
        t={t}
      />

      {/* 2. OS 5 PILARES */}
      <PillarMatrix
        profile={profile}
        selectedPillar={selectedPillar}
        activeTab={activeTab}
        lang={profileInit.lang}
        onSelectPillar={(pillar) => {
          setSelectedPillar(pillar);
          setActiveTab('overview');
        }}
        t={t}
      />

      {/* 3. NAVEGAÇÃO DE ABAS */}
      <nav className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-main)] z-20">
        <div className="max-w-3xl mx-auto flex items-center overflow-x-auto no-scrollbar scroll-smooth px-3 sm:px-6 sm:justify-center gap-2 sm:gap-6 font-mono text-[10px] sm:text-[11px] tracking-[0.16em] uppercase whitespace-nowrap">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 sm:py-3 px-3 sm:px-4 border-b-2 transition-all duration-150 cursor-pointer flex-shrink-0 text-center ${isActive
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

      {/* 4. CONTEÚDO PRINCIPAL */}
      <main
        ref={mainScrollRef}
        className={`flex-1 z-10 max-w-3xl mx-auto w-full overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 ${
          (profileInit.isVip || oracle.credits > 0) ? 'pb-20 sm:pb-24' : 'pb-6 sm:pb-8'
        }`}
      >
        {activeTab === 'overview' && (
          <TabArchetype
            profile={profile}
            interpretation={interpretation}
            selectedPillar={selectedPillar}
            lang={profileInit.lang}
            t={t}
          />
        )}

        {activeTab === 'talents' && (
          <TabPolarity
            interpretation={interpretation}
            t={t}
          />
        )}

        {activeTab === 'year' && (
          <TabCycles
            profile={profile}
            interpretation={interpretation}
            lang={profileInit.lang}
            t={t}
          />
        )}

        {activeTab === 'share' && (
          <TabDossier
            profile={profile}
            interpretation={interpretation}
            lang={profileInit.lang}
            t={t}
            commentSuccess={sharing.commentSuccess}
            commentError={sharing.commentError}
            isPostingComment={sharing.isPostingComment}
            onPostToRedditComments={sharing.handlePostToRedditComments}
            onOpenPortal={sharing.handleOpenPortal}
            onResetChart={charts.handleResetChart}
          />
        )}
      </main>

      {/* 5. ORÁCULO (Visível apenas para quem realizou o pagamento / VIP ou possui créditos) */}
      {(profileInit.isVip || oracle.credits > 0) && (
        <OracleChat
          isOracleOpen={oracle.isOracleOpen}
          viewportHeight={oracle.viewportHeight}
          oracleQuestion={oracle.oracleQuestion}
          oracleChat={oracle.oracleChat}
          isAskingOracle={oracle.isAskingOracle}
          chatBottomRef={oracle.chatBottomRef}
          oracleFormRef={oracle.oracleFormRef}
          profile={profile}
          lang={profileInit.lang}
          isVip={profileInit.isVip || oracle.credits > 0}
          credits={oracle.credits}
          username={profileInit.redditUsername}
          onOpen={oracle.openOracle}
          onClose={oracle.closeOracle}
          onAskOracle={oracle.handleAskOracle}
          onQuestionChange={oracle.setOracleQuestion}
          t={t}
        />
      )}

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
