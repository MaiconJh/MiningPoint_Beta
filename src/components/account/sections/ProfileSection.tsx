import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile, Badge, UserBadge, FeaturedBadgeItem } from '../../../types/profile';
import { useAuth } from '../../../context/AuthContext';
import { useProfileDraftContext } from '../../../context/ProfileDraftContext';
import { listUserBadges, listBadgesByIds } from '../../../lib/profile';
import { ProfilePreviewCard } from '../ProfilePreviewCard';
import { ProfileEditPanel } from '../ProfileEditPanel';
import { ProfilePreviewModal } from '../ProfilePreviewModal';
import { AccountSectionSkeleton } from '../../skeleton/AccountSectionSkeleton';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';

interface ProfileSectionProps {
  isEditPanelOpen: boolean;
  onEditPanelOpenChange: (open: boolean) => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  isEditPanelOpen,
  onEditPanelOpenChange,
}) => {
  const { profile, user, loading } = useAuth();
  const { draft, setField, isDirty } = useProfileDraftContext();

  const [editFocusTarget, setEditFocusTarget] = useState<'banner' | 'avatar' | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [, setBadgesLoading] = useState(true);

  const openEditPanel = useCallback(
    (target: 'banner' | 'avatar' | null = null) => {
      setEditFocusTarget(target);
      setFocusNonce((n) => n + 1);
      onEditPanelOpenChange(true);
    },
    [onEditPanelOpenChange]
  );

  useEffect(() => {
    if (!user?.uid) {
      setUserBadges([]);
      setBadgesLoading(false);
      return;
    }
    let isMounted = true;
    setBadgesLoading(true);

    listUserBadges(user.uid)
      .then(async (ubList) => {
        if (!isMounted) return;
        setUserBadges(ubList);
        const badgeIds = ubList.map((ub) => ub.badgeId);
        if (badgeIds.length > 0) {
          const badges = await listBadgesByIds(badgeIds);
          if (isMounted) {
            setAvailableBadges(badges);
            setBadgesLoading(false);
          }
        } else {
          if (isMounted) {
            setAvailableBadges([]);
            setBadgesLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching user badges in ProfileSection:', err);
        if (isMounted) {
          setUserBadges([]);
          setAvailableBadges([]);
          setBadgesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleReorderFeaturedBadges = (newOrderIds: string[]) => {
    if (draft.featuredBadgesMode === 'auto') {
      setField('featuredBadgesMode', 'manual');
    }
    setField('featuredBadges', newOrderIds);
  };

  const featuredBadgeItems: FeaturedBadgeItem[] = useMemo(() => {
    return draft.featuredBadges
      .map((id) => {
        const badge = availableBadges.find((b) => b.id === id);
        const userBadge = userBadges.find((ub) => ub.badgeId === id);
        return badge && userBadge ? { badge, userBadge } : null;
      })
      .filter((item): item is FeaturedBadgeItem => item !== null);
  }, [draft.featuredBadges, availableBadges, userBadges]);

  const draftProfile: UserProfile = useMemo(() => {
    if (!profile) return {} as UserProfile;
    return {
      ...profile,
      bio: draft.bio,
      photoURL: draft.photoURL,
      bannerUrl: draft.bannerUrl,
      featuredTitleId: draft.featuredTitleId,
      featuredTitle: null, // força ProfileHeader a re-resolver via getTitle
      featuredBadges: draft.featuredBadges,
      featuredBadgesMode: draft.featuredBadgesMode,
      visibility: draft.visibility,
    };
  }, [profile, draft]);

  if (loading && !profile) {
    return <AccountSectionSkeleton rows={3} />;
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <div className="w-full flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
        {/* Coluna da vitrine + barra de ações */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Barra superior de ações */}
          <div className="bg-[var(--bg-default)] py-3 px-6 rounded-xl border border-[var(--border-default)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
                Perfil
              </h2>
              {isDirty && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)] text-[11px] font-semibold text-[var(--feedback-warning)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--feedback-warning)] animate-pulse shrink-0" />
                  <span>Alterações pendentes</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>Ver perfil</span>
              </button>

              <button
                type="button"
                onClick={() => openEditPanel(null)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs ${
                  isEditPanelOpen ? 'lg:hidden' : ''
                }`}
              >
                <PencilIcon className="w-3.5 h-3.5" />
                <span>Editar perfil</span>
              </button>
            </div>
          </div>

          {/* Vitrine real do perfil */}
          <div className="w-full">
            <ProfilePreviewCard
              profile={draftProfile}
              featuredBadges={featuredBadgeItems}
              onModeChange={(nextMode) => setField('featuredBadgesMode', nextMode)}
              onReorder={handleReorderFeaturedBadges}
              onEditBanner={isEditPanelOpen ? undefined : () => openEditPanel('banner')}
              onEditAvatar={isEditPanelOpen ? undefined : () => openEditPanel('avatar')}
            />
          </div>
        </div>

        {/* Painel lateral de edição */}
        <ProfileEditPanel
          isOpen={isEditPanelOpen}
          onClose={() => onEditPanelOpenChange(false)}
          availableBadges={availableBadges}
          focusTarget={editFocusTarget}
          focusNonce={focusNonce}
        />
      </div>

      {/* Modal de visualização */}
      <ProfilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        profile={draftProfile}
        featuredBadges={featuredBadgeItems}
        visibility={draft.visibility}
        onModeChange={(nextMode) => setField('featuredBadgesMode', nextMode)}
        onReorder={handleReorderFeaturedBadges}
      />
    </>
  );
};
