import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Layers from 'lucide-react/dist/esm/icons/layers';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { Forum } from '../../types/forum';
import { useAuth } from '../../context/AuthContext';
import { canViewForum } from '../../lib/forumPermissions';

interface ForumIndexProps {
  forums: Forum[];
  loading: boolean;
  error: string | null;
}

export const ForumIndex: React.FC<ForumIndexProps> = ({ forums, loading, error }) => {
  const { user, profile } = useAuth();

  // Filter forums visible to the current user (R-03)
  const visibleForums = useMemo(() => {
    return forums.filter((f) => canViewForum(f, user, profile));
  }, [forums, user, profile]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[var(--bg-surface)] rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-[var(--bg-surface)] rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse h-36"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-[var(--feedback-error)] text-[var(--text-inverse)] text-sm font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] m-0">
          Fóruns da Comunidade
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2 mb-0 max-w-2xl">
          Espaço aberto para discussões, dúvidas, sugestões e troca de experiências entre os membros do MiningPoint.
        </p>
      </div>

      {visibleForums.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
            Nenhum fórum disponível no momento
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5 mb-0 max-w-md mx-auto">
            Não há fóruns públicos ou liberados para o seu grupo de acesso no momento. Retorne mais tarde para conferir novidades!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleForums.map((forum) => (
            <Link
              key={forum.id}
              to={`/forum/${forum.slug}`}
              className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)] transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--bg-default)] border border-[var(--border-subtle)] text-[var(--brand-primary)]">
                    Foco: {forum.focus}
                  </span>
                  {forum.categories.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Layers className="w-3.5 h-3.5" />
                      {forum.categories.length} subdivisões
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors m-0">
                  {forum.title}
                </h2>

                {forum.description && (
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 m-0">
                    {forum.description}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--brand-primary)]">
                <span>Acessar fórum</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
