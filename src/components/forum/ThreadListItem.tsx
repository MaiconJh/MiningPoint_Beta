import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Pin from "lucide-react/dist/esm/icons/pin";
import Lock from "lucide-react/dist/esm/icons/lock";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import ThumbsUp from "lucide-react/dist/esm/icons/thumbs-up";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Forum, ForumThread } from "../../types/forum";
import { getUserProfile } from "../../lib/profile";
import { UserProfile } from "../../types/profile";

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
  if (!date) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
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
  const navigate = useNavigate();

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
    (acc, cur) => acc + (typeof cur === "number" ? cur : 0),
    0
  );

  const createdAtDate = thread.createdAt?.toDate ? thread.createdAt.toDate() : null;
  const updatedAtDate = thread.updatedAt?.toDate ? thread.updatedAt.toDate() : null;

  const formattedDate = createdAtDate
    ? createdAtDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "";

  const relativeCreated = formatRelativeTime(createdAtDate);
  const relativeUpdated = formatRelativeTime(updatedAtDate);

  const authorGroupColor = author?.primaryGroup?.color || "var(--brand-primary)";
  const authorNick = author
    ? author.handle
      ? `@${author.handle}`
      : author.displayName || "Membro"
    : thread.authorId
    ? `membro-${thread.authorId.slice(0, 5)}`
    : "Membro";

  const authorInitial = (author?.displayName || authorNick.replace(/^@/, ""))
    .charAt(0)
    .toUpperCase();

  const isSolved = Boolean(forum.features?.solution && thread.solutionCommentId);
  const threadUrl = `/forum/${forum.slug}/${thread.id}`;

  return (
    <div
      role="listitem"
      onClick={() => navigate(threadUrl)}
      className={`flex items-start sm:items-center gap-4 px-5 py-4 border-b border-[var(--border-subtle)] last:border-b-0 transition-colors relative cursor-pointer hover:bg-[color-mix(in_srgb,var(--bg-surface)_80%,var(--bg-surface-elevated)_20%)] ${
        thread.isPinned ? "bg-[var(--bg-surface-elevated)]" : ""
      }`}
    >
      {thread.isPinned && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-3 bottom-3 w-0.5 bg-[var(--brand-primary)] rounded-r-[2px]"
        />
      )}

      {/* Left: Author Avatar */}
      <div className="shrink-0">
        <div
          className="w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center bg-[var(--bg-surface)] text-[14px] font-bold"
          style={{ borderColor: authorGroupColor, color: authorGroupColor }}
          title={author?.primaryGroup?.name || "Membro"}
        >
          {author?.photoURL ? (
            <img
              src={author.photoURL}
              alt={authorNick}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{authorInitial}</span>
          )}
        </div>
      </div>

      {/* Center: Title Row & Meta Row */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Link
            to={threadUrl}
            onClick={(e) => e.stopPropagation()}
            className="text-[1rem] leading-[1.4] font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors truncate"
          >
            {thread.title}
          </Link>

          {category && (
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[4px] text-[10px] font-semibold leading-[1.5] border border-[var(--border-default)] text-[var(--text-secondary)] bg-[var(--bg-default)]">
              {category.name}
            </span>
          )}

          {thread.isPinned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[4px] text-[10px] font-semibold leading-[1.5] border border-[color-mix(in_srgb,var(--brand-primary)_45%,transparent)] text-[var(--brand-primary)]">
              <Pin className="w-2.5 h-2.5" />
              <span>Fixado</span>
            </span>
          )}

          {thread.isLocked && (
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[4px] text-[10px] font-semibold leading-[1.5] border border-[color-mix(in_srgb,var(--feedback-warning)_45%,transparent)] text-[var(--feedback-warning)]">
              <Lock className="w-2.5 h-2.5" />
              <span>Trancado</span>
            </span>
          )}

          {isSolved && (
            <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[4px] text-[10px] font-semibold leading-[1.5] border border-[color-mix(in_srgb,var(--feedback-success)_45%,transparent)] text-[var(--feedback-success)]">
              <CheckCircle className="w-2.5 h-2.5" />
              <span>Resolvido</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap forum-meta text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-secondary)]">
            {authorNick}
          </span>

          {formattedDate && (
            <>
              <span className="text-[12px] leading-none">·</span>
              <span className="forum-num">{formattedDate}</span>
            </>
          )}

          {relativeCreated && (
            <>
              <span className="text-[12px] leading-none">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="forum-num">{relativeCreated}</span>
              </span>
            </>
          )}

          {thread.commentCount > 0 && relativeUpdated && (
            <>
              <span className="text-[12px] leading-none">·</span>
              <span className="text-[var(--text-secondary)] inline-flex items-center gap-1">
                Última resposta <span className="forum-num">{relativeUpdated}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Reactions & Comments Counters */}
      <div className="hidden sm:flex items-center gap-4 shrink-0 pl-4 border-l border-[var(--border-subtle)] self-center h-6 text-[var(--text-muted)] text-[12px]">
        {forum.features?.reactions && totalReactions > 0 && (
          <div className="inline-flex items-center gap-1.5 leading-none">
            <ThumbsUp className="w-4 h-4 text-[var(--brand-primary)]" />
            <span className="forum-num">{totalReactions}</span>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 leading-none">
          <MessageSquare className="w-4 h-4" />
          <span className="forum-num">{thread.commentCount}</span>
        </div>
      </div>
    </div>
  );
};