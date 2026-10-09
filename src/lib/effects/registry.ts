import { EffectDescriptor, EffectId } from './types';

/**
 * Registro ordenado dos 8 efeitos visuais suportados no Effect Stack.
 */
export const EFFECT_REGISTRY: readonly EffectDescriptor[] = [
  {
    id: 'tilt',
    label: 'Inclinação Dinâmica',
    cssClass: 'fx-tilt',
    target: 'container',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: false,
    cost: 1,
  },
  {
    id: 'spotlight',
    label: 'Holofote Direcional',
    cssClass: 'fx-spotlight',
    target: 'layer',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: false,
    cost: 1,
  },
  {
    id: 'holo',
    label: 'Holográfico',
    cssClass: 'fx-holo',
    target: 'layer',
    surfaces: ['tooltip'],
    requiresDarkSurface: true,
    animated: true,
    cost: 3,
  },
  {
    id: 'aurora',
    label: 'Aurora Fluida',
    cssClass: 'fx-aurora',
    target: 'layer',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: true,
    cost: 2,
  },
  {
    id: 'prism',
    label: 'Prisma Espectral',
    cssClass: 'fx-prism',
    target: 'layer',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: false,
    cost: 2,
  },
  {
    id: 'shimmer',
    label: 'Varredura de Brilho',
    cssClass: 'fx-shimmer',
    target: 'layer',
    surfaces: ['tooltip'],
    requiresDarkSurface: false,
    animated: true,
    cost: 1,
  },
  {
    id: 'neon',
    label: 'Aura Neon',
    cssClass: 'fx-neon',
    target: 'container',
    surfaces: ['tooltip'],
    requiresDarkSurface: true,
    animated: false,
    cost: 1,
  },
  {
    id: 'ember',
    label: 'Brasas',
    cssClass: 'fx-ember',
    target: 'layer',
    surfaces: ['tooltip'],
    requiresDarkSurface: true,
    animated: true,
    cost: 3,
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
