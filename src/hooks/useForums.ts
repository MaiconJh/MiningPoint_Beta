import { useState, useEffect, useCallback } from 'react';
import { Forum } from '../types/forum';
import { listForums } from '../lib/forums';

export const useForums = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listForums();
      setForums(data);
    } catch (err: unknown) {
      console.error('Failed to load forums:', err);
      setError('Não foi possível carregar a lista de fóruns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    forums,
    loading,
    error,
    reload: load,
  };
};
