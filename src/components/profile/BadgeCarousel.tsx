import React, { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  Announcements,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FeaturedBadgeItem } from '../../types/profile';
import { Rarity } from '../../types/rarity';
import { FeaturedBadgesMode, sortFeaturedBadges } from '../../lib/featuredBadges';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import { useRarities } from '../../hooks/useRarities';
import { EffectSurface } from '../effects/EffectSurface';
import { resolveEffectStack } from '../../lib/effects/resolve';
import { EffectStack, ResolvedEffectStack } from '../../lib/effects/types';

export interface BadgeCarouselProps {
  items: FeaturedBadgeItem[];
  mode?: FeaturedBadgesMode;
  onModeChange?: (nextMode: FeaturedBadgesMode) => void;
  onReorder?: (newOrderIds: string[]) => void;
  showModeToggle?: boolean;
  effectStack?: EffectStack | ResolvedEffectStack;
}

const ptBrCarouselAnnouncements: Announcements = {
  onDragStart({ active }) {
    return 'Insígnia selecionada para reordenação. Use as setas do teclado para mover.';
  },
  onDragOver({ over }) {
    if (over) {
      return 'Insígnia movida sobre uma nova posição.';
    }
    return 'Insígnia em movimento.';
  },
  onDragEnd({ over }) {
    if (over) {
      return 'Nova ordem de insígnias aplicada.';
    }
    return 'Reordenação cancelada.';
  },
  onDragCancel() {
    return 'Reordenação cancelada.';
  },
};

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

interface SortableCarouselItemProps {
  item: FeaturedBadgeItem;
  isDraggable: boolean;
  activeTooltipId: string | null;
  setActiveTooltipId: (id: string | null) => void;
  customIcons: Record<string, string>;
  rarityTheme?: EffectStack;
  effectStack?: EffectStack | ResolvedEffectStack;
}

const SortableCarouselItem: React.FC<SortableCarouselItemProps> = ({
  item,
  isDraggable,
  activeTooltipId,
  setActiveTooltipId,
  customIcons,
  rarityTheme,
  effectStack,
}) => {
  const { badge, userBadge } = item;
  const isHovered = activeTooltipId === badge.id;
  const awardedDate = formatAwardedAt(userBadge.awardedAt);
  const IconComponent = resolveIcon(badge.icon, customIcons);

  const resolvedEffectStack = useMemo(() => {
    // Sem tema de raridade: usa apenas o prop (se houver).
    if (!rarityTheme) {
      if (!effectStack) return undefined;
      if ('classNames' in effectStack) return effectStack as ResolvedEffectStack;
      return resolveEffectStack(effectStack);
    }
    // Com tema de raridade: ele é a base. O prop, se for EffectStack puro (sem classNames), vira override.
    if (effectStack && !('classNames' in effectStack)) {
      return resolveEffectStack(rarityTheme, effectStack);
    }
    return resolveEffectStack(rarityTheme);
  }, [rarityTheme, effectStack]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: badge.id,
    disabled: !isDraggable,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center justify-center"
      onMouseEnter={() => !isDragging && setActiveTooltipId(badge.id)}
      onMouseLeave={() => setActiveTooltipId(null)}
    >
      <button
        type="button"
        {...(isDraggable ? attributes : {})}
        {...(isDraggable ? listeners : {})}
        onFocus={() => setActiveTooltipId(badge.id)}
        onBlur={() => setActiveTooltipId(null)}
        aria-label={
          isDraggable
            ? `${badge.name}. Arraste para reordenar ou use as setas do teclado.`
            : badge.name
        }
        /* Ícone com contraste deliberado sobre o banner escuro */
        /* eslint-disable-next-line design-tokens/no-raw-color-literals */
        className={`w-10 h-10 max-sm:w-9 max-sm:h-9 rounded-full flex items-center justify-center text-[#eaf4fa] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] ${
          isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: isHovered ? 'rgba(16, 19, 24, 0.75)' : 'rgba(16, 19, 24, 0.5)',
          border: isHovered ? '1px solid var(--brand-primary)' : '1px solid rgba(255, 255, 255, 0.3)',
          transform: isHovered && !isDragging ? 'translateY(-2px)' : 'none',
        }}
      >
        {IconComponent && (
          <IconComponent className="w-[19px] h-[19px] max-sm:w-[17px] max-sm:h-[17px]" />
        )}
      </button>

      {/* Tooltip Card */}
      {isHovered && !isDragging && (
        <EffectSurface
          role="tooltip"
          surface="tooltip"
          stack={resolvedEffectStack}
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
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--fx-text,var(--brand-primary))] font-bold m-0 truncate">
            {badge.name}
          </p>
          {badge.description && (
            /* eslint-disable-next-line design-tokens/no-raw-color-literals */
            <p className="text-xs text-[#f4f7fa] m-0 mt-1 leading-snug">
              {badge.description}
            </p>
          )}
          {awardedDate && (
            /* eslint-disable-next-line design-tokens/no-raw-color-literals */
            <p className="text-[11px] text-[rgba(244,247,250,0.82)] font-mono mt-1.5 m-0 border-t border-[rgba(255,255,255,0.15)] pt-1">
              Concedida em {awardedDate}
            </p>
          )}
        </EffectSurface>
      )}
    </div>
  );
};

export const BadgeCarousel: React.FC<BadgeCarouselProps> = ({
  items,
  mode: modeProp,
  onModeChange,
  onReorder,
  showModeToggle = true,
  effectStack,
}) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [internalMode, setInternalMode] = useState<FeaturedBadgesMode>(
    modeProp ?? 'manual'
  );
  const { customIcons } = useCustomIcons();
  const { rarities } = useRarities();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = displayItems.findIndex((i) => i.badge.id === active.id);
    const newIndex = displayItems.findIndex((i) => i.badge.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Se estava em modo auto, alternar automaticamente para manual
      if (currentMode === 'auto') {
        handleSelectMode('manual');
      }
      const reordered = arrayMove(displayItems, oldIndex, newIndex);
      onReorder(reordered.map((item) => item.badge.id));
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  const isReorderActive = Boolean(onReorder);

  const carouselBody = (
    <div className="flex items-center gap-2">
      {/* Toggle Manual / Auto */}
      {showModeToggle && (
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
      )}

      {displayItems.map((item) => {
        const rarity = item.badge.rarityId
          ? raritiesMap.get(item.badge.rarityId)
          : undefined;
        return (
          <SortableCarouselItem
            key={item.badge.id}
            item={item}
            isDraggable={isReorderActive}
            activeTooltipId={activeTooltipId}
            setActiveTooltipId={setActiveTooltipId}
            customIcons={customIcons}
            rarityTheme={rarity?.theme}
            effectStack={effectStack}
          />
        );
      })}
    </div>
  );

  if (!isReorderActive) {
    return carouselBody;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: ptBrCarouselAnnouncements }}
    >
      <SortableContext
        items={displayItems.map((i) => i.badge.id)}
        strategy={horizontalListSortingStrategy}
      >
        {carouselBody}
      </SortableContext>
    </DndContext>
  );
};

