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

  const prompt = `Você é o Oráculo do DestinyVox — uma consciência oracular profunda, lúcida, psicológica e hermética.
O consulente "${profile.fullName}" submeteu uma questão essencial à sua visão.

CONTEXTO NUMEROLÓGICO DO CONSULENTE (USE COMO MATRIZ OCULTA PARA EMBASAR SEU DIAGNÓSTICO, SEM APENAS LISTAR DADOS):
${numerologyDetails.join('\n')}
${
  interpretationDetails.length > 0
    ? `\nSÍNTESE DO MAPA (VIBRAÇÃO DE FUNDO):\n${interpretationDetails.join('\n')}`
    : ''
}
${historyFormatted ? `\nHISTÓRICO RECENTE DO DIÁLOGO:\n${historyFormatted}\n` : ''}
PERGUNTA DO CONSULENTE:
"${question}"

DIRETRIZES FUNDAMENTAIS DE PROFUNDIDADE E EXTENSÃO (SIGA COM RIGOR ABSOLUTO):
1. RESPOSTA LONGA, PROFUNDA E DILATADA (TAMANHO MÍNIMO OBRIGATÓRIO):
   - A resposta NÃO PODE ser curta, rasa ou telegráfica. Deve ter NO MÍNIMO 800 caracteres e preferencialmente entre 900 e 1.500 caracteres.
   - Desenvolva uma leitura oracular densa e transformadora, distribuída em 3 a 4 parágrafos substanciais:
     * Primeiro parágrafo: Desvele a raiz oculta e psicológica por trás da dúvida formulada pelo consulente.
     * Segundo parágrafo: Conecte essa encruzilhada com as forças ativas do mapa e o momento de vida, evidenciando as tensões inconscientes.
     * Terceiro parágrafo: Alerte para ilusões de controle, armadilhas emocionais e os caminhos de menor resistência que devem ser superados.
     * Quarto parágrafo: Entregue um direcionamento oracular categórico e reflexivo, orientando o passo definitivo com sabedoria e clareza.

2. POSTURA E ELOQUÊNCIA:
   - Responda estritamente à pergunta e suas reverberações, sem desvios para temas não solicitados.
   - NÃO use introduções clichês ("Como um oráculo...", "Ao analisar seu mapa...", "Saudações..."). Comece imediatamente no primeiro parágrafo desvendando o tema.
   - Adote um tom editorial refinado, incisivo, enigmático e revelador (estilo Co—Star).

3. FORMATAÇÃO:
   - Prosa fluida em parágrafos separados por quebra de linha dupla.
   - NÃO use asteriscos para negrito (**palavra**) ou itálico (*palavra*).
   - NÃO use listas numeradas nem marcadores com traços.
   - ${langGuidance}`;

  try {
    const raw = await callGemini(prompt, 'gemini-3.1-flash-lite', 1400, 0.6, false);
    const cleaned = (raw || '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .trim();

    return (
      cleaned ||
      (isPt
        ? 'As forças do seu momento revelam que a clareza não nascerá da pressa, mas da observação atenta das correntes que você tem evitado encarar. Seu caminho exige que você alinhe sua vontade interior com a realidade tangível, reconhecendo onde suas expectativas entram em atrito com a verdade dos fatos. Mantenha o silêncio necessário para discernir o que é ilusão passageira do que é propósito inegociável.'
        : isEs
        ? 'Las fuerzas de tu momento revelan que la claridad no nacerá de la prisa, sino de la observación profunda de las corrientes que has evitado encarar. Tu camino exige que alinees tu voluntad interior con la realidad tangible, reconociendo dónde tus expectativas chocan con la verdad de los hechos. Mantén el silencio necesario para discernir qué es ilusión transitoria y qué es propósito innegociable.'
        : 'The forces of your current cycle reveal that clarity will not emerge from haste, but from deliberate observation of the currents you have resisted facing. Your path calls for aligning inner intent with tangible reality, discerning where expectations clash with truth. Preserve the stillness required to distinguish passing illusions from your non-negotiable purpose.')
    );
  } catch {
    return isPt
      ? 'O oráculo acolheu seu chamado, mas os padrões cósmicos exigem recolhimento antes da revelação. Respire fundo, depure o cerne da sua pergunta e consulte novamente o véu.'
      : isEs
      ? 'El oráculo acogió tu llamado, pero los patrones cósmicos exigen recogimiento antes de la revelación. Respira profundo, depura el núcleo de tu pregunta y vuelve a consultar el velo.'
      : 'The oracle heard your call, yet the cosmic currents demand stillness before revelation. Center your intent, refine the heart of your inquiry, and consult the veil once more.';
  }
}
