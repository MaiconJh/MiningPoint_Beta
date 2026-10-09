import React from 'react';

/**
 * Identificadores únicos para os 8 efeitos suportados no Effect Stack.
 */
export type EffectId =
  | 'tilt'
  | 'spotlight'
  | 'holo'
  | 'aurora'
  | 'prism'
  | 'shimmer'
  | 'neon'
  | 'ember';

/**
 * Identificadores dos 6 presets oficiais de brasas.
 */
export type EmberPresetId =
  | 'amber'
  | 'crimson'
  | 'blue'
  | 'green'
  | 'violet'
  | 'dense';

/**
 * Configuração parametrizável de partículas de brasas.
 */
export interface EmberConfig {
  /** Preset base selecionado */
  preset?: EmberPresetId;
  /** Cor primária da brasa e do rastro (herda accentColor se ausente) */
  primaryColor?: string;
  /** Cor secundária do núcleo da brasa */
  secondaryColor?: string;
  /** Quantidade de partículas ativas simultâneas (8-60) */
  density?: number;
  /** Multiplicador de velocidade de subida (0.5-2.0) */
  riseSpeed?: number;
  /** Multiplicador do comprimento do rastro luminoso (0.5-2.0) */
  wakeLength?: number;
  /** Intensidade do brilho difuso (0-100) */
  glowIntensity?: number;
}

/**
 * Configuração de brasas totalmente resolvida pronta para consumo visual.
 */
export interface ResolvedEmberConfig {
  primary: string;
  secondary: string;
  density: number;
  riseSpeed: number;
  wakeLength: number;
  glowIntensity: number;
}

/**
 * Superfícies visuais onde os efeitos podem ser aplicados.
 * Na Fase 1, restrito ao tooltip do carrossel.
 */
export type EffectSurfaceType = 'tooltip';

/**
 * Descritor estático de um efeito registrado.
 */
export interface EffectDescriptor {
  /** Identificador do efeito */
  id: EffectId;
  /** Nome legível em português */
  label: string;
  /** Nome da classe CSS correspondente em effects.css */
  cssClass: string;
  /** Alvo de aplicação do efeito: 'container' no elemento raiz ou 'layer' na camada de fundo */
  target: 'container' | 'layer';
  /** Superfícies suportadas */
  surfaces: EffectSurfaceType[];
  /** Indica se o efeito requer fundo escuro para contraste/blend adequado */
  requiresDarkSurface: boolean;
  /** Indica se o efeito possui animação contínua */
  animated: boolean;
  /** Custo de renderização estimado (1: leve, 2: moderado, 3: pesado) */
  cost: 1 | 2 | 3;
}

/**
 * Configuração individual de um efeito dentro de uma stack.
 */
export interface EffectItemConfig {
  id: EffectId;
  enabled?: boolean;
}

/**
 * Elemento de efeito na stack, podendo ser apenas o id ou objeto de configuração.
 */
export type EffectItem = EffectId | EffectItemConfig;

/**
 * Definição declarativa da pilha de efeitos.
 */
export interface EffectStack {
  /** Lista de efeitos configurados na pilha */
  effects?: EffectItem[];
  /** Cor de destaque (accent) opcional para efeitos como neon, aurora e spotlight */
  accentColor?: string;
  /** Cor própria do texto da superfície (ex.: nome da raridade). Resolvida para --fx-text. Independente de accentColor. */
  textColor?: string;
  /** Configurações parametrizáveis do efeito de brasas */
  particles?: EmberConfig;
}

/**
 * Estrutura resolvida pronta para consumo pelo EffectSurface.
 */
export interface ResolvedEffectStack {
  /** Lista ordenada de descritores de efeitos ativos */
  effects: EffectDescriptor[];
  /** Lista de classes CSS prontas para injeção */
  classNames: string[];
  /** Variáveis CSS prontas para injeção no elemento */
  style: React.CSSProperties;
  /** Indica se há pelo menos um efeito ativo */
  hasEffects: boolean;
  /** Configuração resolvida de brasas (presente apenas quando o efeito ember estiver ativo) */
  ember?: ResolvedEmberConfig;
}

/**
 * Opções para a resolução da pilha de efeitos.
 */
export interface ResolveEffectStackOptions {
  /** Força o comportamento de redução de movimento (ignora efeitos animados) */
  prefersReducedMotion?: boolean;
}
