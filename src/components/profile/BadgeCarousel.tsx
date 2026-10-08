import React, { useState, useMemo, useEffect } from 'react';
import { FeaturedBadgeItem } from '../../types/profile';
import { Rarity } from '../../types/rarity';
import { FeaturedBadgesMode, sortFeaturedBadges } from '../../lib/featuredBadges';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import { useRarities } from '../../hooks/useRarities';

export interface BadgeCarouselProps {
  items: FeaturedBadgeItem[];
  mode?: FeaturedBadgesMode;
  onModeChange?: (nextMode: FeaturedBadgesMode) => void;
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

export const BadgeCarousel: React.FC<BadgeCarouselProps> = ({
  items,
  mode: modeProp,
  onModeChange,
}) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [internalMode, setInternalMode] = useState<FeaturedBadgesMode>(
    modeProp ?? 'manual'
  );
  const { customIcons } = useCustomIcons();
  const { rarities } = useRarities();

  useEffect(() => {
    if (modeProp !== undefined) {
      setInternalMode(modeProp);
    }
  }, [modeProp]);

  const currentMode = modeProp !== undefined ? modeProp : internalMode;

  const raritiesMap = useMemo(() => {
    const map = new Map<string, Rarity>();
    rarities.forEach((r) => map.set(r.id, r));
    return map;
  }, [rarities]);

  const displayItems = useMemo(() => {
    return sortFeaturedBadges(items, currentMode, raritiesMap);
  }, [items, currentMode, raritiesMap]);

  const handleSelectMode = (nextMode: FeaturedBadgesMode) => {
    setInternalMode(nextMode);
    onModeChange?.(nextMode);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Toggle Manual / Auto */}
      <div
        role="group"
        aria-label="Modo de exibição das insígnias"
        className="flex items-center rounded-full p-0.5 border backdrop-blur-xs"
        /* Contraste deliberado sobre o banner escuro */
        /* eslint-disable-next-line design-tokens/no-raw-color-literals */
        style={{
          backgroundColor: 'rgba(16, 19, 24, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.22)',
        }}
      >
        <button
          type="button"
          onClick={() => handleSelectMode('manual')}
          aria-pressed={currentMode === 'manual'}
          title="Modo Manual: ordem de seleção"
          className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-full transition-all cursor-pointer ${
            currentMode === 'manual'
              ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold shadow-xs'
              : 'text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          Manual
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode('auto')}
          aria-pressed={currentMode === 'auto'}
          title="Modo Automático: ordenado por raridade, ordem e nome"
          className={`px-2 py-0.5 text-[10px] sm:text-[11px] font-medium rounded-full transition-all cursor-pointer ${
            currentMode === 'auto'
              ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold shadow-xs'
              : 'text-[rgba(255,255,255,0.7)] hover:text-[rgba(255,255,255,0.95)]'
          }`}
        >
          Auto
        </button>
      </div>

      {displayItems.map(({ badge, userBadge }) => {
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
              /* Ícone com contraste deliberado sobre o banner escuro */
              /* eslint-disable-next-line design-tokens/no-raw-color-literals */
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
                /* Tooltip translúcido estilizado com fundo escuro fixo para contraste com o banner */
                /* eslint-disable-next-line design-tokens/no-raw-color-literals */
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
                  /* Texto de alta legibilidade no tooltip escuro */
                  /* eslint-disable-next-line design-tokens/no-raw-color-literals */
                  <p className="text-xs text-[#f4f7fa] m-0 mt-1 leading-snug">
                    {badge.description}
                  </p>
                )}
                {awardedDate && (
                  /* Cores de apoio e separador com transparência fixa no tooltip escuro */
                  /* eslint-disable-next-line design-tokens/no-raw-color-literals */
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
