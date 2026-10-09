import React, { useEffect } from 'react';
import { UserProfile, FeaturedBadgeItem } from '../../types/profile';
import { FeaturedBadgesMode } from '../../lib/featuredBadges';
import { ProfilePreviewCard } from './ProfilePreviewCard';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  featuredBadges: FeaturedBadgeItem[];
  visibility: 'public' | 'private';
  onModeChange?: (nextMode: FeaturedBadgesMode) => void;
  onReorder?: (newOrderIds: string[]) => void;
}

export const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isOpen,
  onClose,
  profile,
  featuredBadges,
  visibility,
  onModeChange,
  onReorder,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const titleText = visibility === 'private' ? 'Perfil privado' : 'Perfil público';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titleText}
        className="w-full max-w-3xl lg:max-w-4xl rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[calc(100vh-32px)] overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)] m-0 leading-snug">
            {titleText}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ProfilePreviewCard
          profile={profile}
          featuredBadges={featuredBadges}
          onModeChange={onModeChange}
          onReorder={onReorder}
        />
      </div>
    </div>
  );
};
