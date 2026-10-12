import React, { useState, useEffect } from 'react';
import SearchIcon from 'lucide-react/dist/esm/icons/search';
import XIcon from 'lucide-react/dist/esm/icons/x';

export interface MembersSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const MembersSearchBar: React.FC<MembersSearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Nome do membro…',
  className = '',
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sincroniza localValue quando a prop externa value muda (ex.: ao limpar filtros)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce de 300ms para busca em tempo real
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, value, onChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange(localValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <form onSubmit={handleSubmit} className={`relative w-full ${className}`} role="search">
      {/* Ícone de busca à esquerda */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
        <SearchIcon className="w-4 h-4" aria-hidden="true" />
      </div>

      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar membros por nome"
        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
      />

      {/* Botão limpar à direita quando há valor */}
      {localValue.trim().length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <XIcon className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
};
