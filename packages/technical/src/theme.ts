import { programmingMonoFontStack } from './fonts';

export const technicalPalette = {
  canvas: 'var(--seqvio-color-background, #0f172a)',
  surface: 'color-mix(in srgb, var(--seqvio-color-background, #0f172a) 92%, var(--seqvio-color-ink, #e2e8f0))',
  panel: 'color-mix(in srgb, var(--seqvio-color-background, #0f172a) 84%, var(--seqvio-color-ink, #e2e8f0))',
  ink: 'var(--seqvio-color-ink, #e2e8f0)',
  muted: 'var(--seqvio-color-muted, #94a3b8)',
  accent: 'var(--seqvio-color-accent, #38bdf8)',
  accentSoft: 'color-mix(in srgb, var(--seqvio-color-accent, #38bdf8) 18%, transparent)',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  line: 'color-mix(in srgb, var(--seqvio-color-muted, #94a3b8) 35%, transparent)',
  codeBg: '#0b1220',
  gutter: '#64748b',
};

export const technicalFonts = {
  /** Prefer installed coding fonts, then generic monospace. */
  mono: `var(--seqvio-font-mono, ${programmingMonoFontStack()})`,
  sans: 'var(--seqvio-font-body, Inter, "Segoe UI", system-ui, sans-serif)',
};

export const technicalCodeTheme = {
  keyword: '#c792ea',
  string: '#c3e88d',
  number: '#f78c6c',
  comment: '#546e7a',
  function: '#82aaff',
  plain: '#d6deeb',
};
