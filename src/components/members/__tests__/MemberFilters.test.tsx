import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemberFilters } from '../MemberFilters';
import { Group } from '../../../types/group';

describe('MemberFilters', () => {
  const sampleGroups: Group[] = [
    {
      id: 'g-staff',
      name: 'Staff',
      description: '',
      color: '#F87171',
      priority: 90,
      isStaff: true,
      createdAt: {} as any,
    } as unknown as Group,
    {
      id: 'g-membro',
      name: 'Membro',
      description: '',
      color: '#8BD0EF',
      priority: 20,
      isStaff: false,
      createdAt: {} as any,
    } as unknown as Group,
  ];

  it('renderiza título, selects, busca e contador de membros', () => {
    render(
      <MemberFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGroupId={null}
        onGroupChange={vi.fn()}
        sortMode="group"
        onSortChange={vi.fn()}
        groups={sampleGroups}
        memberCount={42}
      />
    );

    expect(screen.getByText('Filtros')).toBeInTheDocument();
    expect(screen.getByText('Todos os grupos')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
    expect(screen.getByText('Membro')).toBeInTheDocument();
    expect(screen.getByText('Grupo (maior autoridade)')).toBeInTheDocument();
    expect(screen.getByText('Nome (A–Z)')).toBeInTheDocument();
    expect(screen.getByText('42 membros')).toBeInTheDocument();
  });

  it('formata o contador no singular e para zero membros', () => {
    const { rerender } = render(
      <MemberFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGroupId={null}
        onGroupChange={vi.fn()}
        sortMode="group"
        onSortChange={vi.fn()}
        groups={sampleGroups}
        memberCount={1}
      />
    );

    expect(screen.getByText('1 membro')).toBeInTheDocument();

    rerender(
      <MemberFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGroupId={null}
        onGroupChange={vi.fn()}
        sortMode="group"
        onSortChange={vi.fn()}
        groups={sampleGroups}
        memberCount={0}
      />
    );

    expect(screen.getByText('Nenhum membro')).toBeInTheDocument();
  });

  it('chama onGroupChange ao selecionar grupo', () => {
    const handleGroupChange = vi.fn();
    render(
      <MemberFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGroupId={null}
        onGroupChange={handleGroupChange}
        sortMode="group"
        onSortChange={vi.fn()}
        groups={sampleGroups}
        memberCount={10}
      />
    );

    const groupSelect = screen.getByRole('combobox', { name: 'Filtrar por grupo' });
    fireEvent.change(groupSelect, { target: { value: 'g-staff' } });

    expect(handleGroupChange).toHaveBeenCalledWith('g-staff');
  });

  it('chama onSortChange ao alterar ordenação', () => {
    const handleSortChange = vi.fn();
    render(
      <MemberFilters
        searchQuery=""
        onSearchChange={vi.fn()}
        selectedGroupId={null}
        onGroupChange={vi.fn()}
        sortMode="group"
        onSortChange={handleSortChange}
        groups={sampleGroups}
        memberCount={10}
      />
    );

    const sortSelect = screen.getByRole('combobox', { name: 'Ordenar membros' });
    fireEvent.change(sortSelect, { target: { value: 'name' } });

    expect(handleSortChange).toHaveBeenCalledWith('name');
  });
});
