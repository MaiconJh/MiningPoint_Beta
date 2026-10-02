import { useState, useEffect, useCallback } from 'react';
import { Badge } from '../types/profile';
import { listBadges } from '../lib/badges';

export const useBadges = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBadges();
      setBadges(data);
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { badges, loading, reload };
};
