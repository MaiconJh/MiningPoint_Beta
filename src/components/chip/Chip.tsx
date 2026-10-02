import React from 'react';
import { ChipStyle } from '../../types/chip';
import { resolveChipStyle, chipToInlineStyle } from '../../lib/chipStyle';

export interface ChipProps {
  label: string;
  color: string; // fallback color
  style?: ChipStyle;
  as?: 'span' | 'div';
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  color,
  style,
  as: Component = 'span',
  className = '',
}) => {
  const resolved = resolveChipStyle(color, style);
  const inlineStyles = chipToInlineStyle(resolved);

  if (resolved.shape === 'text') {
    return (
      <Component
        className={`inline-block select-none leading-none ${className}`}
        style={inlineStyles}
      >
        {label}
      </Component>
    );
  }

  if (resolved.shape === 'diamond') {
    return (
      <Component
        className={`relative inline-flex items-center justify-center select-none overflow-hidden ${className}`}
        style={{ ...inlineStyles, padding: '4px 8px' }}
      >
        <span
          className="absolute inset-0 rotate-45 border"
          style={{
            background: resolved.backgroundStyle,
            borderColor: resolved.borderColor,
            borderWidth: `${resolved.borderWidth}px`,
            borderStyle: resolved.borderStyle,
          }}
        />
        <span className="relative z-10">{label}</span>

        {resolved.shimmer.enabled && (
          <span
            className="chip-shimmer-overlay"
            style={{
              animation: `chip-shimmer ${resolved.shimmer.speed}s infinite linear`,
            }}
          />
        )}
      </Component>
    );
  }

  // Pill and Rounded
  return (
    <Component
      className={`relative inline-flex items-center justify-center px-2.5 py-0.5 leading-none select-none overflow-hidden transition-all duration-200 ${className}`}
      style={inlineStyles}
    >
      <span className="relative z-10">{label}</span>

      {resolved.shimmer.enabled && (
        <span
          className="chip-shimmer-overlay"
          style={{
            animation: `chip-shimmer ${resolved.shimmer.speed}s infinite linear`,
          }}
        />
      )}
    </Component>
  );
};
