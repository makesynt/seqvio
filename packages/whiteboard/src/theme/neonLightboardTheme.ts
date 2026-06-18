/**
 * Neon lightboard preset: hand-drawn strokes glowing on a dark stage.
 *
 * A generic "glowing handwritten board" look — bright neon strokes over a black
 * background, as if drawn with a luminous marker on glass. Pairs well with an
 * SVG glow filter applied at the scene level (see `NEON_GLOW_FILTER_ID` /
 * `neonGlowFilterMarkup` for a ready-made one).
 *
 * This is purely a visual style. It carries no fixed content, layout, or icon
 * set — compose your own scenes on top of it.
 */

import { WhiteboardTheme } from './defaultTheme';

/**
 * Neon stroke palette for use as per-element `strokeColor`. These are plain,
 * widely-used neon hues — pick whatever reads best on a black stage.
 */
export const neonPalette = {
  magenta: '#e879f9',
  cyan: '#34e0f2',
  green: '#4ade80',
  orange: '#fb923c',
  purple: '#b794ff',
} as const;

/** Stable id for the bundled glow filter (use with `filter: url(#...)`). */
export const NEON_GLOW_FILTER_ID = 'neon-glow';

/**
 * Ready-made SVG `<filter>` markup that produces a neon bloom: three blur
 * passes merged under the crisp source stroke. Drop it into a zero-size inline
 * `<svg>` once per scene, then reference it via
 * `style={{ filter: 'url(#neon-glow)' }}` on the stage.
 */
export const neonGlowFilterMarkup = {
  id: NEON_GLOW_FILTER_ID,
  /** Blur std deviations, inner → outer. */
  blurStdDeviations: [2, 6, 12] as const,
};

export const neonLightboardTheme: Partial<WhiteboardTheme> = {
  handDrawn: true,
  roughness: 1.25,
  bowing: 1.1,
  /** CJK text roughjs multiplier; 0 = crisp SVG (default). */
  textRoughness: 0,
  colors: {
    // Neon strokes glow brightest in cyan; callers usually override per element.
    ink: neonPalette.cyan,
    accent: neonPalette.magenta,
    accent2: neonPalette.green,
    muted: neonPalette.purple,
    surface: '#000000',
    cta: neonPalette.orange,
    background: '#000000',
  },
  strokeWidth: 3,
  strokeWidthBold: 4,
  // No paper-style wash fills on a glowing board.
  shapeFillDefault: 'none',
  defaultBorderRadius: 8,
  textRender: 'fill',
  penSize: 56,
  fontFamily:
    'Virgil, "Long Cang", "Segoe UI Emoji", "Apple Color Emoji", sans-serif',
  pathFontUrls: {
    virgil: './Virgil.woff2',
    longcang: './LongCang-Regular.ttf',
    noto: './NotoSansSC-Regular.woff',
    dejavu: './DejaVuSans.ttf',
  },
  // Neon style works well with slightly larger text — glow effects need stroke
  // width to show, so body text should be a bit bigger than the default.
  typeScale: {
    display: 84,
    h1: 56,
    h2: 38,
    body: 28,
    caption: 20,
  },
  spacing: {
    padX: 80,
    padY: 64,
    gapLg: 56,
    gapMd: 32,
    gapSm: 16,
  },
};
