import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProfileSidebar } from '../ProfileSidebar';
import { UserProfile, UserBadge } from '../../../types/profile';

describe('ProfileSidebar', () => {
  it('alinha offset sticky e respeita hierarquia sem h4', () => {
    const mockProfile: UserProfile = {
      uid: 'user-1',
      displayName: 'Explorador Teste',
      email: 'teste@example.com',
      photoURL: null,
      primaryGroupId: 'membro',
      secondaryGroupIds: [],
      isStaff: false,
      effectivePermissions: {
        accessPanel: false,
        manageUsers: false,
        manageGroups: false,
        manageBadges: false,
        manageForum: false,
        manageContent: false,
      },
      bio: 'Bio teste',
      featuredTitleId: null,
      featuredTitle: null,
      visibility: 'public',
      featuredBadges: [],
      attributes: {
        exploration: 100,
        gathering: 100,
        knowledge: 100,
        community: 100,
        endurance: 50,
        economy: 8,
      },
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      createdAt: null as any,
      shortId: 'abc1234',
      handle: 'explorador',
    };

    const mockUserBadges: UserBadge[] = [
      { id: 'ub-1', userId: 'user-1', badgeId: 'badge-1', awardedAt: null as any, awardedBy: 'admin' },
      { id: 'ub-2', userId: 'user-1', badgeId: 'badge-2', awardedAt: null as any, awardedBy: 'admin' },
    ];

    const { container } = render(
      <ProfileSidebar profile={mockProfile} userBadges={mockUserBadges} />
    );

    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
    const asideClassName = aside?.className || '';
    expect(asideClassName).toContain('+16px');
    expect(asideClassName).not.toContain('+24px');

    const h2Elements = container.querySelectorAll('h2');
    expect(h2Elements).toHaveLength(2);

    const h4Elements = container.querySelectorAll('h4');
    expect(h4Elements).toHaveLength(0);

    expect(screen.getByText('458')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
