import React, { useState } from 'react';
import { FeaturedBadgeItem } from '../../types/profile';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';

interface BadgeCarouselProps {
  items: FeaturedBadgeItem[];
}

const formatAwardedAt = (awardedAt?: unknown): string => {
  if (!awardedAt) return '';
  let date: Date | null = null;
  if (typeof (awardedAt as { toDate?: () => Date }).toDate === 'function') {
    date = (awardedAt as { toDate: () => Date }).toDate();
  } else if (awardedAt instanceof Date) {
    date = awardedAt;
  } else if (typeof awardedAt === 'string' || typeof awardedAt === 'number') {
    date = new Date(awardedAt);
  }
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const BadgeCarousel: React.FC<BadgeCarouselProps> = ({ items }) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const { customIcons } = useCustomIcons();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {items.map(({ badge, userBadge }) => {
        const isHovered = activeTooltipId === badge.id;
        const awardedDate = formatAwardedAt(userBadge.awardedAt);
        const IconComponent = resolveIcon(badge.icon, customIcons);

        return (
          <div
            key={badge.id}
            className="relative flex items-center justify-center"
            onMouseEnter={() => setActiveTooltipId(badge.id)}
            onMouseLeave={() => setActiveTooltipId(null)}
          >
            <button
              type="button"
              onFocus={() => setActiveTooltipId(badge.id)}
              onBlur={() => setActiveTooltipId(null)}
              aria-label={badge.name}
              className="w-10 h-10 max-sm:w-9 max-sm:h-9 rounded-full flex items-center justify-center text-[#eaf4fa] transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              style={{
                backgroundColor: isHovered ? 'rgba(16, 19, 24, 0.75)' : 'rgba(16, 19, 24, 0.5)',
                border: isHovered ? '1px solid var(--brand-primary)' : '1px solid rgba(255, 255, 255, 0.3)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
              }}
            >
              {IconComponent && (
                <IconComponent className="w-[19px] h-[19px] max-sm:w-[17px] max-sm:h-[17px]" />
              )}
            </button>

            {/* Tooltip Card (max-width 220px, dark translucent, thin light border, blur) */}
            {isHovered && (
              <div
                role="tooltip"
                className="absolute bottom-[calc(100%+8px)] right-0 w-max max-w-[220px] p-3 rounded-lg z-30 pointer-events-none"
                style={{
                  backgroundColor: 'rgba(16, 19, 24, 0.85)',
                  backdropFilter: 'blur(11px)',
                  WebkitBackdropFilter: 'blur(11px)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: '0 16px 38px rgba(0, 0, 0, 0.45)',
                }}
              >
                <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-primary)] font-bold m-0 truncate">
                  {badge.name}
                </p>
                {badge.description && (
                  <p className="text-xs text-[#f4f7fa] m-0 mt-1 leading-snug">
                    {badge.description}
                  </p>
                )}
                {awardedDate && (
                  <p className="text-[11px] text-[rgba(244,247,250,0.82)] font-mono mt-1.5 m-0 border-t border-[rgba(255,255,255,0.15)] pt-1">
                    Concedida em {awardedDate}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
