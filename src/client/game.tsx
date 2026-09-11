import './index.css';

import { Component, useState, useRef, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { i18n, type SupportedLang } from './i18n';

// Componentes da Interface
import { Header, type SavedChart } from './components/Header';
import { PillarMatrix, type PillarId } from './components/PillarMatrix';
import { TabArchetype } from './components/TabArchetype';
import { TabPolarity } from './components/TabPolarity';
import { TabCycles } from './components/TabCycles';
import { TabDossier } from './components/TabDossier';
import { OracleChat } from './components/OracleChat';
import { HermeticStarIcon } from './components/HermeticStarIcon';
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
      let lang: SupportedLang = 'en';
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('destinyvox_lang') || localStorage.getItem('destinyvox_lang');
        if (stored && ['en', 'pt', 'es'].includes(stored)) {
          lang = stored as SupportedLang;
        }
      }
      const t = i18n[lang];

      return (
        <div className="w-screen h-screen bg-[#050505] text-[#f5f5f5] flex flex-col items-center justify-center p-6 text-center font-mono">
          <div className="border border-neutral-800 p-6 max-w-md bg-[#080808] space-y-3">
            <span className="text-neutral-500 text-xs tracking-widest uppercase block">{t.renderError}</span>
            <p className="font-editorial text-sm text-neutral-300">
              {this.state.error || t.renderErrorDefault}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 border border-neutral-700 bg-white text-black px-4 py-2 text-xs font-semibold hover:bg-neutral-200 transition-colors uppercase tracking-widest cursor-pointer"
            >
              {t.reload}
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
            {t.loadingQuote}
          </div>
          <div className="text-[10px] text-[var(--text-subtle)] tracking-widest uppercase pt-2 animate-pulse">
            [ {profileInit.loadingStep || t.loadingStep} ]
          </div>
        </div>
      </div>
    );
  }

  if (profileInit.error || !profileInit.readingData) {
    return (
      <div className="w-full h-full bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-6 text-center font-mono">
        <span className="text-[var(--text-subtle)] text-xs tracking-widest uppercase mb-2">{t.syncError}</span>
        <p className="font-editorial text-sm text-[var(--text-muted)] max-w-sm mb-4">{profileInit.error || t.syncErrorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="border border-[var(--border-main)] bg-[var(--bg-card)] px-4 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-card-alt)] transition-colors uppercase tracking-widest cursor-pointer"
        >
          {t.reconnect}
        </button>
      </div>
    );
  }

  const { profile, interpretation } = profileInit.readingData;

  return (
    <div
      style={{
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
      className="relative w-full h-full max-w-full bg-[var(--bg-main)] text-[var(--text-main)] select-none flex flex-col overflow-hidden"
    >
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

      {/* 3. CONTEÚDO PRINCIPAL */}
      <main
        ref={mainScrollRef}
        className="flex-1 z-10 max-w-3xl mx-auto w-full max-w-full overflow-y-auto overflow-x-hidden px-3 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 space-y-5 pb-14 sm:pb-16 box-border"
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

      {/* 4. NAVBAR FIXADO NO BOTTOM (ARCHETYPE, POLARITY, ORACLE AI, CYCLES, DOSSIER) */}
      <nav
        style={{
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-main)]/95 backdrop-blur-md border-t border-[var(--border-main)] shadow-lg max-w-full"
      >
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between px-1 sm:px-3 h-12 sm:h-14 font-mono text-[8px] sm:text-[9px] md:text-[10px] tracking-wider uppercase">
          {/* 1. ARCHETYPE */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 640 && oracle.isOracleOpen) oracle.closeOracle();
              setActiveTab('overview');
            }}
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all cursor-pointer py-1 ${
              activeTab === 'overview' && !oracle.isOracleOpen
                ? 'text-[var(--accent-gold)] font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="truncate px-0.5">{profileInit.lang === 'en' ? 'ARCHETYPE' : profileInit.lang === 'es' ? 'ARQUETIPO' : 'ARQUÉTIPO'}</span>
            {activeTab === 'overview' && !oracle.isOracleOpen && (
              <span className="w-3.5 sm:w-4 h-[1.5px] bg-[var(--accent-gold)] rounded-full mt-1 animate-fadeIn" />
            )}
          </button>

          {/* 2. POLARITY */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 640 && oracle.isOracleOpen) oracle.closeOracle();
              setActiveTab('talents');
            }}
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all cursor-pointer py-1 ${
              activeTab === 'talents' && !oracle.isOracleOpen
                ? 'text-[var(--accent-gold)] font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="truncate px-0.5">{profileInit.lang === 'en' ? 'POLARITY' : profileInit.lang === 'es' ? 'POLARIDAD' : 'POLARIDADE'}</span>
            {activeTab === 'talents' && !oracle.isOracleOpen && (
              <span className="w-3.5 sm:w-4 h-[1.5px] bg-[var(--accent-gold)] rounded-full mt-1 animate-fadeIn" />
            )}
          </button>

          {/* 3. ORACLE AI (SEMPRE VISÍVEL NO CENTRO DA NAVBAR - DESTAQUE AMPLIADO) */}
          <button
            type="button"
            onClick={() => {
              if (oracle.isOracleOpen) {
                oracle.closeOracle();
              } else {
                oracle.openOracle();
              }
            }}
            className="flex-1 flex flex-col items-center justify-center h-full transition-all cursor-pointer py-1 px-0.5"
          >
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full border transition-all ${
                oracle.isOracleOpen
                  ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] shadow-[0_0_14px_rgba(204,164,59,0.35)] font-bold'
                  : 'border-[var(--border-main)] bg-[var(--bg-card-alt)] hover:border-[var(--accent-gold)] text-[var(--text-main)] hover:text-[var(--accent-gold)] shadow-xs'
              }`}
            >
              <HermeticStarIcon className="w-4 sm:w-4.5 h-4 sm:h-4.5 shrink-0 rounded-[2.5px]" />
              <span className="font-semibold text-[8.5px] sm:text-[10px] md:text-[10.5px] whitespace-nowrap">
                {profileInit.lang === 'en' ? 'ORACLE AI' : 'ORÁCULO AI'}
              </span>
            </div>
          </button>

          {/* 4. CYCLES */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 640 && oracle.isOracleOpen) oracle.closeOracle();
              setActiveTab('year');
            }}
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all cursor-pointer py-1 ${
              activeTab === 'year' && !oracle.isOracleOpen
                ? 'text-[var(--accent-gold)] font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="truncate px-0.5">{profileInit.lang === 'en' ? 'CYCLES' : profileInit.lang === 'es' ? 'CICLOS' : 'CICLOS'}</span>
            {activeTab === 'year' && !oracle.isOracleOpen && (
              <span className="w-3.5 sm:w-4 h-[1.5px] bg-[var(--accent-gold)] rounded-full mt-1 animate-fadeIn" />
            )}
          </button>

          {/* 5. DOSSIER */}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 640 && oracle.isOracleOpen) oracle.closeOracle();
              setActiveTab('share');
            }}
            className={`flex-1 flex flex-col items-center justify-center h-full transition-all cursor-pointer py-1 ${
              activeTab === 'share' && !oracle.isOracleOpen
                ? 'text-[var(--accent-gold)] font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <span className="truncate px-0.5">{profileInit.lang === 'en' ? 'DOSSIER' : profileInit.lang === 'es' ? 'DOSSIER' : 'DOSSIÊ'}</span>
            {activeTab === 'share' && !oracle.isOracleOpen && (
              <span className="w-3.5 sm:w-4 h-[1.5px] bg-[var(--accent-gold)] rounded-full mt-1 animate-fadeIn" />
            )}
          </button>
        </div>
      </nav>

      {/* 5. ORÁCULO AI */}
      <OracleChat
        isOracleOpen={oracle.isOracleOpen}
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
        userToken={profileInit.userToken}
        onClose={oracle.closeOracle}
        onAskOracle={oracle.handleAskOracle}
        onOpenPortal={sharing.handleOpenPortal}
        t={t}
      />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <DestinyVoxApp />
  </ErrorBoundary>
);
