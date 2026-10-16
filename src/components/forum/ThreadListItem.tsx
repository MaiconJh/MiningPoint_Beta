import React from 'react';
import { Link } from 'react-router-dom';
import Pin from 'lucide-react/dist/esm/icons/pin';
import Lock from 'lucide-react/dist/esm/icons/lock';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Smile from 'lucide-react/dist/esm/icons/smile';
import { Forum, ForumThread } from '../../types/forum';

interface ThreadListItemProps {
  thread: ForumThread;
  forum: Forum;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, forum }) => {
  const category = forum.categories?.find((c) => c.id === thread.categoryId);

  const totalReactions = Object.values(thread.reactionCounts || {}).reduce(
    (acc, cur) => acc + (typeof cur === 'number' ? cur : 0),
    0
  );

  const formattedDate = thread.createdAt?.toDate
    ? thread.createdAt.toDate().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border transition-all ${
        thread.isPinned
          ? 'border-[var(--brand-primary)] bg-[var(--bg-surface-elevated)]'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[var(--brand-primary)] text-[var(--text-on-primary)]">
                <Pin className="w-3 h-3" />
                Fixado
              </span>
            )}

            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[var(--bg-default)] text-[var(--feedback-warning)] border border-[var(--border-subtle)]">
                <Lock className="w-3 h-3" />
                Trancado
              </span>
            )}

            {forum.features?.solution && thread.solutionCommentId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[var(--feedback-success)] text-[var(--text-inverse)]">
                <CheckCircle className="w-3 h-3" />
                Resolvido
              </span>
            )}

            {category && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[var(--bg-default)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {category.name}
              </span>
            )}
          </div>

          <Link
            to={`/forum/${forum.slug}/${thread.id}`}
            className="text-base sm:text-lg font-bold text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors line-clamp-2 block"
          >
            {thread.title}
          </Link>

          <p className="text-xs text-[var(--text-muted)] line-clamp-2 m-0">
            {thread.body}
          </p>

          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] pt-1 flex-wrap">
            <span>Publicado em {formattedDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-center">
          {forum.features?.reactions && totalReactions > 0 && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-default)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)]">
              <Smile className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>{totalReactions}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] bg-[var(--bg-default)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)]">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>{thread.commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
