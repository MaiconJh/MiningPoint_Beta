import React from 'react';
import { ChipStyle } from '../types/chip';

export const DEFAULT_CHIP_STYLE = {
  shape: 'pill' as const,
  background: {
    type: 'solid' as const,
    opacity: 100,
  },
  border: {
    width: 1,
    style: 'solid' as const,
  },
  text: {
    weight: 700 as const,
    size: 11,
    uppercase: true,
    fontFamily: 'sans' as const,
    italic: false,
    letterSpacing: 'normal' as const,
  },
  effects: {
    shadow: false,
    glow: {
      enabled: false,
      intensity: 50,
    },
    shimmer: {
      enabled: false,
      speed: 3,
    },
    pulse: {
      enabled: false,
      speed: 2,
    },
  },
};

export interface ResolvedChipStyle {
  shape: 'pill' | 'rounded' | 'diamond' | 'text';
  bgType: 'solid' | 'gradient' | 'transparent';
  backgroundStyle: string; // CSS background/backgroundColor value
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  borderColor: string;
  textColor: string;
  textWeight: number;
  textSize: number;
  textUppercase: boolean;
  fontFamily: 'sans' | 'mono' | 'serif';
  fontStyle: 'normal' | 'italic';
  letterSpacing: string;
  shadow: boolean;
  glow: {
    enabled: boolean;
    color: string;
    intensity: number;
  };
  shimmer: {
    enabled: boolean;
    speed: number;
  };
  pulse: {
    enabled: boolean;
    speed: number;
  };
}

export const resolveChipStyle = (
  fallbackColor: string,
  style?: ChipStyle
): ResolvedChipStyle => {
  const shape = style?.shape || DEFAULT_CHIP_STYLE.shape;

  // 1. Background
  const bgType = style?.background?.type || DEFAULT_CHIP_STYLE.background.type;
  let backgroundStyle = 'transparent';

  if (shape === 'text' || bgType === 'transparent') {
    backgroundStyle = 'transparent';
  } else if (bgType === 'gradient') {
    const from = style?.background?.gradientFrom || fallbackColor;
    const to = style?.background?.gradientTo || fallbackColor;
    const angle = style?.background?.gradientAngle ?? 135;
    backgroundStyle = `linear-gradient(${angle}deg, ${from}, ${to})`;
  } else {
    // Solid background
    const customBgColor = style?.background?.color;
    const opacity = style?.background?.opacity;

    if (customBgColor) {
      const op = opacity !== undefined ? opacity : 100;
      backgroundStyle = op === 100 ? customBgColor : `color-mix(in srgb, ${customBgColor} ${op}%, transparent)`;
    } else {
      // Taken from fallbackColor
      const op = opacity !== undefined ? opacity : 15;
      backgroundStyle = `color-mix(in srgb, ${fallbackColor} ${op}%, transparent)`;
    }
  }

  // 2. Border
  const rawBorderWidth = shape === 'text' ? 0 : style?.border?.width;
  const borderWidth = rawBorderWidth !== undefined ? rawBorderWidth : DEFAULT_CHIP_STYLE.border.width;
  const borderStyle = style?.border?.style || DEFAULT_CHIP_STYLE.border.style;
  let borderColor = 'transparent';

  if (borderWidth > 0 && shape !== 'text') {
    if (style?.border?.color) {
      borderColor = style.border.color;
    } else {
      borderColor = `color-mix(in srgb, ${fallbackColor} 45%, transparent)`;
    }
  }

  // 3. Text
  const textColor = style?.text?.color || fallbackColor;
  const textWeight = style?.text?.weight ?? DEFAULT_CHIP_STYLE.text.weight;
  const textSize = style?.text?.size ?? DEFAULT_CHIP_STYLE.text.size;
  const textUppercase = style?.text?.uppercase ?? DEFAULT_CHIP_STYLE.text.uppercase;
  const fontFamily = style?.text?.fontFamily || DEFAULT_CHIP_STYLE.text.fontFamily;
  const fontStyle = style?.text?.italic ? 'italic' : 'normal';

  let letterSpacing = textUppercase ? '0.06em' : 'normal';
  if (style?.text?.letterSpacing === 'wide') {
    letterSpacing = '0.1em';
  } else if (style?.text?.letterSpacing === 'wider') {
    letterSpacing = '0.18em';
  }

  // 4. Effects
  const shadow = style?.effects?.shadow ?? false;

  const glowEnabled = style?.effects?.glow?.enabled ?? false;
  const glowColor = style?.effects?.glow?.color || borderColor || fallbackColor;
  const glowIntensity = style?.effects?.glow?.intensity ?? 50;

  const shimmerEnabled = style?.effects?.shimmer?.enabled ?? false;
  const shimmerSpeed = style?.effects?.shimmer?.speed ?? 3;

  const pulseEnabled = style?.effects?.pulse?.enabled ?? false;
  const pulseSpeed = style?.effects?.pulse?.speed ?? 2;

  return {
    shape,
    bgType,
    backgroundStyle,
    borderWidth,
    borderStyle,
    borderColor,
    textColor,
    textWeight,
    textSize,
    textUppercase,
    fontFamily,
    fontStyle,
    letterSpacing,
    shadow,
    glow: {
      enabled: glowEnabled,
      color: glowColor,
      intensity: glowIntensity,
    },
    shimmer: {
      enabled: shimmerEnabled,
      speed: shimmerSpeed,
    },
    pulse: {
      enabled: pulseEnabled,
      speed: pulseSpeed,
    },
  };
};

export const chipToInlineStyle = (resolved: ResolvedChipStyle): React.CSSProperties => {
  const fontFamilies = {
    sans: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  };

  const css: React.CSSProperties = {
    color: resolved.textColor,
    fontWeight: resolved.textWeight,
    fontSize: `${resolved.textSize}px`,
    fontFamily: fontFamilies[resolved.fontFamily],
    fontStyle: resolved.fontStyle,
    textTransform: resolved.textUppercase ? 'uppercase' : 'none',
    letterSpacing: resolved.letterSpacing,
  };

  if (resolved.shape === 'text') {
    css.background = 'transparent';
    css.border = 'none';
    css.padding = '0';
    return css;
  }

  // Background
  css.background = resolved.backgroundStyle;

  // Border
  if (resolved.borderWidth > 0) {
    css.borderWidth = `${resolved.borderWidth}px`;
    css.borderStyle = resolved.borderStyle;
    css.borderColor = resolved.borderColor;
  } else {
    css.border = 'none';
  }

  // Border radius for pill vs rounded
  if (resolved.shape === 'pill') {
    css.borderRadius = '9999px';
  } else if (resolved.shape === 'rounded') {
    css.borderRadius = '6px';
  }

  // Box shadows (combining shadow and glow)
  const shadows: string[] = [];
  if (resolved.shadow) {
    shadows.push('var(--sombra-1, 0 1px 3px rgba(0,0,0,0.3))');
  }
  if (resolved.glow.enabled) {
    const blurRadius = Math.max(2, Math.round((resolved.glow.intensity / 100) * 16));
    const spreadRadius = Math.max(0, Math.round((resolved.glow.intensity / 100) * 4));
    shadows.push(`0 0 ${blurRadius}px ${spreadRadius}px ${resolved.glow.color}`);
  }

  if (shadows.length > 0) {
    css.boxShadow = shadows.join(', ');
  }

  // Pulse animation
  if (resolved.pulse.enabled) {
    css.animation = `chip-pulse ${resolved.pulse.speed}s infinite ease-in-out`;
  }

  return css;
};
