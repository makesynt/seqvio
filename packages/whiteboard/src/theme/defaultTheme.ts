/**
 * Default whiteboard theme — refined stroke-first look
 */

export type TextRenderMode = "fill" | "stroke" | "stroke-wash";
export type ShapeFillDefault = "none" | "wash";

/**
 * Font-size hierarchy for a WhiteboardScene canvas.
 *
 * All values are in CSS pixels at the scene's native resolution (typically
 * 1280×720 or 1920×1080). Pick from these levels rather than inventing ad-hoc
 * sizes — consistent scale is what makes a video feel polished.
 *
 * Intended semantics (not enforced by the renderer):
 *   display  — hero title, one per scene
 *   h1       — section heading
 *   h2       — card / panel heading
 *   body     — explanation text, list items
 *   caption  — labels, marginal annotations, footer chrome
 */
export interface TypeScale {
  display: number;
  h1: number;
  h2: number;
  body: number;
  caption: number;
}

/**
 * Named spacing token set for a scene canvas.
 *
 * padX / padY — edge insets for content placed near the canvas border.
 * gapLg / gapMd / gapSm — vertical (or horizontal) distance between elements.
 *
 * Using these tokens keeps layout rhythm consistent within a theme and makes
 * per-theme layout adjustments trivial.
 */
export interface Spacing {
  /** Left / right edge inset (pixels). */
  padX: number;
  /** Top / bottom edge inset (pixels). */
  padY: number;
  /** Distance between major sections. */
  gapLg: number;
  /** Distance between related elements. */
  gapMd: number;
  /** Distance between tightly coupled elements. */
  gapSm: number;
}

export interface WhiteboardTheme {
  colors: {
    ink: string;
    accent: string;
    accent2: string;
    muted: string;
    surface: string;
    cta: string;
    background: string;
  };
  strokeWidth: number;
  strokeWidthBold: number;
  textRender: TextRenderMode;
  textWashOpacity: number;
  shapeFillDefault: ShapeFillDefault;
  shapeWashFill: string;
  shapeWashOpacity: number;
  fontFamily: string;
  pathFontUrls: {
    noto: string;
    dejavu: string;
    /** Hand-drawn Latin (woff2, SVG text). */
    virgil?: string;
    /** Hand-drawn CJK (Long Cang 龙苍, truetype, SVG text). */
    longcang?: string;
    /** Hand-drawn CJK (Yozai 悠哉, truetype, SVG text). */
    yozai?: string;
    /** Hand-drawn CJK (Xiaolai 小赖, truetype, SVG text). */
    xiaolai?: string;
    /** Hand-drawn CJK (LXGW WenKai Lite 霞鹜文楷, truetype, SVG text). */
    wenkai?: string;
    /** Hand-drawn CJK (Liu Jian Mao Cao 刘建毛草, truetype, SVG text). */
    liuJianMaoCao?: string;
    /** Hand-drawn CJK (Zhi Mang Xing 志莽行, truetype, SVG text). */
    zhiMangXing?: string;
  };
  /** Preferred CJK family for handDrawn SVG text when DrawText.font is not set. */
  cjkHandwritingFamily?: string;
  defaultBorderRadius: number;
  /** Use roughjs hand-drawn strokes for DrawShape (seed-stable for video). */
  handDrawn?: boolean;
  /** roughjs roughness when handDrawn (Excalidraw-like ~1.0–1.5). */
  roughness?: number;
  /** roughjs bowing when handDrawn. */
  bowing?: number;
  /**
   * CJK text roughness multiplier when handDrawn (0 = crisp SVG, ~0.4–0.6 = light sketch).
   */
  textRoughness?: number;
  /** Pen tip cursor size in CSS pixels (Hand component). */
  penSize?: number;
  /**
   * Font-size hierarchy for DrawText elements.
   *
   * Use `theme.typeScale.body` etc. instead of hard-coded pixel values so
   * that switching themes automatically adjusts the entire type ladder.
   *
   * DrawText falls back to `typeScale.body` when neither a `fontSize` prop
   * nor any override is provided.
   */
  typeScale: TypeScale;
  /**
   * Named spacing tokens for layout.
   *
   * Use `theme.spacing.padX` etc. when positioning DrawText / DrawShape
   * elements to keep scenes consistent with the theme's layout rhythm.
   */
  spacing: Spacing;
}

/** Default type scale — calibrated for a 1280 × 720 canvas. */
export const defaultTypeScale: TypeScale = {
  display: 72,
  h1: 48,
  h2: 34,
  body: 24,
  caption: 18,
};

/** Default spacing — calibrated for a 1280 × 720 canvas. */
export const defaultSpacing: Spacing = {
  padX: 80,
  padY: 60,
  gapLg: 48,
  gapMd: 28,
  gapSm: 14,
};

export const defaultWhiteboardTheme: WhiteboardTheme = {
  colors: {
    ink: "#2c3e50",
    accent: "#3498db",
    accent2: "#27ae60",
    muted: "#7f8c8d",
    surface: "#ffffff",
    cta: "#e74c3c",
    background: "#f8f9fb",
  },
  strokeWidth: 2,
  strokeWidthBold: 3,
  textRender: "fill",
  textWashOpacity: 0.3,
  shapeFillDefault: "wash",
  shapeWashFill: "rgba(255,255,255,0.65)",
  shapeWashOpacity: 0.85,
  fontFamily:
    '"Microsoft YaHei UI","PingFang SC","Noto Sans SC",system-ui,sans-serif',
  pathFontUrls: {
    noto: "./NotoSansSC-Regular.woff",
    dejavu: "./DejaVuSans.ttf",
    virgil: undefined,
  },
  defaultBorderRadius: 10,
  penSize: 54,
  typeScale: defaultTypeScale,
  spacing: defaultSpacing,
};

export function getTextStrokeWidth(
  fontSize: number,
  theme: WhiteboardTheme = defaultWhiteboardTheme,
): number {
  if (fontSize >= 40) return theme.strokeWidthBold;
  if (fontSize >= 24) return theme.strokeWidth + 0.5;
  return theme.strokeWidth;
}

export function mergeTheme(
  partial?: Partial<WhiteboardTheme>,
): WhiteboardTheme {
  if (!partial) return defaultWhiteboardTheme;
  return {
    ...defaultWhiteboardTheme,
    ...partial,
    colors: { ...defaultWhiteboardTheme.colors, ...partial.colors },
    pathFontUrls: {
      ...defaultWhiteboardTheme.pathFontUrls,
      ...(partial.pathFontUrls ?? {}),
    },
    typeScale: { ...defaultWhiteboardTheme.typeScale, ...partial.typeScale },
    spacing: { ...defaultWhiteboardTheme.spacing, ...partial.spacing },
  };
}
