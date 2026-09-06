import type { NumerologyProfile } from '../../shared/numerology';
import type { SynastryResult, SynastryPayload } from './types';
import { callGemini } from './gemini';

export async function calculateSynastryReading(
  user1Name: string,
  user1Profile: NumerologyProfile,
  user2Name: string,
  user2Profile: NumerologyProfile,
  language: string = 'en'
): Promise<SynastryResult> {
  const isEn = language.startsWith('en');
  const isEs = language.startsWith('es');

  // Calculo de ressonancia harmonica baseada em numeros pitagoricos
  const lpDiff = Math.abs(user1Profile.lifePath - user2Profile.lifePath);
  let baseScore: number;
  if (lpDiff === 0) baseScore = 95;
  else if ([2, 4, 6].includes(lpDiff)) baseScore = 88;
  else if ([1, 3, 5].includes(lpDiff)) baseScore = 82;
  else baseScore = 78;

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
    const rawJson = await callGemini(prompt, 'gemini-3.1-flash-lite', 1800, 0.82, true);
    const parsed: SynastryPayload = JSON.parse(rawJson || '{}');

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
  } catch {
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
