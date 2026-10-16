import React, { useState } from 'react';
import {
  Forum,
  ForumFormData,
  ThreadStructure,
  DEFAULT_FORUM_PERMISSIONS,
  DEFAULT_FORUM_FEATURES,
} from '../../types/forum';
import { validateForumRoute } from '../../lib/forums';
import { ForumCategoryEditor } from './ForumCategoryEditor';
import { ForumPermissionEditor } from './ForumPermissionEditor';

interface ForumFormProps {
  initialForum?: Forum | null;
  existingForums: Forum[];
  onSave: (data: ForumFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (forumId: string) => Promise<void>;
  saving: boolean;
  inlineError?: string | null;
}

export const ForumForm: React.FC<ForumFormProps> = ({
  initialForum,
  existingForums,
  onSave,
  onCancel,
  onDelete,
  saving,
  inlineError,
}) => {
  const [title, setTitle] = useState(initialForum?.title || '');
  const [slug, setSlug] = useState(initialForum?.slug || '');
  const [description, setDescription] = useState(initialForum?.description || '');
  const [focus, setFocus] = useState(initialForum?.focus || 'discussões');
  const [order, setOrder] = useState<number>(initialForum?.order ?? existingForums.length + 1);
  const [isActive, setIsActive] = useState<boolean>(initialForum?.isActive ?? true);
  const [threadStructure, setThreadStructure] = useState<ThreadStructure>(
    initialForum?.threadStructure || 'flat'
  );
  const [categories, setCategories] = useState(initialForum?.categories || []);
  const [features, setFeatures] = useState(
    initialForum?.features || { ...DEFAULT_FORUM_FEATURES }
  );
  const [permissions, setPermissions] = useState(
    initialForum?.permissions || { ...DEFAULT_FORUM_PERMISSIONS }
  );

  const [localError, setLocalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!initialForum && !slug) {
      // Auto-generate slug suggestion for new forums
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!title.trim()) {
      setLocalError('O título do fórum é obrigatório.');
      return;
    }

    const routeValidation = validateForumRoute(slug, initialForum?.id, existingForums);
    if (!routeValidation.valid) {
      setLocalError(routeValidation.error || 'A rota informada é inválida.');
      return;
    }

    const payload: ForumFormData = {
      title: title.trim().slice(0, 80),
      slug: routeValidation.slug,
      route: routeValidation.route,
      description: description.trim().slice(0, 300),
      focus: focus.trim().slice(0, 50),
      order: typeof order === 'number' ? order : 0,
      isActive,
      threadStructure,
      categories,
      features,
      permissions,
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error('Error saving forum:', err);
      setLocalError('Erro ao salvar o fórum. Tente novamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialForum || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialForum.id);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 max-w-4xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
            {initialForum ? `Editar fórum: ${initialForum.title}` : 'Novo fórum'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
            Configure parâmetros gerais, rotas, subdivisões e regras de acesso do fórum.
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
            isActive
              ? 'bg-[var(--feedback-success)] text-[var(--text-inverse)]'
              : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
          }`}
        >
          {isActive ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {(localError || inlineError) && (
        <div className="mb-6 p-4 rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] text-sm font-medium">
          {localError || inlineError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Título do Fórum
            </label>
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Ex: Discussões Gerais, Suporte Técnico"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Segmento de Rota Pública (/forum/:slug)
            </label>
            <div className="flex items-center rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] focus-within:border-[var(--border-focus)] overflow-hidden">
              <span className="px-3 py-2 text-xs text-[var(--text-muted)] bg-[var(--bg-surface-elevated)] border-r border-[var(--border-default)]">
                /forum/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="geral"
                className="w-full px-3 py-2 text-sm bg-transparent text-[var(--text-primary)] focus:outline-none"
                required
              />
            </div>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 block">
              A rota base /forum é reservada. Use palavras em minúsculas e hífens.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Foco do Fórum
            </label>
            <input
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ex: discussões, suporte, bugs"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Ordem de Exibição
            </label>
            <input
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Estrutura de Respostas
            </label>
            <select
              value={threadStructure}
              onChange={(e) => setThreadStructure(e.target.value as ThreadStructure)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            >
              <option value="flat">Plana (lista sequencial)</option>
              <option value="quoted">Com citação (referência a mensagem)</option>
              <option value="nested">Aninhada (respostas encadeadas)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Descrição do Fórum
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Breve resumo da finalidade deste fórum para os membros"
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
          />
        </div>

        {/* Feature toggles */}
        <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] space-y-3">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
            Funcionalidades Opcionais
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={features.solution}
                onChange={(e) => setFeatures({ ...features, solution: e.target.checked })}
                className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
              />
              <span>Marcação de Solução</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={features.reactions}
                onChange={(e) => setFeatures({ ...features, reactions: e.target.checked })}
                className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
              />
              <span>Reações em Tópicos</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={features.reports}
                onChange={(e) => setFeatures({ ...features, reports: e.target.checked })}
                className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
              />
              <span>Denúncias de Conteúdo</span>
            </label>
          </div>
        </div>

        {/* Categories editor (R-04) */}
        <div className="pt-2">
          <ForumCategoryEditor categories={categories} onChange={setCategories} />
        </div>

        {/* Permissions editor (R-05..R-08) */}
        <div className="pt-2">
          <ForumPermissionEditor permissions={permissions} onChange={setPermissions} />
        </div>

        {/* State toggle */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-[var(--border-default)] accent-[var(--brand-primary)]"
            />
            <span>Fórum Ativo (disponível publicamente conforme permissões)</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-[var(--border-subtle)]">
          <div>
            {initialForum && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-xs font-semibold text-[var(--feedback-error)] hover:bg-[var(--bg-surface-elevated)] rounded-lg transition-colors cursor-pointer"
              >
                Excluir fórum
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando...' : initialForum ? 'Salvar alterações' : 'Criar fórum'}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-[var(--text-primary)] m-0">
              Confirmar exclusão
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">
              Tem certeza que deseja excluir o fórum &quot;{initialForum?.title}&quot;? Esta ação removerá a configuração do fórum.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] hover:opacity-90 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
