/**
 * Pin & Paper theme — field-notebook editorial style.
 *
 * Inspired by the Pin & Paper visual system: yellow legal-pad surface, deep
 * cobalt-blue ink, Long Cang hand-drawn strokes, and the warmth of a notebook
 * pinned to a corkboard.
 *
 * Design language:
 * - Background: warm yellow paper (#EFE56A) via `texture="none"` + `background` prop
 * - Ink: deep cobalt blue (#1F3A8A) — all shapes, all text by default
 * - Accent: cinnabar red (#C2342B) — use sparingly (stamps, alerts, single emphasis)
 * - Accent2: olive (#6B7A2E) — tertiary accent for positive / growth signals
 * - Cards: cream (#F8F1D6) fill with cobalt border (simulate via fillColor + strokeColor)
 * - Font: Long Cang (CJK hand-drawn) / Virgil (Latin hand-drawn) — handDrawn must stay true
 *
 * Typography scale (for DrawText `fontSize` values — canvas at 1280×720):
 *   display  : 82 px — hero title (one per scene)
 *   h1       : 56 px — section title
 *   h2       : 38 px — card heading
 *   body     : 26 px — body / explanation text
 *   caption  : 20 px — marginal note, label (rotate -3° via style override when hand-note feel is needed)
 *
 * Spacing (pin to these; avoid ad-hoc values):
 *   pad-edge : 90 px — left/right margin
 *   pad-top  : 80 px — top content zone
 *   gap-lg   : 56 px — between major sections
 *   gap-md   : 36 px — between related elements
 *   gap-sm   : 18 px — between tightly coupled elements
 *
 * Background: use `texture="none"` on WhiteboardScene and set `background="#EFE56A"`.
 *
 * Card simulation (no CSS shadows in seqvio — approximate with shapes):
 *   1. DrawShape type="rounded-rectangle" with fillColor="#F8F1D6" strokeColor="#1F3A8A" strokeWidth=2
 *   2. Offset a second thin rectangle (+4px x, +5px y) with fillColor="#1F3A8A" for the hard shadow
 *
 * Do not use more than two accent colors per scene.
 * Keep the background yellow — never override it with white/grey on a Pin & Paper scene.
 */

import { WhiteboardTheme, TypeScale, Spacing } from './defaultTheme';

/** Pin & Paper palette tokens — use these, not ad-hoc hex literals. */
export const pinPalette = {
  paper: '#EFE56A',        // background surface
  cream: '#F8F1D6',        // card fill
  ink: '#1F3A8A',          // primary text, borders, shapes
  inkSoft: '#2D4FB8',      // secondary ink (subdued shapes)
  red: '#C2342B',          // accent — stamps, alerts only
  olive: '#6B7A2E',        // accent2 — positive signals
  cta: '#D8702A',          // warm orange CTA
} as const;

export const pinAndPaperTheme: Partial<WhiteboardTheme> = {
  handDrawn: true,
  roughness: 1.1,
  bowing: 0.9,
  textRoughness: 0,        // CJK text stays crisp

  colors: {
    ink: pinPalette.ink,
    accent: pinPalette.red,
    accent2: pinPalette.olive,
    muted: pinPalette.inkSoft,
    surface: pinPalette.cream,
    cta: pinPalette.cta,
    background: pinPalette.paper,
  },

  strokeWidth: 2,
  strokeWidthBold: 3,
  shapeFillDefault: 'none',
  defaultBorderRadius: 10,
  textRender: 'fill',
  penSize: 52,

  // Long Cang for hand-drawn CJK strokes; Virgil for Latin hand-drawn
  fontFamily:
    '"Long Cang", Virgil, "Segoe UI Emoji", "Apple Color Emoji", cursive',

  pathFontUrls: {
    virgil: './Virgil.woff2',
    longcang: './LongCang-Regular.ttf',
    noto: './NotoSansSC-Regular.woff',
    dejavu: './DejaVuSans.ttf',
  },

  // Scale calibrated for 1280×720; matches the Pin & Paper design.md tokens
  // scaled to this canvas size.
  typeScale: {
    display: 82,
    h1: 56,
    h2: 38,
    body: 26,
    caption: 20,
  } satisfies TypeScale,

  spacing: {
    padX: 90,
    padY: 80,
    gapLg: 56,
    gapMd: 36,
    gapSm: 18,
  } satisfies Spacing,
};
