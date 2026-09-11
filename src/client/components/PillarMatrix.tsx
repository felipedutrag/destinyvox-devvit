import React from 'react';
import type { SupportedLang } from '../i18n';
import { getArchetype } from '../../shared/numerology';

export type PillarId = 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'personalYear';

interface PillarMatrixProps {
  profile: {
    lifePath: number;
    expression: number;
    soulUrge: number;
    personality: number;
    personalYear: number;
  };
  selectedPillar: PillarId;
  activeTab: string;
  lang: SupportedLang;
  onSelectPillar: (pillar: PillarId) => void;
  t: {
    pillarLifePath: string;
    pillarExpression: string;
    pillarSoulUrge: string;
    pillarPersonality: string;
    pillarPersonalYear: string;
  };
}

export const PillarMatrix: React.FC<PillarMatrixProps> = ({
  profile,
  selectedPillar,
  activeTab,
  lang,
  onSelectPillar,
  t,
}) => {
  return (
    <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)] z-20">
      <div className="max-w-5xl mx-auto grid grid-cols-5 divide-x divide-[var(--border-subtle)] text-center">
        {/* 1. Caminho de Vida (Destino) */}
        <button
          type="button"
          onClick={() => onSelectPillar('lifePath')}
          title="Life Path"
          className={`p-2.5 sm:p-4 transition-all duration-150 cursor-pointer text-center relative rounded-xs ${
            activeTab === 'overview' && selectedPillar === 'lifePath'
              ? 'bg-[var(--bg-card-alt)] ring-1.5 ring-inset ring-[var(--accent-gold)] shadow-xs'
              : 'hover:bg-[var(--bg-card-alt)] opacity-85 hover:opacity-100'
          }`}
        >
          <span className={`font-mono text-[9px] sm:text-[11px] uppercase tracking-widest block truncate ${
            activeTab === 'overview' && selectedPillar === 'lifePath' ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-subtle)]'
          }`}>
            {t.pillarLifePath}
          </span>
          <div className={`font-editorial text-2xl sm:text-4xl font-normal mt-0.5 transition-transform ${
            activeTab === 'overview' && selectedPillar === 'lifePath' ? 'text-[var(--text-main)] scale-105 font-medium' : 'text-[var(--text-main)]'
          }`}>
            {profile.lifePath}
          </div>
          <span className="font-mono text-[9px] sm:text-[11px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight font-medium">
            {getArchetype(profile.lifePath, lang).title.split('/')[0]}
          </span>
          {activeTab === 'overview' && selectedPillar === 'lifePath' && (
            <div className="w-6 h-[2px] bg-[var(--accent-gold)] mx-auto mt-1 rounded-full" />
          )}
        </button>

        {/* 2. Expressao */}
        <button
          type="button"
          onClick={() => onSelectPillar('expression')}
          title="Expression"
          className={`p-2.5 sm:p-4 transition-all duration-150 cursor-pointer text-center relative rounded-xs ${
            activeTab === 'overview' && selectedPillar === 'expression'
              ? 'bg-[var(--bg-card-alt)] ring-1.5 ring-inset ring-[var(--accent-gold)] shadow-xs'
              : 'hover:bg-[var(--bg-card-alt)] opacity-85 hover:opacity-100'
          }`}
        >
          <span className={`font-mono text-[9px] sm:text-[11px] uppercase tracking-widest block truncate ${
            activeTab === 'overview' && selectedPillar === 'expression' ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-subtle)]'
          }`}>
            {t.pillarExpression}
          </span>
          <div className={`font-editorial text-2xl sm:text-4xl font-normal mt-0.5 transition-transform ${
            activeTab === 'overview' && selectedPillar === 'expression' ? 'text-[var(--text-main)] scale-105 font-medium' : 'text-[var(--text-main)]'
          }`}>
            {profile.expression}
          </div>
          <span className="font-mono text-[9px] sm:text-[11px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight font-medium">
            {getArchetype(profile.expression, lang).title.split('/')[0]}
          </span>
          {activeTab === 'overview' && selectedPillar === 'expression' && (
            <div className="w-6 h-[2px] bg-[var(--accent-gold)] mx-auto mt-1 rounded-full" />
          )}
        </button>

        {/* 3. Desejo da Alma */}
        <button
          type="button"
          onClick={() => onSelectPillar('soulUrge')}
          title="Soul Urge"
          className={`p-2.5 sm:p-4 transition-all duration-150 cursor-pointer text-center relative rounded-xs ${
            activeTab === 'overview' && selectedPillar === 'soulUrge'
              ? 'bg-[var(--bg-card-alt)] ring-1.5 ring-inset ring-[var(--accent-gold)] shadow-xs'
              : 'hover:bg-[var(--bg-card-alt)] opacity-85 hover:opacity-100'
          }`}
        >
          <span className={`font-mono text-[9px] sm:text-[11px] uppercase tracking-widest block truncate ${
            activeTab === 'overview' && selectedPillar === 'soulUrge' ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-subtle)]'
          }`}>
            {t.pillarSoulUrge}
          </span>
          <div className={`font-editorial text-2xl sm:text-4xl font-normal mt-0.5 transition-transform ${
            activeTab === 'overview' && selectedPillar === 'soulUrge' ? 'text-[var(--text-main)] scale-105 font-medium' : 'text-[var(--text-main)]'
          }`}>
            {profile.soulUrge}
          </div>
          <span className="font-mono text-[9px] sm:text-[11px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight font-medium">
            {getArchetype(profile.soulUrge, lang).title.split('/')[0]}
          </span>
          {activeTab === 'overview' && selectedPillar === 'soulUrge' && (
            <div className="w-6 h-[2px] bg-[var(--accent-gold)] mx-auto mt-1 rounded-full" />
          )}
        </button>

        {/* 4. Personalidade */}
        <button
          type="button"
          onClick={() => onSelectPillar('personality')}
          title="Personality"
          className={`p-2.5 sm:p-4 transition-all duration-150 cursor-pointer text-center relative rounded-xs ${
            activeTab === 'overview' && selectedPillar === 'personality'
              ? 'bg-[var(--bg-card-alt)] ring-1.5 ring-inset ring-[var(--accent-gold)] shadow-xs'
              : 'hover:bg-[var(--bg-card-alt)] opacity-85 hover:opacity-100'
          }`}
        >
          <span className={`font-mono text-[9px] sm:text-[11px] uppercase tracking-widest block truncate ${
            activeTab === 'overview' && selectedPillar === 'personality' ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-subtle)]'
          }`}>
            {t.pillarPersonality}
          </span>
          <div className={`font-editorial text-2xl sm:text-4xl font-normal mt-0.5 transition-transform ${
            activeTab === 'overview' && selectedPillar === 'personality' ? 'text-[var(--text-main)] scale-105 font-medium' : 'text-[var(--text-main)]'
          }`}>
            {profile.personality}
          </div>
          <span className="font-mono text-[9px] sm:text-[11px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight font-medium">
            {getArchetype(profile.personality, lang).title.split('/')[0]}
          </span>
          {activeTab === 'overview' && selectedPillar === 'personality' && (
            <div className="w-6 h-[2px] bg-[var(--accent-gold)] mx-auto mt-1 rounded-full" />
          )}
        </button>

        {/* 5. Ano Pessoal */}
        <button
          type="button"
          onClick={() => onSelectPillar('personalYear')}
          title="Personal Year"
          className={`p-2.5 sm:p-4 transition-all duration-150 cursor-pointer text-center relative rounded-xs ${
            activeTab === 'overview' && selectedPillar === 'personalYear'
              ? 'bg-[var(--bg-card-alt)] ring-1.5 ring-inset ring-[var(--accent-gold)] shadow-xs'
              : 'hover:bg-[var(--bg-card-alt)] opacity-85 hover:opacity-100'
          }`}
        >
          <span className={`font-mono text-[9px] sm:text-[11px] uppercase tracking-widest block truncate ${
            activeTab === 'overview' && selectedPillar === 'personalYear' ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-subtle)]'
          }`}>
            {t.pillarPersonalYear}
          </span>
          <div className={`font-editorial text-2xl sm:text-4xl font-normal mt-0.5 transition-transform ${
            activeTab === 'overview' && selectedPillar === 'personalYear' ? 'text-[var(--text-main)] scale-105 font-medium' : 'text-[var(--text-main)]'
          }`}>
            {profile.personalYear}
          </div>
          <span className="font-mono text-[9px] sm:text-[11px] text-[var(--text-muted)] truncate block mt-0.5 tracking-tight font-medium">
            {getArchetype(profile.personalYear, lang).title.split('/')[0]}
          </span>
          {activeTab === 'overview' && selectedPillar === 'personalYear' && (
            <div className="w-6 h-[2px] bg-[var(--accent-gold)] mx-auto mt-1 rounded-full" />
          )}
        </button>
      </div>
    </section>
  );
};
