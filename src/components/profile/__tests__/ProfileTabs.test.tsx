import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileTabs } from '../ProfileTabs';

describe('ProfileTabs', () => {
  it('permite navegação interativa quando readOnly está ausente', () => {
    const onChangeTabSpy = vi.fn();

    render(
      <ProfileTabs
        activeTab="feed"
        onChangeTab={onChangeTabSpy}
        ownMode={false}
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);

    for (const tab of tabs) {
      expect(tab).not.toHaveAttribute('aria-disabled');
      expect(tab).not.toHaveAttribute('tabindex', '-1');
    }

    fireEvent.click(tabs[1]);
    expect(onChangeTabSpy).toHaveBeenCalledWith('sobre');
  });

  it('desativa interação e foco por tabulação quando readOnly é true', () => {
    const onChangeTabSpy = vi.fn();

    render(
      <ProfileTabs
        activeTab="sobre"
        onChangeTab={onChangeTabSpy}
        ownMode={false}
        readOnly
      />
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);

    for (const tab of tabs) {
      expect(tab).toHaveAttribute('aria-disabled', 'true');
      expect(tab).toHaveAttribute('tabindex', '-1');
    }

    fireEvent.click(tabs[0]);
    expect(onChangeTabSpy).not.toHaveBeenCalled();
  });
});
