import { redis } from '@devvit/web/server';
import {
  calculateFullNumerology,
  calculatePersonalMonth,
  calculatePersonalDay,
  getArchetype,
  type NumerologyProfile,
  type ArchetypeData,
} from '../shared/numerology';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface CosmicReadingResult {
  profile: NumerologyProfile;
  archetypes: {
    lifePath: ArchetypeData;
    expression: ArchetypeData;
    soulUrge: ArchetypeData;
    personality: ArchetypeData;
    personalYear: ArchetypeData;
  };
  interpretation: {
    destinyOverview: string;
    hiddenTalents: string;
    shadowAndChallenges: string;
    yearlyForecast: string;
    monthlyForecast?: string;
    dailyForecast?: string;
    cosmicMotto: string;
  };
}

type GeminiPart = {
  text?: string;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
};

type GeminiApiResponse = {
  candidates?: GeminiCandidate[];
};

type InterpretationPayload = {
  destinyOverview?: string;
  hiddenTalents?: string;
  shadowAndChallenges?: string;
  yearlyForecast?: string;
  monthlyForecast?: string;
  dailyForecast?: string;
  cosmicMotto?: string;
};

type SynastryPayload = {
  harmonyTitle?: string;
  connectionAnalysis?: string;
  strengths?: string;
  challenges?: string;
  cosmicAdvice?: string;
};

// Chamar Gemini 3.1 Flash-Lite para interpretação numerológica profunda
export async function generateGeminiNumerologyReading(
  profile: NumerologyProfile,
  language: string = 'en'
): Promise<CosmicReadingResult['interpretation']> {
  const isEn = language.startsWith('en');
  const isEs = language.startsWith('es');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentDayNum = now.getDate();
  const personalMonth = calculatePersonalMonth(profile.personalYear, currentMonthNum);
  const personalDay = calculatePersonalDay(personalMonth, currentDayNum);

  const monthNamesPt = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const currentMonthName = isEn ? monthNamesEn[currentMonthNum - 1] : isEs ? monthNamesEs[currentMonthNum - 1] : monthNamesPt[currentMonthNum - 1];

  const langInstruction = isEn
    ? 'Respond strictly in English with an eloquent, profound, psychologically astute, literary tone reminiscent of Carl Jung and high-end psychological astrology (like Co—Star and nuanced psychoanalysis).'
    : isEs
    ? 'Responde estrictamente en Español con un tono elocuente, profundo, psicológicamente perspicaz, literario y analítico al estilo de Carl Jung y la astrología psicológica refinada.'
    : 'Responda estritamente em Português com tom eloqüente, profundo, literário, rico em vocabulário, psicologicamente agudo e analítico no estilo de Carl Jung e da astrologia psicológica refinada.';

  const prompt = `Você é o Arquivista e Oráculo Central do DestinyVox, uma inteligência analítica de vanguarda que funde a Numerologia Pitagórica Antiga com a Psicologia Arquetípica Jungiana profunda.

O consulente possui o seguinte mapa numerológico calculado com precisão geométrica:
- Nome Completo de Certidão: "${profile.fullName}"
- Data de Nascimento: ${profile.birthDate}
- Caminho de Vida (Life Path - Vetor Existencial & Propósito da Data): #${profile.lifePath} ${profile.isMasterLifePath ? '(NÚMERO MESTRE SAGRADO)' : ''}
- Expressão / Destino (Expression & Destiny - Vocação, Ferramentas & Arquitetura do Nome): #${profile.expression} ${profile.isMasterExpression ? '(NÚMERO MESTRE)' : ''}
- Desejo da Alma (Soul Urge - Desejo Profundo & Anima Interior): #${profile.soulUrge}
- Personalidade Exterior (Social Persona - A Máscara que o Mundo Enxerga): #${profile.personality}
- Ano Pessoal Vigente (${currentYear}): Ciclo #${profile.personalYear}
- Mês Pessoal Atual (${currentMonthName}): Vibração #${personalMonth}
- Dia Pessoal Atual (${currentDayNum} de ${currentMonthName}): Vibração #${personalDay}

${langInstruction}

DIRETRIZES CRÍTICAS DE PROFUNDIDADE E EXTENSÃO (EVITE TEXTOS CURTOS OU SUPERFICIAIS):
1. **Densidade e Riqueza**: Seja detalhado, articulado, investigativo e poético. Cada seção deve ser ampla, imersiva e profundamente personalizada, analisando os atritos e sinergias concretas entre os números do consulente.
2. **Síntese Dinâmica de Forças**: Mostre como o Caminho de Vida #${profile.lifePath} (a missão do nascimento) é condicionado e executado pelas faculdades da Expressão #${profile.expression} (o instrumental do nome), e como os anseios secretos do Desejo da Alma #${profile.soulUrge} guiam as motivações por trás das aparências da Personalidade #${profile.personality}.
3. **Polaridade Luminosa & Sombra Psicológica**: Não poupe sutileza analítica. Esclareça os dons luminares de alta frequência e disseque sem rodeios os mecanismos inconscientes de autossabotagem, compulsões, defesas do ego e dívidas cármicas/existenciais.
4. **Ciclos Temporais Estratégicos**: Entregue uma orientação temporal robusta e pragmática conectando o macro-ciclo do Ano Pessoal #${profile.personalYear}, o influxo do Mês Pessoal #${personalMonth} e o ritmo pontual do Dia Pessoal #${personalDay}.
5. **QUEBRA OBRIGATÓRIA DE PARÁGRAFOS**: NUNCA gere blocos monolíticos de texto contínuo. Separe RIGOROSAMENTE cada parágrafo com linha dupla em branco (\\n\\n) para garantir uma leitura editorial elegante, fluida e escaneável.

Retorne EXATAMENTE um objeto JSON válido (sem tags markdown de código além de json, sem textos antes ou depois) com a seguinte estrutura:
{
  "destinyOverview": "Tratado interpretativo amplo e fascinante (3 a 4 parágrafos bem delimitados e separados por \\n\\n) sobre o propósito de nascimento (Caminho de Vida #${profile.lifePath}) em confronto e harmonia com a vocação do nome (Expressão #${profile.expression}). Discorra sobre a geometria da jornada desta alma, a tensão entre o destino e a vontade consciente, e o papel existencial que ela veio desempenhar.",
  "hiddenTalents": "Investigação minuciosa e rica da Frequência Elevada (Dons, Potenciais Ocultos e Virtudes Luminosas divididos em 3 parágrafos claros separados por \\n\\n). Como o Desejo da Alma #${profile.soulUrge} alimenta a genialidade e o magnetismo prático do consulente, e de que forma essa força pode ser expressa em liderança, criação e maestria pessoal.",
  "shadowAndChallenges": "Diagnóstico psicológico profundo e perspicaz do Padrão de Sombra (Desafios, Pontos Cegos e Fricções Egoicas divididos em 3 parágrafos claros separados por \\n\\n). Aborde as tendências de autossabotagem, ansiedades arquetípicas geradas pelo choque entre #${profile.lifePath} e #${profile.expression}, medos inconscientes e as chaves práticas para transmutar essa sombra em poder pessoal.",
  "yearlyForecast": "Prognóstico energético, existencial e estratégico detalhado para o Ano Pessoal #${profile.personalYear} (${currentYear}) (2 a 3 parágrafos nítidos separados por \\n\\n). Quais são as portas que se abrem, quais terrenos exigem colheita ou desapego, e qual o tom decisivo dos próximos meses.",
  "monthlyForecast": "Orientação contextual refinada para o Mês Pessoal #${personalMonth} (${currentMonthName}) (2 parágrafos sólidos separados por \\n\\n), focando nas dinâmicas emocionais, financeiras e relacionais imediatas sob esta vibração.",
  "dailyForecast": "Reflexão cirúrgica e inspiradora sobre o Dia Pessoal #${personalDay} (${currentDayNum} de ${currentMonthName}) (1 parágrafo denso e provocativo), com uma atitude recomendada e um ponto de atenção para hoje.",
  "cosmicMotto": "Um aforismo filosófico denso, belo, poético e inesquecível em 1 frase curta que sintetiza a essência deste mapa."
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 4096,
            temperature: 0.85,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data: GeminiApiResponse = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const parsed: InterpretationPayload = JSON.parse(rawText);

    return {
      destinyOverview:
        parsed.destinyOverview ||
        (isEn
          ? 'Your cosmic frequency vibrates with primordial creative force.'
          : isEs
          ? 'Tu frecuencia cósmica vibra con fuerza creadora primordial.'
          : 'Sua frequência cósmica vibra com força criadora primordial.'),
      hiddenTalents:
        parsed.hiddenTalents ||
        (isEn
          ? 'Innate capacity to transmute friction into conscious mastery.'
          : isEs
          ? 'Capacidad innata de transmutar obstáculos en maestría evolutiva.'
          : 'Capacidade inata de transmutar obstáculos em degraus evolutivos.'),
      shadowAndChallenges:
        parsed.shadowAndChallenges ||
        (isEn
          ? 'Awareness needed around unconscious ego defenses and energetic balance.'
          : isEs
          ? 'Atención al equilibrio entre ambición y quietud interior.'
          : 'Atenção ao equilíbrio entre ambição e descanso interior.'),
      yearlyForecast:
        parsed.yearlyForecast ||
        (isEn
          ? 'A deliberate period for laying authentic foundations and strategic renewal.'
          : isEs
          ? 'Momento propicio para nuevos cimientos y renovación consciente.'
          : 'Momento favorável para novos alicerces e renovação vibracional.'),
      monthlyForecast: parsed.monthlyForecast || undefined,
      dailyForecast: parsed.dailyForecast || undefined,
      cosmicMotto:
        parsed.cosmicMotto ||
        (isEn
          ? 'Those who understand their inner geometry command their own destiny.'
          : isEs
          ? 'Quien comprende sus propios números domina su propio destino.'
          : 'Quem compreende os próprios números domina o próprio destino.'),
    };
  } catch (err) {
    console.error('Erro ao gerar leitura com Gemini:', err);
    return {
      destinyOverview: isEn
        ? `Your journey is governed by the vibration of Number ${profile.lifePath}. You hold an indelible calling to pioneer new ground and awaken collective clarity.`
        : isEs
        ? `Tu camino está regido por la vibración del Número ${profile.lifePath}. Posees un llamado innato para explorar nuevos horizontes e inspirar a tu entorno.`
        : `Sua rota é regida pela vibração do Número ${profile.lifePath}. Você possui um chamado indelével para desbravar novos horizontes e inspirar as pessoas ao seu redor.`,
      hiddenTalents: isEn
        ? `The frequency of Expression #${profile.expression} grants lucid leadership and the capacity to manifest vision into enduring reality.`
        : isEs
        ? `La frecuencia ${profile.expression} otorga liderazgo intuitivo y capacidad de materializar ideas con perseverancia.`
        : `A frequência ${profile.expression} concede liderança intuitiva e capacidade de materializar ideias com perseverança.`,
      shadowAndChallenges: isEn
        ? 'Beware of energy dispersion, perfectionistic isolation, or over-controlling outcomes.'
        : isEs
        ? 'Cuidado con la dispersión de energía o la autoexigencia desmedida.'
        : 'Cuidado com a dispersão de energia ou cobrança excessiva sobre seus próprios passos.',
      yearlyForecast: isEn
        ? `Under Personal Year #${profile.personalYear}, this is a pivotal cycle of conscious harvest and self-realization.`
        : isEs
        ? `Bajo el Año Personal ${profile.personalYear}, este es un ciclo de cosecha consciente y madurez.`
        : `Sob o Ano Pessoal ${profile.personalYear}, este é um ciclo de colheita e amadurecimento consciente.`,
      cosmicMotto: isEn
        ? 'Those who understand their inner geometry command their own destiny.'
        : isEs
        ? 'Quien comprende sus propios números domina su propio destino.'
        : 'Quem compreende os próprios números domina o próprio destino.',
    };
  }
}

// Consultar o Oráculo DestinyVox em chat interativo
export async function askDestinyVoxOracle(
  question: string,
  profile: NumerologyProfile,
  language: string = 'en'
): Promise<string> {
  const isEn = language.startsWith('en');
  const isEs = language.startsWith('es');

  const langGuidance = isEn
    ? 'Respond strictly in English. Formulate a rich, elegant, multi-layered answer (3 to 4 substantial paragraphs) blending philosophical depth, psychological insight, and practical wisdom.'
    : isEs
    ? 'Responde estrictamente en Español. Formula una respuesta rica, elegante y profunda (3 a 4 párrafos sustanciales) combinando profundidad filosófica, visión psicológica y sabiduría práctica.'
    : 'Responda estritamente em Português. Formule uma resposta rica, elegante, profunda e reveladora (3 a 4 parágrafos substanciais) combinando profundidade filosófica, psicologia arquetípica e sabedoria prática.';

  const prompt = `Você é o Oráculo Mestre DestinyVox, mentor arquetípico e guia existencial de alta erudição.
O consulente "${profile.fullName}" traz uma consulta ao oráculo.

DADOS NUMEROLÓGICOS DO CONSULENTE:
- Caminho de Vida: #${profile.lifePath} (Propósito existencial central)
- Número de Expressão: #${profile.expression} (Modo de ação, talentos e vocação)
- Desejo da Alma: #${profile.soulUrge} (Necessidade psíquica interior e valores sagrados)
- Ano Pessoal Atual: #${profile.personalYear} (Ciclo evolutivo no qual a pergunta se insere)

PERGUNTA DO CONSULENTE:
"${question}"

${langGuidance}

DIRETRIZES DE RESPOSTA (NÃO SEJA BREVE OU TELEGRÁFICO):
1. **Conexão Direta com a Geometria Pessoal**: Mostre ao consulente exatamente como a vibração do seu Caminho #${profile.lifePath} e a Expressão #${profile.expression} se manifestam na situação que ele trouxe.
2. **Diagnóstico Psicológico & Intuitivo**: Examine o dilema sob uma ótica que vá além do óbvio. Mostre o conflito entre o desejo aparente e a necessidade real da alma sob o Ano Pessoal #${profile.personalYear}.
3. **Conselho Prático e Direção Transformativa**: Ofereça uma postura concreta para o consulente assumir diante da dúvida, acompanhada de uma chave de reflexão profunda para ancorar clareza mental e coragem.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
        }),
      }
    );
    const data: GeminiApiResponse = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || (language.startsWith('en') ? 'The stars confirm that the path lies before you.' : 'As estrelas confirmam que o caminho está diante de você.');
  } catch {
    return language.startsWith('en') ? 'The silence of the cosmos whispers that the answer already lives in your intuition.' : 'O silêncio do cosmos sussurra que a resposta já habita em sua intuição.';
  }
}

// Calcular e gerar leitura completa com persistência no Redis
export async function getOrGenerateProfile(
  username: string,
  fullName: string,
  birthDate: string,
  language: string = 'en'
): Promise<CosmicReadingResult> {
  const profile = calculateFullNumerology(fullName, birthDate);
  const langKey = (language.startsWith('pt') ? 'pt' : language.startsWith('es') ? 'es' : 'en') as 'en' | 'pt' | 'es';

  // Buscar arquétipos traduzidos com fallback garantido
  const archetypes = {
    lifePath: getArchetype(profile.lifePath, langKey),
    expression: getArchetype(profile.expression, langKey),
    soulUrge: getArchetype(profile.soulUrge, langKey),
    personality: getArchetype(profile.personality, langKey),
    personalYear: getArchetype(profile.personalYear, langKey),
  };

  // Gerar interpretação via Gemini
  const interpretation = await generateGeminiNumerologyReading(profile, language);

  const result: CosmicReadingResult = {
    profile,
    archetypes,
    interpretation,
  };

  // Salvar no Redis do Reddit apenas se houver usuário identificado
  if (username) {
    try {
      await redis.set(`destinyvox_user_${username}`, JSON.stringify(result));
      await redis.incrBy(`destinyvox_stat_lp_${profile.lifePath}`, 1);
    } catch (err) {
      console.error('Erro ao salvar no Redis:', err);
    }
    notifyTelegramNewChart(username, result).catch(() => {});
  }

  return result;
}

// Enviar notificação instantânea para o Telegram do criador
export async function notifyTelegramNewChart(username: string, reading: CosmicReadingResult) {
  const TELEGRAM_BOT_TOKEN = '8772913024:AAHCsGyYaf11MkncGCHSwj-q8OJVYzQ6v8c';
  const TELEGRAM_CHAT_ID = '8024902234';

  const { profile, archetypes } = reading;
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const msg =
    `✨ *NOVO ACESSO / MAPA GERADO NO DESTINYVOX!* ✨\n\n` +
    `👤 *Redditor:* u/${username}\n` +
    `🧭 *Caminho de Vida:* #${profile.lifePath} (${archetypes.lifePath.title.split('/')[0]})\n` +
    `🎯 *Expressão:* #${profile.expression}\n` +
    `💫 *Alma:* #${profile.soulUrge}\n` +
    `⏳ *Ano Pessoal:* #${profile.personalYear}\n\n` +
    `🕒 *Horário:* ${now}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: 'Markdown',
      }),
    });
  } catch (err) {
    console.error('Falha ao enviar notificação para o Telegram:', err);
  }
}

export interface SynastryResult {
  user1: { username: string; profile: NumerologyProfile };
  user2: { username: string; profile: NumerologyProfile };
  compatibilityScore: number;
  harmonyTitle: string;
  connectionAnalysis: string;
  strengths: string;
  challenges: string;
  cosmicAdvice: string;
}

// Calcular Sinastria Cósmica entre 2 Perfis
export async function calculateSynastryReading(
  user1Name: string,
  user1Profile: NumerologyProfile,
  user2Name: string,
  user2Profile: NumerologyProfile,
  language: string = 'en'
): Promise<SynastryResult> {
  const isEn = language.startsWith('en');
  const isEs = language.startsWith('es');

  // Cálculo de ressonância harmônica baseada em números pitagóricos
  const lpDiff = Math.abs(user1Profile.lifePath - user2Profile.lifePath);
  let baseScore: number;
  if (lpDiff === 0) baseScore = 95; // Mesma vibração
  else if ([2, 4, 6].includes(lpDiff)) baseScore = 88; // Vibrações complementares
  else if ([1, 3, 5].includes(lpDiff)) baseScore = 82; // Polaridade estimulante
  else baseScore = 78;

  // Ajuste fino com expressão e alma
  if (user1Profile.soulUrge === user2Profile.soulUrge) baseScore = Math.min(99, baseScore + 5);

  const langInstruction = isEn
    ? 'Respond strictly in English with a profound, psychologically astute, nuanced and literary tone dissecting the relational alchemy between these two souls.'
    : isEs
    ? 'Responde estrictamente en Español con un tono profundo, psicológicamente perspicaz, matizado y literario diseccionando la alquimia relacional entre ambas almas.'
    : 'Responda estritamente em Português com tom profundo, perspicaz, denso, psicologicamente matizado e literário dissecando a alquimia relacional entre estas duas almas.';

  const prompt = `Você é o Oráculo de Sinastria & Alquimia Relacional do DestinyVox, especialista em decodificar a dinâmica vibracional e cármica entre duas consciências.

Faça a análise aprofundada de compatibilidade e dinâmica cósmica entre dois indivíduos com base na Numerologia Pitagórica:

INDIVÍDUO 1: u/${user1Name} ("${user1Profile.fullName}")
- Caminho de Vida: #${user1Profile.lifePath} (Propósito existencial)
- Expressão / Destino: #${user1Profile.expression} (Modo de ação no mundo)
- Desejo da Alma: #${user1Profile.soulUrge} (Necessidade psíquica interior)

INDIVÍDUO 2: u/${user2Name} ("${user2Profile.fullName}")
- Caminho de Vida: #${user2Profile.lifePath} (Propósito existencial)
- Expressão / Destino: #${user2Profile.expression} (Modo de ação no mundo)
- Desejo da Alma: #${user2Profile.soulUrge} (Necessidade psíquica interior)

Score Preliminar de Ressonância: ${baseScore}%

${langInstruction}

DIRETRIZES DE PROFUNDIDADE (EVITE RESUMOS CURTOS OU GENERALISTAS):
1. **Química Arquetípica**: Discuta com riqueza a dinâmica de atração, fascínio e espelhamento entre o Caminho #${user1Profile.lifePath} e o Caminho #${user2Profile.lifePath}.
2. **Harmonia e Fricção de Expressões**: Analise como o estilo de comunicação e ação (${user1Profile.expression} vs ${user2Profile.expression}) colabora ou entra em choque.
3. **Pacto Secreto das Almas**: Avalie se os anseios interiores (${user1Profile.soulUrge} e ${user2Profile.soulUrge}) se nutrem ou se exigem concessões emocionais difíceis.

Retorne EXATAMENTE um JSON válido com esta estrutura:
{
  "harmonyTitle": "Um título arquetípico e poético em 3 a 5 palavras para esta conexão (ex: Aliança dos Círculos de Fogo)",
  "connectionAnalysis": "Tratado relacional minucioso e envolvente (3 a 4 parágrafos amplos) dissecando a atração magnética, a dança de polaridades, as projeções mútuas e o propósito cármico deste encontro na vida de ambos.",
  "strengths": "Mapeamento detalhado dos maiores dons e catalisadores da dupla (2 parágrafos ricos), ressaltando onde eles se tornam invencíveis juntos e como elevam o potencial um do outro.",
  "challenges": "Dissecação honesta e penetrante dos atritos de ego, pontos cegos e armadilhas de convivência (2 parágrafos lúcidos), mostrando onde a corda tende a arrebentar.",
  "cosmicAdvice": "Um direcionamento estratégico e conselho sábio substancial (1 parágrafo denso e memorável) com um mantra relacional prático para sustentar a harmonia duradoura."
}`;

  try {
    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1800,
            temperature: 0.82,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const aiData: GeminiApiResponse = await aiRes.json();
    const rawJson = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '{}';
    const parsed: SynastryPayload = JSON.parse(rawJson);

    return {
      user1: { username: user1Name, profile: user1Profile },
      user2: { username: user2Name, profile: user2Profile },
      compatibilityScore: baseScore,
      harmonyTitle:
        parsed.harmonyTitle ||
        (isEn ? 'Alliance of Elements' : isEs ? 'Alianza de los Elementos' : 'Aliança dos Elementos'),
      connectionAnalysis:
        parsed.connectionAnalysis ||
        (isEn
          ? 'Two cosmic vectors converging in a dynamic dance of mutual reflection.'
          : isEs
          ? 'Dos fuerzas que se encuentran en un movimiento cósmico de reflejo mutuo.'
          : 'Duas forças que se encontram em um movimento cósmico de espelhamento mútuo.'),
      strengths:
        parsed.strengths ||
        (isEn
          ? 'Natural intellectual stimulation and shared forward momentum.'
          : isEs
          ? 'Complementariedad natural y estímulo intelectual continuo.'
          : 'Complementaridade natural e estímulo intelectual contínuo.'),
      challenges:
        parsed.challenges ||
        (isEn
          ? 'Individual rhythms and priorities that demand conscious listening.'
          : isEs
          ? 'Ritmos y prioridades individuales que exigen paciencia y diálogo.'
          : 'Ritmos e prioridades individuais que exigem paciência e diálogo.'),
      cosmicAdvice:
        parsed.cosmicAdvice ||
        (isEn
          ? 'Honor differences as deeply as you celebrate shared resonance.'
          : isEs
          ? 'Honren las diferencias tanto como celebran las afinidades.'
          : 'Honrem as diferenças tanto quanto celebram as afinidades.'),
    };
  } catch (err) {
    return {
      user1: { username: user1Name, profile: user1Profile },
      user2: { username: user2Name, profile: user2Profile },
      compatibilityScore: baseScore,
      harmonyTitle: isEn ? 'Cosmic Resonance' : isEs ? 'Resonancia Cósmica' : 'Ressonância Cósmica',
      connectionAnalysis: isEn
        ? `The vibrations of Path #${user1Profile.lifePath} and Path #${user2Profile.lifePath} create a dance of polarities with profound soul growth.`
        : isEs
        ? `La vibración del Camino ${user1Profile.lifePath} y Camino ${user2Profile.lifePath} crean una danza de polaridades con aprendizaje profundo.`
        : `A vibração do Caminho ${user1Profile.lifePath} e Caminho ${user2Profile.lifePath} criam uma dança de polaridades com aprendizado profundo.`,
      strengths: isEn
        ? 'Capacity to elevate each other through shared challenges.'
        : isEs
        ? 'Capacidad de crecer juntos superando los desafíos del camino.'
        : 'Capacidade de crescerem juntos superando os desafios da jornada.',
      challenges: isEn
        ? 'Aligning expectations and respecting psychological solitude.'
        : isEs
        ? 'Ajuste de expectativas y respeto al espacio psíquico individual.'
        : 'Ajuste de expectativas e respeito ao espaço psíquico individual.',
      cosmicAdvice: isEn
        ? 'Love and partnership are bridges uniting complementary mysteries.'
        : isEs
        ? 'El amor y la unión son puentes que conectan misterios complementarios.'
        : 'O amor e a parceria são pontes que unem mistérios complementares.',
    };
  }
}

