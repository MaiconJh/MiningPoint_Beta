import { useState, useEffect, useCallback } from 'react';
import { Origin } from '../types/origin';
import { listOrigins } from '../lib/origins';

export const useOrigins = () => {
  const [origins, setOrigins] = useState<Origin[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOrigins();
      setOrigins(data);
    } catch (err) {
      console.error('Failed to load origins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { origins, loading, reload };
};
