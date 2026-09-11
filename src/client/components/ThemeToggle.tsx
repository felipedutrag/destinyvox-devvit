import React from 'react';

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  title?: string;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  isDarkMode,
  onToggleTheme,
  title = 'Toggle theme',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onToggleTheme}
      aria-label={title}
      title={title}
      className={`w-6.5 h-6.5 sm:w-7 sm:h-7 border border-[var(--border-subtle)] hover:border-[var(--border-main)] text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer flex items-center justify-center rounded shrink-0 ${className}`}
    >
      {isDarkMode ? (
        /* Sol elegante e perfeitamente centralizado */
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        /* Lua elegante e perfeitamente centralizada */
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 sm:w-4 sm:h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
};
