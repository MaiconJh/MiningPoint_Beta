import React from 'react';
import { Group } from '../../types/group';
import { MembersSearchBar } from './MembersSearchBar';

export interface MemberFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGroupId: string | null;
  onGroupChange: (groupId: string | null) => void;
  sortMode: 'group' | 'name';
  onSortChange: (sortMode: 'group' | 'name') => void;
  groups: Group[];
  memberCount: number;
}

export const MemberFilters: React.FC<MemberFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedGroupId,
  onGroupChange,
  sortMode,
  onSortChange,
  groups,
  memberCount,
}) => {
  const formatMemberCount = (count: number): string => {
    if (count === 0) return 'Nenhum membro';
    if (count === 1) return '1 membro';
    return `${count} membros`;
  };

  return (
    <aside
      className="w-full lg:w-[280px] lg:sticky lg:top-5 shrink-0"
      aria-label="Filtros de membros"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[14px] p-5 flex flex-col gap-5 shadow-xs">
        {/* Cabeçalho de filtros */}
        <div className="pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] m-0">
            Filtros
          </h2>
        </div>

        {/* Campo de busca */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="members-search-input"
            className="text-xs font-semibold text-[var(--text-secondary)]"
          >
            Buscar
          </label>
          <MembersSearchBar
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>

        {/* Filtro por grupo */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="members-group-select"
            className="text-xs font-semibold text-[var(--text-secondary)]"
          >
            Grupo
          </label>
          <select
            id="members-group-select"
            value={selectedGroupId || ''}
            onChange={(e) => onGroupChange(e.target.value || null)}
            aria-label="Filtrar por grupo"
            className="w-full bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] cursor-pointer"
          >
            <option value="">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenação */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="members-sort-select"
            className="text-xs font-semibold text-[var(--text-secondary)]"
          >
            Ordenação
          </label>
          <select
            id="members-sort-select"
            value={sortMode}
            onChange={(e) => onSortChange(e.target.value as 'group' | 'name')}
            aria-label="Ordenar membros"
            className="w-full bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] cursor-pointer"
          >
            <option value="group">Grupo (maior autoridade)</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </div>

        {/* Contador de membros */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Total
          </span>
          <span className="text-sm font-bold text-[var(--brand-primary)]">
            {formatMemberCount(memberCount)}
          </span>
        </div>
      </div>
    </aside>
  );
};
