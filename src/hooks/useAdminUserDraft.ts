import { useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile, UserVisibility } from '../types/profile';
import { useToast } from '../context/ToastContext';
import { updateUserDocFields, setVisibility } from '../lib/users';

export interface AdminUserDraftState {
  displayName: string;
  photoURL: string;
  bio: string;
  featuredTitleId: string | null;
  featuredBadges: string[];
  visibility: UserVisibility;
}

export interface UseAdminUserDraftResult {
  draft: AdminUserDraftState;
  setField: <K extends keyof AdminUserDraftState>(key: K, value: AdminUserDraftState[K]) => void;
  isDirty: boolean;
  isSaving: boolean;
  reset: () => void;
  save: () => Promise<boolean>;
}

export const useAdminUserDraft = (
  uid: string,
  initialProfile: UserProfile | null
): UseAdminUserDraftResult => {
  const { showToast } = useToast();

  const initialDraft = useMemo<AdminUserDraftState>(() => {
    return {
      displayName: initialProfile?.displayName || '',
      photoURL: initialProfile?.photoURL || '',
      bio: initialProfile?.bio || '',
      featuredTitleId: initialProfile?.featuredTitleId || null,
      featuredBadges: initialProfile?.featuredBadges || [],
      visibility: initialProfile?.visibility === 'private' ? 'private' : 'public',
    };
  }, [
    initialProfile?.displayName,
    initialProfile?.photoURL,
    initialProfile?.bio,
    initialProfile?.featuredTitleId,
    initialProfile?.featuredBadges,
    initialProfile?.visibility,
  ]);

  const [draft, setDraft] = useState<AdminUserDraftState>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const setField = useCallback(
    <K extends keyof AdminUserDraftState>(key: K, value: AdminUserDraftState[K]) => {
      setDraft((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const isDirty = useMemo(() => {
    if (!initialProfile) return false;

    const nameChanged = draft.displayName !== (initialProfile.displayName || '');
    const photoChanged = draft.photoURL !== (initialProfile.photoURL || '');
    const bioChanged = draft.bio !== (initialProfile.bio || '');
    const titleChanged =
      (draft.featuredTitleId || null) !== (initialProfile.featuredTitleId || null);
    const visChanged = draft.visibility !== initialProfile.visibility;

    const origBadges = initialProfile.featuredBadges || [];
    const badgesChanged =
      draft.featuredBadges.length !== origBadges.length ||
      draft.featuredBadges.some((id, idx) => id !== origBadges[idx]);

    return nameChanged || photoChanged || bioChanged || titleChanged || visChanged || badgesChanged;
  }, [draft, initialProfile]);

  const reset = useCallback(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!uid || !initialProfile || !isDirty || isSaving) {
      return false;
    }

    setIsSaving(true);

    try {
      const updates: Partial<
        Pick<UserProfile, 'displayName' | 'photoURL' | 'bio' | 'featuredTitleId' | 'featuredBadges'>
      > = {};

      if (draft.displayName !== (initialProfile.displayName || '')) {
        updates.displayName = draft.displayName;
      }
      if (draft.photoURL !== (initialProfile.photoURL || '')) {
        updates.photoURL = draft.photoURL.trim() || null;
      }
      if (draft.bio !== (initialProfile.bio || '')) {
        updates.bio = draft.bio;
      }
      if ((draft.featuredTitleId || null) !== (initialProfile.featuredTitleId || null)) {
        updates.featuredTitleId = draft.featuredTitleId || null;
      }

      const origBadges = initialProfile.featuredBadges || [];
      const badgesChanged =
        draft.featuredBadges.length !== origBadges.length ||
        draft.featuredBadges.some((id, idx) => id !== origBadges[idx]);

      if (badgesChanged) {
        updates.featuredBadges = draft.featuredBadges;
      }

      if (Object.keys(updates).length > 0) {
        await updateUserDocFields(uid, updates);
      }

      if (draft.visibility !== initialProfile.visibility) {
        await setVisibility(uid, draft.visibility);
      }

      showToast('Alterações salvas.', 'success');
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Erro ao salvar alterações do perfil pelo administrador:', err);
      showToast('Não foi possível salvar. Tente novamente.', 'error');
      setIsSaving(false);
      return false;
    }
  }, [uid, initialProfile, draft, isDirty, isSaving, showToast]);

  return {
    draft,
    setField,
    isDirty,
    isSaving,
    reset,
    save,
  };
};
