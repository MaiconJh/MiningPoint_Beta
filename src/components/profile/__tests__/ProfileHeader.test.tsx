import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProfileHeader } from '../ProfileHeader';
import { UserProfile } from '../../../types/profile';

describe('ProfileHeader', () => {
  it('usa o token de feedback no ícone de check ao copiar link', () => {
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
        exploration: 50,
        gathering: 50,
        knowledge: 50,
        community: 50,
        endurance: 50,
        economy: 50,
      },
      isBanned: false,
      bannedAt: null,
      bannedBy: null,
      createdAt: null as any,
      shortId: 'abc1234',
      handle: 'explorador',
    };

    render(<ProfileHeader profile={mockProfile} />);

    const button = screen.getByTitle('Copiar link do perfil');
    fireEvent.click(button);

    const checkIcon = button.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
    const className = checkIcon?.getAttribute('class') || '';
    expect(className).not.toContain('emerald');
    expect(className).toContain('var(--feedback-success)');
  });
});
