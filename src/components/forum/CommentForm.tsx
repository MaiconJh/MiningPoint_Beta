import React, { useState } from 'react';
import X from 'lucide-react/dist/esm/icons/x';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';
import Quote from 'lucide-react/dist/esm/icons/quote';
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
    <div className="p-4 sm:p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
      {(quoteText || parentCommentId) && (
        <div className="mb-3 p-3 rounded-lg bg-[var(--bg-default)] border border-[var(--border-subtle)] flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
            {quoteText ? (
              <>
                <Quote className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                <span className="italic line-clamp-2">&quot;{quoteText}&quot;</span>
              </>
            ) : (
              <>
                <CornerDownRight className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                <span>Respondendo a um comentário</span>
              </>
            )}
          </div>
          {onClearReply && (
            <button
              type="button"
              onClick={onClearReply}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer p-0.5"
              title="Cancelar resposta"
              aria-label="Cancelar resposta vinculada"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Escreva sua resposta..."
          className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-y"
          required
        />

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Enviando...' : 'Responder'}
          </button>
        </div>
      </form>
    </div>
  );
};
