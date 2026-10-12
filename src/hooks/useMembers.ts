/**
 * Hook para busca, filtragem e ordenação de membros públicos do MiningPoint.
 *
 * Limitações documentadas:
 * 1. Filtros e ordenação operam sobre a página carregada, não sobre o conjunto total no Firestore.
 *    Buscar alguém que está na página 5 não retorna resultado até que a página seja carregada via "Carregar mais".
 * 2. Documentos legados de usuários sem o campo `visibility` são excluídos pela query `onlyPublic`.
 * 3. Busca no cliente por `displayName` (case-insensitive, includes), consistente com os demais filtros.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { DocumentSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types/profile';
import { Group } from '../types/group';
import { Title } from '../types/title';
import { listUsers } from '../lib/users';
import { listGroups } from '../lib/groups';
import { listUserCollectibles } from '../lib/collectibleLinks';
import { listTitlesByIds } from '../lib/titles';

export interface UseMembersResult {
  members: UserProfile[];
  groups: Group[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  sortMode: 'group' | 'name';
  setSortMode: (mode: 'group' | 'name') => void;
  loadMore: () => void;
  userTitlesMap: Record<string, Title[]>;
  clearFilters: () => void;
}

const PAGE_SIZE = 24;

export const useMembers = (): UseMembersResult => {
  const [rawUsers, setRawUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userTitlesMap, setUserTitlesMap] = useState<Record<string, Title[]>>({});
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'group' | 'name'>('group');

  // Cache de títulos já buscados por ID
  const titlesCacheRef = useRef<Map<string, Title>>(new Map());

  // Helper para resolver títulos de uma lista de membros
  const resolveTitlesForUsers = useCallback(async (usersToResolve: UserProfile[]) => {
    if (usersToResolve.length === 0) return {};

    const cache = titlesCacheRef.current;
    const newTitlesMap: Record<string, Title[]> = {};

    await Promise.all(
      usersToResolve.map(async (u) => {
        try {
          const userCollectibles = await listUserCollectibles(u.uid, 'title');
          const titleIds = userCollectibles.map((uc) => uc.itemId);

          const missingIds = titleIds.filter((id) => !cache.has(id));
          if (missingIds.length > 0) {
            const fetchedTitles = await listTitlesByIds(missingIds);
            fetchedTitles.forEach((t) => cache.set(t.id, t));
          }

          newTitlesMap[u.uid] = titleIds
            .map((id) => cache.get(id))
            .filter((t): t is Title => Boolean(t));
        } catch (err) {
          console.error(`Erro ao carregar títulos para ${u.uid}:`, err);
          newTitlesMap[u.uid] = [];
        }
      })
    );

    return newTitlesMap;
  }, []);

  // Carga inicial de usuários e grupos
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [groupsResult, usersResult] = await Promise.all([
          listGroups(),
          listUsers({ limitCount: PAGE_SIZE, onlyPublic: true }),
        ]);

        if (!isMounted) return;

        // Grupos ordenados por priority DESC
        const sortedGroups = [...groupsResult].sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
        );
        setGroups(sortedGroups);

        setRawUsers(usersResult.users);
        setLastDoc(usersResult.lastDoc);
        setHasMore(usersResult.hasMore);

        // Resolver títulos dos usuários da página inicial
        const titlesMap = await resolveTitlesForUsers(usersResult.users);
        if (isMounted) {
          setUserTitlesMap(titlesMap);
        }
      } catch (err) {
        console.error('Erro ao inicializar página de membros:', err);
        if (isMounted) {
          setError('Não foi possível carregar os membros. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [resolveTitlesForUsers]);

  // Carregar mais usuários (paginação)
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastDoc) return;

    setIsLoadingMore(true);
    try {
      const res = await listUsers({
        limitCount: PAGE_SIZE,
        lastDoc,
        onlyPublic: true,
      });

      setRawUsers((prev) => [...prev, ...res.users]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);

      // Resolver títulos dos novos usuários
      const newTitles = await resolveTitlesForUsers(res.users);
      setUserTitlesMap((prev) => ({ ...prev, ...newTitles }));
    } catch (err) {
      console.error('Erro ao carregar mais membros:', err);
      setError('Não foi possível carregar mais membros.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, lastDoc, resolveTitlesForUsers]);

  // Limpar filtros de busca e grupo
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedGroupId(null);
  }, []);

  // Filtragem e ordenação sobre os membros carregados
  const members = useMemo(() => {
    let result = [...rawUsers];

    // 1. Busca por nome (case-insensitive, includes)
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      result = result.filter((u) =>
        (u.displayName || '').toLowerCase().includes(normalizedQuery)
      );
    }

    // 2. Filtro por grupo (primário ou secundário)
    if (selectedGroupId && selectedGroupId.trim() !== '') {
      result = result.filter((u) => {
        return (
          u.primaryGroupId === selectedGroupId ||
          (Array.isArray(u.secondaryGroupIds) && u.secondaryGroupIds.includes(selectedGroupId))
        );
      });
    }

    // 3. Ordenação
    if (sortMode === 'group') {
      result.sort((a, b) => {
        const priorityA = a.primaryGroup?.priority ?? -1;
        const priorityB = b.primaryGroup?.priority ?? -1;
        if (priorityB !== priorityA) {
          return priorityB - priorityA;
        }
        return (a.displayName || '').localeCompare(b.displayName || '', 'pt-BR');
      });
    } else {
      // sortMode === 'name'
      result.sort((a, b) =>
        (a.displayName || '').localeCompare(b.displayName || '', 'pt-BR')
      );
    }

    return result;
  }, [rawUsers, searchQuery, selectedGroupId, sortMode]);

  return {
    members,
    groups,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    selectedGroupId,
    setSelectedGroupId,
    sortMode,
    setSortMode,
    loadMore,
    userTitlesMap,
    clearFilters,
  };
};
