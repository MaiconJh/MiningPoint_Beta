import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BadgeCarousel } from '../BadgeCarousel';
import { FeaturedBadgeItem } from '../../../types/profile';
import { Timestamp } from 'firebase/firestore';

vi.mock('../../../hooks/useRarities', () => ({
  useRarities: () => ({
    rarities: [
      { id: 'comum', label: 'Comum', order: 1 },
      { id: 'raro', label: 'Raro', order: 3 },
    ],
    loading: false,
    reload: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useCustomIcons', () => ({
  useCustomIcons: () => ({
    customIcons: [],
    loading: false,
  }),
}));

describe('BadgeCarousel', () => {
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

  it('retorna null se a lista de itens estiver vazia', () => {
    const { container } = render(<BadgeCarousel items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza os botões do toggle Manual e Auto', () => {
    render(<BadgeCarousel items={mockItems} mode="manual" />);

    expect(screen.getByRole('button', { name: 'Manual' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto' })).toBeInTheDocument();
  });

  it('dispara onModeChange ao alternar entre Manual e Auto', () => {
    const handleModeChange = vi.fn();
    render(<BadgeCarousel items={mockItems} mode="manual" onModeChange={handleModeChange} />);

    const autoBtn = screen.getByRole('button', { name: 'Auto' });
    fireEvent.click(autoBtn);

    expect(handleModeChange).toHaveBeenCalledWith('auto');
  });

  it('ordena itens por raridade quando no modo auto', () => {
    render(<BadgeCarousel items={mockItems} mode="auto" />);

    // No modo auto, "Insígnia Beta" (raro: order 3) deve preceder "Insígnia Alfa" (comum: order 1)
    const buttons = screen.getAllByRole('button');
    // Os primeiros botões são do toggle (Manual, Auto), os seguintes são as insígnias
    const badgeButtons = buttons.filter(
      (b) => b.getAttribute('aria-label') === 'Insígnia Alfa' || b.getAttribute('aria-label') === 'Insígnia Beta'
    );

    expect(badgeButtons[0]).toHaveAttribute('aria-label', 'Insígnia Beta');
    expect(badgeButtons[1]).toHaveAttribute('aria-label', 'Insígnia Alfa');
  });
});
