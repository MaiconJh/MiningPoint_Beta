import React, { useState } from 'react';
import { ChipStyle } from '../../types/chip';
import { Chip } from '../chip/Chip';

interface ChipStyleEditorProps {
  value: ChipStyle | undefined;
  fallbackColor: string;
  onChange: (next: ChipStyle | undefined) => void;
  labelName?: string;
}

export const ChipStyleEditor: React.FC<ChipStyleEditorProps> = ({
  value,
  fallbackColor,
  onChange,
  labelName = 'Exemplo',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to patch nested properties cleanly
  const patchStyle = (updater: (prev: ChipStyle) => ChipStyle) => {
    const current = value || {};
    const next = updater(current);
    onChange(next);
  };

  const currentShape = value?.shape || 'pill';
  const bgType = value?.background?.type || 'solid';
  const bgColor = value?.background?.color || fallbackColor;
  const bgOpacity = value?.background?.opacity ?? 100;
  const gradFrom = value?.background?.gradientFrom || fallbackColor;
  const gradTo = value?.background?.gradientTo || fallbackColor;
  const gradAngle = value?.background?.gradientAngle ?? 135;

  const borderWidth = value?.border?.width ?? 1;
  const borderColor = value?.border?.color || fallbackColor;
  const borderStyle = value?.border?.style || 'solid';

  const textColor = value?.text?.color || fallbackColor;
  const textWeight = value?.text?.weight || 700;
  const textSize = value?.text?.size || 11;
  const textUppercase = value?.text?.uppercase ?? true;
  const fontFamily = value?.text?.fontFamily || 'sans';
  const textItalic = value?.text?.italic ?? false;
  const letterSpacing = value?.text?.letterSpacing || 'normal';

  const shadow = value?.effects?.shadow ?? false;

  const glowEnabled = value?.effects?.glow?.enabled ?? false;
  const glowColor = value?.effects?.glow?.color || fallbackColor;
  const glowIntensity = value?.effects?.glow?.intensity ?? 50;

  const shimmerEnabled = value?.effects?.shimmer?.enabled ?? false;
  const shimmerSpeed = value?.effects?.shimmer?.speed ?? 3;

  const pulseEnabled = value?.effects?.pulse?.enabled ?? false;
  const pulseSpeed = value?.effects?.pulse?.speed ?? 2;

  return (
    <div className="border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface-elevated)] overflow-hidden transition-colors">
      {/* Header / Toggle button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Aparência do chip
          </span>
          <Chip label={labelName || 'Exemplo'} color={fallbackColor} style={value} />
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

      {/* Editor Body */}
      {isExpanded && (
        <div className="p-5 border-t border-[var(--border-subtle)] space-y-6 bg-[var(--bg-surface)]">
          {/* Live Preview Large */}
          <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col items-center justify-center gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Visualização em tempo real
            </span>
            <div className="py-2">
              <Chip label={labelName || 'Exemplo'} color={fallbackColor} style={value} />
            </div>
          </div>

          {/* 1. Forma */}
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold">
              Forma
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  ['pill', 'Pill'],
                  ['rounded', 'Arredondado'],
                  ['diamond', 'Losango'],
                  ['text', 'Texto'],
                ] as const
              ).map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => patchStyle((prev) => ({ ...prev, shape: s }))}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    currentShape === s
                      ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Fundo */}
          {currentShape !== 'text' && (
            <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
              <label className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold">
                Fundo
              </label>

              <div className="flex items-center gap-2">
                {(
                  [
                    ['solid', 'Sólido'],
                    ['gradient', 'Gradiente'],
                    ['transparent', 'Transparente'],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() =>
                      patchStyle((prev) => ({
                        ...prev,
                        background: { ...prev.background, type },
                      }))
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      bgType === type
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {bgType === 'solid' && (
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)]">Cor:</span>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) =>
                        patchStyle((prev) => ({
                          ...prev,
                          background: { ...prev.background, color: e.target.value },
                        }))
                      }
                      className="w-8 h-8 p-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      Opacidade ({bgOpacity}%):
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgOpacity}
                      onChange={(e) =>
                        patchStyle((prev) => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            opacity: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      className="w-full accent-[var(--brand-primary)] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {bgType === 'gradient' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">De:</span>
                      <input
                        type="color"
                        value={gradFrom}
                        onChange={(e) =>
                          patchStyle((prev) => ({
                            ...prev,
                            background: { ...prev.background, gradientFrom: e.target.value },
                          }))
                        }
                        className="w-8 h-8 p-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">Para:</span>
                      <input
                        type="color"
                        value={gradTo}
                        onChange={(e) =>
                          patchStyle((prev) => ({
                            ...prev,
                            background: { ...prev.background, gradientTo: e.target.value },
                          }))
                        }
                        className="w-8 h-8 p-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      Ângulo ({gradAngle}°):
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradAngle}
                      onChange={(e) =>
                        patchStyle((prev) => ({
                          ...prev,
                          background: {
                            ...prev.background,
                            gradientAngle: parseInt(e.target.value, 10),
                          },
                        }))
                      }
                      className="w-full accent-[var(--brand-primary)] cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Borda */}
          {currentShape !== 'text' && (
            <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
              <label className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold">
                Borda
              </label>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">Largura (px):</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={borderWidth}
                    onChange={(e) =>
                      patchStyle((prev) => ({
                        ...prev,
                        border: {
                          ...prev.border,
                          width: parseInt(e.target.value, 10) || 0,
                        },
                      }))
                    }
                    className="w-16 px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs font-mono"
                  />
                </div>

                {borderWidth > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">Cor:</span>
                      <input
                        type="color"
                        value={borderColor}
                        onChange={(e) =>
                          patchStyle((prev) => ({
                            ...prev,
                            border: { ...prev.border, color: e.target.value },
                          }))
                        }
                        className="w-8 h-8 p-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      {(
                        [
                          ['solid', 'Sólida'],
                          ['dashed', 'Tracejada'],
                          ['dotted', 'Pontilhada'],
                        ] as const
                      ).map(([st, label]) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            patchStyle((prev) => ({
                              ...prev,
                              border: { ...prev.border, style: st },
                            }))
                          }
                          className={`py-1 px-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                            borderStyle === st
                              ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)]'
                              : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 4. Texto */}
          <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
            <label className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold">
              Texto e Tipografia
            </label>

            {/* Linha 1: Família da Fonte */}
            <div className="space-y-1.5">
              <span className="text-xs text-[var(--text-secondary)] font-medium">Família da Fonte:</span>
              <div className="flex items-center gap-2">
                {(
                  [
                    ['sans', 'Sans-Serif', 'font-sans'],
                    ['mono', 'Monospace', 'font-mono'],
                    ['serif', 'Serif', 'font-serif'],
                  ] as const
                ).map(([ff, label, cls]) => (
                  <button
                    key={ff}
                    type="button"
                    onClick={() =>
                      patchStyle((prev) => ({
                        ...prev,
                        text: { ...prev.text, fontFamily: ff },
                      }))
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${cls} ${
                      fontFamily === ff
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)] font-bold'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Linha 2: Cor, Tamanho, Peso */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">Cor:</span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) =>
                    patchStyle((prev) => ({
                      ...prev,
                      text: { ...prev.text, color: e.target.value },
                    }))
                  }
                  className="w-8 h-8 p-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-secondary)]">Tamanho (px):</span>
                <input
                  type="number"
                  min="10"
                  max="16"
                  value={textSize}
                  onChange={(e) =>
                    patchStyle((prev) => ({
                      ...prev,
                      text: {
                        ...prev.text,
                        size: parseInt(e.target.value, 10) || 11,
                      },
                    }))
                  }
                  className="w-16 px-2.5 py-1 rounded border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-secondary)] mr-1">Peso:</span>
                {([400, 500, 600, 700] as const).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() =>
                      patchStyle((prev) => ({
                        ...prev,
                        text: { ...prev.text, weight: w },
                      }))
                    }
                    className={`py-1 px-2 rounded text-xs font-mono border transition-all cursor-pointer ${
                      textWeight === w
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Linha 3: Espaçamento de letras & Estilos (Maiúsculas, Itálico) */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--text-secondary)] mr-1">Espaçamento:</span>
                {(
                  [
                    ['normal', 'Padrão'],
                    ['wide', 'Largo'],
                    ['wider', 'Muito largo'],
                  ] as const
                ).map(([ls, label]) => (
                  <button
                    key={ls}
                    type="button"
                    onClick={() =>
                      patchStyle((prev) => ({
                        ...prev,
                        text: { ...prev.text, letterSpacing: ls },
                      }))
                    }
                    className={`py-1 px-2 rounded text-xs border transition-all cursor-pointer ${
                      letterSpacing === ls
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)] text-[var(--brand-primary)] font-semibold'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={textUppercase}
                    onChange={(e) =>
                      patchStyle((prev) => ({
                        ...prev,
                        text: { ...prev.text, uppercase: e.target.checked },
                      }))
                    }
                    className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                  />
                  <span>Maiúsculas</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={textItalic}
                    onChange={(e) =>
                      patchStyle((prev) => ({
                        ...prev,
                        text: { ...prev.text, italic: e.target.checked },
                      }))
                    }
                    className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                  />
                  <span className="italic">Itálico</span>
                </label>
              </div>
            </div>
          </div>

          {/* 5. Efeitos */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <label className="block text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold">
              Efeitos especiais
            </label>

            <div className="space-y-3">
              {/* Sombra */}
              <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shadow}
                  onChange={(e) =>
                    patchStyle((prev) => ({
                      ...prev,
                      effects: { ...prev.effects, shadow: e.target.checked },
                    }))
                  }
                  className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                />
                <span>Sombra sutil (box-shadow)</span>
              </label>

              {/* Glow */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={glowEnabled}
                    onChange={(e) =>
                      patchStyle((prev) => ({
                        ...prev,
                        effects: {
                          ...prev.effects,
                          glow: { ...prev.effects?.glow, enabled: e.target.checked },
                        },
                      }))
                    }
                    className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                  />
                  <span>Glow (Brilho de fundo)</span>
                </label>

                {glowEnabled && (
                  <div className="flex items-center gap-4 pl-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">Cor:</span>
                      <input
                        type="color"
                        value={glowColor}
                        onChange={(e) =>
                          patchStyle((prev) => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              glow: {
                                ...prev.effects?.glow,
                                enabled: true,
                                color: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-8 h-8 p-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-default)] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-[160px]">
                      <span className="text-xs text-[var(--text-secondary)] shrink-0">
                        Intensidade ({glowIntensity}%):
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={glowIntensity}
                        onChange={(e) =>
                          patchStyle((prev) => ({
                            ...prev,
                            effects: {
                              ...prev.effects,
                              glow: {
                                ...prev.effects?.glow,
                                enabled: true,
                                intensity: parseInt(e.target.value, 10),
                              },
                            },
                          }))
                        }
                        className="w-full accent-[var(--brand-primary)] cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Shimmer */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shimmerEnabled}
                    onChange={(e) =>
                      patchStyle((prev) => ({
                        ...prev,
                        effects: {
                          ...prev.effects,
                          shimmer: { ...prev.effects?.shimmer, enabled: e.target.checked },
                        },
                      }))
                    }
                    className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                  />
                  <span>Shimmer (Varredura de luz)</span>
                </label>

                {shimmerEnabled && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      Velocidade ({shimmerSpeed}s):
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={shimmerSpeed}
                      onChange={(e) =>
                        patchStyle((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            shimmer: {
                              ...prev.effects?.shimmer,
                              enabled: true,
                              speed: parseFloat(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-36 accent-[var(--brand-primary)] cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Pulse */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pulseEnabled}
                    onChange={(e) =>
                      patchStyle((prev) => ({
                        ...prev,
                        effects: {
                          ...prev.effects,
                          pulse: { ...prev.effects?.pulse, enabled: e.target.checked },
                        },
                      }))
                    }
                    className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer"
                  />
                  <span>Pulse (Pulso de opacidade)</span>
                </label>

                {pulseEnabled && (
                  <div className="flex items-center gap-2 pl-6">
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      Velocidade ({pulseSpeed}s):
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="0.5"
                      value={pulseSpeed}
                      onChange={(e) =>
                        patchStyle((prev) => ({
                          ...prev,
                          effects: {
                            ...prev.effects,
                            pulse: {
                              ...prev.effects?.pulse,
                              enabled: true,
                              speed: parseFloat(e.target.value),
                            },
                          },
                        }))
                      }
                      className="w-36 accent-[var(--brand-primary)] cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Restore Default Button */}
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
