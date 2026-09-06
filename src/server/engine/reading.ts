import { redis } from '@devvit/web/server';
import {
  calculateFullNumerology,
  calculatePersonalMonth,
  calculatePersonalDay,
  getArchetype,
  getSoulDictum,
  type NumerologyProfile,
} from '../../shared/numerology';
import type { CosmicReadingResult, InterpretationPayload } from './types';
import { callGemini } from './gemini';
import { notifyTelegramNewChart } from './notifications';

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

DIRETRIZES CRÍTICAS DE PROFUNDIDADE E EXTENSÃO (PADRÃO DE EXTENSÃO EQUILIBRADO E UNIFORME):
1. **Extensão Controlada e Consistente**: Cada seção deve conter entre 180 e 260 palavras, dividida estritamente em parágrafos coesos (cerca de 60-80 palavras por parágrafo). Evite textos desproporcionalmente gigantes em uma seção e minúsculos em outra.
2. **Síntese Dinâmica de Forças**: Mostre como o Caminho de Vida #${profile.lifePath} (a missão do nascimento) é condicionado e executado pelas faculdades da Expressão #${profile.expression} (o instrumental do nome), e como os anseios secretos do Desejo da Alma #${profile.soulUrge} guiam as motivações por trás das aparências da Personalidade #${profile.personality}.
3. **Polaridade Luminosa & Sombra Psicológica**: Não poupe sutileza analítica. Esclareça os dons luminares de alta frequência e disseque sem rodeios os mecanismos inconscientes de autossabotagem, compulsões, defesas do ego e dívidas cármicas/existenciais.
4. **Ciclos Temporais Estratégicos**: Entregue uma orientação temporal robusta e pragmática conectando o macro-ciclo do Ano Pessoal #${profile.personalYear}, o influxo do Mês Pessoal #${personalMonth} e o ritmo pontual do Dia Pessoal #${personalDay}.
5. **QUEBRA OBRIGATÓRIA DE PARÁGRAFOS**: NUNCA gere blocos monolíticos de texto contínuo. Separe RIGOROSAMENTE cada parágrafo com linha dupla em branco (\\n\\n) para garantir uma leitura editorial elegante, fluida e escaneável.

Retorne EXATAMENTE um objeto JSON válido (sem tags markdown de código além de json, sem textos antes ou depois) com a seguinte estrutura:
{
  "destinyOverview": "Tratado interpretativo balanceado (3 parágrafos claros separados por \\n\\n, totalizando aprox. 220 palavras) sobre o propósito de nascimento (Caminho de Vida #${profile.lifePath}) em confronto e harmonia com a vocação do nome (Expressão #${profile.expression}). Discorra sobre a geometria da jornada desta alma, a tensão entre o destino e a vontade consciente, e o papel existencial que ela veio desempenhar.",
  "hiddenTalents": "Investigação balanceada da Frequência Elevada (Dons, Potenciais Ocultos e Virtudes Luminosas divididos em 3 parágrafos claros separados por \\n\\n, aprox. 200 palavras). Como o Desejo da Alma #${profile.soulUrge} alimenta a genialidade e o magnetismo prático do consulente.",
  "shadowAndChallenges": "Diagnóstico psicológico perspicaz do Padrão de Sombra (Desafios, Pontos Cegos e Fricções Egoicas divididos em 3 parágrafos claros separados por \\n\\n, aprox. 200 palavras). Aborde as tendências de autossabotagem geradas pelo choque entre #${profile.lifePath} e #${profile.expression}, e as chaves práticas de transmutação.",
  "yearlyForecast": "Prognóstico estratégico para o Ano Pessoal #${profile.personalYear} (${currentYear}) (2 a 3 parágrafos separados por \\n\\n, aprox. 180 palavras). Portas abertas, colheitas e diretrizes para os próximos meses.",
  "monthlyForecast": "Orientação para o Mês Pessoal #${personalMonth} (${currentMonthName}) (2 parágrafos sólidos separados por \\n\\n, aprox. 120 palavras), focando nas dinâmicas emocionais e práticas imediatas.",
  "dailyForecast": "Reflexão sobre o Dia Pessoal #${personalDay} (${currentDayNum} de ${currentMonthName}) (1 parágrafo denso e provocativo, aprox. 60 palavras), com atitude recomendada e ponto de atenção.",
  "cosmicMotto": "Um aforismo filosófico único, denso e poético em 1 frase curta que sintetiza a essência do Caminho #${profile.lifePath}."
}`;

  try {
    const rawText = await callGemini(prompt, 'gemini-2.5-flash', 8192, 0.8, true);
    if (!rawText) throw new Error('Gemini retornou texto vazio');

    let cleanJson = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed: InterpretationPayload = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      if (!cleanJson.endsWith('}')) {
        cleanJson = cleanJson + '"}';
      }
      parsed = JSON.parse(cleanJson);
    }

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
        getSoulDictum(profile.lifePath, isEn ? 'en' : isEs ? 'es' : 'pt'),
    };
  } catch (err) {
    console.error('Erro ao gerar leitura com Gemini:', err);
    return {
      destinyOverview: isEn
        ? `Your journey is governed by the vibration of Number ${profile.lifePath}. You hold an indelible calling to pioneer new ground and awaken collective clarity.\n\nThrough the geometry of your birth date, you are invited to transform friction into sovereignty, anchoring your path with patience and deliberate insight.\n\nWhen your conscious focus aligns with your foundational purpose, your natural leadership radiates effortless equilibrium.`
        : isEs
        ? `Tu camino está regido por la vibración del Número ${profile.lifePath}. Posees un llamado innato para explorar nuevos horizontes e inspirar a tu entorno.\n\nA través de la geometría de tu fecha natal, estás invitado a transformar la fricción en maestría, anclando tu rumbo con paciencia y visión.\n\nCuando tu voluntad consciente se alinea con tu propósito nuclear, tu liderazgo natural irradia un equilibrio inquebrantable.`
        : `Sua rota é regida pela vibração do Número ${profile.lifePath}. Você possui um chamado indelével para desbravar novos horizontes e inspirar as pessoas ao seu redor.\n\nAtravés da geometria de sua data de nascimento, você é convidado a transformar atritos em maestria, ancorando sua direção com serenidade e clareza.\n\nQuando sua vontade consciente se alinha ao seu propósito matricial, sua liderança natural irradia um equilíbrio inabalável.`,
      hiddenTalents: isEn
        ? `The frequency of Expression #${profile.expression} grants lucid leadership and the capacity to manifest vision into enduring reality.\n\nYour inner resonance awakens solutions where others perceive barriers, turning raw ideas into tangible architecture.`
        : isEs
        ? `La frecuencia de Expresión #${profile.expression} otorga liderazgo intuitivo y capacidad de materializar ideas con perseverancia.\n\nTu resonancia interior descubre soluciones donde otros encuentran obstáculos, convirtiendo conceptos en obras duraderas.`
        : `A frequência de Expressão #${profile.expression} concede liderança intuitiva e capacidade de materializar ideias com perseverança.\n\nSua ressonância interior desperta soluções onde outros enxergam barreiras, convertendo intuições em estruturas duradouras.`,
      shadowAndChallenges: isEn
        ? 'Beware of energy dispersion, perfectionistic isolation, or over-controlling outcomes.\n\nTrue mastery surrenders the compulsive urge to govern every detail, allowing natural cycles to mature in their own timing.'
        : isEs
        ? 'Cuidado con la dispersión de energía o la autoexigencia desmedida.\n\nLa verdadera maestría suelta el deseo de controlarlo todo, permitiendo que los ritmos naturales maduren a su tiempo.'
        : 'Cuidado com a dispersão de energia ou cobrança excessiva sobre seus próprios passos.\n\nA verdadeira maestria solta a urgência de controlar cada detalhe, permitindo que o tempo amadureça os frutos certos.',
      yearlyForecast: isEn
        ? `Under Personal Year #${profile.personalYear}, this is a pivotal cycle of conscious harvest and self-realization.\n\nFocus your deliberate efforts on long-term foundations, decluttering distractions that no longer serve your evolution.`
        : isEs
        ? `Bajo el Año Personal ${profile.personalYear}, este es un ciclo de cosecha consciente y madurez.\n\nEnfoca tus esfuerzos deliberados en cimientos de largo plazo, desprendiéndote de lo que ya no sirve a tu evolución.`
        : `Sob o Ano Pessoal ${profile.personalYear}, este é um ciclo de colheita e amadurecimento consciente.\n\nConcentre seus esforços deliberados em alicerces duradouros, desfazendo-se do que já não serve à sua evolução.`,
      cosmicMotto: getSoulDictum(profile.lifePath, isEn ? 'en' : isEs ? 'es' : 'pt'),
    };
  }
}

export async function getOrGenerateProfile(
  username: string,
  fullName: string,
  birthDate: string,
  language: string = 'en'
): Promise<CosmicReadingResult> {
  const profile = calculateFullNumerology(fullName, birthDate);
  const langKey = (language.startsWith('pt') ? 'pt' : language.startsWith('es') ? 'es' : 'en') as 'en' | 'pt' | 'es';

  const archetypes = {
    lifePath: getArchetype(profile.lifePath, langKey),
    expression: getArchetype(profile.expression, langKey),
    soulUrge: getArchetype(profile.soulUrge, langKey),
    personality: getArchetype(profile.personality, langKey),
    personalYear: getArchetype(profile.personalYear, langKey),
  };

  const interpretation = await generateGeminiNumerologyReading(profile, language);

  const result: CosmicReadingResult = {
    profile,
    archetypes,
    interpretation,
  };

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
