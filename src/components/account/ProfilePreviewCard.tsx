import React from 'react';
import { UserProfile, FeaturedBadgeItem } from '../../types/profile';
import { FeaturedBadgesMode } from '../../lib/featuredBadges';
import { ProfileBanner } from '../profile/ProfileBanner';
import { ProfileHeader } from '../profile/ProfileHeader';
import { ProfileTabs } from '../profile/ProfileTabs';

interface ProfilePreviewCardProps {
  profile: UserProfile;
  featuredBadges: FeaturedBadgeItem[];
  onModeChange?: (nextMode: FeaturedBadgesMode) => void;
  onReorder?: (newOrderIds: string[]) => void;
}

export const ProfilePreviewCard: React.FC<ProfilePreviewCardProps> = ({
  profile,
  featuredBadges,
  onModeChange,
  onReorder,
}) => {
  return (
    <div className="rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-hidden">
      <ProfileBanner
        featuredBadges={featuredBadges}
        mode={profile.featuredBadgesMode || 'manual'}
        onModeChange={onModeChange}
        onReorder={onReorder}
      />
      <div className="pb-4">
        <ProfileHeader profile={profile} />
      </div>
      <ProfileTabs activeTab="sobre" onChangeTab={() => {}} ownMode={false} readOnly />
      <div className="p-6">
        {profile.bio ? (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line m-0">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm text-[var(--text-muted)] m-0">
            Nenhuma bio definida.
          </p>
        )}
      </div>
    </div>
  );
};
