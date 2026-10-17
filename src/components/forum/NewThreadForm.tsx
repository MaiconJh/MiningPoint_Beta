import React, { useState, useRef } from 'react';
import Bold from 'lucide-react/dist/esm/icons/bold';
import Italic from 'lucide-react/dist/esm/icons/italic';
import Code from 'lucide-react/dist/esm/icons/code';
import Quote from 'lucide-react/dist/esm/icons/quote';
import List from 'lucide-react/dist/esm/icons/list';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Send from 'lucide-react/dist/esm/icons/send';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormat = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.slice(start, end);
    const replacement = `${prefix}${selected || 'texto'}${suffix}`;
    const newText = text.slice(0, start) + replacement + text.slice(end);
    setBody(newText);
    setTimeout(() => {
      textarea.focus();
      const cursorStart = start + prefix.length;
      const cursorEnd = cursorStart + (selected ? selected.length : 5);
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

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
    <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-4">
      <h3 className="forum-title text-[var(--text-primary)] m-0">
        Criar Novo Tópico
      </h3>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] forum-meta font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {forum.categories.length > 0 && (
          <div>
            <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
              Subdivisão / Categoria
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-3.5 py-2.5 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
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
          <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do seu tópico..."
            className="w-full px-3.5 py-2.5 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            required
          />
        </div>

        <div>
          <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
            Mensagem
          </label>
          {/* Toolbar de Ícones */}
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] overflow-hidden focus-within:border-[var(--border-focus)] transition-colors">
            <div className="px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => insertFormat('**', '**')}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Negrito"
                aria-label="Negrito"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('*', '*')}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Itálico"
                aria-label="Itálico"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('`', '`')}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Código"
                aria-label="Código"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('> ', '')}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Citação"
                aria-label="Citação"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('- ', '')}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Lista"
                aria-label="Lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormat('[', '](https://)')}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                title="Link"
                aria-label="Link"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Escreva sua mensagem aqui..."
              className="w-full px-3.5 py-3 forum-body bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-y"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 forum-body font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 forum-body font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{saving ? 'Publicando...' : 'Publicar tópico'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
