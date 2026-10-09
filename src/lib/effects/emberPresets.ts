import { EmberPresetId, ResolvedEmberConfig } from './types';

export interface EmberPreset extends ResolvedEmberConfig {
  id: EmberPresetId;
  label: string;
}

/**
 * Catálogo com os 6 presets visuais oficiais de brasas.
 */
export const EMBER_PRESETS: readonly EmberPreset[] = [
  {
    id: 'amber',
    label: 'Fogueira Clássica',
    primary: '#ff8c2a',
    secondary: '#ffd27a',
    density: 22,
    riseSpeed: 1.0,
    wakeLength: 1.0,
    glowIntensity: 55,
  },
  {
    id: 'crimson',
    label: 'Forja Profunda',
    primary: '#c0392b',
    secondary: '#ffb080',
    density: 28,
    riseSpeed: 0.85,
    wakeLength: 1.3,
    glowIntensity: 50,
  },
  {
    id: 'blue',
    label: 'Chama Azul Arcana',
    primary: '#4a90e2',
    secondary: '#a8d8ff',
    density: 20,
    riseSpeed: 1.2,
    wakeLength: 0.9,
    glowIntensity: 55,
  },
  {
    id: 'green',
    label: 'Chama Espectral',
    primary: '#2ecc71',
    secondary: '#a8ffb8',
    density: 18,
    riseSpeed: 1.15,
    wakeLength: 0.7,
    glowIntensity: 50,
  },
  {
    id: 'violet',
    label: 'Braseiro Lento',
    primary: '#9b59b6',
    secondary: '#e2b8ff',
    density: 16,
    riseSpeed: 0.7,
    wakeLength: 1.5,
    glowIntensity: 50,
  },
  {
    id: 'dense',
    label: 'Tempestade de Brasas',
    primary: '#ff8c2a',
    secondary: '#fff0c0',
    density: 40,
    riseSpeed: 1.0,
    wakeLength: 1.2,
    glowIntensity: 65,
  },
];

/**
 * Mapeamento indexado por ID para busca rápida.
 */
const PRESET_MAP: Record<EmberPresetId, EmberPreset> = EMBER_PRESETS.reduce(
  (acc, preset) => {
    acc[preset.id] = preset;
    return acc;
  },
  {} as Record<EmberPresetId, EmberPreset>
);

/**
 * Obtém os dados de um preset de brasas pelo seu ID.
 */
export const getEmberPreset = (id: EmberPresetId): EmberPreset => {
  return PRESET_MAP[id] ?? PRESET_MAP.amber;
};
