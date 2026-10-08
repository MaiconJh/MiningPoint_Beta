import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SortableBadgeStrip } from '../SortableBadgeStrip';
import { FeaturedBadgeItem } from '../../../types/profile';
import { Timestamp } from 'firebase/firestore';

vi.mock('../../../hooks/useCustomIcons', () => ({
  useCustomIcons: () => ({
    customIcons: [],
    loading: false,
  }),
}));

describe('SortableBadgeStrip', () => {
  const mockItems: FeaturedBadgeItem[] = [
    {
      badge: {
        id: 'b1',
        name: 'Insígnia Alfa',
        description: 'Desc Alfa',
        icon: 'award',
        rarityId: 'comum',
        order: 1,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
      userBadge: {
        id: 'ub1',
        userId: 'u1',
        badgeId: 'b1',
        awardedAt: Timestamp.now(),
        awardedBy: 'admin',
      },
    },
    {
      badge: {
        id: 'b2',
        name: 'Insígnia Beta',
        description: 'Desc Beta',
        icon: 'star',
        rarityId: 'raro',
        order: 2,
        createdAt: Timestamp.now(),
        createdBy: 'admin',
      },
      userBadge: {
        id: 'ub2',
        userId: 'u1',
        badgeId: 'b2',
        awardedAt: Timestamp.now(),
        awardedBy: 'admin',
      },
    },
  ];

  it('retorna null se a lista for vazia', () => {
    const { container } = render(
      <SortableBadgeStrip items={[]} onReorder={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza os itens com acessibilidade e nomes', () => {
    render(
      <SortableBadgeStrip items={mockItems} onReorder={vi.fn()} />
    );

    expect(screen.getByText('Insígnia Alfa')).toBeInTheDocument();
    expect(screen.getByText('Insígnia Beta')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Reordenar Insígnia Alfa\. Posição 1 de 2/)
    ).toBeInTheDocument();
  });

  it('reordena para a direita ao clicar no botão mover para a direita', () => {
    const handleReorder = vi.fn();
    render(
      <SortableBadgeStrip items={mockItems} onReorder={handleReorder} />
    );

    const moveRightBtn = screen.getByLabelText('Mover Insígnia Alfa para a direita');
    fireEvent.click(moveRightBtn);

    expect(handleReorder).toHaveBeenCalledWith(['b2', 'b1']);
  });

  it('desabilita mover para a esquerda no primeiro item', () => {
    render(
      <SortableBadgeStrip items={mockItems} onReorder={vi.fn()} />
    );

    const moveLeftBtn = screen.getByLabelText('Mover Insígnia Alfa para a esquerda');
    expect(moveLeftBtn).toBeDisabled();
  });

  it('dispara onRemove ao clicar no botão remover', () => {
    const handleRemove = vi.fn();
    render(
      <SortableBadgeStrip items={mockItems} onReorder={vi.fn()} onRemove={handleRemove} />
    );

    const removeBtn = screen.getByLabelText('Remover Insígnia Alfa dos destaques');
    fireEvent.click(removeBtn);

    expect(handleRemove).toHaveBeenCalledWith('b1');
  });
});
