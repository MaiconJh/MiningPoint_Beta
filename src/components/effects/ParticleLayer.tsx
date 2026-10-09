import React, { useMemo, useState, useEffect } from 'react';
import { ResolvedEmberConfig } from '../../lib/effects/types';

export interface ParticleLayerProps {
  config: ResolvedEmberConfig;
}

interface ParticleData {
  id: number;
  leftPercent: number;
  headSize: number;
  wakeHeight: number;
  opacity: number;
  swayAmp: number;
  riseDuration: number;
  swayDuration: number;
  delaySec: number;
}

/**
 * Camada de partículas de brasas renderizada puramente em elementos DOM com keyframes CSS.
 */
export const ParticleLayer: React.FC<ParticleLayerProps> = ({ config }) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
    }
  }, []);

  // Criação estável das partículas proporcional à densidade configurada
  const particles = useMemo<ParticleData[]>(() => {
    const list: ParticleData[] = [];
    const count = Math.max(8, Math.min(60, Math.round(config.density)));

    for (let i = 0; i < count; i++) {
      // Distribuição pseudo-aleatória determinística por partícula
      const seed = (i * 9301 + 49297) % 233280;
      const rnd1 = seed / 233280;
      const rnd2 = ((seed * 9301 + 49297) % 233280) / 233280;
      const rnd3 = ((rnd2 * 9301 + 49297) % 233280) / 233280;
      const rnd4 = ((rnd3 * 9301 + 49297) % 233280) / 233280;

      const baseRise = 5.0 + rnd1 * 4.0; // 5s a 9s
      const riseDuration = Math.max(1.5, baseRise / Math.max(0.5, config.riseSpeed));
      const swayDuration = 1.6 + rnd2 * 2.0; // 1.6s a 3.6s
      const delaySec = -(rnd3 * 8.0); // atraso negativo para preencher o volume imediatamente

      const headSize = 2.5 + rnd4 * 2.5; // 2.5px a 5px
      const baseWake = 10 + rnd1 * 14;
      const wakeHeight = baseWake * Math.max(0.5, config.wakeLength);

      list.push({
        id: i,
        leftPercent: rnd1 * 100,
        headSize,
        wakeHeight,
        opacity: 0.55 + rnd2 * 0.4,
        swayAmp: 6 + rnd3 * 12,
        riseDuration,
        swayDuration,
        delaySec,
      });
    }

    return list;
  }, [config.density, config.riseSpeed, config.wakeLength]);

  const containerStyle: React.CSSProperties = {
    ['--ember-primary' as string]: config.primary,
    ['--ember-secondary' as string]: config.secondary,
    ['--ember-glow' as string]: `${config.glowIntensity}`,
  };

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={containerStyle}
    >
      {particles.map((p) => {
        const particleStyle: React.CSSProperties = reducedMotion
          ? {
              left: `${p.leftPercent.toFixed(1)}%`,
              bottom: `${(p.id * 3.5) % 90}%`,
              opacity: 0.5,
              width: `${p.headSize}px`,
            }
          : ({
              left: `${p.leftPercent.toFixed(1)}%`,
              width: `${p.headSize}px`,
              ['--amp' as string]: `${p.swayAmp.toFixed(1)}px`,
              ['--rise-dur' as string]: `${p.riseDuration.toFixed(2)}s`,
              ['--sway-dur' as string]: `${p.swayDuration.toFixed(2)}s`,
              ['--particle-opacity' as string]: p.opacity.toFixed(2),
              animationDelay: `${p.delaySec.toFixed(2)}s, ${(p.delaySec * 0.7).toFixed(2)}s`,
            } as React.CSSProperties);

        return (
          <span
            key={p.id}
            className={`ember-particle ${reducedMotion ? 'static' : ''}`}
            style={particleStyle}
          >
            <span
              className="ember-wake"
              style={{
                height: `${p.wakeHeight.toFixed(1)}px`,
              }}
            />
            <span
              className="ember-head"
              style={{
                width: `${p.headSize.toFixed(1)}px`,
                height: `${p.headSize.toFixed(1)}px`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
};
