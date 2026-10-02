import { useState, useEffect, useCallback } from 'react';
import { Title } from '../types/title';
import { listTitles } from '../lib/titles';

export const useTitles = () => {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTitles();
      setTitles(data);
    } catch (err) {
      console.error('Failed to load titles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { titles, loading, reload };
};
