import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto shrink-0 pt-12 pb-8 bg-[var(--bg-surface)] border-t border-[var(--border-default)]">
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] items-start pb-8 border-b border-[var(--border-default)]">
          <div>
            <span className="font-bold text-lg tracking-wide text-[var(--text-primary)]">
              MiningPoint
            </span>
            <p className="max-w-[42ch] mt-2 text-sm text-[var(--text-secondary)]">
              Nas profundezas, cada descoberta abre novas possibilidades. Cada recurso guarda perguntas ainda sem resposta.
            </p>
          </div>

          <nav aria-label="Links do rodapé">
            <ul className="flex flex-wrap items-center gap-4 list-none m-0 p-0">
              <li>
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold tracking-wide bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
                >
                  Entrar no Discord
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary-hover)] hover:underline transition-colors cursor-pointer bg-transparent border-0 p-0"
                >
                  Contato
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-6">
          <p className="m-0 text-xs text-[var(--text-muted)]">
            MiningPoint é um projeto de comunidade.
          </p>
          <p className="m-0 text-xs text-[var(--text-muted)]">
            © {currentYear} MiningPoint
          </p>
        </div>
      </div>
    </footer>
  );
};
