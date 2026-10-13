import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockCommit = vi.fn().mockResolvedValue(undefined);
  const mockWriteBatch = vi.fn(() => ({
    update: mockUpdate,
    commit: mockCommit,
  }));
  const mockDeleteFieldSentinel = { _methodName: 'deleteField' };
  const mockDeleteField = vi.fn(() => mockDeleteFieldSentinel);

  return {
    mockUpdate,
    mockCommit,
    mockWriteBatch,
    mockDeleteFieldSentinel,
    mockDeleteField,
    mockUserDocs: [] as Array<{
      id: string;
      ref: { id: string; path: string };
      data: () => Record<string, unknown>;
    }>,
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(async () => ({
      docs: mocks.mockUserDocs,
    })),
    writeBatch: mocks.mockWriteBatch,
    deleteField: mocks.mockDeleteField,
  };
});

vi.mock('../firebase', () => ({
  db: { _mockDb: true },
}));

vi.mock('../groups', () => ({
  listGroups: vi.fn(async () => [
    {
      id: 'admin',
      name: 'Admin',
      isStaff: true,
      permissions: {
        admin: {
          accessPanel: true,
          manageUsers: true,
          manageGroups: true,
          manageBadges: true,
          manageForum: true,
          manageContent: true,
        },
      },
    },
    {
      id: 'membro',
      name: 'Membro',
      isStaff: false,
      permissions: { admin: {} },
    },
    {
      id: 'visitante',
      name: 'Visitante',
      isStaff: false,
      permissions: { admin: {} },
    },
  ]),
  getGroup: vi.fn(),
}));

import { backfillPrimaryGroupId } from '../users';

describe('backfillPrimaryGroupId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUserDocs = [];
  });

  it('migra usuário que tem groupId mas não tem primaryGroupId e remove groupId com deleteField', async () => {
    mocks.mockUserDocs = [
      {
        id: 'user-legacy-1',
        ref: { id: 'user-legacy-1', path: 'users/user-legacy-1' },
        data: () => ({
          displayName: 'Antigo Usuário',
          groupId: 'admin',
        }),
      },
    ];

    const onProgress = vi.fn();
    const result = await backfillPrimaryGroupId(onProgress);

    expect(result).toEqual({
      migratedCount: 1,
      alreadyCleanCount: 0,
      totalCount: 1,
    });

    expect(mocks.mockWriteBatch).toHaveBeenCalled();
    expect(mocks.mockUpdate).toHaveBeenCalledWith(
      mocks.mockUserDocs[0].ref,
      expect.objectContaining({
        primaryGroupId: 'admin',
        secondaryGroupIds: [],
        isStaff: true,
        groupId: mocks.mockDeleteFieldSentinel,
      })
    );
    expect(mocks.mockCommit).toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it('remove groupId de usuário que já possui primaryGroupId mas ainda tem o campo legado', async () => {
    mocks.mockUserDocs = [
      {
        id: 'user-half-migrated',
        ref: { id: 'user-half-migrated', path: 'users/user-half-migrated' },
        data: () => ({
          displayName: 'Meio Migrado',
          primaryGroupId: 'membro',
          groupId: 'membro',
        }),
      },
    ];

    const result = await backfillPrimaryGroupId();

    expect(result).toEqual({
      migratedCount: 1,
      alreadyCleanCount: 0,
      totalCount: 1,
    });

    expect(mocks.mockUpdate).toHaveBeenCalledWith(mocks.mockUserDocs[0].ref, {
      groupId: mocks.mockDeleteFieldSentinel,
    });
    expect(mocks.mockCommit).toHaveBeenCalled();
  });

  it('não realiza updates em usuários que já possuem primaryGroupId e não têm groupId', async () => {
    mocks.mockUserDocs = [
      {
        id: 'user-clean',
        ref: { id: 'user-clean', path: 'users/user-clean' },
        data: () => ({
          displayName: 'Usuário Limpo',
          primaryGroupId: 'membro',
        }),
      },
    ];

    const result = await backfillPrimaryGroupId();

    expect(result).toEqual({
      migratedCount: 0,
      alreadyCleanCount: 1,
      totalCount: 1,
    });

    expect(mocks.mockUpdate).not.toHaveBeenCalled();
    expect(mocks.mockCommit).not.toHaveBeenCalled();
  });

  it('lida com múltiplos usuários em lote calculando corretamente as contagens', async () => {
    mocks.mockUserDocs = [
      {
        id: 'u1',
        ref: { id: 'u1', path: 'users/u1' },
        data: () => ({ groupId: 'membro' }),
      },
      {
        id: 'u2',
        ref: { id: 'u2', path: 'users/u2' },
        data: () => ({ primaryGroupId: 'admin', groupId: 'admin' }),
      },
      {
        id: 'u3',
        ref: { id: 'u3', path: 'users/u3' },
        data: () => ({ primaryGroupId: 'visitante' }),
      },
    ];

    const result = await backfillPrimaryGroupId();

    expect(result).toEqual({
      migratedCount: 2,
      alreadyCleanCount: 1,
      totalCount: 3,
    });

    expect(mocks.mockUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.mockCommit).toHaveBeenCalledTimes(1);
  });
});
