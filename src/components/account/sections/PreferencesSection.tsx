import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

export const PreferencesSection: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <section className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col">
      <h2 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] font-bold m-0 mb-2">
        Preferências
      </h2>

      <div className="flex flex-col gap-[3px] py-3 text-sm">
        {/* Label sozinho em cima */}
        <span className="text-[11px] text-[var(--text-muted)] font-normal">
          Tema
        </span>

        {/* Radios customizados com 14px de gap */}
        <div className="flex items-center gap-[14px] mt-1">
          {/* Opção: Claro */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="account-theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => setTheme('light')}
              className="sr-only peer"
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-surface)] ${
                theme === 'light'
                  ? 'border-[var(--brand-primary)]'
                  : 'border-[var(--border-strong)] group-hover:border-[var(--text-secondary)]'
              }`}
            >
              {theme === 'light' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
              )}
            </div>
            <span
              className={`text-[14px] transition-colors ${
                theme === 'light'
                  ? 'text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Claro
            </span>
          </label>

          {/* Opção: Escuro */}
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="account-theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => setTheme('dark')}
              className="sr-only peer"
            />
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-primary)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--bg-surface)] ${
                theme === 'dark'
                  ? 'border-[var(--brand-primary)]'
                  : 'border-[var(--border-strong)] group-hover:border-[var(--text-secondary)]'
              }`}
            >
              {theme === 'dark' && (
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
              )}
            </div>
            <span
              className={`text-[14px] transition-colors ${
                theme === 'dark'
                  ? 'text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Escuro
            </span>
          </label>
        </div>
      </div>
    </section>
  );
};
