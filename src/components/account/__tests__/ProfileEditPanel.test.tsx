import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileEditPanel } from '../ProfileEditPanel';
import { useProfileDraftContext } from '../../../context/ProfileDraftContext';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';

vi.mock('../../../context/ProfileDraftContext', () => ({
  useProfileDraftContext: vi.fn(),
}));

vi.mock('../../../context/ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../TitleSelector', () => ({
  TitleSelector: () => <div data-testid="title-selector">TitleSelector</div>,
}));

describe('ProfileEditPanel', () => {
  const mockSetField = vi.fn();
  const mockSave = vi.fn().mockResolvedValue(true);
  const mockReset = vi.fn();
  const mockShowToast = vi.fn();
  const mockOnClose = vi.fn();

  const defaultDraft = {
    bio: 'Minha bio existente',
    featuredTitleId: null,
    visibility: 'public' as const,
    featuredBadges: ['badge-1'],
    featuredBadgesMode: 'manual' as const,
    handle: 'alfa',
    photoURL: 'https://example.com/avatar.png',
    bannerUrl: 'https://example.com/banner.png',
    pendingAvatarFile: null,
    pendingBannerFile: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      profile: { displayName: 'Explorador Teste' },
    });
    (useToast as any).mockReturnValue({
      showToast: mockShowToast,
    });
    (useProfileDraftContext as any).mockReturnValue({
      draft: defaultDraft,
      setField: mockSetField,
      isDirty: false,
      isSaving: false,
      save: mockSave,
      reset: mockReset,
    });
  });

  it('renderiza as 3 seções do painel quando aberto', () => {
    render(
      <ProfileEditPanel
        isOpen={true}
        onClose={mockOnClose}
        availableBadges={[
          { id: 'badge-1', name: 'Badge Alfa', icon: 'award' } as any,
          { id: 'badge-2', name: 'Badge Beta', icon: 'shield' } as any,
        ]}
      />
    );

    expect(screen.getByText('Editar perfil')).toBeInTheDocument();
    expect(screen.getByText('Imagens')).toBeInTheDocument();
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('Destaques')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Minha bio existente')).toBeInTheDocument();
    expect(screen.getByText('19 / 400')).toBeInTheDocument();
  });

  it('permite editar a bio chamando setField', () => {
    render(
      <ProfileEditPanel
        isOpen={true}
        onClose={mockOnClose}
        availableBadges={[]}
      />
    );

    const textarea = screen.getByDisplayValue('Minha bio existente');
    fireEvent.change(textarea, { target: { value: 'Nova bio atualizada' } });

    expect(mockSetField).toHaveBeenCalledWith('bio', 'Nova bio atualizada');
  });

  it('ao tentar selecionar arquivo maior que 5MB, dispara toast de erro e não altera o draft', () => {
    render(
      <ProfileEditPanel
        isOpen={true}
        onClose={mockOnClose}
        availableBadges={[]}
      />
    );

    // Cria um arquivo falso de 6MB
    const bigFile = new File(['x'.repeat(100)], 'large-banner.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });

    const bannerInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(bannerInput).toBeInTheDocument();

    fireEvent.change(bannerInput, { target: { files: [bigFile] } });

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('O limite é 5 MB'),
      'error'
    );
    expect(mockSetField).not.toHaveBeenCalled();
  });

  it('fecha direto se não houver alterações pendentes (isDirty === false)', () => {
    render(
      <ProfileEditPanel
        isOpen={true}
        onClose={mockOnClose}
        availableBadges={[]}
      />
    );

    const closeBtn = screen.getByLabelText('Fechar painel de edição');
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Descartar alterações?')).not.toBeInTheDocument();
  });

  it('abre diálogo de confirmação se tentar fechar com isDirty === true', () => {
    (useProfileDraftContext as any).mockReturnValue({
      draft: defaultDraft,
      setField: mockSetField,
      isDirty: true,
      isSaving: false,
      save: mockSave,
      reset: mockReset,
    });

    render(
      <ProfileEditPanel
        isOpen={true}
        onClose={mockOnClose}
        availableBadges={[]}
      />
    );

    const closeBtn = screen.getByLabelText('Fechar painel de edição');
    fireEvent.click(closeBtn);

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(screen.getByText('Descartar alterações?')).toBeInTheDocument();

    // Clicar em "Descartar"
    const discardBtn = screen.getByRole('button', { name: 'Descartar' });
    fireEvent.click(discardBtn);

    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('salva e fecha ao clicar no botão salvar alterações', async () => {
    (useProfileDraftContext as any).mockReturnValue({
      draft: defaultDraft,
      setField: mockSetField,
      isDirty: true,
      isSaving: false,
      save: mockSave,
      reset: mockReset,
    });

    render(
      <ProfileEditPanel
        isOpen={true}
        onClose={mockOnClose}
        availableBadges={[]}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
