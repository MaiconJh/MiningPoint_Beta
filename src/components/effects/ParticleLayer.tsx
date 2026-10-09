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
  headSize: number;
  wakeHeight: number;
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
      // Distribuição fixa: 60% ember, 30% spark, 10% ash
      const ratio = i / count;
      const kind: ParticleKind = ratio < 0.6 ? 'ember' : ratio < 0.9 ? 'spark' : 'ash';

      // Faixas de tamanho/densidade por tipo (dos mockups)
      let headSize: number;
      let baseWake: number;
      let peakOpacity: number;
      let swayAmp: number;
      let baseRise: number;
      let swayDuration: number;

      if (kind === 'ember') {
        headSize = 2.4 + Math.random() * 2.0; // 2.4 – 4.4
        baseWake = 16 + Math.random() * 10; // 16 – 26
        peakOpacity = 0.75 + Math.random() * 0.2; // 0.75 – 0.95
        swayAmp = 10 + Math.random() * 8;
        baseRise = 5.5 + Math.random() * 2.5;
        swayDuration = 2 + Math.random() * 2;
      } else if (kind === 'spark') {
        headSize = 1.6 + Math.random() * 1.0; // 1.6 – 2.6
        baseWake = 8 + Math.random() * 6; // 8 – 14
        peakOpacity = 0.9 + Math.random() * 0.1; // 0.9 – 1.0
        swayAmp = 14 + Math.random() * 10;
        baseRise = 3.5 + Math.random() * 2;
        swayDuration = 1.8 + Math.random() * 1.6;
      } else {
        headSize = 3.0 + Math.random() * 2.0; // 3.0 – 5.0
        baseWake = 20 + Math.random() * 14; // 20 – 34
        peakOpacity = 0.4 + Math.random() * 0.3; // 0.4 – 0.7
        swayAmp = 8 + Math.random() * 6;
        baseRise = 7 + Math.random() * 3;
        swayDuration = 2.5 + Math.random() * 2;
      }

      const riseDuration = Math.max(1.5, baseRise / Math.max(0.5, config.riseSpeed));
      const wakeHeight = baseWake * Math.max(0.5, config.wakeLength);

      list.push({
        id: i,
        kind,
        leftPercent: Math.random() * 100,
        headSize,
        wakeHeight,
        peakOpacity,
        swayAmp,
        riseDuration,
        swayDuration,
        delay: -(Math.random() * 8),
      });
    }

    return list;
  }, [config.density, config.riseSpeed, config.wakeLength]);

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
          width: `${p.headSize.toFixed(1)}px`,
          ['--rise-dur' as string]: `${p.riseDuration.toFixed(2)}s`,
          ['--sway-dur' as string]: `${p.swayDuration.toFixed(2)}s`,
          ['--particle-opacity' as string]: p.peakOpacity.toFixed(2),
          ['--amp' as string]: `${p.swayAmp.toFixed(1)}px`,
          animationDelay: `${p.delay.toFixed(2)}s`,
          ...(reducedMotion ? { animation: 'none' as const, opacity: 0.5 } : {}),
        };

        // No CSS, .ember-wake tem width:100% e .ember-head é o círculo.
        // A coluna é head (topo) → wake (embaixo). O wake sai do head para baixo.
        return (
          <span key={p.id} className="ember-particle" style={particleStyle}>
            <span
              className="ember-head"
              style={{ width: `${p.headSize.toFixed(1)}px`, height: `${p.headSize.toFixed(1)}px` }}
            />
            <span
              className="ember-wake"
              style={{ height: `${p.wakeHeight.toFixed(1)}px` }}
            />
          </span>
        );
      })}
    </span>
  );
};
