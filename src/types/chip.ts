export interface ChipStyle {
  shape?: 'pill' | 'rounded' | 'diamond' | 'text';
  background?: {
    type?: 'solid' | 'gradient' | 'transparent';
    color?: string; // hex, used when type is 'solid'
    opacity?: number; // 0-100, applied to background
    gradientFrom?: string; // hex, used when type is 'gradient'
    gradientTo?: string; // hex, used when type is 'gradient'
    gradientAngle?: number; // degrees, 0-360
  };
  border?: {
    width?: number; // px, 0 for none
    color?: string; // hex
    style?: 'solid' | 'dashed' | 'dotted';
  };
  text?: {
    color?: string; // hex
    weight?: 400 | 500 | 600 | 700;
    size?: number; // px, 10-16 range recommended
    uppercase?: boolean;
    fontFamily?: 'sans' | 'mono' | 'serif';
    italic?: boolean;
    letterSpacing?: 'normal' | 'wide' | 'wider';
  };
  effects?: {
    shadow?: boolean; // uses --sombra-1
    glow?: {
      enabled: boolean;
      color?: string; // hex, defaults to border color
      intensity?: number; // 0-100, maps to blur radius
    };
    shimmer?: {
      enabled: boolean; // animated light sweep across the chip
      speed?: number; // seconds per cycle, 1-5
    };
    pulse?: {
      enabled: boolean; // opacity pulse
      speed?: number; // seconds per cycle, 1-5
    };
  };
}
