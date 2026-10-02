import { useState, useEffect, useCallback } from 'react';
import { Group } from '../types/group';
import { listGroups, seedDefaultGroups } from '../lib/groups';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data = await listGroups();
      if (data.length === 0) {
        await seedDefaultGroups();
        data = await listGroups();
      }
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    groups,
    loading,
    reload: load,
  };
};
