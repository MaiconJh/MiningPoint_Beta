import React, { useState, useMemo } from 'react';
import { EffectStack, EffectId } from '../../lib/effects/types';
import { EFFECT_REGISTRY } from '../../lib/effects/registry';
import { resolveEffectStack } from '../../lib/effects/resolve';
import { EffectSurface } from '../effects/EffectSurface';

export interface EffectStackEditorProps {
  value: EffectStack | undefined;
  onChange: (next: EffectStack | undefined) => void;
  labelName?: string;
}

export const EffectStackEditor: React.FC<EffectStackEditorProps> = ({
  value,
  onChange,
  labelName = 'Raridade',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Identificadores de efeitos atualmente ativos
  const activeEffectIds = useMemo(() => {
    const ids = new Set<EffectId>();
    if (value?.effects) {
      for (const item of value.effects) {
        if (typeof item === 'string') {
          ids.add(item);
        } else if (item && item.enabled !== false) {
          ids.add(item.id);
        }
      }
    }
    return ids;
  }, [value?.effects]);

  // Resolução da stack para pré-visualização ao vivo
  const resolvedStack = useMemo(() => {
    return resolveEffectStack(value);
  }, [value]);

  const activeCount = activeEffectIds.size;
  const currentAccentColor = value?.accentColor || '';

  const handleToggleEffect = (targetId: EffectId) => {
    const nextSet = new Set(activeEffectIds);
    if (nextSet.has(targetId)) {
      nextSet.delete(targetId);
    } else {
      nextSet.add(targetId);
    }

    const nextEffects: EffectId[] = EFFECT_REGISTRY
      .filter((desc) => nextSet.has(desc.id))
      .map((desc) => desc.id);

    if (nextEffects.length === 0 && !value?.accentColor) {
      onChange(undefined);
      return;
    }

    onChange({
      ...(value?.accentColor ? { accentColor: value.accentColor } : {}),
      ...(nextEffects.length > 0 ? { effects: nextEffects } : {}),
    });
  };

  const handleAccentColorChange = (newColor: string) => {
    const nextAccent = newColor.trim() || undefined;

    const nextEffects: EffectId[] = EFFECT_REGISTRY
      .filter((desc) => activeEffectIds.has(desc.id))
      .map((desc) => desc.id);

    if (!nextAccent && nextEffects.length === 0) {
      onChange(undefined);
      return;
    }

    onChange({
      ...(nextAccent ? { accentColor: nextAccent } : {}),
      ...(nextEffects.length > 0 ? { effects: nextEffects } : {}),
    });
  };

  return (
    <div className="border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-elevated)] overflow-hidden transition-colors">
      {/* Botão de cabeçalho colapsável */}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Efeitos visuais
          </span>
          <EffectSurface
            stack={resolvedStack}
            surface="tooltip"
            className="px-2.5 py-1 rounded text-xs font-mono font-bold"
            /* eslint-disable-next-line design-tokens/no-raw-color-literals */
            style={{
              backgroundColor: 'rgba(16, 19, 24, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
            }}
          >
            <span className="text-[var(--brand-primary)] uppercase">
              {labelName}
            </span>
          </EffectSurface>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {activeCount === 0
              ? 'Nenhum efeito ativo'
              : `${activeCount} ${activeCount === 1 ? 'efeito' : 'efeitos'}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <span>{isExpanded ? 'Ocultar opções' : 'Personalizar'}</span>
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

      {/* Corpo do editor expandido */}
      {isExpanded && (
        <div className="p-5 border-t border-[var(--border-subtle)] space-y-6 bg-[var(--bg-surface)]">
          {/* 1. Live Preview grande */}
          <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Visualização em tempo real (Tooltip)
            </span>
            <div className="py-2">
              <EffectSurface
                stack={resolvedStack}
                surface="tooltip"
                className="w-max max-w-[240px] p-3 rounded-lg z-30"
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
                  {labelName}
                </p>
                {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
                <p className="text-xs text-[#f4f7fa] m-0 mt-1 leading-snug">
                  Pré-visualização da assinatura visual desta raridade.
                </p>
                {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
                <p className="text-[11px] text-[rgba(244,247,250,0.82)] font-mono mt-1.5 m-0 border-t border-[rgba(255,255,255,0.15)] pt-1">
                  Efeitos visuais aplicados
                </p>
              </EffectSurface>
            </div>
          </div>

          {/* 2. Seleção dos 8 efeitos */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold">
              Efeitos disponíveis ({activeCount}/8 ativos)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EFFECT_REGISTRY.map((descriptor) => {
                const isSelected = activeEffectIds.has(descriptor.id);
                return (
                  <button
                    key={descriptor.id}
                    type="button"
                    onClick={() => handleToggleEffect(descriptor.id)}
                    className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={isSelected}
                      className="mt-0.5 rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          {descriptor.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]">
                          {descriptor.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-muted)]">
                        <span>Custo: {descriptor.cost}</span>
                        <span>•</span>
                        <span>{descriptor.animated ? 'Animado' : 'Estático'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Cor de destaque (accentColor) */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <label
              htmlFor="effect-accent-color"
              className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold"
            >
              Cor de destaque dos efeitos (Opcional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={currentAccentColor || '#8BD0EF'}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                className="w-10 h-10 p-0.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
              />
              <input
                id="effect-accent-color"
                type="text"
                maxLength={7}
                value={currentAccentColor}
                onChange={(e) => handleAccentColorChange(e.target.value)}
                placeholder="Padrão (--brand-primary)"
                className="w-48 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--brand-primary)]"
              />
              {currentAccentColor && (
                <button
                  type="button"
                  onClick={() => handleAccentColorChange('')}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Limpar cor
                </button>
              )}
            </div>
            <span className="text-xs text-[var(--text-muted)] block">
              Alimenta efeitos como neon, holofote e partículas com a cor de assinatura.
            </span>
          </div>

          {/* 4. Rodapé / Restaurar padrão */}
          <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
