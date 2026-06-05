/**
 * Injects @font-face rules for bundled handwriting / CJK fonts.
 */

import React from 'react';
import { WhiteboardTheme } from './defaultTheme';
import { VIRGIL_FAMILY, LONGCANG_FAMILY } from '../utils/handwritingFonts';

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

  const longcangUrl =
    pathFontUrls.longcang ??
    pathFontUrls.yozai ??
    pathFontUrls.xiaolai ??
    pathFontUrls.wenkai;
  if (longcangUrl) {
    rules.push(`
@font-face {
  font-family: '${LONGCANG_FAMILY}';
  src: url('${longcangUrl}') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}`);
  }

  return rules.length > 0 ? (
    <style dangerouslySetInnerHTML={{ __html: rules.join('\n') }} />
  ) : null;
}
