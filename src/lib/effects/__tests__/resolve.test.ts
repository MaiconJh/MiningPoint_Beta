import { describe, it, expect } from 'vitest';
import { resolveEffectStack } from '../resolve';
import { EFFECT_REGISTRY, EFFECT_MAP, getEffect } from '../registry';
import { EffectId } from '../types';

describe('Effect Registry', () => {
  it('contém exatamente 8 efeitos tipados', () => {
    expect(EFFECT_REGISTRY).toHaveLength(8);

    const expectedIds: EffectId[] = [
      'tilt',
      'spotlight',
      'holo',
      'aurora',
      'prism',
      'shimmer',
      'neon',
      'ember',
    ];

    expect(EFFECT_REGISTRY.map((e) => e.id)).toEqual(expectedIds);
  });

  it('possui atributos válidos em todos os descritores', () => {
    for (const descriptor of EFFECT_REGISTRY) {
      expect(descriptor.id).toBeDefined();
      expect(descriptor.label).toBeTruthy();
      expect(descriptor.cssClass).toMatch(/^fx-[a-z]+$/);
      expect(descriptor.surfaces).toContain('tooltip');
      expect(typeof descriptor.animated).toBe('boolean');
      expect([1, 2, 3]).toContain(descriptor.cost);
      expect(typeof descriptor.requiresDarkSurface).toBe('boolean');
    }
  });

  it('permite consulta individual via getEffect', () => {
    const holo = getEffect('holo');
    expect(holo).toBeDefined();
    expect(holo?.id).toBe('holo');
    expect(holo?.cssClass).toBe('fx-holo');
    expect(holo?.animated).toBe(true);
    expect(holo?.cost).toBe(3);

    // Efeito inexistente
    expect(getEffect('inexistente' as EffectId)).toBeUndefined();
  });
});

describe('resolveEffectStack', () => {
  it('retorna estrutura vazia quando base e override forem undefined', () => {
    const resolved = resolveEffectStack(undefined);
    expect(resolved.hasEffects).toBe(false);
    expect(resolved.effects).toEqual([]);
    expect(resolved.classNames).toEqual([]);
    expect(resolved.style).toEqual({});
  });

  it('retorna estrutura vazia quando a lista de efeitos for vazia', () => {
    const resolved = resolveEffectStack({ effects: [] });
    expect(resolved.hasEffects).toBe(false);
    expect(resolved.effects).toEqual([]);
    expect(resolved.classNames).toEqual([]);
    expect(resolved.style).toEqual({});
  });

  it('resolve efeitos simples passados apenas por string ID', () => {
    const resolved = resolveEffectStack({
      effects: ['neon', 'tilt'],
    });

    expect(resolved.hasEffects).toBe(true);
    // Deve manter a ordem determinística do registry: tilt (1º) antes de neon (7º)
    expect(resolved.effects.map((e) => e.id)).toEqual(['tilt', 'neon']);
    expect(resolved.classNames).toEqual(['fx-tilt', 'fx-neon']);
  });

  it('executa cascata base -> override e deduplica por ID', () => {
    const base = {
      effects: ['tilt', 'shimmer'] as EffectId[],
      accentColor: '#177ce8',
    };

    const override = {
      effects: ['shimmer', 'aurora'] as EffectId[],
      accentColor: '#4ade80',
    };

    const resolved = resolveEffectStack(base, override);

    expect(resolved.hasEffects).toBe(true);
    // Deve conter tilt, aurora e shimmer (shimmer deduplicado e ordenado pelo registry)
    expect(resolved.effects.map((e) => e.id)).toEqual(['tilt', 'aurora', 'shimmer']);
    expect(resolved.classNames).toEqual(['fx-tilt', 'fx-aurora', 'fx-shimmer']);
    // Override de cor prevalece
    expect(resolved.style).toEqual({
      '--fx-accent': '#4ade80',
    });
  });

  it('permite desativar um efeito da base usando enabled: false no override', () => {
    const base = {
      effects: ['neon', 'prism'] as EffectId[],
    };

    const override = {
      effects: [{ id: 'neon' as const, enabled: false }],
    };

    const resolved = resolveEffectStack(base, override);

    expect(resolved.effects.map((e) => e.id)).toEqual(['prism']);
    expect(resolved.classNames).toEqual(['fx-prism']);
  });

  it('filtra efeitos animados quando prefersReducedMotion estiver ativo', () => {
    // Mistura de efeitos estáticos (tilt, prism, neon) e animados (holo, shimmer, ember)
    const allEffects: EffectId[] = ['tilt', 'holo', 'prism', 'shimmer', 'neon', 'ember'];

    const resolvedWithoutReducedMotion = resolveEffectStack(
      { effects: allEffects },
      undefined,
      { prefersReducedMotion: false }
    );
    expect(resolvedWithoutReducedMotion.effects.map((e) => e.id)).toEqual([
      'tilt',
      'holo',
      'prism',
      'shimmer',
      'neon',
      'ember',
    ]);

    const resolvedWithReducedMotion = resolveEffectStack(
      { effects: allEffects },
      undefined,
      { prefersReducedMotion: true }
    );

    // Efeitos animados ('holo', 'shimmer', 'ember') são descartados;
    // apenas estáticos ('tilt', 'prism', 'neon') permanecem.
    expect(resolvedWithReducedMotion.effects.map((e) => e.id)).toEqual(['tilt', 'prism', 'neon']);
    expect(resolvedWithReducedMotion.classNames).toEqual(['fx-tilt', 'fx-prism', 'fx-neon']);
  });

  it('resolve ember com preset amber quando nenhuma partícula for especificada', () => {
    const resolved = resolveEffectStack({ effects: ['ember'] });
    expect(resolved.ember).toBeDefined();
    expect(resolved.ember?.density).toBe(22);
    expect(resolved.ember?.riseSpeed).toBe(1.0);
    expect(resolved.ember?.wakeLength).toBe(1.0);
    expect(resolved.ember?.glowIntensity).toBe(55);
    expect(resolved.ember?.primary).toBe('#ff8c2a');
    expect(resolved.ember?.secondary).toBe('#ffd27a');
  });

  it('permite sobrescrever preset e densidade no ember', () => {
    const resolved = resolveEffectStack({
      effects: ['ember'],
      particles: { preset: 'blue', density: 30 },
    });
    expect(resolved.ember?.density).toBe(30);
    expect(resolved.ember?.primary).toBe('#4a90e2');
  });

  it('herda accentColor quando primaryColor não for especificada', () => {
    const resolved = resolveEffectStack({
      effects: ['ember'],
      accentColor: '#00ff00',
    });
    expect(resolved.ember?.primary).toBe('#00ff00');
  });

  it('prioriza primaryColor explícita sobre accentColor e preset', () => {
    const resolved = resolveEffectStack({
      effects: ['ember'],
      accentColor: '#00ff00',
      particles: { primaryColor: '#ff0000' },
    });
    expect(resolved.ember?.primary).toBe('#ff0000');
  });

  it('clampa density para o limite máximo de 60', () => {
    const resolved = resolveEffectStack({
      effects: ['ember'],
      particles: { density: 1000 },
    });
    expect(resolved.ember?.density).toBe(60);
  });

  it('não emite ember quando ember não estiver na lista de efeitos ativos', () => {
    const resolved = resolveEffectStack({
      particles: { preset: 'blue' },
    });
    expect(resolved.ember).toBeUndefined();
    expect(resolved.hasEffects).toBe(false);
  });

  it('preserva accentColor base quando override não especificar nova cor', () => {
    const resolved = resolveEffectStack(
      { effects: ['neon'], accentColor: 'var(--brand-primary)' },
      { effects: ['prism'] }
    );

    expect(resolved.style).toEqual({
      '--fx-accent': 'var(--brand-primary)',
    });
  });

  it('resolve textColor para --fx-text mesmo sem efeitos ativos', () => {
    const resolved = resolveEffectStack({ textColor: '#f59e0b' });

    expect(resolved.hasEffects).toBe(false);
    expect(resolved.effects).toEqual([]);
    expect(resolved.classNames).toEqual([]);
    expect((resolved.style as Record<string, string>)['--fx-text']).toBe('#f59e0b');
  });

  it('aplica cascata em textColor preservando ou sobrescrevendo', () => {
    const base = { textColor: '#108a80', accentColor: '#177ce8' };
    const override = { textColor: '#f59e0b' };

    const resolved = resolveEffectStack(base, override);
    expect(resolved.style).toEqual({
      '--fx-accent': '#177ce8',
      '--fx-text': '#f59e0b',
    });
  });
});
