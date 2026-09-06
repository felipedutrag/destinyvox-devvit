import type { NumerologyProfile } from '../../shared/numerology';
import { callGemini } from './gemini';

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
    const raw = await callGemini(prompt, 'gemini-2.5-flash', 1024, 0.8, false);
    return (
      raw ||
      (language.startsWith('en')
        ? 'The stars confirm that the path lies before you.'
        : 'As estrelas confirmam que o caminho está diante de você.')
    );
  } catch {
    return language.startsWith('en')
      ? 'The silence of the cosmos whispers that the answer already lives in your intuition.'
      : 'O silêncio do cosmos sussurra que a resposta já habita em sua intuição.';
  }
}
