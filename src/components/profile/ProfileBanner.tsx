import React from 'react';
import { FeaturedBadgeItem } from '../../types/profile';
import { FeaturedBadgesMode } from '../../lib/featuredBadges';
import { BadgeCarousel } from './BadgeCarousel';

export interface ProfileBannerProps {
  featuredBadges: FeaturedBadgeItem[];
  mode?: FeaturedBadgesMode;
  onModeChange?: (nextMode: FeaturedBadgesMode) => void;
  onReorder?: (newOrderIds: string[]) => void;
  showModeToggle?: boolean;
}

export const ProfileBanner: React.FC<ProfileBannerProps> = ({
  featuredBadges,
  mode,
  onModeChange,
  onReorder,
  showModeToggle,
}) => {
  return (
    <div className="relative w-full h-[200px] overflow-hidden">
      {/* Texture & Gradients layer */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        /* Textura gráfica deliberadamente escura em ambos os temas para contraste das insígnias */
        /* eslint-disable-next-line design-tokens/no-raw-color-literals */
        style={{
          backgroundColor: '#333B46',
          backgroundImage: `
            radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--brand-primary) 20%, transparent) 0%, transparent 64%),
            radial-gradient(circle at 18% 32%, rgba(255, 255, 255, 0.30) 0 2px, transparent 3px),
            radial-gradient(circle at 46% 68%, rgba(255, 255, 255, 0.26) 0 2px, transparent 3px),
            radial-gradient(circle at 72% 26%, rgba(255, 255, 255, 0.28) 0 2px, transparent 3px),
            radial-gradient(circle at 88% 74%, rgba(255, 255, 255, 0.22) 0 2px, transparent 3px),
            repeating-radial-gradient(circle at 118% -28%, rgba(255, 255, 255, 0.16) 0 1px, transparent 1px 26px),
            repeating-radial-gradient(circle at -18% 128%, rgba(255, 255, 255, 0.11) 0 1px, transparent 1px 34px),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0 1px, transparent 1px 44px),
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 32px),
            linear-gradient(115deg, #333B46, #4A5563, #39424F)
          `,
        }}
      >
        {/* Shading overlay for readability */}
        <div
          className="absolute inset-0"
          /* Sombreado fixo independente de tema para legibilidade */
          /* eslint-disable-next-line design-tokens/no-raw-color-literals */
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, transparent 42%, rgba(0, 0, 0, 0.35) 100%)',
          }}
        />
      </div>

      {/* Badge Carousel anchored to bottom-right (16px from right, 14px from bottom) */}
      <div className="absolute right-[16px] bottom-[14px] z-10">
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
