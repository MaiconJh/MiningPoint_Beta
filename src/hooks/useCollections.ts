import { useState, useEffect, useCallback } from 'react';
import { NamedCollection } from '../types/collection';
import { listCollections } from '../lib/collections';

export const useCollections = () => {
  const [collections, setCollections] = useState<NamedCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCollections();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { collections, loading, reload };
};
