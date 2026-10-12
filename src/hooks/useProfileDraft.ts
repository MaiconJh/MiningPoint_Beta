import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserVisibility } from '../types/profile';
import { FeaturedBadgesMode } from '../lib/featuredBadges';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { setHandle, redefineHandle } from '../lib/users';
import { uploadProfileImage, removeProfileImage, getStorageErrorMessage } from '../lib/storage';

export interface ProfileDraftState {
  bio: string;
  featuredTitleId: string | null;
  visibility: UserVisibility;
  featuredBadges: string[];
  featuredBadgesMode: FeaturedBadgesMode;
  handle: string | null;
  photoURL: string | null;
  bannerUrl: string | null;
  pendingAvatarFile: File | null;
  pendingBannerFile: File | null;
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
      photoURL: profile?.photoURL || null,
      bannerUrl: profile?.bannerUrl || null,
      pendingAvatarFile: null,
      pendingBannerFile: null,
    };
  }, [
    profile?.bio,
    profile?.featuredTitleId,
    profile?.visibility,
    profile?.featuredBadges,
    profile?.featuredBadgesMode,
    profile?.handle,
    profile?.photoURL,
    profile?.bannerUrl,
  ]);

  const [draft, setDraft] = useState<ProfileDraftState>(initialDraft);
  const [isSaving, setIsSaving] = useState(false);

  // Sync draft when profile initially loads or updates from backend
  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  // Limpeza de URLs do tipo blob criadas para preview local
  const revokeIfBlob = useCallback((url: string | null | undefined) => {
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignora caso a URL já tenha sido revogada ou ambiente não suporte
      }
    }
  }, []);

  const setField = useCallback(<K extends keyof ProfileDraftState>(key: K, value: ProfileDraftState[K]) => {
    setDraft((prev) => {
      if (key === 'photoURL' && prev.photoURL !== value) {
        revokeIfBlob(prev.photoURL);
      }
      if (key === 'bannerUrl' && prev.bannerUrl !== value) {
        revokeIfBlob(prev.bannerUrl);
      }
      return {
        ...prev,
        [key]: value,
      };
    });
  }, [revokeIfBlob]);

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

    const photoChanged =
      (draft.photoURL || null) !== (profile.photoURL || null) ||
      draft.pendingAvatarFile !== null;

    const bannerChanged =
      (draft.bannerUrl || null) !== (profile.bannerUrl || null) ||
      draft.pendingBannerFile !== null;

    return (
      bioChanged ||
      titleChanged ||
      visChanged ||
      handleChanged ||
      badgesChanged ||
      modeChanged ||
      photoChanged ||
      bannerChanged
    );
  }, [draft, profile]);

  const reset = useCallback(() => {
    revokeIfBlob(draft.photoURL);
    revokeIfBlob(draft.bannerUrl);
    setDraft(initialDraft);
  }, [initialDraft, draft.photoURL, draft.bannerUrl, revokeIfBlob]);

  // Limpeza ao desmontar o hook
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    return () => {
      revokeIfBlob(draftRef.current.photoURL);
      revokeIfBlob(draftRef.current.bannerUrl);
    };
  }, [revokeIfBlob]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !db || !profile || !isDirty || isSaving) {
      return false;
    }

    setIsSaving(true);

    try {
      // 1. Upload e remoção de imagens no Storage antes de atualizar o documento
      let resolvedBannerUrl: string | null | undefined = undefined;
      let resolvedPhotoURL: string | null | undefined = undefined;

      if (draft.pendingBannerFile) {
        resolvedBannerUrl = await uploadProfileImage(user.uid, 'banner', draft.pendingBannerFile);
      } else if (draft.bannerUrl === null && (profile.bannerUrl || null) !== null) {
        await removeProfileImage(user.uid, 'banner');
        resolvedBannerUrl = null;
      }

      if (draft.pendingAvatarFile) {
        resolvedPhotoURL = await uploadProfileImage(user.uid, 'avatar', draft.pendingAvatarFile);
      } else if (draft.photoURL === null && (profile.photoURL || null) !== null) {
        await removeProfileImage(user.uid, 'avatar');
        resolvedPhotoURL = null;
      }

      // 2. Handle handle changes if modified
      const originalHandle = profile.handle || null;
      const targetHandle = draft.handle || null;

      if (targetHandle !== originalHandle && targetHandle !== null) {
        if (originalHandle === null) {
          await setHandle(user.uid, targetHandle);
        } else if (!profile.hasRedefinedHandle) {
          await redefineHandle(user.uid, targetHandle);
        }
      }

      // 3. Handle doc fields (bio, title, visibility, badges, photoURL, bannerUrl)
      const updates: Record<string, unknown> = {};

      if (resolvedBannerUrl !== undefined) {
        updates.bannerUrl = resolvedBannerUrl;
      }
      if (resolvedPhotoURL !== undefined) {
        updates.photoURL = resolvedPhotoURL;
      }

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

      // Revoga preview blob URLs locais após upload bem-sucedido
      if (draft.pendingBannerFile && draft.bannerUrl) {
        revokeIfBlob(draft.bannerUrl);
      }
      if (draft.pendingAvatarFile && draft.photoURL) {
        revokeIfBlob(draft.photoURL);
      }

      // 4. Refresh user profile in AuthContext
      await refreshProfile();

      showToast('Alterações salvas.', 'success');
      setIsSaving(false);
      return true;
    } catch (err) {
      console.warn('Erro ao salvar alterações do perfil:', err);
      showToast(getStorageErrorMessage(err), 'error');
      setIsSaving(false);
      return false;
    }
  }, [user?.uid, profile, draft, isDirty, isSaving, refreshProfile, showToast, revokeIfBlob]);

  return {
    draft,
    setField,
    isDirty,
    isSaving,
    reset,
    save,
  };
};
