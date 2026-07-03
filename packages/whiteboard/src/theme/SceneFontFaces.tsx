/**
 * Injects @font-face rules for bundled handwriting / CJK fonts.
 */

import React from "react";
import { WhiteboardTheme } from "./defaultTheme";
import {
  VIRGIL_FAMILY,
  LONGCANG_FAMILY,
  XIAOLAI_FAMILY,
  WENKAI_FAMILY,
  YOZAI_FAMILY,
  LIU_JIAN_MAO_CAO_FAMILY,
  ZHI_MANG_XING_FAMILY,
  CJK_HANDWRITING_UNICODE_RANGE,
} from "../utils/handwritingFonts";

export function SceneFontFaces({ theme }: { theme: WhiteboardTheme }) {
  const { pathFontUrls } = theme;
  const rules: string[] = [];

  if (pathFontUrls.virgil) {
    rules.push(`
@font-face {
  font-family: '${VIRGIL_FAMILY}';
  src: url('${pathFontUrls.virgil}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}`);
  }

  const cjkFonts = [
    [LONGCANG_FAMILY, pathFontUrls.longcang],
    [XIAOLAI_FAMILY, pathFontUrls.xiaolai],
    [WENKAI_FAMILY, pathFontUrls.wenkai],
    [YOZAI_FAMILY, pathFontUrls.yozai],
    [LIU_JIAN_MAO_CAO_FAMILY, pathFontUrls.liuJianMaoCao],
    [ZHI_MANG_XING_FAMILY, pathFontUrls.zhiMangXing],
  ] as const;

  for (const [family, url] of cjkFonts) {
    if (!url) continue;
    rules.push(`
@font-face {
  font-family: '${family}';
  src: url('${url}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
  unicode-range: ${CJK_HANDWRITING_UNICODE_RANGE};
}`);
  }

  return rules.length > 0 ? (
    <style dangerouslySetInnerHTML={{ __html: rules.join("\n") }} />
  ) : null;
}
