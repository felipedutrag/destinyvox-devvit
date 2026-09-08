import type { NumerologyProfile } from '../../shared/numerology';
import type { CosmicReadingResult } from './types';
import { callGemini } from './gemini';

export interface AskOracleParams {
  question: string;
  profile: NumerologyProfile;
  reading?: CosmicReadingResult;
  history?: Array<{ sender: 'user' | 'oracle'; text: string }>;
  language?: string;
}

export async function askDestinyVoxOracle(
  questionOrParams: string | AskOracleParams,
  profileArg?: NumerologyProfile,
  languageArg: string = 'en'
): Promise<string> {
  const isParamsObj = typeof questionOrParams === 'object' && questionOrParams !== null;
  const question = (isParamsObj ? questionOrParams.question : questionOrParams).trim();
  const profile = isParamsObj ? questionOrParams.profile : profileArg!;
  const reading = isParamsObj ? questionOrParams.reading : undefined;
  const history = isParamsObj ? questionOrParams.history : undefined;
  const language = (isParamsObj ? questionOrParams.language : languageArg) || 'en';

  const isPt = language.startsWith('pt');
  const isEs = language.startsWith('es');

  // Construção do contexto completo do mapa numerológico
  const numerologyDetails: string[] = [
    `- Nome: ${profile.fullName}`,
    `- Data de Nascimento: ${profile.birthDate}`,
    `- Caminho de Vida (Destino): #${profile.lifePath}${profile.isMasterLifePath ? ' (Número Mestre)' : ''}${
      reading?.archetypes?.lifePath?.title ? ` - ${reading.archetypes.lifePath.title}` : ''
    }`,
    `- Número de Expressão (Missão & Ação): #${profile.expression}${profile.isMasterExpression ? ' (Número Mestre)' : ''}${
      reading?.archetypes?.expression?.title ? ` - ${reading.archetypes.expression.title}` : ''
    }`,
    `- Desejo da Alma (Motivação Interior): #${profile.soulUrge}${
      reading?.archetypes?.soulUrge?.title ? ` - ${reading.archetypes.soulUrge.title}` : ''
    }`,
    `- Personalidade Exterior (Postura no Mundo): #${profile.personality}${
      reading?.archetypes?.personality?.title ? ` - ${reading.archetypes.personality.title}` : ''
    }`,
    `- Ano Pessoal Atual (Ciclo do Momento): #${profile.personalYear}${
      reading?.archetypes?.personalYear?.title ? ` - ${reading.archetypes.personalYear.title}` : ''
    }`,
  ];

  const interpretationDetails: string[] = [];
  if (reading?.interpretation) {
    const interp = reading.interpretation;
    if (interp.destinyOverview) {
      interpretationDetails.push(`- Visão do Destino: ${interp.destinyOverview}`);
    }
    if (interp.hiddenTalents) {
      interpretationDetails.push(`- Forças & Talentos: ${interp.hiddenTalents}`);
    }
    if (interp.shadowAndChallenges) {
      interpretationDetails.push(`- Sombras & Desafios: ${interp.shadowAndChallenges}`);
    }
    if (interp.yearlyForecast) {
      interpretationDetails.push(`- Previsão do Ano Atual: ${interp.yearlyForecast}`);
    }
    if (interp.cosmicMotto) {
      interpretationDetails.push(`- Lema Cósmico: "${interp.cosmicMotto}"`);
    }
  }

  // Histórico recente formatado
  const historyFormatted =
    history && history.length > 0
      ? history
          .map((m) => `${m.sender === 'user' ? 'Consulente' : 'Oráculo'}: ${m.text.trim()}`)
          .join('\n')
      : '';

  const langGuidance = isPt
    ? 'Responda estritamente em Português direto, natural e sem rodeios.'
    : isEs
    ? 'Responde estrictamente en Español directo, natural y sin rodeos.'
    : 'Respond strictly in direct, natural, and concise English.';

  const prompt = `Você é um Oráculo conselheiro direto, sábio e conciso.
O consulente "${profile.fullName}" fez uma pergunta pontual.

CONTEXTO NUMEROLÓGICO DO CONSULENTE (USE APENAS COMO BASE INTERNA PARA GUIAR SUA INTUIÇÃO, NÃO RECITE):
${numerologyDetails.join('\n')}
${
  interpretationDetails.length > 0
    ? `\nSÍNTESE DO MAPA (APENAS REFERÊNCIA INTERNA):\n${interpretationDetails.join('\n')}`
    : ''
}
${historyFormatted ? `\nHISTÓRICO RECENTE DO DIÁLOGO:\n${historyFormatted}\n` : ''}
PERGUNTA DO CONSULENTE:
"${question}"

REGRAS CRÍTICAS E OBRIGATÓRIAS (SIGA COM RIGOR ABSOLUTO):
1. LIMITE-SE ESTRITAMENTE A RESPONDER À PERGUNTA FEITA:
   - Responda apenas e exclusivamente o que o consulente perguntou.
   - NÃO fale de assuntos, previsões, números ou áreas da vida que NÃO foram perguntadas.
   - NÃO recite os dados do mapa, números ou arquétipos a menos que o consulente tenha perguntado especificamente sobre um número ou cálculo dele.
   - NÃO faça introduções, saudações teatrais ("Saudações...", "Como oráculo...", "Ao analisar seu mapa...") nem conclusões vazias. Comece imediatamente com a resposta direta.

2. RESPOSTA CURTA, DIRETA E OBJETIVA:
   - Responda em no máximo 1 a 2 parágrafos curtos e concisos.
   - Seja claro, útil e assertivo, sem monólogos nem palestras teóricas.

3. FORMATAÇÃO:
   - Prosa limpa. NÃO use asteriscos para negrito (**palavra**) ou itálico (*palavra*).
   - NÃO use listas numeradas nem marcadores com traços.
   - ${langGuidance}`;

  try {
    const raw = await callGemini(prompt, 'gemini-3.1-flash-lite', 300, 0.5, false);
    const cleaned = (raw || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();

    return (
      cleaned ||
      (isPt
        ? 'As coordenadas do seu mapa confirmam que o melhor caminho é agir em harmonia com sua essência e o momento atual.'
        : isEs
        ? 'Las coordenadas de tu mapa confirman que el mejor camino es actuar en armonía con tu esencia y momento actual.'
        : 'The coordinates of your chart confirm that the best path is to act in harmony with your essence and current cycle.')
    );
  } catch {
    return isPt
      ? 'O oráculo ouviu seu chamado, mas o fluxo cósmico oscilou. Reorganize sua intenção e pergunte novamente.'
      : isEs
      ? 'El oráculo escuchó tu llamado, pero el flujo cósmico osciló. Reorganiza tu intención y pregunta de nuevo.'
      : 'The oracle heard your call, but cosmic flow fluctuated. Re-center your intent and ask again.';
  }
}
