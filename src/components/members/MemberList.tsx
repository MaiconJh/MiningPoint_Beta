import React from 'react';
import { motion } from 'framer-motion';
import UsersIcon from 'lucide-react/dist/esm/icons/users';
import { UserProfile } from '../../types/profile';
import { Title } from '../../types/title';
import { MemberCard } from './MemberCard';
import { SkeletonCircle, SkeletonLine } from '../skeleton/Skeleton';

export interface MemberListProps {
  members: UserProfile[];
  userTitlesMap: Record<string, Title[]>;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  userTitlesMap,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onClearFilters,
  hasActiveFilters,
}) => {
  // Estado de carregamento inicial
  if (isLoading && members.length === 0) {
    return (
      <div
        className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] w-full"
        aria-busy="true"
        aria-label="Carregando membros"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[14px] p-5 flex flex-col items-center text-center gap-3"
          >
            <SkeletonCircle size={64} />
            <SkeletonLine width={100} height={16} radius="4px" />
            <SkeletonLine width={60} height={20} radius="9999px" />
          </div>
        ))}
      </div>
    );
  }

  // Estado vazio
  if (!isLoading && members.length === 0) {
    return (
      <div className="w-full border border-dashed border-[var(--border-subtle)] rounded-[14px] p-10 text-center flex flex-col items-center justify-center">
        <UsersIcon className="w-10 h-10 text-[var(--text-muted)] mb-3" aria-hidden="true" />
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
          Nenhum membro encontrado
        </h3>
        <p className="text-sm text-[var(--text-secondary)] m-0 max-w-sm mb-4">
          Tente ajustar a busca ou o filtro de grupo.
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:opacity-90 transition-opacity cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            Limpar filtros
          </button>
        )}
      </div>
    );
  }

  // Lista com membros
  return (
    <div className="flex flex-col gap-6 w-full">
      <ul
        role="list"
        aria-live="polite"
        className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] p-0 m-0 list-none"
      >
        {members.map((member, index) => (
          <motion.li
            key={member.uid}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: Math.min(index * 0.03, 0.4),
            }}
            className="flex"
          >
            <MemberCard
              member={member}
              titles={userTitlesMap[member.uid] || []}
            />
          </motion.li>
        ))}
      </ul>

      {/* Botão de paginação */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          >
            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  );
};
