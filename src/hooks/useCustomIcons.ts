import { useState, useEffect, useCallback } from 'react';
import { CustomIcon } from '../types/icon';
import { listCustomIcons } from '../lib/icons';

export const useCustomIcons = (enabled = true) => {
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await listCustomIcons();
      setCustomIcons(data);
    } catch (err) {
      console.error('Failed to load custom icons:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      reload();
    }
  }, [enabled, reload]);

  return { customIcons, loading, reload };
};
