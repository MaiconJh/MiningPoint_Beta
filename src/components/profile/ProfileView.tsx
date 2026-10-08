import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../context/AuthContext';
import { FeaturedBadgesMode } from '../../lib/featuredBadges';
import { ProfileBanner } from './ProfileBanner';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs, ProfileTabId } from './ProfileTabs';
import { ProfileSidebar } from './ProfileSidebar';
import { FeedTab } from './tabs/FeedTab';
import { AboutTab } from './tabs/AboutTab';
import { AttributesTab } from './tabs/AttributesTab';
import { HistoryTab } from './tabs/HistoryTab';
import { ProfileSkeleton } from '../skeleton/ProfileSkeleton';
import { HandleBanner } from '../onboarding/HandleBanner';

interface ProfileViewProps {
  userId: string;
  ownMode: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ userId, ownMode }) => {
  const navigate = useNavigate();
  const {
    profile: fetchedProfile,
    userBadges,
    featuredBadges,
    loading,
    notFound,
  } = useProfile(userId);
  const { profile: authProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTabId>('feed');

  // Use live authProfile in ownMode to ensure immediate reactive UI updates
  const profile = ownMode && authProfile ? authProfile : fetchedProfile;
  const displayMode: FeaturedBadgesMode = profile?.featuredBadgesMode ?? 'manual';

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  if (notFound || !profile) {
    return (
      <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
          Perfil não encontrado
        </h1>
        <p className="text-base text-[var(--text-secondary)] mb-6 max-w-md">
          O perfil solicitado não está disponível ou não foi encontrado.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] text-sm font-semibold text-[var(--text-primary)] transition-colors"
        >
          Voltar para o início
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
      <div className="rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm overflow-clip">
        {/* 1. Banner */}
        <ProfileBanner
          featuredBadges={featuredBadges}
          mode={displayMode}
          showModeToggle={false}
        />

        {/* 2. Header row */}
        <ProfileHeader profile={profile} />

        {/* Onboarding HandleBanner */}
        {ownMode && profile && <HandleBanner profile={profile} />}

        {/* 3. Tabs row */}
        <ProfileTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          ownMode={ownMode}
        />

        {/* 4. Two-column body */}
        <div className="p-6 flex flex-col lg:flex-row gap-6 items-start">
          {/* Main tab content */}
          <div className="flex-1 min-w-0" role="tabpanel" id={`panel-${activeTab}`}>
            {activeTab === 'feed' && (
              <FeedTab isBanned={profile.isBanned} ownMode={ownMode} />
            )}
            {activeTab === 'sobre' && (
              <AboutTab
                bio={profile.bio}
                showEditButton={ownMode}
                onEdit={() => navigate('/conta/perfil')}
              />
            )}
            {activeTab === 'qualidades' && (
              <AttributesTab attributes={profile.attributes} />
            )}
            {activeTab === 'historico' && <HistoryTab />}
          </div>

          {/* Sidebar */}
          <ProfileSidebar profile={profile} userBadges={userBadges} />
        </div>
      </div>
    </div>
  );
};
