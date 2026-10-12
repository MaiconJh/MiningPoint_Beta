import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMembers } from '../useMembers';
import { listUsers } from '../../lib/users';
import { listGroups } from '../../lib/groups';
import { listUserCollectibles } from '../../lib/collectibleLinks';
import { listTitlesByIds } from '../../lib/titles';
import { UserProfile } from '../../types/profile';
import { Group } from '../../types/group';

vi.mock('../../lib/users', () => ({
  listUsers: vi.fn(),
}));

vi.mock('../../lib/groups', () => ({
  listGroups: vi.fn(),
}));

vi.mock('../../lib/collectibleLinks', () => ({
  listUserCollectibles: vi.fn(),
}));

vi.mock('../../lib/titles', () => ({
  listTitlesByIds: vi.fn(),
}));

describe('useMembers hook', () => {
  const mockGroups: Group[] = [
    {
      id: 'staff',
      name: 'Staff',
      description: 'Equipe do site',
      color: '#F87171',
      priority: 90,
      isStaff: true,
      createdAt: {} as any,
    } as unknown as Group,
    {
      id: 'membro',
      name: 'Membro',
      description: 'Membro regular',
      color: '#8BD0EF',
      priority: 20,
      isStaff: false,
      createdAt: {} as any,
    } as unknown as Group,
    {
      id: 'visitante',
      name: 'Visitante',
      description: 'Novo usuário',
      color: '#C2C6CC',
      priority: 10,
      isStaff: false,
      createdAt: {} as any,
    } as unknown as Group,
  ];

  const mockUsers: UserProfile[] = [
    {
      uid: 'user-1',
      displayName: 'Alice Silva',
      email: 'alice@example.com',
      photoURL: null,
      primaryGroupId: 'membro',
      secondaryGroupIds: ['staff'],
      primaryGroup: mockGroups[1],
      visibility: 'public',
      bio: '',
      featuredTitleId: null,
      featuredBadges: [],
      isStaff: false,
      effectivePermissions: {} as any,
      attributes: {} as any,
      createdAt: {} as any,
    } as unknown as UserProfile,
    {
      uid: 'user-2',
      displayName: 'Bruno Costa',
      email: 'bruno@example.com',
      photoURL: 'https://example.com/bruno.jpg',
      primaryGroupId: 'staff',
      secondaryGroupIds: [],
      primaryGroup: mockGroups[0],
      visibility: 'public',
      bio: '',
      featuredTitleId: null,
      featuredBadges: [],
      isStaff: true,
      effectivePermissions: {} as any,
      attributes: {} as any,
      createdAt: {} as any,
    } as unknown as UserProfile,
    {
      uid: 'user-3',
      displayName: 'Carlos Sem Grupo',
      email: 'carlos@example.com',
      photoURL: null,
      primaryGroupId: '',
      secondaryGroupIds: [],
      primaryGroup: null,
      visibility: 'public',
      bio: '',
      featuredTitleId: null,
      featuredBadges: [],
      isStaff: false,
      effectivePermissions: {} as any,
      attributes: {} as any,
      createdAt: {} as any,
    } as unknown as UserProfile,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (listGroups as any).mockResolvedValue(mockGroups);
    (listUsers as any).mockResolvedValue({
      users: mockUsers,
      lastDoc: { id: 'last-doc' },
      hasMore: true,
    });
    (listUserCollectibles as any).mockResolvedValue([]);
    (listTitlesByIds as any).mockResolvedValue([]);
  });

  it('carrega usuários e grupos inicialmente com onlyPublic = true', async () => {
    const { result } = renderHook(() => useMembers());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(listUsers).toHaveBeenCalledWith({
      limitCount: 24,
      onlyPublic: true,
    });
    expect(listGroups).toHaveBeenCalledTimes(1);

    // Grupos ordenados por priority DESC
    expect(result.current.groups[0].id).toBe('staff');
    expect(result.current.groups[1].id).toBe('membro');
    expect(result.current.groups[2].id).toBe('visitante');

    expect(result.current.hasMore).toBe(true);
  });

  it('ordena por grupo (priority DESC) por padrão, colocando membros sem grupo no final', async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Bruno (staff, priority 90) vem primeiro, Alice (membro, 20) segundo, Carlos (sem grupo, -1) último
    expect(result.current.members[0].uid).toBe('user-2');
    expect(result.current.members[1].uid).toBe('user-1');
    expect(result.current.members[2].uid).toBe('user-3');
  });

  it('permite ordenar por nome (A–Z)', async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSortMode('name');
    });

    // Alice, Bruno, Carlos
    expect(result.current.members[0].displayName).toBe('Alice Silva');
    expect(result.current.members[1].displayName).toBe('Bruno Costa');
    expect(result.current.members[2].displayName).toBe('Carlos Sem Grupo');
  });

  it('filtra por busca em displayName de forma case-insensitive', async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('ali');
    });

    expect(result.current.members.length).toBe(1);
    expect(result.current.members[0].displayName).toBe('Alice Silva');

    act(() => {
      result.current.setSearchQuery('COSTA');
    });

    expect(result.current.members.length).toBe(1);
    expect(result.current.members[0].displayName).toBe('Bruno Costa');
  });

  it('filtra por grupo primário e secundário', async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Grupo staff: Bruno é primário, Alice é secundário -> ambos aparecem
    act(() => {
      result.current.setSelectedGroupId('staff');
    });

    expect(result.current.members.length).toBe(2);
    expect(result.current.members.map((m) => m.uid)).toContain('user-1');
    expect(result.current.members.map((m) => m.uid)).toContain('user-2');

    // Grupo membro: só Alice é membro
    act(() => {
      result.current.setSelectedGroupId('membro');
    });

    expect(result.current.members.length).toBe(1);
    expect(result.current.members[0].uid).toBe('user-1');
  });

  it('loadMore concatena novos membros da próxima página', async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const user4: UserProfile = {
      uid: 'user-4',
      displayName: 'Daniela Lima',
      email: 'daniela@example.com',
      photoURL: null,
      primaryGroupId: 'visitante',
      secondaryGroupIds: [],
      primaryGroup: mockGroups[2],
      visibility: 'public',
      bio: '',
      featuredTitleId: null,
      featuredBadges: [],
      isStaff: false,
      effectivePermissions: {} as any,
      attributes: {} as any,
      createdAt: {} as any,
    } as unknown as UserProfile;

    (listUsers as any).mockResolvedValueOnce({
      users: [user4],
      lastDoc: null,
      hasMore: false,
    });

    await act(async () => {
      result.current.loadMore();
    });

    expect(listUsers).toHaveBeenCalledWith({
      limitCount: 24,
      lastDoc: { id: 'last-doc' },
      onlyPublic: true,
    });

    expect(result.current.hasMore).toBe(false);
    expect(result.current.members.some((m) => m.uid === 'user-4')).toBe(true);
  });

  it('expõe mensagem amigável em pt-BR em caso de falha', async () => {
    (listUsers as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Não foi possível carregar os membros. Tente novamente.');
    expect(result.current.members).toEqual([]);
  });

  it('clearFilters reseta searchQuery e selectedGroupId', async () => {
    const { result } = renderHook(() => useMembers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearchQuery('teste');
      result.current.setSelectedGroupId('staff');
    });

    expect(result.current.searchQuery).toBe('teste');
    expect(result.current.selectedGroupId).toBe('staff');

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedGroupId).toBeNull();
  });
});
