import { EffectDescriptor, EffectId } from './types';

/**
 * Registro ordenado dos 8 efeitos visuais suportados no Effect Stack.
 */
export const EFFECT_REGISTRY: readonly EffectDescriptor[] = [
  {
    id: 'tilt',
    label: 'Inclinação Dinâmica',
    cssClass: 'fx-tilt',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: false,
    cost: 1,
  },
  {
    id: 'spotlight',
    label: 'Holofote Direcional',
    cssClass: 'fx-spotlight',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: false,
    cost: 1,
  },
  {
    id: 'holo',
    label: 'Holográfico',
    cssClass: 'fx-holo',
    surfaces: ['tooltip'],
    requiresDarkSurface: true,
    animated: true,
    cost: 3,
  },
  {
    id: 'aurora',
    label: 'Aurora Fluida',
    cssClass: 'fx-aurora',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: true,
    cost: 2,
  },
  {
    id: 'prism',
    label: 'Prisma Espectral',
    cssClass: 'fx-prism',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: false,
    cost: 2,
  },
  {
    id: 'shimmer',
    label: 'Varredura de Brilho',
    cssClass: 'fx-shimmer',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: true,
    cost: 1,
  },
  {
    id: 'neon',
    label: 'Aura Neon',
    cssClass: 'fx-neon',
    surfaces: ['tooltip'],
    requiresDarkSurface: true,
    animated: false,
    cost: 1,
  },
  {
    id: 'sparkle',
    label: 'Centelhas',
    cssClass: 'fx-sparkle',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: true,
    cost: 2,
  },
];

/**
 * Mapeamento indexado por ID para busca rápida.
 */
export const EFFECT_MAP: Record<EffectId, EffectDescriptor> = EFFECT_REGISTRY.reduce(
  (acc, descriptor) => {
    acc[descriptor.id] = descriptor;
    return acc;
  },
  {} as Record<EffectId, EffectDescriptor>
);

/**
 * Obtém o descritor de um efeito a partir do seu identificador.
 */
export const getEffect = (id: EffectId): EffectDescriptor | undefined => {
  return EFFECT_MAP[id];
};
