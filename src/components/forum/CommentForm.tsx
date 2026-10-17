import React, { useState, useRef } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';
import Quote from 'lucide-react/dist/esm/icons/quote';
import Bold from 'lucide-react/dist/esm/icons/bold';
import Italic from 'lucide-react/dist/esm/icons/italic';
import Code from 'lucide-react/dist/esm/icons/code';
import List from 'lucide-react/dist/esm/icons/list';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import Send from 'lucide-react/dist/esm/icons/send';
import { ForumCommentFormData } from '../../types/forum';

interface CommentFormProps {
  onSave: (data: ForumCommentFormData) => Promise<void>;
  saving: boolean;
  parentCommentId?: string | null;
  quoteCommentId?: string | null;
  quoteText?: string | null;
  onClearReply?: () => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  onSave,
  saving,
  parentCommentId,
  quoteCommentId,
  quoteText,
  onClearReply,
}) => {
  const [body, setBody] = useState('');
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

    if (!body.trim()) {
      setError('O comentário não pode ficar em branco.');
      return;
    }

    try {
      await onSave({
        body: body.trim(),
        parentCommentId: parentCommentId || null,
        quoteCommentId: quoteCommentId || null,
      });
      setBody('');
      if (onClearReply) onClearReply();
    } catch (err: unknown) {
      console.error('Failed to post comment:', err);
      setError('Erro ao enviar o comentário. Tente novamente.');
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-3">
      {/* Resposta/Citação vinculada */}
      {(quoteText || parentCommentId) && (
        <div className="p-3 rounded-lg bg-[var(--bg-default)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 forum-meta text-[var(--text-secondary)]">
            {quoteText ? (
              <>
                <Quote className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                <span className="italic line-clamp-2">&quot;{quoteText}&quot;</span>
              </>
            ) : (
              <>
                <CornerDownRight className="w-3.5 h-3.5 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                <span>Respondendo a um comentário</span>
              </>
            )}
          </div>
          {onClearReply && (
            <button
              type="button"
              onClick={onClearReply}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
              title="Cancelar resposta vinculada"
              aria-label="Cancelar resposta vinculada"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="p-2.5 rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] forum-meta font-semibold">
          {error}
        </div>
      )}

      {/* Composer com Toolbar de Ícones (R-05) */}
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

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Escreva sua resposta..."
            className="w-full px-3.5 py-3 forum-body bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none resize-y"
            required
          />

          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between">
            <span className="forum-meta text-[var(--text-muted)]">
              Formatação Markdown suportada
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 forum-body font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Enviando...' : 'Responder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
