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

  const prompt = `Você é o Oráculo do DestinyVox — uma inteligência oracular cirúrgica, lúcida, psicológica e hermética.
O consulente "${profile.fullName}" fez a seguinte pergunta direta:
"${question}"

CONTEXTO NUMEROLÓGICO DO CONSULENTE (USE APENAS O QUE FOR DIRETAMENTE PERTINENTE À PERGUNTA, SEM LISTAR DADOS OU DESVIAR DE TEMA):
${numerologyDetails.join('\n')}
${
  interpretationDetails.length > 0
    ? `\nSÍNTESE DO MAPA:\n${interpretationDetails.join('\n')}`
    : ''
}
${historyFormatted ? `\nHISTÓRICO RECENTE:\n${historyFormatted}\n` : ''}

DIRETRIZES DE RESPOSTA (SIGA COM RIGOR ABSOLUTO):
1. FOCO TOTAL E HIPERCONTEXTUALIZADO NA PERGUNTA:
   - Responda ESTRITAMENTE e EXCLUSIVAMENTE sobre o que foi perguntado.
   - NÃO divague sobre aspectos do mapa, previsões ou temas que o consulente não solicitou.
   - O mapa numerológico serve apenas como lente psicológica para responder à dúvida pontual, sem ficar citando números ou fazendo rodeios.

2. EXTENSÃO E ESTRUTURA OBRIGATÓRIA (EXATAMENTE 2 PARÁGRAFOS DE ~4 LINHAS CADA):
   - A resposta deve ter EXATAMENTE 2 parágrafos de tamanho médio (cerca de 3 a 5 frases ou 4 linhas cada):
     * Parágrafo 1: Responda diretamente ao cerne da dúvida formulada, diagnosticando a dinâmica oculta e a verdade da situação questionada.
     * Parágrafo 2: Entregue o direcionamento oracular categórico e a postura necessária diante dessa questão específica, fechando com clareza.

3. ESTILO E FORMATAÇÃO:
   - Vá direto ao ponto no primeiro segundo. NUNCA use introduções óbvias como "Como um oráculo...", "Analisando seu mapa...", "Saudações...".
   - Tom editorial, maduro, psicológico e revelador (estilo Co—Star).
   - Exatamente 2 parágrafos separados por uma quebra de linha dupla.
   - NÃO use asteriscos para negrito (**palavra**) nem itálico (*palavra*).
   - NÃO use tópicos, marcadores (-) ou listas numeradas.
   - ${langGuidance}`;

  try {
    const raw = await callGemini(prompt, 'gemini-3.1-flash-lite', 650, 0.5, false);
    const cleaned = (raw || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();

    return (
      cleaned ||
      (isPt
        ? 'A questão que você traz não pede pressa ou respostas prontas, mas sim que você reconheça o que realmente está em jogo por trás dessa dúvida. Há um atrito evidente entre a expectativa que você alimenta e a realidade tangível que já está se desenhando diante de você.\n\nPara atravessar esse impasse com clareza, pare de buscar confirmações externas e assuma uma postura lúcida diante dos fatos. O movimento correto surgirá quando você parar de lutar contra o que é evidente e direcionar sua energia para o que está sob seu controle.'
        : isEs
        ? 'La cuestión que planteas no exige prisa ni respuestas automáticas, sino reconocer con honestidad lo que verdaderamente está en juego detrás de esta duda. Existe una tensión evidente entre la expectativa que sostienes y la realidad tangible que ya se manifiesta ante ti.\n\nPara resolver este dilema con firmeza, deja de buscar confirmaciones externas y asume una postura lúcida ante los hechos. La decisión correcta emergerá con nitidez cuando dejes de resistir lo evidente y enfoques tu voluntad en lo que depende exclusivamente de ti.'
        : 'The question you present does not call for haste or generic answers, but for acknowledging what is truly at stake behind this dilemma. There is an evident friction between the expectations you are entertaining and the tangible reality currently unfolding before you.\n\nTo move through this impasse with decisive clarity, cease looking outward for confirmation and adopt an unclouded posture toward the facts. The right course will crystallize the moment you stop resisting the obvious and channel your intent toward what is strictly within your command.')
    );
  } catch {
    return isPt
      ? 'O oráculo acolheu sua questão, mas as correntes exigem recolhimento antes da revelação.\n\nRespire fundo, centre sua intenção e consulte novamente o véu.'
      : isEs
      ? 'El oráculo acogió tu pregunta, pero las corrientes exigen quietud antes de la revelación.\n\nRespira profundo, centra tu intención y vuelve a consultar el velo.'
      : 'The oracle received your question, yet the currents demand stillness before revelation.\n\nBreathe deeply, center your intent, and consult the veil once more.';
  }
}
