/**
 * Hand-drawn SVG text fonts (Excalidraw Virgil + Long Cang 龙苍 for CJK).
 */

export const VIRGIL_FAMILY = "Virgil";
export const LONGCANG_FAMILY = "Long Cang";
export const XIAOLAI_FAMILY = "Xiaolai";
export const WENKAI_FAMILY = "LXGW WenKai Lite";
export const YOZAI_FAMILY = "Yozai";
export const LIU_JIAN_MAO_CAO_FAMILY = "Liu Jian Mao Cao";
export const ZHI_MANG_XING_FAMILY = "Zhi Mang Xing";

export const DEFAULT_VIRGIL_URL = "./Virgil.woff2";
export const DEFAULT_LONGCANG_URL = "./LongCang-Regular.ttf";
export const DEFAULT_XIAOLAI_URL = "./Xiaolai-Regular.ttf";
export const DEFAULT_WENKAI_URL = "./LXGWWenKaiLite-Regular.ttf";
export const DEFAULT_YOZAI_URL = "./Yozai-Regular.ttf";
export const DEFAULT_LIU_JIAN_MAO_CAO_URL = "./LiuJianMaoCao-Regular.ttf";
export const DEFAULT_ZHI_MANG_XING_URL = "./ZhiMangXing-Regular.ttf";

export const CJK_HANDWRITING_UNICODE_RANGE = [
  "U+2E80-2EFF",
  "U+2F00-2FDF",
  "U+3000-303F",
  "U+31C0-31EF",
  "U+3400-4DBF",
  "U+4E00-9FFF",
  "U+F900-FAFF",
  "U+FF00-FFEF",
].join(", ");

export type HandwritingFontFormat = "woff2" | "truetype";

export async function preloadFontFace(
  family: string,
  fontUrl: string,
  format: HandwritingFontFormat = "woff2",
  unicodeRange?: string,
): Promise<void> {
  if (typeof FontFace === "undefined" || typeof document === "undefined") {
    return;
  }
  try {
    const face = new FontFace(family, `url(${fontUrl}) format('${format}')`, {
      weight: "400",
      style: "normal",
      ...(unicodeRange ? { unicodeRange } : {}),
    });
    const loaded = await face.load();
    document.fonts.add(loaded);
  } catch {
    // SceneFontFaces @font-face fallback
  }
}

export async function preloadHandwritingFonts(options?: {
  virgilUrl?: string;
  longcangUrl?: string;
  yozaiUrl?: string;
  xiaolaiUrl?: string;
  wenkaiUrl?: string;
  liuJianMaoCaoUrl?: string;
  zhiMangXingUrl?: string;
}): Promise<void> {
  const virgilUrl = options?.virgilUrl ?? DEFAULT_VIRGIL_URL;
  const longcangUrl = options?.longcangUrl ?? DEFAULT_LONGCANG_URL;
  const xiaolaiUrl = options?.xiaolaiUrl ?? DEFAULT_XIAOLAI_URL;
  const wenkaiUrl = options?.wenkaiUrl ?? DEFAULT_WENKAI_URL;
  const yozaiUrl = options?.yozaiUrl ?? DEFAULT_YOZAI_URL;
  const liuJianMaoCaoUrl =
    options?.liuJianMaoCaoUrl ?? DEFAULT_LIU_JIAN_MAO_CAO_URL;
  const zhiMangXingUrl = options?.zhiMangXingUrl ?? DEFAULT_ZHI_MANG_XING_URL;
  await Promise.all([
    preloadFontFace(VIRGIL_FAMILY, virgilUrl, "woff2"),
    preloadFontFace(
      LONGCANG_FAMILY,
      longcangUrl,
      "truetype",
      CJK_HANDWRITING_UNICODE_RANGE,
    ),
    preloadFontFace(
      XIAOLAI_FAMILY,
      xiaolaiUrl,
      "truetype",
      CJK_HANDWRITING_UNICODE_RANGE,
    ),
    preloadFontFace(
      WENKAI_FAMILY,
      wenkaiUrl,
      "truetype",
      CJK_HANDWRITING_UNICODE_RANGE,
    ),
    preloadFontFace(
      YOZAI_FAMILY,
      yozaiUrl,
      "truetype",
      CJK_HANDWRITING_UNICODE_RANGE,
    ),
    preloadFontFace(
      LIU_JIAN_MAO_CAO_FAMILY,
      liuJianMaoCaoUrl,
      "truetype",
      CJK_HANDWRITING_UNICODE_RANGE,
    ),
    preloadFontFace(
      ZHI_MANG_XING_FAMILY,
      zhiMangXingUrl,
      "truetype",
      CJK_HANDWRITING_UNICODE_RANGE,
    ),
  ]);
}
