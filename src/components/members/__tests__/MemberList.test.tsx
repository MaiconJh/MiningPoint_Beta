import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MemberList } from '../MemberList';
import { UserProfile } from '../../../types/profile';

describe('MemberList', () => {
  const sampleMembers: UserProfile[] = [
    {
      uid: 'user-1',
      displayName: 'Membro Um',
      email: 'um@example.com',
      photoURL: null,
      primaryGroupId: 'g1',
      secondaryGroupIds: [],
      primaryGroup: {
        id: 'g1',
        name: 'Exploradores',
        description: '',
        color: '#8BD0EF',
        priority: 10,
        isStaff: false,
        createdAt: {} as any,
      } as any,
      visibility: 'public',
      bio: '',
      featuredTitleId: null,
      featuredBadges: [],
      isStaff: false,
      effectivePermissions: {} as any,
      attributes: {} as any,
      createdAt: {} as any,
    } as unknown as UserProfile,
    {
      uid: 'user-2',
      displayName: 'Membro Dois',
      email: 'dois@example.com',
      photoURL: null,
      primaryGroupId: 'g1',
      secondaryGroupIds: [],
      primaryGroup: null,
      visibility: 'public',
      bio: '',
      featuredTitleId: null,
      featuredBadges: [],
      isStaff: false,
      effectivePermissions: {} as any,
      attributes: {} as any,
      createdAt: {} as any,
    } as unknown as UserProfile,
  ];

  it('renderiza N cards para N membros', () => {
    render(
      <MemoryRouter>
        <MemberList
          members={sampleMembers}
          userTitlesMap={{}}
          isLoading={false}
          isLoadingMore={false}
          hasMore={false}
          onLoadMore={vi.fn()}
          onClearFilters={vi.fn()}
          hasActiveFilters={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Membro Um')).toBeInTheDocument();
    expect(screen.getByText('Membro Dois')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('exibe estado vazio com botão Limpar filtros quando houver filtros ativos', () => {
    const handleClear = vi.fn();
    render(
      <MemoryRouter>
        <MemberList
          members={[]}
          userTitlesMap={{}}
          isLoading={false}
          isLoadingMore={false}
          hasMore={false}
          onLoadMore={vi.fn()}
          onClearFilters={handleClear}
          hasActiveFilters={true}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Nenhum membro encontrado')).toBeInTheDocument();
    expect(screen.getByText('Tente ajustar a busca ou o filtro de grupo.')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Limpar filtros' });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('exibe estado vazio sem CTA quando não houver filtros ativos (lista global vazia)', () => {
    render(
      <MemoryRouter>
        <MemberList
          members={[]}
          userTitlesMap={{}}
          isLoading={false}
          isLoadingMore={false}
          hasMore={false}
          onLoadMore={vi.fn()}
          onClearFilters={vi.fn()}
          hasActiveFilters={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Nenhum membro encontrado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('exibe e gerencia o botão Carregar mais condicionalmente', () => {
    const handleLoadMore = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <MemberList
          members={sampleMembers}
          userTitlesMap={{}}
          isLoading={false}
          isLoadingMore={false}
          hasMore={true}
          onLoadMore={handleLoadMore}
          onClearFilters={vi.fn()}
          hasActiveFilters={false}
        />
      </MemoryRouter>
    );

    const loadMoreButton = screen.getByRole('button', { name: 'Carregar mais' });
    expect(loadMoreButton).toBeInTheDocument();
    expect(loadMoreButton).not.toBeDisabled();

    fireEvent.click(loadMoreButton);
    expect(handleLoadMore).toHaveBeenCalledTimes(1);

    // Quando isLoadingMore for true, mostra "Carregando..." e desativa
    rerender(
      <MemoryRouter>
        <MemberList
          members={sampleMembers}
          userTitlesMap={{}}
          isLoading={false}
          isLoadingMore={true}
          hasMore={true}
          onLoadMore={handleLoadMore}
          onClearFilters={vi.fn()}
          hasActiveFilters={false}
        />
      </MemoryRouter>
    );

    const loadingButton = screen.getByRole('button', { name: 'Carregando...' });
    expect(loadingButton).toBeDisabled();
  });
});
