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
  if (!['restrained', 'balanced', 'expressive'].includes(String(profile.motionDensity))) issues.push({ severity: 'error', code: 'unsupported_motion_density', path: 'motionDensity', message: 'motionDensity must be restrained, balanced, or expressive' });
  if (!['static', 'semantic-focus', 'evidence-follow'].includes(String(profile.cameraPolicy))) issues.push({ severity: 'error', code: 'unsupported_camera_policy', path: 'cameraPolicy', message: 'Unsupported camera policy' });
  if (!['cut', 'crossfade', 'focus-transfer'].includes(String(profile.transitionPolicy))) issues.push({ severity: 'error', code: 'unsupported_transition_policy', path: 'transitionPolicy', message: 'Unsupported transition policy' });
  return issues;
}

/** Compare semantic timing/identity fields before and after style application. */
export function semanticStyleInvariant(before: unknown, after: unknown): { ok: boolean; differences: string[] } {
  const project = (value: any) => JSON.stringify({
    id: value?.id,
    scenes: value?.scenes?.map((scene: any) => ({ id: scene.id, explanation: scene.explanation, annotations: scene.annotations })),
    direction: value?.direction,
    audio: value?.audio ? { sceneTimings: value.audio.sceneTimings, explanationBeats: value.audio.explanationBeats, narration: value.audio.narration } : undefined,
  });
  const left = project(before); const right = project(after);
  return left === right ? { ok: true, differences: [] } : { ok: false, differences: ['semantic_timing_or_identity_changed'] };
}
