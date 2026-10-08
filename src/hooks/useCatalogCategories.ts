import { useState, useEffect, useCallback } from 'react';
import { CatalogCategory } from '../types/catalogCategory';
import { listCatalogCategories } from '../lib/catalogCategories';

export const useCatalogCategories = () => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCatalogCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load catalog categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, loading, reload };
};
