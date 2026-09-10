import { useEffect } from 'react';

function neutralizeParentBorders() {
  try {
    if (typeof window !== 'undefined') {
      if (window.frameElement) {
        (window.frameElement as HTMLElement).style.border = 'none';
        (window.frameElement as HTMLElement).style.outline = 'none';
        (window.frameElement as HTMLElement).style.boxShadow = 'none';
      }
      const card = window.parent?.document?.querySelector('devvit2-modal-card');
      if (card) {
        (card as HTMLElement).style.border = 'none';
        (card as HTMLElement).style.outline = 'none';
        (card as HTMLElement).style.boxShadow = 'none';
      }
    }
  } catch {
    // cross-origin sandbox
  }
}

export function useTheme() {
  // [TEMA DARK DESABILITADO TEMPORARIAMENTE - FORÇADO MODO LIGHT]
  const isDarkMode = false;

  useEffect(() => {
    neutralizeParentBorders();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark');
    html.classList.add('light');
    try {
      localStorage.setItem('destinyvox_theme', 'light');
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    // Modo escuro desabilitado temporariamente a pedido do usuário
  };

  return { isDarkMode, toggleTheme };
}
