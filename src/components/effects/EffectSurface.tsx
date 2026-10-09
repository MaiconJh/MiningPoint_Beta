import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { EffectSurfaceType, ResolvedEffectStack } from '../../lib/effects/types';

export interface EffectSurfaceContextValue {
  stack?: ResolvedEffectStack;
  surface: EffectSurfaceType;
}

export const EffectSurfaceContext = createContext<EffectSurfaceContextValue | null>(null);

/**
 * Hook de acesso ao contexto da superfície de efeitos.
 */
export const useEffectSurface = (): EffectSurfaceContextValue | null => {
  return useContext(EffectSurfaceContext);
};

export interface EffectSurfaceProps {
  /** Pilha resolvida de efeitos visuais */
  stack?: ResolvedEffectStack;
  /** Tipo de superfície alvo (ex.: 'tooltip') */
  surface?: EffectSurfaceType;
  /** Classes CSS adicionais */
  className?: string;
  /** Estilos inline adicionais */
  style?: React.CSSProperties;
  /** Papel de acessibilidade */
  role?: string;
  /** Elemento HTML raiz a ser renderizado */
  as?: React.ElementType;
  /** Conteúdo interno */
  children: React.ReactNode;
}

/**
 * Componente headless para aplicação de Effect Stack em superfícies visuais.
 * Não acopla regras a efeitos específicos e delega rendering a tokens e classes CSS.
 */
export const EffectSurface: React.FC<EffectSurfaceProps> = ({
  stack,
  surface = 'tooltip',
  className = '',
  style,
  role,
  as: Component = 'div',
  children,
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const [pointerStyle, setPointerStyle] = useState<React.CSSProperties>({});

  const hasEffects = Boolean(stack && stack.hasEffects);

  // Manipulação de ponteiro para efeitos direcionais (tilt e spotlight)
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const tiltX = (y - 0.5) * -12;
    const tiltY = (x - 0.5) * 12;

    setPointerStyle({
      ['--fx-mouse-x' as string]: `${(x * 100).toFixed(1)}%`,
      ['--fx-mouse-y' as string]: `${(y * 100).toFixed(1)}%`,
      ['--fx-tilt-x' as string]: `${tiltX.toFixed(1)}deg`,
      ['--fx-tilt-y' as string]: `${tiltY.toFixed(1)}deg`,
    } as React.CSSProperties);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPointerStyle({
      ['--fx-tilt-x' as string]: '0deg',
      ['--fx-tilt-y' as string]: '0deg',
    } as React.CSSProperties);
  }, []);

  const contextValue = React.useMemo<EffectSurfaceContextValue>(
    () => ({
      stack,
      surface,
    }),
    [stack, surface]
  );

  // Sem efeitos ativos: preserva rigorosamente o markup e estilo originais
  if (!hasEffects || !stack) {
    return (
      <EffectSurfaceContext.Provider value={contextValue}>
        <Component
          role={role}
          className={className}
          style={{ ...style, ...(stack?.style || {}) }}
        >
          {children}
        </Component>
      </EffectSurfaceContext.Provider>
    );
  }

  const containerClassNames = stack.effects
    .filter((e) => (e.target || 'layer') === 'container')
    .map((e) => e.cssClass);

  const layerEffects = stack.effects.filter(
    (e) => (e.target || 'layer') === 'layer'
  );

  const mergedClassName = [
    'fx-surface',
    ...containerClassNames,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const mergedStyle: React.CSSProperties = {
    ...style,
    ...stack.style,
    ...pointerStyle,
  };

  return (
    <EffectSurfaceContext.Provider value={contextValue}>
      <Component
        ref={containerRef}
        role={role}
        className={mergedClassName}
        style={mergedStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {layerEffects.map((effect) => (
          <span
            key={effect.id}
            aria-hidden="true"
            className={`fx-layer ${effect.cssClass}`}
          />
        ))}
        <div className="fx-content">{children}</div>
      </Component>
    </EffectSurfaceContext.Provider>
  );
};
