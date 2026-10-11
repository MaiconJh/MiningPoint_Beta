import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileDraft } from '../useProfileDraft';
import { UserProfile } from '../../types/profile';
import { Timestamp } from 'firebase/firestore';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user-1' },
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('../../lib/storage', () => ({
  uploadProfileImage: vi.fn(),
  removeProfileImage: vi.fn(),
}));

describe('useProfileDraft - suporte a banner e avatar', () => {
  const baseProfile: UserProfile = {
    uid: 'user-1',
    displayName: 'Usuário Teste',
    email: 'teste@example.com',
    photoURL: 'https://example.com/avatar.jpg',
    bannerUrl: 'https://example.com/banner.jpg',
    shortId: '1234',
    handle: null,
    primaryGroupId: 'visitante',
    secondaryGroupIds: [],
    isStaff: false,
    effectivePermissions: {
      accessPanel: false,
      manageUsers: false,
      manageGroups: false,
      manageBadges: false,
      manageForum: false,
      manageContent: false,
      manageCatalogs: false,
    },
    bio: '',
    featuredTitleId: null,
    visibility: 'public',
    featuredBadges: [],
    attributes: {
      exploration: 0,
      gathering: 0,
      knowledge: 0,
      community: 0,
      endurance: 0,
      economy: 0,
    },
    createdAt: Timestamp.now(),
  };

  it('inicializa draft derivando photoURL, bannerUrl e arquivos pendentes como null', () => {
    const { result } = renderHook(() => useProfileDraft(baseProfile));

    expect(result.current.draft.photoURL).toBe('https://example.com/avatar.jpg');
    expect(result.current.draft.bannerUrl).toBe('https://example.com/banner.jpg');
    expect(result.current.draft.pendingAvatarFile).toBeNull();
    expect(result.current.draft.pendingBannerFile).toBeNull();
    expect(result.current.isDirty).toBe(false);
  });

  it('retorna isDirty como true quando apenas bannerUrl for alterado', () => {
    const { result } = renderHook(() => useProfileDraft(baseProfile));

    act(() => {
      result.current.setField('bannerUrl', 'https://example.com/novo-banner.jpg');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.setField('bannerUrl', 'https://example.com/banner.jpg');
    });

    expect(result.current.isDirty).toBe(false);
  });

  it('retorna isDirty como true quando houver arquivo de banner pendente', () => {
    const { result } = renderHook(() => useProfileDraft(baseProfile));

    const dummyFile = new File(['dados'], 'novo-banner.png', { type: 'image/png' });

    act(() => {
      result.current.setField('pendingBannerFile', dummyFile);
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('reset() restaura valores iniciais', () => {
    const { result } = renderHook(() => useProfileDraft(baseProfile));

    act(() => {
      result.current.setField('bannerUrl', null);
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.draft.bannerUrl).toBe('https://example.com/banner.jpg');
    expect(result.current.isDirty).toBe(false);
  });
});
