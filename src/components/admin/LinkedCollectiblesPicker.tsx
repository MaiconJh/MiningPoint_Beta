import React, { useState, useEffect, useMemo } from 'react';
import { listBadges } from '../../lib/badges';
import { listTitles } from '../../lib/titles';
import { Badge } from '../../types/profile';
import { Title } from '../../types/title';
import { Chip } from '../chip/Chip';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';

export interface LinkedCollectiblesPickerProps {
  title: string;
  targetKind: 'badge' | 'title';
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

type CollectibleOption = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  chipStyle?: Title['chipStyle'];
};

export const LinkedCollectiblesPicker: React.FC<LinkedCollectiblesPickerProps> = ({
  title,
  targetKind,
  selectedIds,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CollectibleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { customIcons } = useCustomIcons();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(null);

    const loadData = async () => {
      try {
        if (targetKind === 'badge') {
          const badgeList = await listBadges();
          if (!isMounted) return;
          setItems(
            badgeList.map((b: Badge) => ({
              id: b.id,
              name: b.name,
              description: b.description,
              icon: b.icon,
            }))
          );
        } else {
          const titleList = await listTitles();
          if (!isMounted) return;
          setItems(
            titleList.map((t: Title) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              color: t.color,
              chipStyle: t.chipStyle,
            }))
          );
        }
      } catch (err) {
        console.error(`Erro ao carregar itens para o seletor de ${targetKind}:`, err);
        if (isMounted) {
          setLoadError('Não foi possível carregar as opções disponíveis.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [targetKind]);

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [items, search]);

  const selectedCount = selectedIds.length;

  return (
    <div className="border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-elevated)] overflow-hidden transition-colors">
      {/* Cabeçalho colapsável */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {title}
          </span>
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)]">
              {selectedCount} {selectedCount === 1 ? 'selecionado' : 'selecionados'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <span>{isExpanded ? 'Ocultar opções' : 'Configurar'}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="p-5 border-t border-[var(--border-subtle)] space-y-4 bg-[var(--bg-surface)]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Campo de busca */}
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar ${targetKind === 'badge' ? 'insígnia' : 'título'} por nome...`}
                className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-[var(--feedback-error)] hover:underline whitespace-nowrap self-end sm:self-center cursor-pointer"
              >
                Limpar seleção ({selectedCount})
              </button>
            )}
          </div>

          {loadError && (
            <p className="text-xs text-[var(--feedback-error)]">{loadError}</p>
          )}

          {loading ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
              Carregando opções...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)]">
              {search.trim()
                ? `Nenhum item encontrado para «${search}».`
                : `Nenhum ${targetKind === 'badge' ? 'insígnia' : 'título'} cadastrado ainda.`}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const ResolvedIconComponent =
                  targetKind === 'badge' && item.icon
                    ? resolveIcon(item.icon, customIcons)
                    : null;

                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--bg-surface))]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-default)] hover:border-[var(--border-default)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-0 cursor-pointer accent-[var(--brand-primary)]"
                    />

                    {targetKind === 'badge' ? (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--brand-primary)]">
                          {ResolvedIconComponent ? (
                            <ResolvedIconComponent className="w-4 h-4" />
                          ) : (
                            <span className="text-xs">★</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs text-[var(--text-secondary)] truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="shrink-0">
                          <Chip
                            label={item.name}
                            color={item.color || '#8BD0EF'}
                            style={item.chipStyle}
                          />
                        </div>
                        {item.description && (
                          <p className="text-xs text-[var(--text-secondary)] truncate min-w-0 flex-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
