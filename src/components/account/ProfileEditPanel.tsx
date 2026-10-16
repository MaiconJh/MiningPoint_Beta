import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '../../types/profile';
import { useAuth } from '../../context/AuthContext';
import { useProfileDraftContext } from '../../context/ProfileDraftContext';
import { useToast } from '../../context/ToastContext';
import { validateImageFile } from '../../lib/storage';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import { TitleSelector } from './TitleSelector';
import { HandleSettings } from './HandleSettings';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import XIcon from 'lucide-react/dist/esm/icons/x';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import SaveIcon from 'lucide-react/dist/esm/icons/save';
import CheckIcon from 'lucide-react/dist/esm/icons/check';

export interface ProfileEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  availableBadges?: Badge[];
  focusTarget?: 'banner' | 'avatar' | null;
  focusNonce?: number;
}

export const ProfileEditPanel: React.FC<ProfileEditPanelProps> = ({
  isOpen,
  onClose,
  availableBadges = [],
  focusTarget = null,
  focusNonce = 0,
}) => {
  const { profile } = useAuth();
  const { customIcons } = useCustomIcons();
  const { draft, setField, isDirty, isSaving, save, reset } = useProfileDraftContext();
  const { showToast } = useToast();

  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerRowRef = useRef<HTMLDivElement>(null);
  const avatarRowRef = useRef<HTMLDivElement>(null);
  const [highlightedRow, setHighlightedRow] = useState<'banner' | 'avatar' | null>(null);

  // Foco inicial ao abrir o painel
  useEffect(() => {
    if (isOpen) {
      panelRef.current?.focus();
    }
  }, [isOpen]);

  // Foco direcionado e destaque visual na linha solicitada
  useEffect(() => {
    if (!focusTarget || !focusNonce || focusNonce <= 0) return;

    const targetRef = focusTarget === 'banner' ? bannerRowRef : avatarRowRef;
    if (targetRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      targetRef.current.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
      setHighlightedRow(focusTarget);
      const timer = setTimeout(() => {
        setHighlightedRow(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [focusTarget, focusNonce]);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowConfirmDiscard(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Tecla Escape fecha o painel (com confirmação se houver pendências)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmDiscard) {
          setShowConfirmDiscard(false);
        } else {
          handleRequestClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showConfirmDiscard, handleRequestClose]);

  const handleConfirmDiscard = () => {
    reset();
    setShowConfirmDiscard(false);
    onClose();
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'banner' | 'avatar'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      showToast(validation.reason || 'Arquivo de imagem inválido.', 'error');
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (kind === 'banner') {
      setField('pendingBannerFile', file);
      setField('bannerUrl', previewUrl);
    } else {
      setField('pendingAvatarFile', file);
      setField('photoURL', previewUrl);
    }

    e.target.value = '';
  };

  const handleRemoveBanner = () => {
    setField('bannerUrl', null);
    setField('pendingBannerFile', null);
  };

  const handleRemoveAvatar = () => {
    setField('photoURL', null);
    setField('pendingAvatarFile', null);
  };

  const handleToggleBadge = (badgeId: string) => {
    const isSelected = draft.featuredBadges.includes(badgeId);
    let updated: string[];
    if (isSelected) {
      updated = draft.featuredBadges.filter((id) => id !== badgeId);
    } else {
      if (draft.featuredBadges.length >= 4) {
        return;
      }
      updated = [...draft.featuredBadges, badgeId];
    }
    setField('featuredBadges', updated);
  };

  const handleSave = async () => {
    const success = await save();
    if (success) {
      onClose();
    }
  };

  const displayName = profile?.displayName || 'Explorador';
  const hasBanner = Boolean(draft.bannerUrl || draft.pendingBannerFile);
  const hasAvatar = Boolean(draft.photoURL || draft.pendingAvatarFile);

  return (
    <>
      {/* Backdrop overlay (apenas mobile) */}
      <div
        className={`fixed inset-0 z-40 bg-[var(--bg-overlay)]/40 lg:hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleRequestClose}
        aria-hidden="true"
      />

      {/* Drawer / Painel lateral */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
        tabIndex={-1}
        className={`edit-panel-transition fixed inset-y-0 right-0 z-50 w-full max-w-[400px] lg:static lg:inset-auto lg:z-auto lg:max-w-none lg:w-[400px] lg:shrink-0 lg:sticky lg:top-[calc(var(--nav-offset)+var(--nav-h)+16px)] lg:max-h-[calc(100vh-120px)] bg-[var(--bg-surface)] border-l lg:border border-[var(--border-default)] lg:rounded-[16px] shadow-2xl lg:shadow-sm flex flex-col outline-none transform ${
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : 'translate-x-full opacity-0 pointer-events-none lg:hidden'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do painel */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] shrink-0">
          <h3 className="text-base font-bold text-[var(--text-primary)] m-0">
            Editar perfil
          </h3>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Fechar painel de edição"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo rolável com as seções */}
        <div className="flex-1 overflow-y-auto lg:min-h-0 p-6 flex flex-col gap-8">
          {/* Identificação pública (@nick) */}
          {profile && (
            <HandleSettings
              profile={profile}
              currentDraftHandle={draft.handle}
              onUpdateDraftHandle={(h) => setField('handle', h)}
              className="flex flex-col gap-4"
            />
          )}

          {/* 1. Imagens */}
          <section className="flex flex-col gap-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">
              Imagens
            </h4>

            {/* Inputs escondidos */}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              tabIndex={-1}
              onChange={(e) => handleFileSelect(e, 'banner')}
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              tabIndex={-1}
              onChange={(e) => handleFileSelect(e, 'avatar')}
            />

            {/* Linha Banner */}
            <div
              ref={bannerRowRef}
              className={`p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default)] flex items-center justify-between gap-4 transition-all duration-300 ${
                highlightedRow === 'banner' ? 'ring-2 ring-[var(--brand-primary)]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-16 h-10 rounded-md overflow-hidden shrink-0 border border-[var(--border-default)] flex items-center justify-center"
                  /* eslint-disable-next-line design-tokens/no-raw-color-literals */
                  style={{ backgroundColor: '#333B46' }}
                >
                  {draft.bannerUrl ? (
                    <img
                      src={draft.bannerUrl}
                      alt="Miniatura do banner"
                      className="w-full h-full object-cover img-thumb-transition"
                    />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    Banner
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] truncate">
                    {hasBanner ? 'Imagem definida' : 'Fundo padrão'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveBanner}
                  disabled={!hasBanner}
                  aria-label="Remover banner"
                  title="Remover banner"
                  className={`p-1.5 rounded-lg border transition-colors ${
                    hasBanner
                      ? 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--feedback-error)] hover:border-[var(--feedback-error)] cursor-pointer'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Linha Avatar */}
            <div
              ref={avatarRowRef}
              className={`p-3.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default)] flex items-center justify-between gap-4 transition-all duration-300 ${
                highlightedRow === 'avatar' ? 'ring-2 ring-[var(--brand-primary)]' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[var(--border-default)] flex items-center justify-center bg-[var(--bg-surface-elevated)]">
                  {draft.photoURL ? (
                    <img
                      src={draft.photoURL}
                      alt="Miniatura do avatar"
                      className="w-full h-full object-cover img-thumb-transition"
                    />
                  ) : (
                    <div
                      style={{ backgroundColor: getAvatarColor(displayName) }}
                      /* eslint-disable-next-line design-tokens/no-raw-color-literals */
                      className="w-full h-full flex items-center justify-center text-xs font-bold text-[#F7F7F8]"
                    >
                      {getInitials(displayName)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    Avatar
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] truncate">
                    {hasAvatar ? 'Foto personalizada' : 'Iniciais'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Trocar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={!hasAvatar}
                  aria-label="Remover avatar"
                  title="Remover avatar"
                  className={`p-1.5 rounded-lg border transition-colors ${
                    hasAvatar
                      ? 'border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--feedback-error)] hover:border-[var(--feedback-error)] cursor-pointer'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* 2. Bio */}
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">
                Bio
              </h4>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {draft.bio.length} / 400
              </span>
            </div>

            <textarea
              maxLength={400}
              rows={4}
              value={draft.bio}
              onChange={(e) => setField('bio', e.target.value)}
              placeholder="Escreva algo sobre você..."
              className="w-full p-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] resize-none transition-colors"
            />
          </section>

          {/* 3. Destaques */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] m-0">
                Destaques
              </h4>
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {draft.featuredBadges.length} de 4 insígnias
              </span>
            </div>

            {/* Grid de seleção de insígnias */}
            {availableBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {availableBadges.map((badge) => {
                  const IconComponent = resolveIcon(badge.icon, customIcons);
                  const isSelected = draft.featuredBadges.includes(badge.id);
                  const isDisabled = !isSelected && draft.featuredBadges.length >= 4;

                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => handleToggleBadge(badge.id)}
                      disabled={isDisabled}
                      aria-label={badge.name}
                      title={badge.name}
                      className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-2 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)] shadow-xs'
                          : isDisabled
                          ? 'border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                          : 'border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] cursor-pointer'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-5 h-5 shrink-0" />}

                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand-primary)] text-[var(--text-on-primary)] flex items-center justify-center shadow-xs">
                          <CheckIcon className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] m-0">
                Nenhuma insígnia conquistada para destacar.
              </p>
            )}

            {/* Seletor de Título */}
            <div className="mt-2">
              <TitleSelector
                currentTitleId={draft.featuredTitleId}
                onSelectTitle={(newTitleId) => setField('featuredTitleId', newTitleId)}
                bare={true}
              />
            </div>
          </section>
        </div>

        {/* Rodapé do painel */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            {isDirty ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--feedback-warning)] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[var(--feedback-warning)] animate-pulse shrink-0" />
                <span>Pendente</span>
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">
                Sem alterações
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={`btn-save-transition inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDirty && !isSaving
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:opacity-90 shadow-xs'
                : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
            }`}
          >
            <SaveIcon className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Salvando...' : 'Salvar alterações'}</span>
          </button>
        </div>
      </aside>

      {/* Diálogo de confirmação de descarte de alterações */}
      {showConfirmDiscard && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmDiscard(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Descartar alterações?"
            className="dialog-transition w-full max-w-sm rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-2xl flex flex-col gap-4"
          >
            <h4 className="text-base font-bold text-[var(--text-primary)] m-0 leading-tight">
              Descartar alterações?
            </h4>
            <p className="text-sm text-[var(--text-secondary)] m-0 leading-relaxed">
              Você tem alterações não salvas no rascunho do seu perfil. Deseja descartá-las?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDiscard(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[var(--feedback-error)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
