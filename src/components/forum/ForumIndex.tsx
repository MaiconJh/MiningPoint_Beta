import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Folder from 'lucide-react/dist/esm/icons/folder';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Flame from 'lucide-react/dist/esm/icons/flame';
import BarChart2 from 'lucide-react/dist/esm/icons/bar-chart-2';
import { Forum, ForumThread } from '../../types/forum';
import { useAuth } from '../../context/AuthContext';
import { canViewForum } from '../../lib/forumPermissions';
import { listThreads } from '../../lib/forumThreads';
import { ThreadListItem } from './ThreadListItem';

interface ForumIndexProps {
  forums: Forum[];
  loading: boolean;
  error: string | null;
}

export const ForumIndex: React.FC<ForumIndexProps> = ({ forums, loading, error }) => {
  const { user, profile } = useAuth();
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);

  // Filter forums visible to the current user
  const visibleForums = useMemo(() => {
    return forums.filter((f) => canViewForum(f, user, profile));
  }, [forums, user, profile]);

  // Unique focuses for the horizontal categories bar
  const uniqueFocuses = useMemo(() => {
    const set = new Set<string>();
    visibleForums.forEach((f) => {
      if (f.focus && f.focus.trim()) set.add(f.focus.trim());
    });
    return Array.from(set);
  }, [visibleForums]);

  // Filtered forums based on active category/focus pill
  const filteredForums = useMemo(() => {
    if (!selectedFocus) return visibleForums;
    return visibleForums.filter((f) => f.focus === selectedFocus);
  }, [visibleForums, selectedFocus]);

  // Recent threads and stats for feed and sidebar
  const [recentThreads, setRecentThreads] = useState<Array<{ thread: ForumThread; forum: Forum }>>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [forumStats, setForumStats] = useState<
    Record<string, { threads: number; comments: number; solutions: number }>
  >({});

  useEffect(() => {
    let isMounted = true;
    if (visibleForums.length === 0) return;

    setLoadingRecent(true);
    Promise.all(
      visibleForums.map(async (f) => {
        try {
          const ths = await listThreads(f.id);
          return ths.map((t) => ({ thread: t, forum: f }));
        } catch {
          return [];
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const all = results.flat();
      all.sort((a, b) => {
        const tA = a.thread.createdAt?.toMillis?.() || 0;
        const tB = b.thread.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
      setRecentThreads(all.slice(0, 8));

      const stats: Record<string, { threads: number; comments: number; solutions: number }> = {};
      results.forEach((threadsOfForum, idx) => {
        const f = visibleForums[idx];
        const totalComments = threadsOfForum.reduce(
          (acc, cur) => acc + (cur.thread.commentCount || 0),
          0
        );
        const totalSolutions = threadsOfForum.filter((cur) =>
          Boolean(f.features?.solution && cur.thread.solutionCommentId)
        ).length;
        stats[f.id] = {
          threads: threadsOfForum.length,
          comments: totalComments,
          solutions: totalSolutions,
        };
      });
      setForumStats(stats);
      setLoadingRecent(false);
    });

    return () => {
      isMounted = false;
    };
  }, [visibleForums]);

  // Community aggregated statistics
  const totalThreadsCount = useMemo(() => {
    return Object.values(forumStats).reduce((acc, cur) => acc + cur.threads, 0);
  }, [forumStats]);

  const totalCommentsCount = useMemo(() => {
    return Object.values(forumStats).reduce((acc, cur) => acc + cur.comments, 0);
  }, [forumStats]);

  const totalSolutionsCount = useMemo(() => {
    return Object.values(forumStats).reduce((acc, cur) => acc + cur.solutions, 0);
  }, [forumStats]);

  if (loading) {
    return (
      <div className="space-y-6 forum-screen-fade">
        <div className="flex gap-2">
          <div className="h-8 w-32 bg-[var(--bg-surface)] rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-[var(--bg-surface)] rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div className="space-y-6">
            <div className="h-32 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse" />
            <div className="h-48 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse" />
          </div>
          <div className="space-y-5">
            <div className="h-36 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse" />
            <div className="h-36 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-[var(--feedback-error)] text-[var(--text-inverse)] forum-body font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="forum-screen-fade">
      {/* Category/Focus Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedFocus(null)}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
            selectedFocus === null
              ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] border-[var(--brand-primary)]'
              : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]'
          }`}
        >
          Todos os fóruns
        </button>
        {uniqueFocuses.map((focus) => (
          <button
            key={focus}
            type="button"
            onClick={() => setSelectedFocus(focus)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
              selectedFocus === focus
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] border-[var(--brand-primary)]'
                : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]'
            }`}
          >
            {focus}
          </button>
        ))}
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="min-w-0">
          {/* Unified Forum List */}
          {filteredForums.length === 0 ? (
            <div className="p-10 mb-8 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
              <MessageSquare className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3" />
              <h2 className="forum-title text-[var(--text-primary)] m-0">
                Nenhum fórum disponível nesta categoria
              </h2>
              <p className="forum-meta text-[var(--text-muted)] mt-1.5 mb-0 max-w-md mx-auto">
                Não há fóruns cadastrados com o foco selecionado. Tente selecionar &quot;Todos os fóruns&quot;.
              </p>
            </div>
          ) : (
            <div className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] overflow-hidden mb-8">
              {filteredForums.map((forum) => {
                const threadCount = forumStats[forum.id]?.threads ?? 0;
                const commentCount = forumStats[forum.id]?.comments ?? 0;

                return (
                  <Link
                    key={forum.id}
                    to={`/forum/${forum.slug}`}
                    className="group flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-5 border-b border-[var(--border-subtle)] last:border-b-0 transition-colors cursor-pointer relative hover:bg-[color-mix(in_srgb,var(--bg-surface)_80%,var(--bg-surface-elevated)_20%)]"
                  >
                    <div className="w-11 h-11 rounded-[10px] bg-[var(--bg-default)] border border-[var(--border-default)] group-hover:border-[var(--border-focus)] flex items-center justify-center shrink-0 text-[var(--brand-primary)] transition-colors">
                      <MessageSquare className="w-[22px] h-[22px]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[1rem] font-bold text-[var(--text-primary)] leading-[1.4]">
                          {forum.title}
                        </span>
                        {forum.focus && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-[4px] text-[10px] font-semibold border border-[var(--border-default)] text-[var(--text-secondary)] bg-[var(--bg-default)] leading-[1.5]">
                            Foco: {forum.focus}
                          </span>
                        )}
                      </div>

                      {forum.description && (
                        <div className="text-[0.875rem] text-[var(--text-secondary)] leading-[1.5] mb-2">
                          {forum.description}
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap forum-meta text-[var(--text-muted)]">
                        {forum.categories.length > 0 && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <Folder className="w-3 h-3" />
                              <span className="forum-num">{forum.categories.length}</span>{' '}
                              {forum.categories.length === 1 ? 'subdivisão' : 'subdivisões'}
                            </span>
                            <span className="text-[var(--border-default)]">·</span>
                            <div className="inline-flex items-center gap-1.5 flex-wrap">
                              {forum.categories.slice(0, 3).map((cat) => (
                                <span
                                  key={cat.id}
                                  className="px-1.5 py-[1px] rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[10px]"
                                >
                                  {cat.name}
                                </span>
                              ))}
                              {forum.categories.length > 3 && (
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  +{forum.categories.length - 3}
                                </span>
                              )}
                            </div>
                            <span className="text-[var(--border-default)]">·</span>
                          </>
                        )}

                        <span className="inline-flex items-center gap-1">
                          <span className="forum-num">{threadCount}</span>{' '}
                          {threadCount === 1 ? 'tópico' : 'tópicos'}
                        </span>
                        <span className="text-[var(--border-default)]">·</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="forum-num">{commentCount}</span>{' '}
                          {commentCount === 1 ? 'resposta' : 'respostas'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 forum-meta font-semibold text-[var(--brand-primary)] px-2.5 py-1.5 rounded-[6px] border border-transparent group-hover:bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] group-hover:border-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)] transition-all shrink-0 ml-[60px] sm:ml-auto">
                      <span>Acessar fórum</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Community Recent Threads */}
          <h2 className="text-[0.9375rem] font-semibold text-[var(--text-primary)] mb-3.5 flex items-center gap-2 m-0">
            Últimos Tópicos da Comunidade
          </h2>

          {loadingRecent ? (
            <div className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] overflow-hidden divide-y divide-[var(--border-subtle)]">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 animate-pulse h-20" />
              ))}
            </div>
          ) : recentThreads.length === 0 ? (
            <div className="p-8 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
              <p className="forum-meta text-[var(--text-muted)] m-0">
                Nenhum tópico recente encontrado nos fóruns ativos.
              </p>
            </div>
          ) : (
            <div
              className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] overflow-hidden"
              role="list"
            >
              {recentThreads.map(({ thread, forum }) => (
                <ThreadListItem key={thread.id} thread={thread} forum={forum} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-5">
          {/* Card 1: Estatísticas */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] p-5 flex flex-col">
            <h3 className="flex items-center gap-2 text-[0.875rem] font-semibold text-[var(--text-primary)] mb-4 m-0">
              <BarChart2 className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
              Estatísticas
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-3">
              <div className="flex flex-col gap-0.5">
                <span className="forum-meta text-[var(--text-muted)] leading-[1.2]">
                  Fóruns
                </span>
                <span className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-[1.2] forum-num">
                  {visibleForums.length}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="forum-meta text-[var(--text-muted)] leading-[1.2]">
                  Tópicos
                </span>
                <span className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-[1.2] forum-num">
                  {totalThreadsCount}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="forum-meta text-[var(--text-muted)] leading-[1.2]">
                  Respostas
                </span>
                <span className="text-[1.25rem] font-bold text-[var(--text-primary)] leading-[1.2] forum-num">
                  {totalCommentsCount}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="forum-meta text-[var(--text-muted)] leading-[1.2]">
                  Soluções
                </span>
                <span className="text-[1.25rem] font-bold text-[var(--feedback-success)] leading-[1.2] forum-num">
                  {totalSolutionsCount}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Tópicos em Alta */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] p-5 flex flex-col">
            <h3 className="flex items-center gap-2 text-[0.875rem] font-semibold text-[var(--text-primary)] mb-4 m-0">
              <Flame className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
              Tópicos em Alta
            </h3>

            {recentThreads.length === 0 ? (
              <p className="forum-meta text-[var(--text-muted)] m-0">
                Nenhum tópico em alta no momento.
              </p>
            ) : (
              <div className="flex flex-col gap-1 -mx-2">
                {[...recentThreads]
                  .sort((a, b) => (b.thread.commentCount || 0) - (a.thread.commentCount || 0))
                  .slice(0, 3)
                  .map(({ thread, forum }) => (
                    <Link
                      key={thread.id}
                      to={`/forum/${forum.slug}/${thread.id}`}
                      className="flex items-center justify-between gap-3 p-2 rounded-[6px] transition-colors hover:bg-[color-mix(in_srgb,var(--bg-surface)_80%,var(--bg-surface-elevated)_20%)]"
                    >
                      <div className="flex flex-col min-w-0 gap-[1px]">
                        <span className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate">
                          {thread.title}
                        </span>
                        <span className="text-[0.6875rem] text-[var(--text-muted)]">
                          {forum.title}
                        </span>
                      </div>
                      <span className="text-[0.8125rem] font-bold text-[var(--feedback-success)] forum-num shrink-0">
                        {thread.commentCount || 0}
                      </span>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

