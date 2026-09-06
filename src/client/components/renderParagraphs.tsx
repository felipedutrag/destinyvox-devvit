import { type ReactNode } from 'react';

// Utilitario para formatar textos longos gerados por IA em paragrafos elegantes e arejados
export const renderParagraphs = (rawText: string | undefined | null, className: string = ''): ReactNode => {
  if (!rawText) return null;

  // Primeiro divide por quebras de linha duplas ou simples
  let parts = rawText
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Se o texto veio como um bloco monolitico sem quebras de linha mas com mais de 160 caracteres,
  // divide de forma inteligente em paragrafos balanceados de 1 a 2 frases para maxima legibilidade.
  if (parts.length === 1 && parts[0] && parts[0].length > 160) {
    const sentences = parts[0].match(/[^.!?]+[.!?]+["']?|\s*[^.!?]+$/g) || [parts[0]];
    const reconstructed: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      currentChunk += (currentChunk ? ' ' : '') + sentence.trim();
      if (currentChunk.length >= 130) {
        reconstructed.push(currentChunk);
        currentChunk = '';
      }
    }
    if (currentChunk) {
      if (reconstructed.length > 0 && currentChunk.length < 80) {
        reconstructed[reconstructed.length - 1] += ' ' + currentChunk;
      } else {
        reconstructed.push(currentChunk);
      }
    }
    if (reconstructed.length > 1) {
      parts = reconstructed;
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {parts.map((p, idx) => (
        <p key={idx} className="leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
};
