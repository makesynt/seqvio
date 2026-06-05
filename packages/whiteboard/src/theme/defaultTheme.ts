/**
 * Default whiteboard theme — refined stroke-first look
 */

export type TextRenderMode = 'fill' | 'stroke' | 'stroke-wash';
export type ShapeFillDefault = 'none' | 'wash';

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
    /** @deprecated Use longcang */
    yozai?: string;
    /** @deprecated Use longcang */
    xiaolai?: string;
    /** @deprecated Use longcang */
    wenkai?: string;
  };
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
}

export const defaultWhiteboardTheme: WhiteboardTheme = {
  colors: {
    ink: '#2c3e50',
    accent: '#3498db',
    accent2: '#27ae60',
    muted: '#7f8c8d',
    surface: '#ffffff',
    cta: '#e74c3c',
    background: '#f8f9fb',
  },
  strokeWidth: 2,
  strokeWidthBold: 3,
  textRender: 'fill',
  textWashOpacity: 0.3,
  shapeFillDefault: 'wash',
  shapeWashFill: 'rgba(255,255,255,0.65)',
  shapeWashOpacity: 0.85,
  fontFamily:
    '"Microsoft YaHei UI","PingFang SC","Noto Sans SC",system-ui,sans-serif',
  pathFontUrls: {
    noto: './NotoSansSC-Regular.woff',
    dejavu: './DejaVuSans.ttf',
    virgil: undefined,
  },
  defaultBorderRadius: 10,
  penSize: 54,
};

export function getTextStrokeWidth(
  fontSize: number,
  theme: WhiteboardTheme = defaultWhiteboardTheme
): number {
  if (fontSize >= 40) return theme.strokeWidthBold;
  if (fontSize >= 24) return theme.strokeWidth + 0.5;
  return theme.strokeWidth;
}

export function mergeTheme(partial?: Partial<WhiteboardTheme>): WhiteboardTheme {
  if (!partial) return defaultWhiteboardTheme;
  return {
    ...defaultWhiteboardTheme,
    ...partial,
    colors: { ...defaultWhiteboardTheme.colors, ...partial.colors },
    pathFontUrls: {
      ...defaultWhiteboardTheme.pathFontUrls,
      ...(partial.pathFontUrls ?? {}),
    },
  };
}
