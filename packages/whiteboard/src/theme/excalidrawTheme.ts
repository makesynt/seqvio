/**
 * Excalidraw-inspired preset: roughjs lines + Virgil handwriting for Latin text.
 */

import { WhiteboardTheme } from './defaultTheme';

export const excalidrawTheme: Partial<WhiteboardTheme> = {
  handDrawn: true,
  roughness: 1.25,
  bowing: 1.1,
  /** CJK text roughjs multiplier; 0 = crisp SVG (default). */
  textRoughness: 0,
  colors: {
    ink: '#1e1e1e',
    accent: '#1971c2',
    accent2: '#2f9e44',
    muted: '#868e96',
    surface: '#ffffff',
    cta: '#e03131',
    background: '#ffffff',
  },
  strokeWidth: 2,
  strokeWidthBold: 2.5,
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
  // Type scale calibrated for a 1280×720 canvas — Excalidraw-style tends to
  // use slightly larger display text and generous body for legibility.
  typeScale: {
    display: 80,
    h1: 52,
    h2: 36,
    body: 26,
    caption: 18,
  },
  spacing: {
    padX: 80,
    padY: 64,
    gapLg: 52,
    gapMd: 30,
    gapSm: 14,
  },
};
