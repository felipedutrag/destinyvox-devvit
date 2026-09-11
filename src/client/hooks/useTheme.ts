import { useState, useEffect } from 'react';

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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('destinyvox_theme');
        if (stored === 'dark') return true;
        if (stored === 'light') return false;
        if (typeof window.matchMedia === 'function') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    neutralizeParentBorders();
  }, []);

  // Sincroniza em tempo real com alterações do sistema/Reddit caso o usuário não tenha travado manualmente
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        try {
          const stored = localStorage.getItem('destinyvox_theme');
          if (!stored) {
            setIsDarkMode(e.matches);
          }
        } catch {
          // ignore
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if ('addListener' in mediaQuery) {
        // Fallback para navegadores legados
        (mediaQuery as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener(handleChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else if ('removeListener' in mediaQuery) {
          (mediaQuery as { removeListener: (cb: (e: MediaQueryListEvent) => void) => void }).removeListener(handleChange);
        }
      };
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.remove('light');
      html.classList.add('dark');
      try {
        localStorage.setItem('destinyvox_theme', 'dark');
      } catch {
        // ignore
      }
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      try {
        localStorage.setItem('destinyvox_theme', 'light');
      } catch {
        // ignore
      }
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return { isDarkMode, toggleTheme };
}
