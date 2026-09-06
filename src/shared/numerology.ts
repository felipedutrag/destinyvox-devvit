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

// Ditames da Alma Únicos por Número (1-9, 11, 22, 33) nos 3 idiomas
export const SOUL_DICTUMS_BY_LANG: Record<'en' | 'pt' | 'es', Record<number, string>> = {
  en: {
    1: 'You originate the flame; do not fear walking the solitary frontier where creation begins.',
    2: 'Your power lies in quiet receptivity; true strength listens before the world speaks.',
    3: 'Give form to the unspoken word; authentic beauty is your most revolutionary act.',
    4: 'Erect an unshakeable temple within; discipline is the sacred vessel of freedom.',
    5: 'Transmute the winds of change into wings; liberty is your eternal compass.',
    6: 'Heal without possessing; genuine love expands the horizon of all it touches.',
    7: 'Step into the lucid silence; the wisdom you seek was never outside your own depth.',
    8: 'Command without tyranny; spiritual mastery and material abundance are one current.',
    9: 'Release the ephemeral to grasp the universal; your compassion dissolves all boundaries.',
    11: 'Anchor the celestial beacon; your intuition sees through the veil of mortal illusion.',
    22: 'Build what outlives generations; turn cosmic vision into earthly monuments.',
    33: 'Radiate unconditional solace; true mastery is the selfless elevation of human souls.',
  },
  pt: {
    1: 'Você inaugura a chama primordial; não tema caminhar na fronteira solitária onde tudo se cria.',
    2: 'Seu poder reside na receptividade sutil; a verdadeira força sabe escutar antes do mundo falar.',
    3: 'Dê contorno à palavra não dita; a beleza autêntica é o seu ato mais revolucionário.',
    4: 'Edifique um templo inabalável por dentro; a disciplina é o vaso sagrado da liberdade.',
    5: 'Transmute os ventos do imprevisto em asas; a liberdade é a sua bússola imutável.',
    6: 'Acolha sem aprisionar; o amor maduro expande os horizontes de tudo o que toca.',
    7: 'Mergulhe no silêncio lúcido; a verdade que você persegue sempre habitou em sua profundeza.',
    8: 'Governe sem tirania; a maestria espiritual e o poder material formam a mesma corrente.',
    9: 'Desapegue do efêmero para tocar o universal; sua compaixão dissolve todas as fronteiras.',
    11: 'Ancore o farol celestial na terra; sua intuição lúcida desfaz as ilusões do mundo ordinário.',
    22: 'Construa aquilo que desafia os séculos; transforme visões universais em monumentos tangíveis.',
    33: 'Irradie alívio e compaixão incondicional; a maestria suprema é elevar a alma dos que cruzam seu caminho.',
  },
  es: {
    1: 'Tú enciendes el fuego primordial; no temas caminar en la frontera solitaria donde todo nace.',
    2: 'Tu poder reside en la escucha sutil; la verdadera fuerza comprende antes de que el mundo hable.',
    3: 'Da forma a la palabra no dicha; la belleza auténtica es tu acto más revolucionario.',
    4: 'Construye un templo inquebrantable en tu interior; la disciplina es el cáliz de la libertad.',
    5: 'Transforma los vientos del cambio en alas; la libertad lúcida es tu brújula eterna.',
    6: 'Acoge sin aprisionar; el amor verdadero expande el horizonte de todo lo que roza.',
    7: 'Adéntrate en el silencio lúcido; la sabiduría que buscas siempre latió en tu propia profundidad.',
    8: 'Gobierna sin tiranía; la maestria espiritual y la abundancia material son una misma corriente.',
    9: 'Suelta lo efímero para abrazar lo universal; tu compasión trasciende cualquier frontera.',
    11: 'Ancla el faro divino en la tierra; tu intuición penetra el velo de cualquier ilusión.',
    22: 'Edifica lo que perdura a través de los siglos; convierte sueños titánicos en realidades tangibles.',
    33: 'Irradia consuelo incondicional; la maestría más alta es la elevación desinteresada de las almas.',
  },
};

export function getSoulDictum(num: number, lang: 'en' | 'pt' | 'es' = 'en'): string {
  const dict = SOUL_DICTUMS_BY_LANG[lang] || SOUL_DICTUMS_BY_LANG.en;
  return dict[num] || dict[1]!;
}

// Interpretações Profundas do Desejo da Alma (Soul Urge) - 2 parágrafos formatados com \n\n
export const SOUL_URGE_DEEP_BY_LANG: Record<'en' | 'pt' | 'es', Record<number, string>> = {
  en: {
    1: 'Your soul hungers for sovereign independence and unconditioned creative freedom. In the silence of your core, you feel an imperative need to walk untrodden trails and forge your own destiny without seeking external approval.\n\nFulfillment arises when you trust your inner compass and take absolute ownership of your choices, turning solitary vision into purposeful creation.',
    2: 'Your soul secretly longs for exquisite harmony, emotional reciprocity, and meaningful connection. Inwardly, you crave environments of deep peace where understanding flows without words and where partnerships are built on unconditional trust.\n\nYour highest joy emerges when you act as an empathetic mediator, weaving bridges of goodwill and cultivating tranquil sanctuary around you.',
    3: 'Your soul yearns for radiant self-expression, joyful authenticity, and imaginative play. Behind every thought lies a deep impulse to communicate beauty, awaken laughter, and illuminate the emotional landscape of those you encounter.\n\nInner fulfillment blooms when you release self-censorship and channel your vibrant creativity into art, words, or heart-centered inspiration.',
    4: 'Your soul seeks enduring solidity, sacred order, and psychological security. At your center, you desire to construct realities that stand the test of time, grounding ephemeral ideas into practical, reliable structures.\n\nTrue contentment arrives when your daily routines reflect quiet discipline, offering a safe harbor where yourself and others can thrive with certitude.',
    5: 'Your soul craves untamed freedom, sensory exploration, and boundless evolution. Within your deepest layers lives an adventurer who rejects rigid dogmas, hungering to experience the kaleidoscope of human experience and sacred curiosity.\n\nInner vitality surges when you embrace change as your natural element, transmuting life’s unpredictability into expansive wisdom.',
    6: 'Your soul is driven by the instinct to nurture, protect, and beautify the hearth of human existence. In quiet moments, you dream of creating sanctuary where unconditional love heals burdens and where family and community feel profoundly safe.\n\nYour inner peace stabilizes when you balance selfless devotion with healthy boundaries, allowing yourself to receive the very care you offer.',
    7: 'Your soul pursues the sacred mystery, lucid solitude, and existential truth. In the inner sanctum of your psyche, you require silence and contemplation to pierce the veil of surface reality and decipher life’s hidden architecture.\n\nGenuine fulfillment awakens when you honor your need for quiet retreats, synthesizing intellectual analysis with profound spiritual intuition.',
    8: 'Your soul aspires to material mastery, executive authority, and sovereign stewardship. Deep down, you are called to wield worldly influence not out of vanity, but to manifest prosperity and build lasting systems of empowerment.\n\nYour core settles into majesty when you align material ambition with moral integrity, directing power toward collective elevation.',
    9: 'Your soul vibrates with universal compassion, artistic transcendence, and humanitarian love. At your essence, you belong to the cosmos, desiring to alleviate global suffering, complete karmic cycles, and inspire through generous release.\n\nDeep peace envelopes you when you surrender attachment to personal credit, trusting that your unconditional gifts ripple across eternity.',
    11: 'Your soul carries the torch of high spiritual illumination and visionary insight. Inwardly, you register the subtle vibrational currents of the collective unconscious, seeking to awaken higher consciousness in humanity.\n\nFulfillment is found when you ground your supreme intuition into compassionate guidance, serving as an unshakable lighthouse for searching souls.',
    22: 'Your soul envisions giant architectures that transform human society for generations. At your center lives the Master Builder, eager to bridge cosmic ideals with massive, tangible engineering in the physical world.\n\nYour soul finds rest only in noble purpose: executing grand, practical visions that offer sustainable progress to communities and nations.',
    33: 'Your soul radiates the highest octave of unconditional devotion and Christic healing. Within your core beats an infinite reservoir of empathy dedicated to consoling the afflicted and elevating the spiritual frequency of the world.\n\nYour ultimate fulfillment unfolds as you embody compassionate wisdom, uplifting every human heart that crosses your sacred journey.',
  },
  pt: {
    1: 'Sua alma anseia por independência soberana e liberdade criativa incondicionada. No silêncio do seu íntimo, você sente uma necessidade imperativa de desbravar caminhos virgens e forjar o próprio destino sem depender de aprovação alheia.\n\nA plenitude desperta quando você confia na sua bússola interior e assume a autoria absoluta das suas escolhas, transformando visão solitária em criação concreta.',
    2: 'Sua alma anseia secretamente por harmonia profunda, reciprocidade afetiva e conexões de alma. No seu âmago, você busca ambientes de serenidade onde a compreensão aconteça sem palavras e onde as alianças sejam fundadas na lealdade.\n\nSua maior realização floresce ao atuar como mediador empático, tecendo pontes de concórdia e estabelecendo refúgios de acolhimento ao seu redor.',
    3: 'Sua alma vibra pela autoexpressão espontânea, autenticidade efervescente e imaginação fértil. Por trás de cada pensamento existe o impulso vital de comunicar beleza, semear entusiasmo e colorir a experiência dos que cruzam seu caminho.\n\nA realização íntima floresce quando você supera o medo do julgamento e canaliza sua energia viva em arte, palavras e inspiração genuína.',
    4: 'Sua alma busca solidez inabalável, ordem sagrada e segurança existencial. No seu centro, reside o desejo de construir realidades que resistam ao tempo, ancorando ideias dispersas em estruturas confiáveis e tangíveis.\n\nO contentamento genuíno surge quando sua rotina reflete disciplina paciente, oferecendo uma fundação segura sobre a qual você e os seus possam prosperar com estabilidade.',
    5: 'Sua alma anseia por liberdade irrevogável, expansão de horizontes e mutabilidade contínua. Dentro de você mora um espírito peregrino avesso a prisões conceituais, sedento por experimentar a multiplicidade do mundo e o mistério da vida.\n\nSua vitalidade interior se renova quando você abraça as transformações como aliadas, transformando o imprevisto em sabedoria e evolução contínua.',
    6: 'Sua alma é movida pelo chamado sagrado de proteger, acolher e harmonizar os laços humanos. Nos instantes de reflexão, você aspira a criar santuários onde o amor cure feridas e onde a convivência seja pautada pelo afeto e cuidado mútuo.\n\nA serenidade interior se consolida quando você equilibra a dedicação aos outros com limites saudáveis, permitindo-se também ser cuidado e nutrido.',
    7: 'Sua alma persegue o mistério velado, a solitude lúcida e as verdades essenciais da existência. No recesso mais íntimo da sua psique, você necessita de silêncio para decifrar as leis invisíveis que regem a vida e o cosmos.\n\nA plenitude autêntica surge quando você honra seus momentos de recolhimento, unindo o rigor analítico à intuição espiritual profunda.',
    8: 'Sua alma almeja maestria material, liderança executiva e soberania prática. No fundo, você é chamado a exercer autoridade transformadora no mundo, não por vaidade, mas pela vocação de materializar prosperidade e erguer sistemas justos.\n\nSeu eixo se estabiliza em grandeza quando você alia ambição pragmática a princípios éticos elevados, canalizando sua força para o bem coletivo.',
    9: 'Sua alma ressoa com compaixão universal, desapego maduro e fraternidade cósmica. No cerne do seu ser, você compreende a unidade de todas as coisas, desejando amenizar o sofrimento humano e fechar ciclos com sabedoria e generosidade.\n\nA paz profunda envolve seu espírito quando você atua com desprendimento de méritos pessoais, ciente de que o bem praticado se propaga pela eternidade.',
    11: 'Sua alma carrega a tocha da iluminação espiritual e da percepção visionária. No íntimo, você capta com clareza as correntes sutis do inconsciente coletivo, sentindo o chamado de despertar lucidez nos corações adormecidos.\n\nA realização reside em aterrar sua intuição divina em conselhos e ações conscientes, agindo como farol sereno em tempos de incerteza.',
    22: 'Sua alma sonha com obras gigantescas que sirvam à humanidade por gerações. No seu núcleo habita o Mestre Arquiteto, desejoso de converter visões utópicas em monumentos práticos e estruturas de transformação duradoura.\n\nSua alma encontra descanso na magnitude: materializar grandes projetos com solidez pragmática, beneficiando comunidades e abrindo futuros.',
    33: 'Sua alma irradia a frequência crística da compaixão curadora e do amor universal incondicional. Dentro de você pulsa uma fonte inesgotável de carinho voltada a confortar os aflitos e inspirar o perdão e a fraternidade humana.\n\nSeu propósito se consuma ao encarnar a sabedoria do coração, acolhendo e elevando qualquer ser que necessite de amparo.',
  },
  es: {
    1: 'Tu alma anhela independencia soberana y libertad creadora absoluta. En el silencio de tu centro, sientes la necesidad imperativa de abrir caminos vírgenes y forjar tu destino sin pedir permiso ni depender de aprobación externa.\n\nLa plenitud nace cuando confías en tu brújula interior y asumes la autoría total de tus elecciones, transformando tu visión solitaria en obra tangible.',
    2: 'Tu alma busca secretamente armonía profunda, reciprocidad sensible y lazos sagrados. En tu interior, ansías espacios de serenidad donde la comprensión fluya sin necesidad de palabras y donde las alianzas se construyan sobre confianza mutua.\n\nTu gozo más alto florece al obrar como puente empático, disolviendo tensiones y creando remansos de paz a tu alrededor.',
    3: 'Tu alma vibra con la autoexpresión luminosa, el entusiasmo sincero y la alegría creativa. Detrás de cada pensamiento palpita el deseo de transmitir belleza, avivar el ánimo y enriquecer la experiencia de quienes te rodean.\n\nLa realización interna se despierta cuando disuelves la autocensura y viertes tu talento en el arte, la palabra y la creatividad viva.',
    4: 'Tu alma busca estabilidad inquebrantable, orden metódico y seguridad existencial. En tu raíz, anhelas edificar realidades que desafíen el paso del tiempo, aterrizando conceptos etéreos en cimientos sólidos y confiables.\n\nLa satisfacción verdadera florece cuando tu disciplina cotidiana te brinda un puerto seguro donde tú y los tuyos crecen con certeza.',
    5: 'Tu alma clama por libertad expansiva, mudanza estimulante y aventura existencial. En tus profundidades habita un espíritu viajero que rechaza la rutina, sediento de explorar los matices de la vida y el aprendizaje directo.\n\nTu vitalidad resurge cuando abrazas el cambio como tu aliado natural, transmutando lo imprevisto en evolución y maestría.',
    6: 'Tu alma está llamada a proteger, embellecer y armonizar los vínculos esenciales. En el silencio, anhelas forjar refugios donde el afecto sane heridas y donde la familia y la comunidad florezcan bajo el amparo del amor leal.\n\nLa paz interior se estabiliza cuando equilibras la entrega a los demás con límites saludables, permitiéndote recibir el mismo cuidado que ofreces.',
    7: 'Tu alma persigue el misterio velado, la soledad lúcida y la verdad trascendente. En el santuario de tu psique, requieres silencio y contemplación para descifrar las leyes profundas que gobiernan la existencia.\n\nLa plenitud genuina se revela cuando honras tus retiros reflexivos, uniendo el intelecto perspicaz con la intuición espiritual.',
    8: 'Tu alma aspira a la maestría material, la visión ejecutiva y el liderazgo justo. En el fondo, estás llamado a ejercer influencia en el mundo físico para materializar abundancia y construir sistemas de prosperidad colectiva.\n\nTu eje alcanza grandeza cuando alineas la ambición práctica con principios éticos nobles, utilizando el poder para elevar a quienes te siguen.',
    9: 'Tu alma resuena con compasión universal, desapego sereno y fraternidad trascendente. En tu núcleo, comprendes la unidad de todo lo viviente y aspiras a disolver el dolor ajeno cerrando ciclos con generosidade y perdón.\n\nLa serenidad profunda te abraza cuando actúas sin apego al reconocimiento personal, sabiendo que tu entrega resuena en lo eterno.',
    11: 'Tu alma porta la llama de la visión espiritual y la intuición suprema. Registras las corrientes sutiles de la conciencia y sientes el deber sagrado de despertar lucidez y serenidad en quienes buscan orientación.\n\nTu plenitud se concreta al anclar tu visión en palabras sabias y actos compasivos, siendo un faro firme en medio de las mareas del mundo.',
    22: 'Tu alma sueña con obras titánicas que beneficien a generaciones enteras. En tu esencia vive el Maestro Constructor, anhelando fusionar grandes ideales humanitarios con estructuras tangibles y perdurables.\n\nTu alma se realiza al convertir utopías en realidades prácticas, aportando progreso y solidez a la sociedad.',
    33: 'Tu alma irradia la frecuencia crística del amor desinteresado y el consuelo universal. Posees un manantial inagotable de empatía para mitigar el sufrimiento y recordar a otros la sacralidad de la vida.\n\nTu misión se corona cuando encarnas la ternura sabia, sosteniendo y elevando a todo ser que cruza tu camino sagrado.',
  },
};

export function getSoulUrgeDeep(num: number, lang: 'en' | 'pt' | 'es' = 'en'): string {
  const dict = SOUL_URGE_DEEP_BY_LANG[lang] || SOUL_URGE_DEEP_BY_LANG.en;
  return dict[num] || dict[1]!;
}

// Interpretações Profundas da Personalidade Exterior (Social Persona) - 2 parágrafos formatados com \n\n
export const PERSONALITY_DEEP_BY_LANG: Record<'en' | 'pt' | 'es', Record<number, string>> = {
  en: {
    1: 'To the outer world, you project an undeniable aura of pioneering self-reliance, bold initiative, and dignified command. People naturally step aside to let you lead, sensing that you possess the courage to enter unfamiliar territory and set the pace for others.\n\nYour challenge lies in softening the sharp edge of independence; true authority inspires willing allegiance rather than distant reverence.',
    2: 'Your outward presence radiates calming grace, refined tact, and approachable gentleness. Others perceive you as a peaceful harbor, instinctively turning to you in moments of interpersonal conflict or delicate negotiations.\n\nBe mindful not to let your gracious diplomacy be mistaken for passivity; your power thrives when gentle receptivity is grounded in firm self-respect.',
    3: 'You enter any room like a breath of fresh air, projecting exuberance, wit, and magnetic verbal charm. People are drawn to your conversational flair and your capacity to uplift the collective mood with spontaneous levity.\n\nYour social gift is profound, provided you balance sparkling sociability with substance, ensuring your genuine depth is never overshadowed by entertainment.',
    4: 'Your social demeanor is the epitome of dependability, grounded calm, and methodical integrity. Others instantly trust you with responsibilities, perceiving an unshakeable bedrock of discipline, punctuality, and realistic counsel.\n\nTake care that your aura of solemn duty does not become an impenetrable fortress; welcoming spontaneity enriches the respect you already command.',
    5: 'You project an electrifying aura of versatility, progressive charm, and thirst for adventure. People sense an unpredictable, worldly spark in you, instinctively perceiving that you belong to the open horizons rather than narrow conventions.\n\nYour presence is exhilarating, but you gain maximum respect when your thirst for freedom is anchored in deliberate follow-through.',
    6: 'Your aura emanates warm benevolence, domestic harmony, and genuine maternal/paternal protection. Others feel immediately embraced and emotionally safe in your perimeter, recognizing a born counselor and mediator of disputes.\n\nBeware only of projecting an urge to fix everyone around you; unconditional acceptance is the most magnetic crown of the caregiver.',
    7: 'You project an enigmatic, dignified presence marked by intellectual elegance and quiet depth. Others perceive an aristocratic reserve about you, sensing that you observe far more than you reveal and walk with an inner philosopher.\n\nYour contemplative mystique is compelling; simply ensure that healthy introspective solitude does not drift into unintentional aloofness.',
    8: 'Your aura projects executive authority, prosperous competence, and unhesitating personal power. People instinctively treat you as an achiever capable of navigating complex material dynamics and making decisive high-stakes calls.\n\nYour presence commands instant respect; soften that force with genuine humility to transform mere deference into lifelong loyalty.',
    9: 'Your public impression is that of a cultured, worldly, and deeply generous benefactor. Others sense in you a universal perspective that transcends local prejudices, carrying the dignified grace of someone who has lived many lifetimes.\n\nYour charismatic nobility is vast; remain personally accessible so that your universal ideals translate into warm individual fellowship.',
    11: 'Your presence radiates a subtle, hypnotic spiritual magnetism and visionary sensitivity. Others often feel an uncanny sense of being seen to the core when talking to you, perceiving an otherworldly charisma that defies ordinary logic.\n\nGround your electrifying energetic voltage in tranquil presence so that your inspiration brings calm clarity rather than overwhelming intensity.',
    22: 'You project the gravitas and expansive capability of a master architect who shapes institutions and communities. People immediately sense that small talk does not suit you; you convey the quiet confidence of someone born to materialize monumental visions.\n\nPair your immense visionary presence with approachable patience, giving others time to grow into the grand horizons you effortlessly perceive.',
    33: 'Your social presence emanates deep spiritual solace, radiant empathy, and selfless benevolence. You walk with the quiet grace of a master teacher whose very gaze calms anxiety and reminds people of human dignity.\n\nYour healing aura is a blessing to all; preserve your energetic reservoir through sacred boundaries so your radiant light remains unextinguished.',
  },
  pt: {
    1: 'Para o mundo exterior, você projeta uma presença magnética de pioneirismo, firmeza inabalável e liderança nata. As pessoas naturalmente abrem caminho para suas iniciativas, pressentindo que você possui coragem para desbravar cenários incertos e ditar o próprio ritmo.\n\nSeu desafio social é suavizar o tom de autossuficiência; a liderança mais nobre atrai cooperação voluntária e não apenas respeito distante.',
    2: 'Sua presença transmite serenidade polida, diplomacia refinada e escuta atenta. Os outros o enxergam como um porto seguro de moderação, recorrendo a você de forma espontânea para mediar conflitos ou dissolver tensões relacionais.\n\nCuide para que sua gentileza natural não seja confundida com passividade; seu magnetismo atinge o ápice quando a empatia se sustenta sobre limites claros.',
    3: 'Você chega a qualquer ambiente irradiando leveza, carisma comunicativo e inteligência vibrante. As pessoas são cativadas pela sua capacidade de enriquecer conversas, quebrar o gelo com elegância e elevar o ânimo do grupo com espontaneidade.\n\nSeu dom social é poderoso, desde que você una seu brilho verbal ao compromisso sincero, assegurando que sua profundidade emocional seja igualmente percebida.',
    4: 'Sua postura pública transmite solidez, confiabilidade exemplar e serenidade pragmática. Os outros sentem que podem lhe confiar tarefas decisivas, percebendo um compromisso inquebrantável com a palavra dada, com a ordem e com o trabalho bem feito.\n\nApenas evite parecer excessivamente austero ou inflexível; permitir-se pequenos toques de flexibilidade amplia ainda mais a reverência que você desperta.',
    5: 'Você projeta uma aura instigante de liberdade, dinamismo cosmopolita e fascínio pelo novo. As pessoas notam de imediato seu espírito inquieto e avesso à mesmice, percebendo que sua mente navega sempre um passo à frente das convenções tradicionais.\n\nSua energia é contagiante e moderna; seu maior trunfo consiste em canalizar esse entusiasmo em direções consistentes para que sua versatilidade produza legado.',
    6: 'Sua imagem pública transparece acolhimento maternal/paternal, harmonia e generosidade protetora. Os outros se sentem confortáveis na sua presença, identificando em você uma figura de concórdia, bom gosto estético e cuidado genuíno pelo bem-estar alheio.\n\nCuidado apenas para não assumir os fardos de todos ao seu redor; o respeito duradouro se consolida quando você ensina os outros a cuidarem de si mesmos.',
    7: 'Sua presença é marcada por uma distinção enigmática, elegância reflexiva e nobreza silenciosa. O mundo o percebe como alguém que observa muito mais do que fala, dotado de um olhar clínico que enxerga através das aparências ordinárias.\n\nSeu ar de sábio ou filósofo é fascinante; lembre-se apenas de descer das torres de observação para cultivar calor humano acessível com aqueles que o admiram.',
    8: 'Você transmite autoridade executiva, competência irrefutável e magnetismo de prosperidade. Os outros o identificam instantaneamente como alguém talhado para lidar com grandes decisões materiais, liderar equipes e gerar resultados concretos.\n\nSua imponência é natural e admirada; tempere sua determinação com calor e generosidade para transformar o temor em lealdade incondicional.',
    9: 'Sua impressão pública é a de um cidadão do mundo, culto, compassivo e generoso. As pessoas percebem em você uma visão abrangente que ignora mesquinharias, portando a serenidade de quem compreende a alma humana em suas dores e grandezas.\n\nSua nobreza moral comove; mantenha a proximidade cotidiana no trato com cada indivíduo para que seu idealismo se torne afeto tangível.',
    11: 'Sua persona irradia um magnetismo intuitivo sutil, quase hipnótico, e uma sensibilidade visionária fora do comum. Em sua presença, as pessoas sentem que estão sendo compreendidas no âmago da alma, despertando confidências espontâneas.\n\nAncore essa vibração elevada em simplicidade e presença aterrada para que sua inspiração traga segurança e lucidez aos que o procuram.',
    22: 'Você projeta a autoridade serena e gigantesca de quem veio erguer monumentos e estruturar sistemas duradouros. O mundo nota que conversas superficiais não lhe pertencem; você exala a força pragmática de quem pensa em escala e materializa o impossível.\n\nUna sua visão monumental à paciência pedagógica, permitindo que os outros acompanhem o ritmo audacioso dos seus planejamentos.',
    33: 'Sua aura pública irradia alívio emocional, sabedoria compassiva e uma bondade desinteressada que acalma corações aflitos. Você caminha com a postura digna de um mestre espiritual cujo contato direto inspira perdão e reconciliação.\n\nSua presença é um bálsamo coletivo; preserve sua energia pessoal com momentos de recolhimento para sustentar seu ministério de luz com vigor.',
  },
  es: {
    1: 'Ante el mundo, proyectas un aura innegable de liderazgo pionero, autonomía digna e iniciativa audaz. La gente te abre paso de forma natural, intuyendo que posees el coraje de asumir riesgos y marcar el rumbo.\n\nTu desafío consiste en templar la autosuficiencia; la verdadera autoridad inspira compromiso voluntario y no solo acatamiento respetuoso.',
    2: 'Tu presencia social destila serenidad diplomática, trato cortés y escucha profunda. Los demás te perciben como un remanso de paz, acudiendo a ti espontáneamente para apaciguar controversias y restaurar el diálogo.\n\nEvita que tu bondad innata sea leída como debilidad; tu magnetismo alcanza su cumbre cuando la dulzura se apoya en una firme autoestima.',
    3: 'Entras en cualquier entorno irradiando ingenio, carisma espontáneo y entusiasmo comunicativo. Los demás se sienten cautivados por tu elocuencia y tu capacidad de amenizar el ambiente con alegría contagiosa.\n\nTu don relacional es extraordinario; acompáñalo de seriedad en tus compromisos para que tu talento creativo sea reconocido en toda su profundidad.',
    4: 'Tu imagen pública es sinónimo de formalidad, disciplina a prueba de fuego y juicio sensato. La gente deposita en ti responsabilidades cruciales, confiando en tu puntualidad, ética y constancia inquebrantable.\n\nEvita mostrarte excesivamente severo o rígido; abrirte a la espontaneidad enriquecerá la profunda admiración que ya despiertas.',
    5: 'Proyectas una presencia electrizante, libre y dotada de moderno dinamismo. Quienes te rodean perciben tu aversión a la monotonía y tu mente abierta, considerándote un espíritu cosmopolita y vanguardista.\n\nTu vitalidad resulta fascinante; canaliza esa versatilidad en proyectos concretos para que tu impulso transformador deje huellas sólidas.',
    6: 'Tu porte exterior emana calidez protectora, armonía y vocación de servicio. La gente se siente arropada a tu lado, reconociendo en ti a un protector leal, amante de la concordia y dotado de exquisita sensibilidad estética.\n\nNo caigas en la tentación de cargar con las responsabilidades ajenas; tu afecto es más poderoso cuando enseña a otros a crecer por sí mismos.',
    7: 'Tu presencia se distingue por una reserva aristocrática, elegancia reflexiva y profundidad intelectual. El mundo intuye que analizas la realidad con bisturí agudo, guardando tus tesoros interiores para momentos selectos.\n\nTu halo misterioso resulta magnético; mantén puentes cálidos con quienes te valoran para no parecer distante en tus relaciones cercanas.',
    8: 'Exhalas liderazgo ejecutivo, seguridad material y una firmeza decisoria que impone respeto inmediato. La gente te reconoce como alguien capaz de orquestar grandes metas, resolver crisis y materializar riqueza tangible.\n\nTu fuerza es admirada; combínala con empatía sincera para que tu liderazgo engendre lealtad incondicional y devoción compartida.',
    9: 'Tu estampa pública es la de un humanista noble, sabio y desprendido. Quienes te conocen perciben una mirada panorámica que no se detiene en rivalidades banales, reflejando la serenidad de una conciencia madura.\n\nTu generosidad trasciende fronteras; mantén la ternura en el trato uno a uno para que tu amor universal se viva en la cercanía cotidiana.',
    11: 'Tu presencia destila un magnetismo espiritual fascinante y una sensibilidad psíquica sutil. A tu lado, las personas sienten que sus intenciones quedan al descubierto con benevolencia, despertando un respeto reverente.\n\nAterriza tu intensa carga intuitiva en palabras prácticas para que tu visión ilumine caminos con serenidad y aplomo.',
    22: 'Proyectas la solidez arquitectónica de quien ha venido a erigir realidades maestras en beneficio de la sociedad. Quienes conversan contigo sienten de inmediato tu desdén por lo trivial y tu capacidad para concretar utopías en hechos reales.\n\nAcompaña tu imponente escala mental con paciencia didáctica, guiando a los demás hacia las cumbres que tú ya visualizas.',
    33: 'Tu presencia social irradia consuelo, compasión sagrada y un amor incondicional que mitiga pesares. Caminas con la gracia de un guía ético cuya mirada reconforta y recuerda a los demás su propia nobleza innata.\n\nTu aura es una bendición colectiva; cultiva momentos de retiro silencioso para renovar la infinita fuente de afecto que compartes con el mundo.',
  },
};

export function getPersonalityDeep(num: number, lang: 'en' | 'pt' | 'es' = 'en'): string {
  const dict = PERSONALITY_DEEP_BY_LANG[lang] || PERSONALITY_DEEP_BY_LANG.en;
  return dict[num] || dict[1]!;
}



