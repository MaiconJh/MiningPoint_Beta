import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Pin from 'lucide-react/dist/esm/icons/pin';
import Lock from 'lucide-react/dist/esm/icons/lock';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ThumbsUp from 'lucide-react/dist/esm/icons/thumbs-up';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { Forum, ForumThread } from '../../types/forum';
import { getUserProfile } from '../../lib/profile';
import { UserProfile } from '../../types/profile';
import { MarkdownBody } from './MarkdownBody';

interface ThreadListItemProps {
  thread: ForumThread;
  forum: Forum;
}

// Module-level cache to share profile requests across items
const profileCache = new Map<string, Promise<UserProfile | null>>();

function getCachedProfile(uid: string): Promise<UserProfile | null> {
  if (!profileCache.has(uid)) {
    profileCache.set(uid, getUserProfile(uid));
  }
  return profileCache.get(uid)!;
}

function formatRelativeTime(date?: Date | null): string {
  if (!date) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `há ${diffDays}d`;
  const diffMonths = Math.floor(diffDays / 30);
  return `há ${diffMonths}m`;
}

export const ThreadListItem: React.FC<ThreadListItemProps> = ({ thread, forum }) => {
  const [author, setAuthor] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (thread.authorId) {
      getCachedProfile(thread.authorId).then((prof) => {
        if (isMounted) setAuthor(prof);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [thread.authorId]);

  const category = forum.categories?.find((c) => c.id === thread.categoryId);

  const totalReactions = Object.values(thread.reactionCounts || {}).reduce(
    (acc, cur) => acc + (typeof cur === 'number' ? cur : 0),
    0
  );

  const createdAtDate = thread.createdAt?.toDate ? thread.createdAt.toDate() : null;
  const updatedAtDate = thread.updatedAt?.toDate ? thread.updatedAt.toDate() : null;

  const formattedDate = createdAtDate
    ? createdAtDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : '';

  const relativeCreated = formatRelativeTime(createdAtDate);
  const relativeUpdated = formatRelativeTime(updatedAtDate);

  const authorGroupColor = author?.primaryGroup?.color || 'var(--brand-primary)';
  const authorNick = author
    ? author.handle
      ? `@${author.handle}`
      : author.displayName || 'Membro'
    : thread.authorId
    ? `membro-${thread.authorId.slice(0, 5)}`
    : 'Membro';

  const authorInitial = (author?.displayName || authorNick).charAt(0).toUpperCase();

  const hasStateBadges =
    thread.isPinned ||
    thread.isLocked ||
    Boolean(forum.features?.solution && thread.solutionCommentId);

  const hasBodyContent = Boolean(thread.body && thread.body.trim().length > 0);

  return (
    <article
      className={`rounded-xl border forum-card-transition flex flex-col ${
        thread.isPinned
          ? 'border-[var(--brand-primary)] bg-[var(--bg-surface-elevated)]'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)]'
      }`}
    >
      {/* Zona 1: Contexto (Header) */}
      <header className="px-4 py-3 sm:px-5 flex items-center justify-between gap-3 border-b border-[color-mix(in_srgb,var(--border-default)_60%,transparent)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-full border-2 overflow-hidden flex items-center justify-center bg-[var(--bg-default)] shrink-0"
            style={{ borderColor: authorGroupColor }}
            title={author?.primaryGroup?.name || 'Membro'}
          >
            {author?.photoURL ? (
              <img
                src={author.photoURL}
                alt={authorNick}
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="forum-meta font-bold"
                style={{ color: authorGroupColor }}
              >
                {authorInitial}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 forum-meta text-[var(--text-muted)] min-w-0 flex-wrap">
            <span className="font-semibold text-[var(--text-secondary)] truncate">
              {authorNick}
            </span>
            {formattedDate && (
              <>
                <span>·</span>
                <span className="forum-num">{formattedDate}</span>
              </>
            )}
            {relativeCreated && (
              <>
                <span>·</span>
                <span className="forum-num">{relativeCreated}</span>
              </>
            )}
          </div>
        </div>

        {category && (
          <span className="shrink-0 px-2 py-0.5 forum-meta font-medium rounded-md bg-[var(--bg-default)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            {category.name}
          </span>
        )}
      </header>

      {/* Zona 2: Conteúdo (Article Body) */}
      <div className="p-4 sm:p-5 space-y-2 flex-1 min-w-0">
        {hasStateBadges && (
          <div className="flex items-center gap-2 flex-wrap">
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 forum-meta font-semibold rounded-md bg-[var(--brand-primary)] text-[var(--text-on-primary)]">
                <Pin className="w-3 h-3" />
                Fixado
              </span>
            )}

            {thread.isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 forum-meta font-semibold rounded-md bg-[var(--bg-default)] text-[var(--feedback-warning)] border border-[var(--border-subtle)]">
                <Lock className="w-3 h-3" />
                Trancado
              </span>
            )}

            {forum.features?.solution && thread.solutionCommentId && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 forum-meta font-semibold rounded-md bg-[var(--feedback-success)] text-[var(--text-inverse)]">
                <CheckCircle className="w-3 h-3" />
                Resolvido
              </span>
            )}
          </div>
        )}

        <Link
          to={`/forum/${forum.slug}/${thread.id}`}
          className="forum-title text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors line-clamp-2 block"
        >
          {thread.title}
        </Link>

        {hasBodyContent && (
          <div className="forum-meta text-[var(--text-muted)] line-clamp-2 m-0">
            <MarkdownBody content={thread.body} compact />
          </div>
        )}
      </div>

      {/* Zona 3: Atividade (Footer) */}
      <footer className="px-4 py-2.5 sm:px-5 flex items-center justify-end gap-3 border-t border-[color-mix(in_srgb,var(--border-default)_60%,transparent)]">
        <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
          {thread.commentCount > 0 && relativeUpdated && (
            <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] forum-meta">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="forum-num">Última resposta {relativeUpdated}</span>
            </span>
          )}

          {forum.features?.reactions && totalReactions > 0 && (
            <div className="flex items-center gap-1 forum-meta text-[var(--text-secondary)] bg-[var(--bg-default)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
              <ThumbsUp className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span className="forum-num font-semibold">{totalReactions}</span>
            </div>
          )}

          <div className="flex items-center gap-1 forum-meta text-[var(--text-secondary)] bg-[var(--bg-default)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="forum-num font-semibold">{thread.commentCount}</span>
          </div>
        </div>
      </footer>
    </article>
  );
};
