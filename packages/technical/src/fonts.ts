/**
 * Code font resolution for technical scenes.
 *
 * JetBrains Mono is bundled with @seqvio/technical and copied into the render
 * output dir as JetBrainsMono-Regular.woff2. System programming fonts remain
 * as fallbacks when the bundled face fails to load.
 */

export const BUNDLED_CODE_FONT_FAMILY = 'JetBrains Mono';
export const BUNDLED_CODE_FONT_FILE = 'JetBrainsMono-Regular.woff2';
export const TERMINAL_FONT_FAMILY = 'Cascadia Mono';
export const TERMINAL_FONT_LATIN_FILE = 'CascadiaMono-Latin-Regular.woff2';
export const TERMINAL_FONT_SYMBOLS_FILE = 'CascadiaMono-Symbols2-Regular.woff2';
export const TERMINAL_FONT_STACK = `"${TERMINAL_FONT_FAMILY}", "Cascadia Mono", Consolas, monospace`;

/**
 * Primary stack for code scenes. Bundled JetBrains Mono is always first so
 * system Nerd Fonts (e.g. 0xProto) cannot steal the look when the woff2 loads
 * a frame late. Remaining entries are emergency fallbacks only.
 */
export const PROGRAMMING_MONO_FONTS = [
  BUNDLED_CODE_FONT_FAMILY,
  'Cascadia Code',
  'Cascadia Mono',
  'Consolas',
  'SF Mono',
  'Menlo',
  'Monaco',
  'DejaVu Sans Mono',
] as const;

const GENERIC_MONO = 'ui-monospace, monospace';
const MISSING_PROBE = '__SeqvioMissingMono__';

function quoteFont(name: string): string {
  return name.includes(' ') ? `"${name}"` : name;
}

/** CSS stack with bundled JetBrains Mono first. */
export function programmingMonoFontStack(): string {
  return [...PROGRAMMING_MONO_FONTS.map(quoteFont), GENERIC_MONO].join(', ');
}

/**
 * Canvas metric probe: if `"Candidate", missing, monospace` measures differently
 * from `missing, monospace`, the candidate face is actually available.
 */
export function isMonoFontInstalled(fontName: string): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    const sample = 'mwmwmwmwil@#%W0123';
    const size = 72;
    ctx.font = `${size}px ${quoteFont(MISSING_PROBE)}, monospace`;
    const baseline = ctx.measureText(sample).width;
    ctx.font = `${size}px ${quoteFont(fontName)}, ${quoteFont(MISSING_PROBE)}, monospace`;
    const withCandidate = ctx.measureText(sample).width;
    return withCandidate !== baseline;
  } catch {
    return false;
  }
}

/** Always prefer the bundled face name; CSS/@font-face supplies the bytes. */
export function resolveProgrammingMonoFont(): string {
  return programmingMonoFontStack();
}

export function detectInstalledProgrammingMonoFonts(): string[] {
  return PROGRAMMING_MONO_FONTS.filter((name) => isMonoFontInstalled(name));
}

let preloadPromise: Promise<void> | null = null;

/** Load the bundled JetBrains Mono into document.fonts before first paint matters. */
export function preloadBundledCodeFont(
  fontUrl: string = `./${BUNDLED_CODE_FONT_FILE}`
): Promise<void> {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') {
    return Promise.resolve();
  }
  if (!preloadPromise) {
    preloadPromise = (async () => {
      try {
        const face = new FontFace(
          BUNDLED_CODE_FONT_FAMILY,
          `url(${fontUrl}) format('woff2')`,
          { weight: '400', style: 'normal', display: 'block' }
        );
        const loaded = await face.load();
        document.fonts.add(loaded);
        if (document.fonts.ready) {
          await document.fonts.ready;
        }
      } catch {
        // Fall back to system stack via CSS font-family.
      }
    })();
  }
  return preloadPromise;
}
