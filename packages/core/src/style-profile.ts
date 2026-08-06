export const STYLE_PROFILE_FORMAT = 'seqvio-style-profile' as const;
export const STYLE_PROFILE_VERSION = '1.0' as const;

export type StyleMotionDensity = 'restrained' | 'balanced' | 'expressive';
export type StyleCameraPolicy = 'static' | 'semantic-focus' | 'evidence-follow';
export type StyleTransitionPolicy = 'cut' | 'crossfade' | 'focus-transfer';

export interface StyleProfile {
  format: typeof STYLE_PROFILE_FORMAT;
  version: typeof STYLE_PROFILE_VERSION;
  id: string;
  label: string;
  typography: { headingFamily: string; bodyFamily: string; monoFamily?: string; scale: 'compact' | 'editorial' | 'large' };
  motionDensity: StyleMotionDensity;
  cameraPolicy: StyleCameraPolicy;
  transitionPolicy: StyleTransitionPolicy;
  attentionPersistence: 'timed' | 'until-handoff';
  spacing: 'tight' | 'comfortable' | 'airy';
  paletteRoles: Record<'background' | 'ink' | 'accent' | 'muted', string>;
}

export interface StyleProfileIssue { severity: 'error' | 'warning'; code: string; path: string; message: string }

export function validateStyleProfile(input: unknown): StyleProfileIssue[] {
  const issues: StyleProfileIssue[] = [];
  if (!input || typeof input !== 'object') return [{ severity: 'error', code: 'invalid_style_profile', path: '$', message: 'Style profile must be an object' }];
  const profile = input as Partial<StyleProfile>;
  if (profile.format !== STYLE_PROFILE_FORMAT) issues.push({ severity: 'error', code: 'unsupported_style_format', path: 'format', message: `format must be "${STYLE_PROFILE_FORMAT}"` });
  if (profile.version !== STYLE_PROFILE_VERSION) issues.push({ severity: 'error', code: 'unsupported_style_version', path: 'version', message: `version must be "${STYLE_PROFILE_VERSION}"` });
  if (!profile.id) issues.push({ severity: 'error', code: 'missing_style_id', path: 'id', message: 'id is required' });
  if (!profile.label) issues.push({ severity: 'error', code: 'missing_style_label', path: 'label', message: 'label is required' });
  if (!profile.typography?.headingFamily || !profile.typography?.bodyFamily) issues.push({ severity: 'error', code: 'missing_style_typography', path: 'typography', message: 'headingFamily and bodyFamily are required' });
  if (!['compact', 'editorial', 'large'].includes(String(profile.typography?.scale))) issues.push({ severity: 'error', code: 'unsupported_typography_scale', path: 'typography.scale', message: 'Typography scale must be compact, editorial, or large' });
  if (!['restrained', 'balanced', 'expressive'].includes(String(profile.motionDensity))) issues.push({ severity: 'error', code: 'unsupported_motion_density', path: 'motionDensity', message: 'motionDensity must be restrained, balanced, or expressive' });
  if (!['static', 'semantic-focus', 'evidence-follow'].includes(String(profile.cameraPolicy))) issues.push({ severity: 'error', code: 'unsupported_camera_policy', path: 'cameraPolicy', message: 'Unsupported camera policy' });
  if (!['cut', 'crossfade', 'focus-transfer'].includes(String(profile.transitionPolicy))) issues.push({ severity: 'error', code: 'unsupported_transition_policy', path: 'transitionPolicy', message: 'Unsupported transition policy' });
  if (!['timed', 'until-handoff'].includes(String(profile.attentionPersistence))) issues.push({ severity: 'error', code: 'unsupported_attention_persistence', path: 'attentionPersistence', message: 'Unsupported attention persistence' });
  if (!['tight', 'comfortable', 'airy'].includes(String(profile.spacing))) issues.push({ severity: 'error', code: 'unsupported_style_spacing', path: 'spacing', message: 'Spacing must be tight, comfortable, or airy' });
  for (const role of ['background', 'ink', 'accent', 'muted'] as const) {
    if (typeof profile.paletteRoles?.[role] !== 'string' || !profile.paletteRoles[role]) issues.push({ severity: 'error', code: 'missing_palette_role', path: `paletteRoles.${role}`, message: `Palette role ${role} is required` });
  }
  return issues;
}

/** Compare semantic timing/identity fields before and after style application. */
export function semanticStyleInvariant(before: unknown, after: unknown): { ok: boolean; differences: string[] } {
  const project = (value: any) => {
    if (!value || typeof value !== 'object') return JSON.stringify(value);
    const { styleProfile: _styleProfile, ...semanticDocument } = value;
    return JSON.stringify(semanticDocument);
  };
  const left = project(before); const right = project(after);
  return left === right ? { ok: true, differences: [] } : { ok: false, differences: ['semantic_timing_or_identity_changed'] };
}

export function applyStyleProfile<T extends object>(document: T, profile: StyleProfile): T & { styleProfile: StyleProfile } {
  const errors = validateStyleProfile(profile).filter((item) => item.severity === 'error');
  if (errors.length > 0) throw new Error(`Invalid style profile: ${errors.map((item) => item.code).join(', ')}`);
  const styled = { ...document, styleProfile: profile };
  const invariant = semanticStyleInvariant(document, styled);
  if (!invariant.ok) throw new Error(invariant.differences.join(', '));
  return styled;
}
