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
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    neutralizeParentBorders();
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

