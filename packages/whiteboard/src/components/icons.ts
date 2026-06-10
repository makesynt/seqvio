/**
 * Built-in icon library for DrawIcon.
 *
 * Each icon is an array of SVG path `d` strings in a 24x24 viewbox (stroke
 * style, no fill — they animate with the same stroke-reveal as DrawShape).
 * Kept small and dependency-free: a curated set covers the common explainer
 * needs (check, cross, arrow, idea, etc.) without pulling a whole icon package
 * (bundle weight + licensing surface). Paths are simple line/curve geometry so
 * they reveal cleanly under stroke-dashoffset animation.
 *
 * Geometry is hand-authored in a 0..24 coordinate space; DrawIcon scales it to
 * the requested size and translates it to the requested position.
 */

export type IconName =
  | 'check'
  | 'cross'
  | 'arrow-right'
  | 'arrow-down'
  | 'circle'
  | 'star'
  | 'lightbulb'
  | 'heart'
  | 'plus'
  | 'minus'
  | 'play'
  | 'document';

/** Path `d` strings authored in a 24x24 box. */
export const ICON_PATHS: Record<IconName, string[]> = {
  check: ['M4 13 L9 18 L20 5'],
  cross: ['M5 5 L19 19', 'M19 5 L5 19'],
  'arrow-right': ['M3 12 L20 12', 'M14 6 L20 12 L14 18'],
  'arrow-down': ['M12 3 L12 20', 'M6 14 L12 20 L18 14'],
  circle: ['M12 2 A10 10 0 1 1 11.99 2'],
  star: ['M12 2 L15 9 L22 9 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9 L9 9 Z'],
  lightbulb: [
    'M9 18 L15 18',
    'M10 21 L14 21',
    'M12 2 A7 7 0 0 1 16 15 L16 17 L8 17 L8 15 A7 7 0 0 1 12 2 Z',
  ],
  heart: ['M12 21 C12 21 3 14 3 8 A4.5 4.5 0 0 1 12 6 A4.5 4.5 0 0 1 21 8 C21 14 12 21 12 21 Z'],
  plus: ['M12 4 L12 20', 'M4 12 L20 12'],
  minus: ['M4 12 L20 12'],
  play: ['M6 4 L20 12 L6 20 Z'],
  document: [
    'M6 2 L14 2 L19 7 L19 22 L6 22 Z',
    'M14 2 L14 7 L19 7',
    'M9 12 L16 12',
    'M9 16 L16 16',
  ],
};

export const ICON_NAMES = Object.keys(ICON_PATHS) as IconName[];

export function isIconName(name: string): name is IconName {
  return name in ICON_PATHS;
}
