import { hasCjk } from './textPath';
import { VIRGIL_FAMILY, LONGCANG_FAMILY } from './handwritingFonts';

/** Pick SVG handwriting family when theme.handDrawn is enabled. */
export function pickHandwritingFontFamily(text: string): string {
  return hasCjk(text) ? LONGCANG_FAMILY : VIRGIL_FAMILY;
}
