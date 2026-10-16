import React from 'react';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Power from 'lucide-react/dist/esm/icons/power';
import { Link } from 'react-router-dom';
import { Forum } from '../../types/forum';

interface ForumListProps {
  forums: Forum[];
  loading: boolean;
  onNew: () => void;
  onEdit: (forum: Forum) => void;
  onToggleActive: (forum: Forum) => Promise<void>;
}

export const ForumList: React.FC<ForumListProps> = ({
  forums,
  loading,
  onNew,
  onEdit,
  onToggleActive,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse h-28"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
            Fóruns Cadastrados ({forums.length})
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
            Gerencie os fóruns ativos, regras de acesso e rotas públicas da comunidade.
          </p>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo fórum
        </button>
      </div>

      {forums.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
          <MessageSquare className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
          <h3 className="text-base font-semibold text-[var(--text-primary)] m-0">
            Nenhum fórum cadastrado
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 mb-4 max-w-sm mx-auto">
            Crie seu primeiro fórum configurável definindo rota, permissões e subdivisões internas.
          </p>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro fórum
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {forums.map((forum) => (
            <div
              key={forum.id}
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
                    {forum.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      forum.isActive
                        ? 'bg-[var(--feedback-success)] text-[var(--text-inverse)]'
                        : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
                    }`}
                  >
                    {forum.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[var(--bg-default)] border border-[var(--border-subtle)] text-[var(--brand-primary)]">
                    {forum.route}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Ordem: {forum.order}
                  </span>
                </div>

                {forum.description && (
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-1 m-0">
                    {forum.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {forum.categories.length === 0
                      ? 'Sem subdivisões'
                      : `${forum.categories.length} subdivisões`}
                  </span>
                  <span>•</span>
                  <span>Foco: {forum.focus}</span>
                  <span>•</span>
                  <span>Estrutura: {forum.threadStructure}</span>
                  <span>•</span>
                  <span>
                    Visibilidade:{' '}
                    {forum.permissions?.view?.mode === 'anyone'
                      ? 'Pública'
                      : forum.permissions?.view?.mode}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Link
                  to={forum.route}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-default)] transition-colors cursor-pointer"
                  title="Ver página pública do fórum"
                  aria-label={`Ver página pública de ${forum.title}`}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => onToggleActive(forum)}
                  className={`p-2 rounded-lg hover:bg-[var(--bg-default)] transition-colors cursor-pointer ${
                    forum.isActive
                      ? 'text-[var(--feedback-success)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                  title={forum.isActive ? 'Desativar fórum' : 'Ativar fórum'}
                  aria-label={forum.isActive ? `Desativar fórum ${forum.title}` : `Ativar fórum ${forum.title}`}
                >
                  <Power className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(forum)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors cursor-pointer border border-[var(--border-default)]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
