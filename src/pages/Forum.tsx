import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useParams, Link } from 'react-router-dom';
import { useForums } from '../hooks/useForums';
import { useAuth } from '../context/AuthContext';
import { getForumBySlug } from '../lib/forums';
import { canViewForum } from '../lib/forumPermissions';
import { Forum as ForumType } from '../types/forum';
import { ForumIndex } from '../components/forum/ForumIndex';
import { ForumView } from '../components/forum/ForumView';
import { ThreadView } from '../components/forum/ThreadView';
import { useThreadDetails } from '../hooks/useForumThreads';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';

const ForumIndexPage: React.FC = () => {
  const { forums, loading, error } = useForums();
  return <ForumIndex forums={forums} loading={loading} error={error} />;
};

const ForumViewPage: React.FC = () => {
  const { forumSlug } = useParams<{ forumSlug: string }>();
  const { user, profile } = useAuth();
  const [forum, setForum] = useState<ForumType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForum = useCallback(async () => {
    if (!forumSlug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getForumBySlug(forumSlug);
      if (!data) {
        setError('Fórum não encontrado.');
      } else if (!canViewForum(data, user, profile)) {
        setError('Você não possui permissão para visualizar este fórum.');
      } else {
        setForum(data);
      }
    } catch (err) {
      console.error('Failed to load forum:', err);
      setError('Erro ao carregar o fórum.');
    } finally {
      setLoading(false);
    }
  }, [forumSlug, user, profile]);

  useEffect(() => {
    loadForum();
  }, [loadForum]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !forum) {
    return (
      <div className="p-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-center space-y-4">
        <MessageSquare className="w-10 h-10 mx-auto text-[var(--text-muted)]" />
        <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
          {error || 'Fórum não encontrado'}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] m-0 max-w-sm mx-auto">
          O fórum solicitado pode ter sido desativado, removido ou requer credenciais de acesso específicas.
        </p>
        <Link
          to="/forum"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para todos os fóruns
        </Link>
      </div>
    );
  }

  return <ForumView forum={forum} />;
};

const ThreadViewPage: React.FC = () => {
  const { forumSlug, threadId } = useParams<{ forumSlug: string; threadId: string }>();
  const { user, profile } = useAuth();
  const [forum, setForum] = useState<ForumType | null>(null);
  const [loadingForum, setLoadingForum] = useState(true);

  const { thread, comments, loading: loadingThread, error: threadError, reload } =
    useThreadDetails(threadId);

  useEffect(() => {
    let isMounted = true;
    if (forumSlug) {
      setLoadingForum(true);
      getForumBySlug(forumSlug)
        .then((data) => {
          if (isMounted) setForum(data);
        })
        .finally(() => {
          if (isMounted) setLoadingForum(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [forumSlug]);

  if (loadingForum || loadingThread) {
    return (
      <div className="space-y-4">
        <div className="h-36 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!forum || !canViewForum(forum, user, profile)) {
    return (
      <div className="p-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-center space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
          Acesso restrito ao fórum
        </h2>
        <Link
          to="/forum"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para todos os fóruns
        </Link>
      </div>
    );
  }

  if (threadError || !thread) {
    return (
      <div className="p-10 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-center space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
          Tópico não encontrado
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] m-0">
          O tópico solicitado não existe ou foi removido.
        </p>
        <Link
          to={`/forum/${forum.slug}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para {forum.title}
        </Link>
      </div>
    );
  }

  return <ThreadView forum={forum} thread={thread} comments={comments} onReload={reload} />;
};

export const Forum: React.FC = () => {
  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Routes>
        <Route index element={<ForumIndexPage />} />
        <Route path=":forumSlug" element={<ForumViewPage />} />
        <Route path=":forumSlug/:threadId" element={<ThreadViewPage />} />
      </Routes>
    </div>
  );
};
