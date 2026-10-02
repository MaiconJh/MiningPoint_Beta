import React from 'react';
import { UserVisibility } from '../../types/profile';

interface AccountVisibilityRowProps {
  visibility: UserVisibility;
  onChange: (newVisibility: UserVisibility) => void;
}

export const AccountVisibilityRow: React.FC<AccountVisibilityRowProps> = ({
  visibility,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-1 py-3 text-sm">
      <span className="text-xs font-medium text-[var(--text-secondary)]">
        Visibilidade
      </span>

      <div className="flex items-center gap-4 mt-1">
        {/* Opção: Público */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="account-visibility"
            value="public"
            checked={visibility === 'public'}
            onChange={() => onChange('public')}
            className="sr-only peer"
          />
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-primary)] ${
              visibility === 'public'
                ? 'border-[var(--brand-primary)]'
                : 'border-[var(--border-strong)] group-hover:border-[var(--text-secondary)]'
            }`}
          >
            {visibility === 'public' && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
            )}
          </div>
          <span
            className={`text-sm transition-colors ${
              visibility === 'public'
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Público
          </span>
        </label>

        {/* Opção: Privado */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="radio"
            name="account-visibility"
            value="private"
            checked={visibility === 'private'}
            onChange={() => onChange('private')}
            className="sr-only peer"
          />
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--brand-primary)] ${
              visibility === 'private'
                ? 'border-[var(--brand-primary)]'
                : 'border-[var(--border-strong)] group-hover:border-[var(--text-secondary)]'
            }`}
          >
            {visibility === 'private' && (
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />
            )}
          </div>
          <span
            className={`text-sm transition-colors ${
              visibility === 'private'
                ? 'text-[var(--text-primary)] font-medium'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Privado
          </span>
        </label>
      </div>

      <p className="text-xs text-[var(--text-secondary)] m-0 mt-1">
        Perfis privados não aparecem para visitantes deslogados.
      </p>
    </div>
  );
};
