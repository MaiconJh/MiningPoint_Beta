import React from 'react';

export interface SkeletonLineProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = '100%',
  height = '14px',
  radius = '4px',
  className = '',
}) => {
  return (
    <div
      className={`bg-[var(--bg-surface-elevated)] opacity-60 motion-safe:animate-pulse shrink-0 ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
      }}
    />
  );
};

export interface SkeletonCircleProps {
  size: number;
  className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size,
  className = '',
}) => {
  return (
    <div
      className={`rounded-full bg-[var(--bg-surface-elevated)] opacity-60 motion-safe:animate-pulse shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
};

export interface SkeletonBlockProps {
  width?: string | number;
  height: string | number;
  radius?: string;
  className?: string;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height,
  radius = '8px',
  className = '',
}) => {
  return (
    <div
      className={`bg-[var(--bg-surface-elevated)] opacity-60 motion-safe:animate-pulse shrink-0 ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
      }}
    />
  );
};
