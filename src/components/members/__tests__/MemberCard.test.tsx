import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MemberCard } from '../MemberCard';
import { UserProfile } from '../../../types/profile';
import { Title } from '../../../types/title';
import { Group } from '../../../types/group';

describe('MemberCard', () => {
  const baseMember = {
    uid: 'u-123',
    displayName: 'Rodrigo Faro',
    email: 'rodrigo@example.com',
    photoURL: 'https://example.com/rodrigo.jpg',
    shortId: 'rodrigo',
    primaryGroupId: 'mineiro',
    secondaryGroupIds: [],
    primaryGroup: {
      id: 'mineiro',
      name: 'Mineiro Veterano',
      description: 'Explorador experiente',
      color: '#8BD0EF',
      priority: 50,
      isStaff: false,
    } as unknown as Group,
    visibility: 'public' as const,
    bio: '',
    featuredTitleId: null,
    featuredBadges: [],
    isStaff: false,
  } as unknown as UserProfile;

  const sampleTitles: Title[] = [
    {
      id: 'title-1',
      name: 'Pioneiro',
      description: 'Desbravador inicial',
      color: '#4ADE80',
      createdAt: {} as any,
      createdBy: 'admin',
    },
    {
      id: 'title-2',
      name: 'Explorador Mestre',
      description: 'Mestre da exploração',
      color: '#FBBF24',
      createdAt: {} as any,
      createdBy: 'admin',
    },
  ];

  it('renderiza nome, foto do avatar, link do perfil e chips de grupo e títulos', () => {
    render(
      <MemoryRouter>
        <MemberCard member={baseMember} titles={sampleTitles} />
      </MemoryRouter>
    );

    expect(screen.getByText('Rodrigo Faro')).toBeInTheDocument();

    const img = screen.getByRole('img', { name: 'Rodrigo Faro' });
    expect(img).toHaveAttribute('src', 'https://example.com/rodrigo.jpg');

    // Link para o perfil
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/perfil/rodrigo');

    // Chips
    expect(screen.getByText('Mineiro Veterano')).toBeInTheDocument();
    expect(screen.getByText('Pioneiro')).toBeInTheDocument();
    expect(screen.getByText('Explorador Mestre')).toBeInTheDocument();
  });

  it('exibe iniciais quando photoURL for nulo', () => {
    const memberWithoutPhoto: UserProfile = {
      ...baseMember,
      photoURL: null,
      displayName: 'Ana Silva',
    };

    render(
      <MemoryRouter>
        <MemberCard member={memberWithoutPhoto} titles={[]} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AS')).toBeInTheDocument();
  });

  it('omite o chip de grupo quando primaryGroup for nulo', () => {
    const memberWithoutGroup: UserProfile = {
      ...baseMember,
      primaryGroup: null,
    };

    render(
      <MemoryRouter>
        <MemberCard member={memberWithoutGroup} titles={sampleTitles} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Mineiro Veterano')).not.toBeInTheDocument();
    expect(screen.getByText('Pioneiro')).toBeInTheDocument();
  });

  it('omite chips de título quando o array de títulos for vazio', () => {
    render(
      <MemoryRouter>
        <MemberCard member={baseMember} titles={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText('Mineiro Veterano')).toBeInTheDocument();
    expect(screen.queryByText('Pioneiro')).not.toBeInTheDocument();
  });
});
