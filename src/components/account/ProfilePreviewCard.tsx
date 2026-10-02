import React from 'react';
import { UserProfile, FeaturedBadgeItem } from '../../types/profile';
import { ProfileBanner } from '../profile/ProfileBanner';
import { ProfileHeader } from '../profile/ProfileHeader';
import { ProfileTabs } from '../profile/ProfileTabs';

interface ProfilePreviewCardProps {
  profile: UserProfile;
  featuredBadges: FeaturedBadgeItem[];
}

export const ProfilePreviewCard: React.FC<ProfilePreviewCardProps> = ({
  profile,
  featuredBadges,
}) => {
  return (
    <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-hidden">
      <ProfileBanner featuredBadges={featuredBadges} />
      <ProfileHeader profile={profile} />
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
