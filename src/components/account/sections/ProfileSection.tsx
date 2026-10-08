import React, { useState, useEffect } from 'react';
import { UserProfile, Badge, UserBadge, FeaturedBadgeItem } from '../../../types/profile';
import { Title } from '../../../types/title';
import { useAuth } from '../../../context/AuthContext';
import { listUserBadges, listBadgesByIds } from '../../../lib/profile';
import { resolveIcon } from '../../../data/icons/iconRegistry';
import { useCustomIcons } from '../../../hooks/useCustomIcons';
import { useProfileDraft } from '../../../hooks/useProfileDraft';
import { AccountEditableRow } from '../AccountEditableRow';
import { AccountVisibilityRow } from '../AccountVisibilityRow';
import { TitleSelector } from '../TitleSelector';
import { HandleSettings } from '../HandleSettings';
import { ProfilePreviewModal } from '../ProfilePreviewModal';
import { SkeletonCircle } from '../../skeleton/Skeleton';
import { AccountSectionSkeleton } from '../../skeleton/AccountSectionSkeleton';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import SaveIcon from 'lucide-react/dist/esm/icons/save';

export const ProfileSection: React.FC = () => {
  const { profile, user, loading } = useAuth();
  const { customIcons } = useCustomIcons();

  const { draft, setField, isDirty, isSaving, save } = useProfileDraft(profile);

  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [titlesMap, setTitlesMap] = useState<Map<string, Title>>(new Map());
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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

  if (loading && !profile) {
    return <AccountSectionSkeleton rows={3} />;
  }

  if (!profile) {
    return null;
  }

  const handleToggleBadge = (badgeId: string) => {
    const isSelected = draft.featuredBadges.includes(badgeId);
    let updated: string[];
    if (isSelected) {
      updated = draft.featuredBadges.filter((id) => id !== badgeId);
    } else {
      if (draft.featuredBadges.length >= 4) {
        return;
      }
      updated = [...draft.featuredBadges, badgeId];
    }
    setField('featuredBadges', updated);
  };

  const featuredBadgeItems: FeaturedBadgeItem[] = draft.featuredBadges
    .map((id) => {
      const badge = availableBadges.find((b) => b.id === id);
      const userBadge = userBadges.find((ub) => ub.badgeId === id);
      return badge && userBadge ? { badge, userBadge } : null;
    })
    .filter((item): item is FeaturedBadgeItem => item !== null);

  const previewProfile: UserProfile = {
    ...profile,
    handle: draft.handle,
    bio: draft.bio,
    featuredTitleId: draft.featuredTitleId,
    featuredTitle: draft.featuredTitleId
      ? titlesMap.get(draft.featuredTitleId) ?? null
      : null,
    visibility: draft.visibility,
    featuredBadgesMode: draft.featuredBadgesMode,
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky Top Bar */}
      <div className="sticky top-[calc(var(--nav-offset)+var(--nav-h)+16px)] z-20 bg-[var(--bg-default)] py-3 px-6 border-b border-[var(--border-default)] flex items-center justify-between gap-4">
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
            onClick={save}
            disabled={!isDirty || isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDirty && !isSaving
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:opacity-90 shadow-xs'
                : 'border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
            }`}
          >
            <SaveIcon className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar alterações'}</span>
          </button>
        </div>
      </div>

      {/* Editing Card (Single Column) */}
      <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden flex flex-col">
        {/* Identificação Pública (@nick) */}
        <HandleSettings
          profile={profile}
          currentDraftHandle={draft.handle}
          onUpdateDraftHandle={(newHandle) => setField('handle', newHandle)}
          className="p-6 flex flex-col gap-6"
        />

        {/* Bio, Título Exibido e Visibilidade */}
        <div className="p-6 border-t border-[var(--border-subtle)] flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider m-0 mb-1">
            Informações do Perfil
          </h3>

          <div className="flex flex-col">
            {/* Bio */}
            <AccountEditableRow
              label="Bio"
              value={draft.bio}
              maxLength={400}
              isMultiline={true}
              rows={4}
              onChange={(newBio) => setField('bio', newBio)}
            />

            {/* Título exibido */}
            <TitleSelector
              currentTitleId={draft.featuredTitleId}
              onSelectTitle={(newTitleId) => setField('featuredTitleId', newTitleId)}
              onTitlesLoaded={setTitlesMap}
            />

            {/* Visibilidade */}
            <AccountVisibilityRow
              visibility={draft.visibility}
              onChange={(newVis) => setField('visibility', newVis)}
            />
          </div>
        </div>

        {/* Insígnias destacadas */}
        {badgesLoading ? (
          <div
            className="p-6 border-t border-[var(--border-subtle)] flex flex-col"
            aria-hidden="true"
          >
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider m-0 mb-2">
              Insígnias destacadas
            </h3>
            <p className="text-xs text-[var(--text-secondary)] m-0 mb-4">
              Escolha até 4 insígnias para aparecer no seu perfil.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <SkeletonCircle size={48} />
              <SkeletonCircle size={48} />
              <SkeletonCircle size={48} />
              <SkeletonCircle size={48} />
            </div>
          </div>
        ) : availableBadges.length > 0 ? (
          <div className="p-6 border-t border-[var(--border-subtle)] flex flex-col">
            <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider m-0 mb-2">
              Insígnias destacadas
            </h3>

            <p className="text-xs text-[var(--text-secondary)] m-0 mb-4">
              Escolha até 4 insígnias para aparecer no seu perfil.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {availableBadges.map((badge) => {
                const IconComponent = resolveIcon(badge.icon, customIcons);
                const isSelected = draft.featuredBadges.includes(badge.id);
                const isDisabled = !isSelected && draft.featuredBadges.length >= 4;

                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => handleToggleBadge(badge.id)}
                    disabled={isDisabled}
                    aria-label={badge.name}
                    title={badge.name}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-2 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)] shadow-xs'
                        : isDisabled
                        ? 'border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] cursor-pointer'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 shrink-0" />}

                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand-primary)] text-[var(--text-on-primary)] flex items-center justify-center shadow-xs">
                        <svg
                          viewBox="0 0 24 24"
                          width="10"
                          height="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <ProfilePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        profile={previewProfile}
        featuredBadges={featuredBadgeItems}
        visibility={draft.visibility}
        onModeChange={(newMode) => setField('featuredBadgesMode', newMode)}
      />
    </div>
  );
};
