import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserVisibility } from '../types/profile';
import { FeaturedBadgesMode } from '../lib/featuredBadges';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { setHandle, redefineHandle } from '../lib/users';

export interface ProfileDraftState {
  bio: string;
  featuredTitleId: string | null;
  visibility: UserVisibility;
  featuredBadges: string[];
  featuredBadgesMode: FeaturedBadgesMode;
  handle: string | null;
}

export interface UseProfileDraftResult {
  draft: ProfileDraftState;
  setField: <K extends keyof ProfileDraftState>(key: K, value: ProfileDraftState[K]) => void;
  isDirty: boolean;
  isSaving: boolean;
  reset: () => void;
  save: () => Promise<boolean>;
}

export const useProfileDraft = (profile: UserProfile | null): UseProfileDraftResult => {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const initialDraft = useMemo<ProfileDraftState>(() => {
    return {
      bio: profile?.bio || '',
      featuredTitleId: profile?.featuredTitleId || null,
      visibility: profile?.visibility === 'private' ? 'private' : 'public',
      featuredBadges: profile?.featuredBadges || [],
      featuredBadgesMode: profile?.featuredBadgesMode === 'auto' ? 'auto' : 'manual',
      handle: profile?.handle || null,
    };
  }, [
    profile?.bio,
    profile?.featuredTitleId,
    profile?.visibility,
    profile?.featuredBadges,
    profile?.featuredBadgesMode,
    profile?.handle,
  ]);

  const [draft, setDraft] = useState<ProfileDraftState>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft when profile initially loads or updates from backend
  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const setField = useCallback(<K extends keyof ProfileDraftState>(key: K, value: ProfileDraftState[K]) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const isDirty = useMemo(() => {
    if (!profile) return false;

    const bioChanged = draft.bio !== (profile.bio || '');
    const titleChanged = (draft.featuredTitleId || null) !== (profile.featuredTitleId || null);
    const visChanged = draft.visibility !== profile.visibility;
    const handleChanged = (draft.handle || null) !== (profile.handle || null);

    const origBadges = profile.featuredBadges || [];
    const badgesChanged =
      draft.featuredBadges.length !== origBadges.length ||
      draft.featuredBadges.some((id, idx) => id !== origBadges[idx]);

    const modeChanged =
      draft.featuredBadgesMode !== (profile.featuredBadgesMode || 'manual');

    return bioChanged || titleChanged || visChanged || handleChanged || badgesChanged || modeChanged;
  }, [draft, profile]);

  const reset = useCallback(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !db || !profile || !isDirty || isSaving) {
      return false;
    }

    setIsSaving(true);

    try {
      // 1. Handle handle changes if modified
      const originalHandle = profile.handle || null;
      const targetHandle = draft.handle || null;

      if (targetHandle !== originalHandle && targetHandle !== null) {
        if (originalHandle === null) {
          await setHandle(user.uid, targetHandle);
        } else if (!profile.hasRedefinedHandle) {
          await redefineHandle(user.uid, targetHandle);
        }
      }

      // 2. Handle doc fields (bio, title, visibility, badges)
      const updates: Record<string, unknown> = {};

      if (draft.bio !== (profile.bio || '')) {
        updates.bio = draft.bio;
      }
      if ((draft.featuredTitleId || null) !== (profile.featuredTitleId || null)) {
        updates.featuredTitleId = draft.featuredTitleId;
      }
      if (draft.visibility !== profile.visibility) {
        updates.visibility = draft.visibility;
      }

      const origBadges = profile.featuredBadges || [];
      const badgesChanged =
        draft.featuredBadges.length !== origBadges.length ||
        draft.featuredBadges.some((id, idx) => id !== origBadges[idx]);

      if (badgesChanged) {
        updates.featuredBadges = draft.featuredBadges;
      }
      if (draft.featuredBadgesMode !== (profile.featuredBadgesMode || 'manual')) {
        updates.featuredBadgesMode = draft.featuredBadgesMode;
      }

      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, updates);
      }

      // 3. Refresh user profile in AuthContext
      await refreshProfile();

      showToast('Alterações salvas.', 'success');
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Erro ao salvar alterações do perfil:', err);
      showToast('Não foi possível salvar. Tente novamente.', 'error');
      setIsSaving(false);
      return false;
    }
  }, [user?.uid, profile, draft, isDirty, isSaving, refreshProfile, showToast]);

  return {
    draft,
    setField,
    isDirty,
    isSaving,
    reset,
    save,
  };
};
