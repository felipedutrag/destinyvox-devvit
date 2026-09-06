import type { ReactNode } from 'react';

// Helper para formatar spans com bold (**texto**), italic (*texto*), ou texto limpo sem asteriscos aparentes
const renderFormattedSpan = (text: string, keyPrefix: string): ReactNode => {
  // Substitui tags markdown como **palavra** em <strong> e *palavra* em <em>
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      // Bold **texto**
      elements.push(
        <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-[var(--text-main)]">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic *texto*
      elements.push(
        <em key={`${keyPrefix}-i-${match.index}`} className="italic text-[var(--text-main)]">
          {match[3]}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : text;
};

// Utilitario para formatar textos longos gerados por IA em paragrafos elegantes, arejados e sem asteriscos crus
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
    <div className={`space-y-3.5 ${className}`}>
      {parts.map((p, idx) => (
        <p key={idx} className="leading-relaxed">
          {renderFormattedSpan(p, `p-${idx}`)}
        </p>
      ))}
    </div>
  );
};
