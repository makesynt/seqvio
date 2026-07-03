import { hasCjk } from "./textPath";
import { VIRGIL_FAMILY, LONGCANG_FAMILY } from "./handwritingFonts";

function quoteFontFamily(family: string): string {
  return family.includes(" ") ? `"${family}"` : family;
}

/** Pick SVG handwriting family when theme.handDrawn is enabled. */
export function pickHandwritingFontFamily(
  text: string,
  cjkFamily = LONGCANG_FAMILY,
): string {
  return hasCjk(text)
    ? `${quoteFontFamily(cjkFamily)}, ${quoteFontFamily(VIRGIL_FAMILY)}`
    : VIRGIL_FAMILY;
}
