/**
 * Hand-drawn SVG text fonts (Excalidraw Virgil + Long Cang 龙苍 for CJK).
 */

export const VIRGIL_FAMILY = 'Virgil';
export const LONGCANG_FAMILY = 'Long Cang';

/** @deprecated Use LONGCANG_FAMILY */
export const YOZAI_FAMILY = LONGCANG_FAMILY;
/** @deprecated Use LONGCANG_FAMILY */
export const XIAOLAI_FAMILY = LONGCANG_FAMILY;
/** @deprecated Use LONGCANG_FAMILY */
export const WENKAI_FAMILY = LONGCANG_FAMILY;

export const DEFAULT_VIRGIL_URL = './Virgil.woff2';
export const DEFAULT_LONGCANG_URL = './LongCang-Regular.ttf';

/** @deprecated Use DEFAULT_LONGCANG_URL */
export const DEFAULT_YOZAI_URL = DEFAULT_LONGCANG_URL;
/** @deprecated Use DEFAULT_LONGCANG_URL */
export const DEFAULT_XIAOLAI_URL = DEFAULT_LONGCANG_URL;
/** @deprecated Use DEFAULT_LONGCANG_URL */
export const DEFAULT_WENKAI_URL = DEFAULT_LONGCANG_URL;

export type HandwritingFontFormat = 'woff2' | 'truetype';

export async function preloadFontFace(
  family: string,
  fontUrl: string,
  format: HandwritingFontFormat = 'woff2'
): Promise<void> {
  if (typeof FontFace === 'undefined' || typeof document === 'undefined') {
    return;
  }
  try {
    const face = new FontFace(
      family,
      `url(${fontUrl}) format('${format}')`,
      {
        weight: '400',
        style: 'normal',
      }
    );
    const loaded = await face.load();
    document.fonts.add(loaded);
  } catch {
    // SceneFontFaces @font-face fallback
  }
}

export async function preloadHandwritingFonts(options?: {
  virgilUrl?: string;
  longcangUrl?: string;
  /** @deprecated Use longcangUrl */
  yozaiUrl?: string;
  /** @deprecated Use longcangUrl */
  xiaolaiUrl?: string;
  /** @deprecated Use longcangUrl */
  wenkaiUrl?: string;
}): Promise<void> {
  const virgilUrl = options?.virgilUrl ?? DEFAULT_VIRGIL_URL;
  const longcangUrl =
    options?.longcangUrl ??
    options?.yozaiUrl ??
    options?.xiaolaiUrl ??
    options?.wenkaiUrl ??
    DEFAULT_LONGCANG_URL;
  await Promise.all([
    preloadFontFace(VIRGIL_FAMILY, virgilUrl, 'woff2'),
    preloadFontFace(LONGCANG_FAMILY, longcangUrl, 'truetype'),
  ]);
}
