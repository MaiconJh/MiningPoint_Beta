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
      'sparkle',
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
    // Mistura de efeitos estáticos (tilt, prism, neon) e animados (holo, shimmer, sparkle)
    const allEffects: EffectId[] = ['tilt', 'holo', 'prism', 'shimmer', 'neon', 'sparkle'];

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
      'sparkle',
    ]);

    const resolvedWithReducedMotion = resolveEffectStack(
      { effects: allEffects },
      undefined,
      { prefersReducedMotion: true }
    );

    // Efeitos animados ('holo', 'shimmer', 'sparkle') são descartados;
    // apenas estáticos ('tilt', 'prism', 'neon') permanecem.
    expect(resolvedWithReducedMotion.effects.map((e) => e.id)).toEqual(['tilt', 'prism', 'neon']);
    expect(resolvedWithReducedMotion.classNames).toEqual(['fx-tilt', 'fx-prism', 'fx-neon']);
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
});
