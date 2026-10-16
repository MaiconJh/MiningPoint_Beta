import { useState, useEffect, useCallback } from 'react';
import { ForumThread, ForumComment } from '../types/forum';
import { listThreads, getThread, listComments } from '../lib/forumThreads';

export const useForumThreads = (forumId: string | undefined, categoryId?: string | null) => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!forumId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listThreads(forumId, { categoryId });
      setThreads(data);
    } catch (err: unknown) {
      console.error('Failed to load threads:', err);
      setError('Não foi possível carregar os tópicos.');
    } finally {
      setLoading(false);
    }
  }, [forumId, categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    threads,
    loading,
    error,
    reload: load,
  };
};

export const useThreadDetails = (threadId: string | undefined) => {
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!threadId) {
      setThread(null);
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [threadData, commentsData] = await Promise.all([
        getThread(threadId),
        listComments(threadId),
      ]);
      setThread(threadData);
      setComments(commentsData);
    } catch (err: unknown) {
      console.error('Failed to load thread details:', err);
      setError('Não foi possível carregar os detalhes do tópico.');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    thread,
    comments,
    loading,
    error,
    reload: load,
  };
};
