/**
 * Browser-safe SVG text path generation via opentype.js
 */

import opentype from 'opentype.js';
import { Point } from '../types';
import {
  DEFAULT_VIRGIL_URL,
  DEFAULT_LONGCANG_URL,
  DEFAULT_YOZAI_URL,
  DEFAULT_XIAOLAI_URL,
  DEFAULT_WENKAI_URL,
} from './handwritingFonts';
import { roughPathFromSvg, RoughStyle } from './roughPath';

export {
  DEFAULT_VIRGIL_URL,
  DEFAULT_LONGCANG_URL,
  DEFAULT_YOZAI_URL,
  DEFAULT_XIAOLAI_URL,
  DEFAULT_WENKAI_URL,
};

export interface TextPathResult {
  pathD: string;
  paths: string[];
  totalLength: number;
  bounds: { x: number; y: number; width: number; height: number };
}

const pathCache = new Map<string, TextPathResult>();
const fonts: {
  noto: opentype.Font | null;
  dejavu: opentype.Font | null;
  longcang: opentype.Font | null;
} = {
  noto: null,
  dejavu: null,
  longcang: null,
};
const fontLoadPromises = new Map<string, Promise<opentype.Font | null>>();

export const DEFAULT_DEJAVU_URL = './DejaVuSans.ttf';
export const DEFAULT_NOTO_URL = './NotoSansSC-Regular.woff';

const CJK_REGEX = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/;

export function hasCjk(text: string): boolean {
  return CJK_REGEX.test(text);
}

function cacheKey(text: string, fontSize: number, align: string, fontId: string): string {
  return `${fontId}:${fontSize}:${align}:${text}`;
}

function computeAlignOffset(
  textWidth: number,
  align: 'left' | 'center' | 'right'
): number {
  if (align === 'center') return -textWidth / 2;
  if (align === 'right') return -textWidth;
  return 0;
}

function pickFontForText(text: string, preferXiaolai = false): opentype.Font | null {
  if ((preferXiaolai || hasCjk(text)) && fonts.longcang) {
    return fonts.longcang;
  }
  if (hasCjk(text) && fonts.noto) return fonts.noto;
  if (fonts.dejavu) return fonts.dejavu;
  return fonts.noto ?? fonts.dejavu;
}

/** Load Long Cang into opentype.js (non-SVG text path fallback). */
export async function preloadLongcangOpentype(
  fontUrl: string = DEFAULT_LONGCANG_URL
): Promise<void> {
  fonts.longcang = await loadFontFromUrl(fontUrl);
  pathCache.clear();
}

/** @deprecated Use preloadLongcangOpentype */
export const preloadYozaiOpentype = preloadLongcangOpentype;
/** @deprecated Use preloadLongcangOpentype */
export const preloadXiaolaiOpentype = preloadLongcangOpentype;
/** @deprecated Use preloadLongcangOpentype */
export const preloadWenkaiOpentype = preloadLongcangOpentype;

async function loadFontFromUrl(fontUrl: string): Promise<opentype.Font | null> {
  if (fontLoadPromises.has(fontUrl)) {
    return fontLoadPromises.get(fontUrl)!;
  }

  const promise = fetch(fontUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Font fetch failed: ${fontUrl}`);
      return response.arrayBuffer();
    })
    .then((buffer) => opentype.parse(buffer))
    .catch(() => null);

  fontLoadPromises.set(fontUrl, promise);
  return promise;
}

export async function preloadTextFont(fontUrl: string = DEFAULT_DEJAVU_URL): Promise<void> {
  const font = await loadFontFromUrl(fontUrl);
  if (fontUrl.includes('Noto') || fontUrl.includes('noto')) {
    fonts.noto = font;
  } else {
    fonts.dejavu = font;
  }
}

export async function preloadPathFonts(
  notoUrl: string = DEFAULT_NOTO_URL,
  dejavuUrl: string = DEFAULT_DEJAVU_URL
): Promise<void> {
  const [noto, dejavu] = await Promise.all([
    loadFontFromUrl(notoUrl),
    loadFontFromUrl(dejavuUrl),
  ]);
  fonts.noto = noto;
  fonts.dejavu = dejavu;
  pathCache.clear();
}

export function setLoadedFont(font: opentype.Font | null): void {
  fonts.dejavu = font;
}

export function textToSvgPathsSync(
  text: string,
  options: {
    fontSize?: number;
    position?: Point;
    align?: 'left' | 'center' | 'right';
    preferYozai?: boolean;
    preferXiaolai?: boolean;
    /** @deprecated Use preferYozai */
    preferWenkai?: boolean;
  } = {}
): TextPathResult | null {
  const fontSize = options.fontSize ?? 48;
  const position = options.position ?? { x: 0, y: 0 };
  const align = options.align ?? 'left';
  const preferHandwriting =
    options.preferYozai === true ||
    options.preferXiaolai === true ||
    options.preferWenkai === true;
  const activeFont = pickFontForText(text, preferHandwriting);
  if (!activeFont) {
    return null;
  }

  const fontId =
    activeFont === fonts.longcang
      ? 'longcang'
      : activeFont === fonts.noto
        ? 'noto'
        : 'dejavu';
  const key = cacheKey(text, fontSize, align, fontId);

  if (pathCache.has(key)) {
    return pathCache.get(key)!;
  }

  const probe = activeFont.getPath(text, 0, fontSize, fontSize);
  const bbox = probe.getBoundingBox();
  const textWidth = bbox.x2 - bbox.x1;
  const alignOffset = computeAlignOffset(textWidth, align);
  const translated = activeFont.getPath(
    text,
    position.x + alignOffset,
    position.y,
    fontSize
  );
  const pathD = translated.toPathData(2);
  const bounds = translated.getBoundingBox();

  const result: TextPathResult = {
    pathD,
    paths: [pathD],
    totalLength: Math.max(textWidth, fontSize * Math.max(1, text.length) * 0.35),
    bounds: {
      x: bounds.x1,
      y: bounds.y1,
      width: bounds.x2 - bounds.x1,
      height: bounds.y2 - bounds.y1,
    },
  };

  pathCache.set(key, result);
  return result;
}

/**
 * CJK outlines via roughjs (legacy; handDrawn mode uses crisp SVG Xiaolai text).
 */
export function textToRoughHandPathSync(
  text: string,
  options: {
    fontSize?: number;
    position?: Point;
    align?: 'left' | 'center' | 'right';
  },
  roughStyle: RoughStyle
): TextPathResult | null {
  const base = textToSvgPathsSync(text, {
    ...options,
    preferXiaolai: true,
    preferYozai: true,
  });
  if (!base?.pathD) {
    return null;
  }

  const cacheKey = `rough:${roughStyle.seed}:${roughStyle.roughness}:${text}:${options.fontSize}:${options.align}`;
  if (pathCache.has(cacheKey)) {
    return pathCache.get(cacheKey)!;
  }

  const roughD = roughPathFromSvg(base.pathD, roughStyle);

  const result: TextPathResult = {
    ...base,
    pathD: roughD,
    paths: [roughD],
  };

  pathCache.set(cacheKey, result);
  return result;
}

export async function textToSvgPaths(
  text: string,
  options: {
    fontSize?: number;
    position?: Point;
    align?: 'left' | 'center' | 'right';
    fontUrl?: string;
    notoUrl?: string;
    dejavuUrl?: string;
  } = {}
): Promise<TextPathResult | null> {
  if (!fonts.noto && !fonts.dejavu) {
    await preloadPathFonts(
      options.notoUrl ?? DEFAULT_NOTO_URL,
      options.dejavuUrl ?? options.fontUrl ?? DEFAULT_DEJAVU_URL
    );
  }
  return textToSvgPathsSync(text, options);
}

export function getDefaultFontUrl(): string {
  return DEFAULT_DEJAVU_URL;
}

/** @deprecated Use preloadHandwritingFonts from handwritingFonts.ts */
export { preloadHandwritingFonts as preloadHandwritingFont } from './handwritingFonts';
