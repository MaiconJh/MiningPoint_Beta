import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Layers from 'lucide-react/dist/esm/icons/layers';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Trophy from 'lucide-react/dist/esm/icons/trophy';
import BarChart2 from 'lucide-react/dist/esm/icons/bar-chart-2';
import Compass from 'lucide-react/dist/esm/icons/compass';
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

  // Unique focuses for the horizontal categories bar (R-02)
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
  const [forumStats, setForumStats] = useState<Record<string, { threads: number; comments: number }>>({});

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

      const stats: Record<string, { threads: number; comments: number }> = {};
      results.forEach((threadsOfForum, idx) => {
        const f = visibleForums[idx];
        const totalComments = threadsOfForum.reduce(
          (acc, cur) => acc + (cur.thread.commentCount || 0),
          0
        );
        stats[f.id] = {
          threads: threadsOfForum.length,
          comments: totalComments,
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
    return recentThreads.filter((item) => item.thread.solutionCommentId).length;
  }, [recentThreads]);

  if (loading) {
    return (
      <div className="space-y-6 forum-screen-fade">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[var(--bg-surface)] rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-[var(--bg-surface)] rounded-md animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse h-40"
            />
          ))}
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
    <div className="space-y-8 forum-screen-fade">
      {/* Header Banner */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="forum-page text-[var(--text-primary)] m-0">
          Fóruns da Comunidade
        </h1>
        <p className="forum-body text-[var(--text-secondary)] mt-2 mb-0 max-w-2xl">
          Espaço aberto para discussões, dúvidas, sugestões e troca de experiências entre os membros do MiningPoint.
        </p>
      </div>

      {/* Zona 1: Barra horizontal de categorias acima do conteúdo (R-02) */}
      {uniqueFocuses.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setSelectedFocus(null)}
            className={`px-3.5 py-1.5 forum-meta font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedFocus === null
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            Todos os fóruns
          </button>
          {uniqueFocuses.map((focus) => (
            <button
              key={focus}
              type="button"
              onClick={() => setSelectedFocus(focus)}
              className={`px-3.5 py-1.5 forum-meta font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedFocus === focus
                  ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
              }`}
            >
              {focus}
            </button>
          ))}
        </div>
      )}

      {/* Main Layout: Grid + Feed with Contextual Sidebar */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Main Column */}
        <div className="flex-1 min-w-0 space-y-8 w-full">
          {/* Zona 2: Grid de cards de categoria (R-02 & R-03) */}
          {filteredForums.length === 0 ? (
            <div className="p-12 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3" />
              <h2 className="forum-title text-[var(--text-primary)] m-0">
                Nenhum fórum disponível nesta categoria
              </h2>
              <p className="forum-meta text-[var(--text-muted)] mt-1.5 mb-0 max-w-md mx-auto">
                Não há fóruns cadastrados com o foco selecionado. Tente selecionar &quot;Todos os fóruns&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredForums.map((forum) => (
                <Link
                  key={forum.id}
                  to={`/forum/${forum.slug}`}
                  className="group forum-card-transition rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)] flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div>
                    {/* Capa com campo de cor próprio (R-03) */}
                    <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-default)] flex items-center justify-between gap-3">
                      {/* Ícone à esquerda com reação ao hover */}
                      <div className="p-2.5 rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--brand-primary)] border border-[var(--border-subtle)] forum-icon-hover">
                        <Compass className="w-5 h-5" />
                      </div>

                      {/* Pílula de foco à direita */}
                      <span className="forum-meta font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--brand-primary)]">
                        Foco: {forum.focus}
                      </span>
                    </div>

                    {/* Título e descrição (título primário, resto meta) */}
                    <div className="p-5 space-y-2.5">
                      <h2 className="forum-title text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors m-0">
                        {forum.title}
                      </h2>

                      {forum.description && (
                        <p className="forum-meta text-[var(--text-secondary)] line-clamp-2 m-0">
                          {forum.description}
                        </p>
                      )}

                      {/* Lista de subdivisões com contagem */}
                      {forum.categories.length > 0 && (
                        <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                          <span className="forum-meta text-[var(--text-muted)] flex items-center gap-1 mr-1">
                            <Layers className="w-3.5 h-3.5" />
                            <span className="forum-num">{forum.categories.length}</span> subdivisões:
                          </span>
                          {forum.categories.slice(0, 3).map((cat) => (
                            <span
                              key={cat.id}
                              className="px-2 py-0.5 forum-meta rounded-md bg-[var(--bg-default)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
                            >
                              {cat.name}
                            </span>
                          ))}
                          {forum.categories.length > 3 && (
                            <span className="forum-meta text-[var(--text-muted)]">
                              +{forum.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rodapé com volume e acesso */}
                  <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-default)] flex items-center justify-between forum-meta text-[var(--text-secondary)]">
                    <div className="flex items-center gap-3">
                      <span className="forum-num">
                        {forumStats[forum.id]?.threads ?? 0} tópicos
                      </span>
                      <span>·</span>
                      <span className="forum-num">
                        {forumStats[forum.id]?.comments ?? 0} respostas
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-semibold text-[var(--brand-primary)]">
                      <span>Acessar fórum</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Zona 3: Feed de últimos tópicos abaixo do grid (R-02) */}
          <div className="space-y-4 pt-4">
            <div className="border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
              <div>
                <h3 className="forum-title text-[var(--text-primary)] m-0">
                  Últimos Tópicos da Comunidade
                </h3>
                <p className="forum-meta text-[var(--text-muted)] mt-1 mb-0">
                  Atividades recentes e discussões em andamento
                </p>
              </div>
            </div>

            {loadingRecent ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse h-20"
                  />
                ))}
              </div>
            ) : recentThreads.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
                <p className="forum-meta text-[var(--text-muted)] m-0">
                  Nenhum tópico recente encontrado nos fóruns ativos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentThreads.map(({ thread, forum }) => (
                  <ThreadListItem key={thread.id} thread={thread} forum={forum} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zona 4: Sidebar contextual à direita (some em telas estreitas) (R-02) */}
        <aside className="hidden lg:block lg:w-80 shrink-0">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 space-y-4">
            {/* Bloco 1: Stats da Comunidade */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--brand-primary)]">
                <BarChart2 className="w-4 h-4" />
                <h4 className="forum-title text-[var(--text-primary)] m-0">
                  Estatísticas
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-0.5">
                  <span className="forum-meta text-[var(--text-muted)] block">Fóruns</span>
                  <span className="forum-title forum-num text-[var(--text-primary)]">
                    {visibleForums.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="forum-meta text-[var(--text-muted)] block">Tópicos</span>
                  <span className="forum-title forum-num text-[var(--text-primary)]">
                    {totalThreadsCount}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="forum-meta text-[var(--text-muted)] block">Respostas</span>
                  <span className="forum-title forum-num text-[var(--text-primary)]">
                    {totalCommentsCount}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="forum-meta text-[var(--text-muted)] block">Soluções</span>
                  <span className="forum-title forum-num text-[var(--feedback-success)]">
                    {totalSolutionsCount}
                  </span>
                </div>
              </div>
            </div>

            {recentThreads.length > 0 && (
              <div className="pt-4 space-y-3 border-t border-[var(--border-default)]">
                <div className="flex items-center gap-2 text-[var(--brand-primary)]">
                  <Trophy className="w-4 h-4" />
                  <h4 className="forum-title text-[var(--text-primary)] m-0">
                    Tópicos em Alta
                  </h4>
                </div>

                <div className="divide-y divide-[var(--border-subtle)]">
                  {[...recentThreads]
                    .sort((a, b) => (b.thread.commentCount || 0) - (a.thread.commentCount || 0))
                    .slice(0, 3)
                    .map(({ thread, forum }) => (
                      <Link
                        key={thread.id}
                        to={`/forum/${forum.slug}/${thread.id}`}
                        className="flex items-start justify-between gap-3 group -mx-2 px-2 py-2 rounded-md hover:bg-[var(--bg-default)] transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="forum-body font-semibold text-[var(--text-primary)] block truncate group-hover:text-[var(--brand-primary)] transition-colors">
                            {thread.title}
                          </span>
                          <span className="forum-meta text-[var(--text-muted)]">
                            {forum.title}
                          </span>
                        </div>
                        <span className="forum-meta font-semibold text-[var(--feedback-success)] forum-num shrink-0">
                          {thread.commentCount || 0}
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
