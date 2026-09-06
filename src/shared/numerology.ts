// Motor Matemático de Numerologia (Pitagórica e Caldéia)
// 100% Executável localmente no cliente e servidor sem depender de APIs externas.

export interface NumerologyProfile {
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  lifePath: number; // Caminho da Vida / Destino
  expression: number; // Expressão / Missão
  soulUrge: number; // Desejo da Alma / Motivação (Vogais)
  personality: number; // Personalidade Exterior (Consoantes)
  personalYear: number; // Ano Pessoal Atual
  isMasterLifePath: boolean;
  isMasterExpression: boolean;
}

// Tabela Pitagórica Tradicional
const PYTHAGOREAN_TABLE: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

// Vogais para o Desejo da Alma (A, E, I, O, U e acentuadas)
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// Normalizar texto (remover acentos e caracteres especiais)
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

// Redução Teosófica preservando Números Mestres (11, 22, 33)
export function reduceToSingleDigitOrMaster(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return n;
}

// Redução Teosófica estrita (1 a 9)
export function reduceStrictSingleDigit(n: number): number {
  while (n > 9) {
    n = n
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return n;
}

// 1. Caminho da Vida (Life Path): Soma do Dia + Mês + Ano de nascimento
export function calculateLifePath(birthDateStr: string): number {
  const digits = birthDateStr.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return 1;

  let year = 1990, month = 1, day = 1;
  if (birthDateStr.includes('-')) {
    const parts = birthDateStr.split('-');
    if (parts[0] && parts[0].length === 4) {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1] ?? '1', 10);
      day = parseInt(parts[2] ?? '1', 10);
    } else {
      // MM-DD-YYYY
      month = parseInt(parts[0] ?? '1', 10);
      day = parseInt(parts[1] ?? '1', 10);
      year = parseInt(parts[2] ?? '1990', 10);
    }
  } else if (birthDateStr.includes('/')) {
    const parts = birthDateStr.split('/');
    if (parts[2] && parts[2].length === 4) {
      // MM/DD/YYYY (American standard)
      month = parseInt(parts[0] ?? '1', 10);
      day = parseInt(parts[1] ?? '1', 10);
      year = parseInt(parts[2], 10);
    } else if (parts[0] && parts[0].length === 4) {
      // YYYY/MM/DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1] ?? '1', 10);
      day = parseInt(parts[2] ?? '1', 10);
    } else {
      month = parseInt(parts[0] ?? '1', 10);
      day = parseInt(parts[1] ?? '1', 10);
      year = parseInt(parts[2] ?? '1990', 10);
    }
  } else  if (digits.length === 8) {
    // Default digits to MMDDYYYY (American standard)
    month = parseInt(digits.slice(0, 2), 10);
    day = parseInt(digits.slice(2, 4), 10);
    year = parseInt(digits.slice(4, 8), 10);
  }

  // Fail-safe inteligente: se o primeiro campo for > 12 (ex: 25/07/1995), ajusta automaticamente
  if (month > 12 && day <= 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  const redDay = reduceToSingleDigitOrMaster(day);
  const redMonth = reduceToSingleDigitOrMaster(month);
  const redYear = reduceToSingleDigitOrMaster(year);

  return reduceToSingleDigitOrMaster(redDay + redMonth + redYear);
}

// 2. Número de Expressão (também conhecido como Número do Destino): Soma de todas as letras do nome de certidão
export function calculateExpression(name: string): number {
  const clean = normalizeText(name);
  let sum = 0;
  for (const char of clean) {
    sum += PYTHAGOREAN_TABLE[char] || 0;
  }
  return reduceToSingleDigitOrMaster(sum);
}

// 3. Desejo da Alma (Soul Urge / Motivação Íntima): Soma apenas das vogais
export function calculateSoulUrge(name: string): number {
  const clean = normalizeText(name);
  let sum = 0;
  for (const char of clean) {
    if (VOWELS.has(char)) {
      sum += PYTHAGOREAN_TABLE[char] || 0;
    }
  }
  return reduceToSingleDigitOrMaster(sum);
}

// 4. Personalidade Exterior: Soma apenas das consoantes
export function calculatePersonality(name: string): number {
  const clean = normalizeText(name);
  let sum = 0;
  for (const char of clean) {
    if (!VOWELS.has(char)) {
      sum += PYTHAGOREAN_TABLE[char] || 0;
    }
  }
  return reduceToSingleDigitOrMaster(sum);
}

// 5. Ano Pessoal: Dia + Mês de Nascimento + Ano Universal Corrente
export function calculatePersonalYear(birthDateStr: string, currentYear = new Date().getFullYear()): number {
  const digits = birthDateStr.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 8) return 1;

  let day = 1, month = 1;
  if (birthDateStr.includes('-')) {
    const parts = birthDateStr.split('-');
    if (parts[0] && parts[0].length === 4) {
      month = parseInt(parts[1] ?? '1', 10);
      day = parseInt(parts[2] ?? '1', 10);
    } else {
      month = parseInt(parts[0] ?? '1', 10);
      day = parseInt(parts[1] ?? '1', 10);
    }
  } else if (birthDateStr.includes('/')) {
    const parts = birthDateStr.split('/');
    if (parts[2] && parts[2].length === 4) {
      // MM/DD/YYYY
      month = parseInt(parts[0] ?? '1', 10);
      day = parseInt(parts[1] ?? '1', 10);
    } else if (parts[0] && parts[0].length === 4) {
      month = parseInt(parts[1] ?? '1', 10);
      day = parseInt(parts[2] ?? '1', 10);
    } else {
      month = parseInt(parts[0] ?? '1', 10);
      day = parseInt(parts[1] ?? '1', 10);
    }
  } else if (digits.length === 8) {
    month = parseInt(digits.slice(0, 2), 10);
    day = parseInt(digits.slice(2, 4), 10);
  }

  // Fail-safe inteligente: se o primeiro campo for > 12 (ex: 25/07), ajusta automaticamente
  if (month > 12 && day <= 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  const sum = reduceStrictSingleDigit(day) + reduceStrictSingleDigit(month) + reduceStrictSingleDigit(currentYear);
  return reduceStrictSingleDigit(sum);
}

// 6. Mês Pessoal: Ano Pessoal + Mês do Calendário Atual
export function calculatePersonalMonth(personalYear: number, currentMonth = new Date().getMonth() + 1): number {
  const sum = reduceStrictSingleDigit(personalYear) + reduceStrictSingleDigit(currentMonth);
  return reduceStrictSingleDigit(sum);
}

// 7. Dia Pessoal: Mês Pessoal + Dia do Calendário Atual
export function calculatePersonalDay(personalMonth: number, currentDay = new Date().getDate()): number {
  const sum = reduceStrictSingleDigit(personalMonth) + reduceStrictSingleDigit(currentDay);
  return reduceStrictSingleDigit(sum);
}

// Gerar Perfil Numerológico Completo
export function calculateFullNumerology(fullName: string, birthDate: string): NumerologyProfile {
  const lifePath = calculateLifePath(birthDate);
  const expression = calculateExpression(fullName);
  const soulUrge = calculateSoulUrge(fullName);
  const personality = calculatePersonality(fullName);
  const personalYear = calculatePersonalYear(birthDate);

  return {
    fullName,
    birthDate,
    lifePath,
    expression,
    soulUrge,
    personality,
    personalYear,
    isMasterLifePath: [11, 22, 33].includes(lifePath),
    isMasterExpression: [11, 22, 33].includes(expression),
  };
}

export interface ArchetypeData {
  title: string;
  element: string;
  keyword: string;
  keywords: string[];
  color: string;
}

// Arquétipos traduzidos para EN, PT, ES (Padrão: EN)
export const NUMBER_ARCHETYPES_BY_LANG: Record<'en' | 'pt' | 'es', Record<number, Omit<ArchetypeData, 'keywords'>>> = {
  en: {
    1: { title: 'The Pioneer / The Leader', element: 'Fire', keyword: 'Independence, Courage, Creation', color: '#ef4444' },
    2: { title: 'The Diplomat / The Peacemaker', element: 'Water', keyword: 'Sensitivity, Cooperation, Harmony', color: '#06b6d4' },
    3: { title: 'The Communicator / The Artist', element: 'Air', keyword: 'Expression, Enthusiasm, Creativity', color: '#f59e0b' },
    4: { title: 'The Builder / The Strategist', element: 'Earth', keyword: 'Discipline, Order, Solidity', color: '#10b981' },
    5: { title: 'The Explorer / The Catalyst', element: 'Air/Fire', keyword: 'Freedom, Adventure, Transformation', color: '#8b5cf6' },
    6: { title: 'The Nurturer / The Harmonizer', element: 'Earth/Water', keyword: 'Love, Family, Responsibility', color: '#ec4899' },
    7: { title: 'The Mystic / The Seeker', element: 'Water/Spirit', keyword: 'Intuition, Analysis, Inner Wisdom', color: '#6366f1' },
    8: { title: 'The Sovereign / The Achiever', element: 'Earth/Fire', keyword: 'Power, Prosperity, Material Mastery', color: '#d97706' },
    9: { title: 'The Humanitarian / The Cosmic Guide', element: 'Fire/Ether', keyword: 'Compassion, Universal Wisdom, Completion', color: '#14b8a6' },
    11: { title: 'The Illuminator', element: 'Divine Light', keyword: 'Supreme Intuition, Spiritual Vision, Channel', color: '#a855f7' },
    22: { title: 'The Master Builder', element: 'Cosmos', keyword: 'Global Construction, Manifesting Giant Dreams', color: '#eab308' },
    33: { title: 'The Master Teacher', element: 'Universal Love', keyword: 'Spiritual Healing, Collective Elevation, Compassion', color: '#38bdf8' },
  },
  pt: {
    1: { title: 'O Pioneiro / O Líder', element: 'Fogo', keyword: 'Independência, Coragem, Criação', color: '#ef4444' },
    2: { title: 'O Diplomata / O Pacifista', element: 'Água', keyword: 'Sensibilidade, Cooperação, Harmonia', color: '#06b6d4' },
    3: { title: 'O Comunicador / O Artista', element: 'Ar', keyword: 'Expressão, Entusiasmo, Criatividade', color: '#f59e0b' },
    4: { title: 'O Construtor / O Estrategista', element: 'Terra', keyword: 'Disciplina, Ordem, Solidez', color: '#10b981' },
    5: { title: 'O Explorador / O Transformador', element: 'Ar/Fogo', keyword: 'Liberdade, Aventura, Mudança', color: '#8b5cf6' },
    6: { title: 'O Protetor / O Harmônico', element: 'Terra/Água', keyword: 'Amor, Família, Responsabilidade', color: '#ec4899' },
    7: { title: 'O Místico / O Sábio', element: 'Água/Espírito', keyword: 'Intuição, Análise, Conexão Divina', color: '#6366f1' },
    8: { title: 'O Soberano / O Realizador', element: 'Terra/Fogo', keyword: 'Poder, Prosperidade, Conquista Material', color: '#d97706' },
    9: { title: 'O Humanitário / O Guia Cósmico', element: 'Fogo/Éter', keyword: 'Compaixão, Sabedoria Universal, Conclusão', color: '#14b8a6' },
    11: { title: 'O Iluminador', element: 'Luz Divina', keyword: 'Intuição Suprema, Visão Espiritual, Canalizador', color: '#a855f7' },
    22: { title: 'O Mestre Arquiteto', element: 'Cosmos', keyword: 'Construção Global, Materialização de Sonhos Gigantes', color: '#eab308' },
    33: { title: 'O Mestre Avatar', element: 'Amor Universal', keyword: 'Cura Espiritual, Elevação Coletiva, Compaixão Crística', color: '#38bdf8' },
  },
  es: {
    1: { title: 'El Pionero / El Líder', element: 'Fuego', keyword: 'Independencia, Coraje, Creación', color: '#ef4444' },
    2: { title: 'El Diplomático / El Pacificador', element: 'Agua', keyword: 'Sensibilidad, Cooperación, Armonía', color: '#06b6d4' },
    3: { title: 'El Comunicador / El Artista', element: 'Aire', keyword: 'Expresión, Entusiasmo, Creatividad', color: '#f59e0b' },
    4: { title: 'El Constructor / El Estratega', element: 'Tierra', keyword: 'Disciplina, Orden, Solidez', color: '#10b981' },
    5: { title: 'El Explorador / El Catalizador', element: 'Aire/Fuego', keyword: 'Libertad, Aventura, Transformación', color: '#8b5cf6' },
    6: { title: 'El Protector / El Armónico', element: 'Tierra/Agua', keyword: 'Amor, Familia, Responsabilidad', color: '#ec4899' },
    7: { title: 'El Místico / El Sabio', element: 'Agua/Espíritu', keyword: 'Intuición, Análisis, Sabiduría Interior', color: '#6366f1' },
    8: { title: 'El Soberano / El Realizador', element: 'Tierra/Fuego', keyword: 'Poder, Prosperidad, Conquista Material', color: '#d97706' },
    9: { title: 'El Humanitario / El Guía Cósmico', element: 'Fuego/Éter', keyword: 'Compasión, Sabiduría Universal, Culminación', color: '#14b8a6' },
    11: { title: 'El Iluminador', element: 'Luz Divina', keyword: 'Intuición Suprema, Visión Espiritual, Canalizador', color: '#a855f7' },
    22: { title: 'El Maestro Arquitecto', element: 'Cosmos', keyword: 'Construcción Global, Materialización de Grandes Sueños', color: '#eab308' },
    33: { title: 'El Maestro Avatar', element: 'Amor Universal', keyword: 'Sanación Espiritual, Elevación Colectiva, Compasión', color: '#38bdf8' },
  },
};

// Export padrão com suporte retrocompatível
export const NUMBER_ARCHETYPES: Record<number, ArchetypeData> = Object.fromEntries(
  Object.entries(NUMBER_ARCHETYPES_BY_LANG.en).map(([k, v]) => [k, { ...v, keywords: v.keyword.split(', ') }])
);

export function getArchetype(num: number, lang: 'en' | 'pt' | 'es' = 'en'): ArchetypeData {
  const dict = NUMBER_ARCHETYPES_BY_LANG[lang] || NUMBER_ARCHETYPES_BY_LANG.en;
  const item = dict[num] || dict[1]!;
  return {
    ...item,
    keywords: item.keyword.split(', '),
  };
}
