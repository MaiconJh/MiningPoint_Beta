import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfilePreviewCard } from '../ProfilePreviewCard';
import { UserProfile, FeaturedBadgeItem } from '../../../types/profile';

const bannerMock = vi.fn((_props: any) => <div data-testid="mock-banner" />);
const headerMock = vi.fn((_props: any) => <div data-testid="mock-header" />);
const tabsMock = vi.fn((_props: any) => <div data-testid="mock-tabs" />);

vi.mock('../../profile/ProfileBanner', () => ({
  ProfileBanner: (props: any) => bannerMock(props),
}));

vi.mock('../../profile/ProfileHeader', () => ({
  ProfileHeader: (props: any) => headerMock(props),
}));

vi.mock('../../profile/ProfileTabs', () => ({
  ProfileTabs: (props: any) => tabsMock(props),
}));

describe('ProfilePreviewCard', () => {
  it('compõe os componentes autênticos do perfil público e passa readOnly para ProfileTabs', () => {
    const mockProfile = {
      bio: 'Minha bio personalizada de teste',
    } as UserProfile;

    const mockFeaturedBadges: FeaturedBadgeItem[] = [
      {
        badge: { id: 'badge-1', name: 'Explorador Alfa' } as any,
        userBadge: { badgeId: 'badge-1' } as any,
      },
    ];

    render(
      <ProfilePreviewCard
        profile={mockProfile}
        featuredBadges={mockFeaturedBadges}
      />
    );

    expect(screen.getByTestId('mock-banner')).toBeInTheDocument();
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-tabs')).toBeInTheDocument();

    expect(tabsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        readOnly: true,
        activeTab: 'sobre',
      })
    );

    expect(bannerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        featuredBadges: mockFeaturedBadges,
      })
    );

    expect(screen.getByText('Minha bio personalizada de teste')).toBeInTheDocument();
  });
});
