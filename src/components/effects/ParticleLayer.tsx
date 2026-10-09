import React, { useMemo, useEffect, useState } from 'react';
import { ResolvedEmberConfig } from '../../lib/effects/types';

export interface ParticleLayerProps {
  config: ResolvedEmberConfig;
}

type ParticleKind = 'ember' | 'spark' | 'ash';

interface ParticleData {
  id: number;
  kind: ParticleKind;
  leftPercent: number;
  size: number;
  peakOpacity: number;
  swayAmp: number;
  riseDuration: number;
  swayDuration: number;
  delay: number;
}

export const ParticleLayer: React.FC<ParticleLayerProps> = ({ config }) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  const particles = useMemo<ParticleData[]>(() => {
    const count = Math.max(8, Math.min(60, Math.round(config.density)));
    const list: ParticleData[] = [];

    for (let i = 0; i < count; i++) {
      // Distribuição orgânica: 60% brasas, 30% centelhas, 10% fuligens
      const ratio = i / count;
      const kind: ParticleKind = ratio < 0.6 ? 'ember' : ratio < 0.9 ? 'spark' : 'ash';

      let size: number;
      let peakOpacity: number;
      let swayAmp: number;
      let baseRise: number;
      let swayDuration: number;

      if (kind === 'ember') {
        size = 2.4 + Math.random() * 2.0; // 2.4 – 4.4px
        peakOpacity = 0.75 + Math.random() * 0.2; // 0.75 – 0.95
        swayAmp = 8 + Math.random() * 8; // 8 – 16px
        baseRise = 5.0 + Math.random() * 2.5;
        swayDuration = 2.0 + Math.random() * 1.6;
      } else if (kind === 'spark') {
        size = 1.4 + Math.random() * 1.0; // 1.4 – 2.4px
        peakOpacity = 0.9 + Math.random() * 0.1; // 0.9 – 1.0
        swayAmp = 10 + Math.random() * 10; // 10 – 20px
        baseRise = 3.2 + Math.random() * 1.8;
        swayDuration = 1.5 + Math.random() * 1.2;
      } else {
        size = 2.2 + Math.random() * 1.4; // 2.2 – 3.6px
        peakOpacity = 0.35 + Math.random() * 0.3; // 0.35 – 0.65
        swayAmp = 5 + Math.random() * 6; // 5 – 11px
        baseRise = 6.5 + Math.random() * 3.0;
        swayDuration = 2.6 + Math.random() * 2.0;
      }

      const riseDuration = Math.max(1.2, baseRise / Math.max(0.5, config.riseSpeed));

      list.push({
        id: i,
        kind,
        leftPercent: Math.random() * 100,
        size,
        peakOpacity,
        swayAmp,
        riseDuration,
        swayDuration,
        delay: -(Math.random() * 8),
      });
    }

    return list;
  }, [config.density, config.riseSpeed]);

  const containerStyle: React.CSSProperties = {
    ['--ember-primary' as string]: config.primary,
    ['--ember-secondary' as string]: config.secondary,
    ['--ember-glow' as string]: String(config.glowIntensity),
  };

  return (
    <span className="fx-ember" aria-hidden="true" style={containerStyle}>
      {particles.map((p) => {
        const particleStyle: React.CSSProperties = {
          left: `${p.leftPercent.toFixed(2)}%`,
          width: `${p.size.toFixed(1)}px`,
          height: `${p.size.toFixed(1)}px`,
          ['--rise-dur' as string]: `${p.riseDuration.toFixed(2)}s`,
          ['--sway-dur' as string]: `${p.swayDuration.toFixed(2)}s`,
          ['--particle-opacity' as string]: p.peakOpacity.toFixed(2),
          ['--amp' as string]: `${p.swayAmp.toFixed(1)}px`,
          animationDelay: `${p.delay.toFixed(2)}s`,
          ...(reducedMotion ? { animation: 'none' as const, opacity: 0.4 } : {}),
        };

        const kindClass =
          p.kind === 'spark' ? 'is-spark' : p.kind === 'ash' ? 'is-ash' : '';

        return (
          <span
            key={p.id}
            className={`ember-particle ${kindClass}`.trim()}
            style={particleStyle}
          />
        );
      })}
    </span>
  );
};
