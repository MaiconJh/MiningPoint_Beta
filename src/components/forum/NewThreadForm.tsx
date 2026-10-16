import React, { useState } from 'react';
import { Forum, ForumThreadFormData } from '../../types/forum';

interface NewThreadFormProps {
  forum: Forum;
  onSave: (data: ForumThreadFormData) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export const NewThreadForm: React.FC<NewThreadFormProps> = ({
  forum,
  onSave,
  onCancel,
  saving,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(
    forum.categories.length > 0 ? forum.categories[0].id : null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('O título do tópico é obrigatório.');
      return;
    }

    if (!body.trim()) {
      setError('O conteúdo da mensagem é obrigatório.');
      return;
    }

    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        categoryId: categoryId || null,
      });
    } catch (err: unknown) {
      console.error('Failed to create thread:', err);
      setError('Erro ao publicar o tópico. Tente novamente.');
    }
  };

  return (
    <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
      <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 mb-4">
        Criar Novo Tópico
      </h3>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {forum.categories.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Subdivisão / Categoria
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            >
              {forum.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do seu tópico..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
            Mensagem
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder="Escreva sua mensagem aqui..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-y"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Publicando...' : 'Publicar tópico'}
          </button>
        </div>
      </form>
    </div>
  );
};
