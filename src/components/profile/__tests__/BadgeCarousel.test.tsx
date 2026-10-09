import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BadgeCarousel } from '../BadgeCarousel';
import { FeaturedBadgeItem } from '../../../types/profile';
import { Timestamp } from 'firebase/firestore';

vi.mock('../../../hooks/useRarities', () => ({
  useRarities: () => ({
    rarities: [
      { id: 'comum', label: 'Comum', color: '#94a3b8', order: 1 },
      {
        id: 'raro',
        label: 'Raro',
        color: '#f59e0b',
        order: 3,
        theme: {
          effects: ['tilt', 'spotlight'],
        },
      },
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

  it('permite ocultar o toggle com showModeToggle={false}', () => {
    render(<BadgeCarousel items={mockItems} mode="manual" showModeToggle={false} />);
    expect(screen.queryByRole('button', { name: 'Manual' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Auto' })).toBeNull();
  });

  it('renderiza rótulo acessível com instruções de arrasto quando onReorder for fornecido', () => {
    const handleReorder = vi.fn();
    render(<BadgeCarousel items={mockItems} mode="manual" onReorder={handleReorder} />);

    const dragButton = screen.getByLabelText(/Insígnia Alfa\. Arraste para reordenar/);
    expect(dragButton).toBeInTheDocument();
  });

  it('aplica tema da raridade com pointer-events-auto e classes de efeito no tooltip', () => {
    render(<BadgeCarousel items={mockItems} mode="manual" />);

    // Clica no badge "Insígnia Beta" (raro) para fixar o tooltip
    const betaBtn = screen.getByRole('button', { name: 'Insígnia Beta' });
    fireEvent.click(betaBtn);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    // pointer-events-auto para permitir interação de ponteiro
    expect(tooltip).toHaveClass('pointer-events-auto');
    expect(tooltip).not.toHaveClass('pointer-events-none');
    // Classe de efeito tilt aplicada no container
    expect(tooltip).toHaveClass('fx-tilt');
    // Herança de accentColor derivada da cor da raridade
    expect(tooltip.style.getPropertyValue('--fx-accent')).toBe('#f59e0b');
  });
});
