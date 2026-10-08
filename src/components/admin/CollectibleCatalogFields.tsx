import React, { useState } from 'react';
import { useRarities } from '../../hooks/useRarities';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';
import { useOrigins } from '../../hooks/useOrigins';
import { useCollections } from '../../hooks/useCollections';

export interface CollectibleCatalogFieldsValue {
  rarityId: string | null;
  categoryId: string | null;
  originId: string | null;
  collectionId: string | null;
  order: number;
}

interface CollectibleCatalogFieldsProps {
  value: CollectibleCatalogFieldsValue;
  onChange: (next: CollectibleCatalogFieldsValue) => void;
}

export const CollectibleCatalogFields: React.FC<CollectibleCatalogFieldsProps> = ({
  value,
  onChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { rarities } = useRarities();
  const { categories } = useCatalogCategories();
  const { origins } = useOrigins();
  const { collections } = useCollections();

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    const parsed = isNaN(raw) ? 0 : Math.max(0, Math.min(999, raw));
    onChange({
      ...value,
      order: parsed,
    });
  };

  return (
    <div className="border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-elevated)] overflow-hidden transition-colors">
      {/* Header / Botão colapsável */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          Catálogo
        </span>

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

      {/* Conteúdo colapsável */}
      {isExpanded && (
        <div className="p-5 border-t border-[var(--border-subtle)] space-y-4 bg-[var(--bg-surface)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Raridade */}
            <div className="space-y-1.5">
              <label
                htmlFor="catalog-rarity"
                className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
              >
                Raridade
              </label>
              <select
                id="catalog-rarity"
                value={value.rarityId ?? ''}
                onChange={(e) =>
                  onChange({ ...value, rarityId: e.target.value || null })
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="">— Nenhum —</option>
                {rarities.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label
                htmlFor="catalog-category"
                className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
              >
                Categoria
              </label>
              <select
                id="catalog-category"
                value={value.categoryId ?? ''}
                onChange={(e) =>
                  onChange({ ...value, categoryId: e.target.value || null })
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="">— Nenhum —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Origem */}
            <div className="space-y-1.5">
              <label
                htmlFor="catalog-origin"
                className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
              >
                Origem
              </label>
              <select
                id="catalog-origin"
                value={value.originId ?? ''}
                onChange={(e) =>
                  onChange({ ...value, originId: e.target.value || null })
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="">— Nenhum —</option>
                {origins.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Coleção */}
            <div className="space-y-1.5">
              <label
                htmlFor="catalog-collection"
                className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
              >
                Coleção
              </label>
              <select
                id="catalog-collection"
                value={value.collectionId ?? ''}
                onChange={(e) =>
                  onChange({ ...value, collectionId: e.target.value || null })
                }
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="">— Nenhum —</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ordem */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
            <label
              htmlFor="catalog-order"
              className="block text-xs font-semibold uppercase tracking-[0.05em] text-[var(--text-secondary)]"
            >
              Ordem (0–999)
            </label>
            <input
              id="catalog-order"
              type="number"
              min={0}
              max={999}
              value={value.order}
              onChange={handleOrderChange}
              className="w-full sm:w-36 font-mono px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
            />
            <p className="text-xs text-[var(--text-muted)] m-0">
              Controla a prioridade na ordenação interna do catálogo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
