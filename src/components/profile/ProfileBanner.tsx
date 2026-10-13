import React from 'react';
import { FeaturedBadgeItem } from '../../types/profile';
import { FeaturedBadgesMode } from '../../lib/featuredBadges';
import { BadgeCarousel } from './BadgeCarousel';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';

export interface ProfileBannerProps {
  featuredBadges: FeaturedBadgeItem[];
  bannerUrl?: string | null;
  mode?: FeaturedBadgesMode;
  onModeChange?: (nextMode: FeaturedBadgesMode) => void;
  onReorder?: (newOrderIds: string[]) => void;
  showModeToggle?: boolean;
  onEditBanner?: () => void;
}

export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  featuredBadges,
  bannerUrl,
  mode,
  onModeChange,
  onReorder,
  showModeToggle,
  onEditBanner,
}) => {
  return (
    <div className="relative w-full h-[200px] overflow-hidden group/banner">
      {/* Background layer: neutral surface or custom banner image */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        /* TOKEN-EXCEPTION 002
           File:      src/components/profile/ProfileBanner.tsx
           Reason:    Banner texture is decorative and must remain dark in both
                      themes for badge legibility.
           Reference: PROJECT_STANDARDS.md § Styling — Declared Exceptions
        */
        /* eslint-disable-next-line design-tokens/no-raw-color-literals */
        style={{
          backgroundColor: '#333B46',
        }}
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover img-thumb-transition"
          />
        )}
        {/* Shading overlay for readability */}
        <div
          className="absolute inset-0"
          /* TOKEN-EXCEPTION 002
             File:      src/components/profile/ProfileBanner.tsx
             Reason:    Banner texture is decorative and must remain dark in both
                        themes for badge legibility.
             Reference: PROJECT_STANDARDS.md § Styling — Declared Exceptions
          */
          /* eslint-disable-next-line design-tokens/no-raw-color-literals */
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, transparent 42%, rgba(0, 0, 0, 0.35) 100%)',
          }}
        />
      </div>

      {/* Edit button anchored at top-left */}
      {onEditBanner && (
        <div className="absolute top-3.5 left-4 sm:top-4 sm:left-6 z-20 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/banner:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={onEditBanner}
            aria-label="Editar banner"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface-elevated)]/90 hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] backdrop-blur-xs shadow-xs hover:border-[var(--brand-primary)] transition-all cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editar banner</span>
          </button>
        </div>
      )}

      {/* Badge Carousel ancorado no canto inferior direito do banner */}
      <div className="absolute right-4 sm:right-6 bottom-[14px] z-10">
        <BadgeCarousel
          items={featuredBadges}
          mode={mode}
          onModeChange={onModeChange}
          onReorder={onReorder}
          showModeToggle={showModeToggle}
        />
      </div>

      {/* 3px accent strip at the bottom edge */}
      <div
        className="h-[3px] w-full absolute bottom-0 inset-x-0 z-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))',
        }}
      />
    </div>
  );
};
