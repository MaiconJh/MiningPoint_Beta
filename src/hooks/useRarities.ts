import { useState, useEffect, useCallback } from 'react';
import { Rarity } from '../types/rarity';
import { listRarities } from '../lib/rarities';

export const useRarities = () => {
  const [rarities, setRarities] = useState<Rarity[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRarities();
      setRarities(data);
    } catch (err) {
      console.error('Failed to load rarities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rarities, loading, reload };
};
