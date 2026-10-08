import React from 'react';
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
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import { FeaturedBadgeItem } from '../../types/profile';

export interface SortableBadgeStripProps {
  items: FeaturedBadgeItem[];
  onReorder: (newOrderIds: string[]) => void;
  onRemove?: (badgeId: string) => void;
}

interface SortableBadgeItemProps {
  item: FeaturedBadgeItem;
  index: number;
  total: number;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onRemove?: () => void;
}

const ptBrAnnouncements: Announcements = {
  onDragStart({ active }) {
    return `Segurando insígnia. Use as setas para mover ou barra de espaço para soltar.`;
  },
  onDragOver({ active, over }) {
    if (over) {
      return `Insígnia movida sobre a posição.`;
    }
    return `Insígnia em movimento.`;
  },
  onDragEnd({ active, over }) {
    if (over) {
      return `Insígnia solta na nova posição.`;
    }
    return `Movimento cancelado.`;
  },
  onDragCancel() {
    return `Movimento de arrasto cancelado.`;
  },
};

const SortableBadgeItem: React.FC<SortableBadgeItemProps> = ({
  item,
  index,
  total,
  onMoveLeft,
  onMoveRight,
  onRemove,
}) => {
  const { badge } = item;
  const { customIcons } = useCustomIcons();
  const IconComponent = resolveIcon(badge.icon, customIcons);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: badge.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 p-1.5 rounded-lg border bg-[var(--bg-surface-elevated)] transition-shadow ${
        isDragging
          ? 'border-[var(--brand-primary)] shadow-md ring-2 ring-[var(--brand-primary)]'
          : 'border-[var(--border-default)] hover:border-[var(--border-strong)]'
      }`}
    >
      {/* Alça de arrasto e foco por teclado */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${badge.name}. Posição ${index + 1} de ${total}. Pressione espaço para mover com as setas.`}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
      >
        {IconComponent ? (
          <IconComponent className="w-5 h-5" />
        ) : (
          <span className="text-xs font-bold">{badge.name.charAt(0)}</span>
        )}
      </button>

      {/* Rótulo e controles manuais acessíveis */}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[100px]" title={badge.name}>
          {badge.name}
        </span>
        <div className="flex items-center gap-0.5 mt-0.5">
          {onMoveLeft && (
            <button
              type="button"
              onClick={onMoveLeft}
              disabled={index === 0}
              aria-label={`Mover ${badge.name} para a esquerda`}
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          {onMoveRight && (
            <button
              type="button"
              onClick={onMoveRight}
              disabled={index === total - 1}
              aria-label={`Mover ${badge.name} para a direita`}
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remover ${badge.name} dos destaques`}
              className="p-0.5 text-[var(--text-muted)] hover:text-[var(--feedback-danger)] cursor-pointer ml-1"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const SortableBadgeStrip: React.FC<SortableBadgeStripProps> = ({
  items,
  onReorder,
  onRemove,
}) => {
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

  if (items.length === 0) {
    return null;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.badge.id === active.id);
    const newIndex = items.findIndex((i) => i.badge.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorder(reordered.map((item) => item.badge.id));
    }
  };

  const handleMove = (currentIndex: number, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const reordered = arrayMove(items, currentIndex, targetIndex);
    onReorder(reordered.map((item) => item.badge.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements: ptBrAnnouncements }}
    >
      <SortableContext
        items={items.map((i) => i.badge.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          role="region"
          aria-label="Reordenação de insígnias destacadas"
          className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[var(--bg-default)] border border-[var(--border-subtle)]"
        >
          {items.map((item, index) => (
            <SortableBadgeItem
              key={item.badge.id}
              item={item}
              index={index}
              total={items.length}
              onMoveLeft={() => handleMove(index, index - 1)}
              onMoveRight={() => handleMove(index, index + 1)}
              onRemove={onRemove ? () => onRemove(item.badge.id) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
