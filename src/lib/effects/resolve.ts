import React from 'react';
import {
  EffectDescriptor,
  EffectId,
  EffectItem,
  EffectStack,
  EmberPresetId,
  ResolvedEffectStack,
  ResolvedEmberConfig,
  ResolveEffectStackOptions,
} from './types';
import { EFFECT_MAP, EFFECT_REGISTRY } from './registry';
import { getEmberPreset } from './emberPresets';

/**
 * Detecta se a preferência de movimento reduzido está ativa no ambiente do navegador.
 */
const checkSystemReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Normaliza um item da stack para obter seu identificador e estado habilitado.
 */
const normalizeEffectItem = (
  item: EffectItem
): { id: EffectId; enabled: boolean } => {
  if (typeof item === 'string') {
    return { id: item, enabled: true };
  }
  return {
    id: item.id,
    enabled: item.enabled !== false,
  };
};

/**
 * Resolve e funde uma pilha de efeitos (base + override), deduplicando por ID,
 * respeitando preferências de acessibilidade e produzindo classes e estilos prontos.
 *
 * @param base Pilha base de efeitos.
 * @param override Sobrescrita parcial opcional.
 * @param options Opções de resolução, como redução de movimento forçada.
 * @returns Estrutura resolvida de efeitos visuais.
 */
export const resolveEffectStack = (
  base?: EffectStack,
  override?: Partial<EffectStack>,
  options?: ResolveEffectStackOptions
): ResolvedEffectStack => {
  const prefersReducedMotion =
    options?.prefersReducedMotion !== undefined
      ? options.prefersReducedMotion
      : checkSystemReducedMotion();

  // Consolidação de estados dos efeitos considerando a cascata (base -> override)
  const effectStateMap = new Map<EffectId, boolean>();

  if (base?.effects) {
    for (const item of base.effects) {
      const { id, enabled } = normalizeEffectItem(item);
      if (id in EFFECT_MAP) {
        effectStateMap.set(id, enabled);
      }
    }
  }

  if (override?.effects) {
    for (const item of override.effects) {
      const { id, enabled } = normalizeEffectItem(item);
      if (id in EFFECT_MAP) {
        effectStateMap.set(id, enabled);
      }
    }
  }

  // Filtragem e ordenação determinística de acordo com o EFFECT_REGISTRY
  const activeEffects: EffectDescriptor[] = [];
  for (const descriptor of EFFECT_REGISTRY) {
    const isEnabled = effectStateMap.get(descriptor.id) === true;
    if (!isEnabled) {
      continue;
    }

    // Se preferência de movimento reduzido estiver ativa, omite efeitos animados
    if (prefersReducedMotion && descriptor.animated) {
      continue;
    }

    activeEffects.push(descriptor);
  }

  const mergedAccentColor = override?.accentColor ?? base?.accentColor;
  const mergedTextColor = override?.textColor ?? base?.textColor;
  const styleVariables: Record<string, string> = {};

  if (mergedAccentColor) {
    styleVariables['--fx-accent'] = mergedAccentColor;
  }
  if (mergedTextColor) {
    styleVariables['--fx-text'] = mergedTextColor;
  }

  const hasEffects = activeEffects.length > 0;
  if (!hasEffects) {
    return {
      effects: [],
      classNames: [],
      style: styleVariables as React.CSSProperties,
      hasEffects: false,
    };
  }

  let resolvedEmber: ResolvedEmberConfig | undefined;
  if (activeEffects.some((e) => e.id === 'ember')) {
    const rawPresetId = (override?.particles?.preset ?? base?.particles?.preset ?? 'amber') as EmberPresetId;
    const preset = getEmberPreset(rawPresetId);

    const primaryRaw =
      override?.particles?.primaryColor ??
      base?.particles?.primaryColor ??
      mergedAccentColor ??
      preset.primary;

    const secondaryRaw =
      override?.particles?.secondaryColor ??
      base?.particles?.secondaryColor ??
      preset.secondary;

    const densityRaw =
      override?.particles?.density ??
      base?.particles?.density ??
      preset.density;

    const riseSpeedRaw =
      override?.particles?.riseSpeed ??
      base?.particles?.riseSpeed ??
      preset.riseSpeed;

    const wakeLengthRaw =
      override?.particles?.wakeLength ??
      base?.particles?.wakeLength ??
      preset.wakeLength;

    const glowIntensityRaw =
      override?.particles?.glowIntensity ??
      base?.particles?.glowIntensity ??
      preset.glowIntensity;

    const density = Math.max(8, Math.min(60, Math.round(Number(densityRaw))));
    const riseSpeed = Math.max(0.5, Math.min(2.0, Number(riseSpeedRaw)));
    const wakeLength = Math.max(0.5, Math.min(2.0, Number(wakeLengthRaw)));
    const glowIntensity = Math.max(0, Math.min(100, Math.round(Number(glowIntensityRaw))));

    resolvedEmber = {
      primary: primaryRaw,
      secondary: secondaryRaw,
      density,
      riseSpeed,
      wakeLength,
      glowIntensity,
    };

    styleVariables['--fx-ember-primary'] = resolvedEmber.primary;
    styleVariables['--fx-ember-secondary'] = resolvedEmber.secondary;
    styleVariables['--fx-ember-glow'] = `${resolvedEmber.glowIntensity}`;
  }

  const classNames = activeEffects.map((effect) => effect.cssClass);

  return {
    effects: activeEffects,
    classNames,
    style: styleVariables as React.CSSProperties,
    hasEffects: true,
    ...(resolvedEmber ? { ember: resolvedEmber } : {}),
  };
};
