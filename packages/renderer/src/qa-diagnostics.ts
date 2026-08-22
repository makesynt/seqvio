import { analyzeSpeechRate, resolvePacingProfile, type RenderableMeta } from '@seqvio/core';
import { resolveNarrationCueTimes } from './media-contract';

export type QaProfile = 'baseline' | 'capture';

export interface QaDiagnostic {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
  frame?: number;
  repair?: string;
}

export interface ProductFrameObservation {
  fullSentenceOverlayIds: string[];
  primaryTextCount: number;
  primaryTextBudget: number;
  repeatedTemplateIds: string[];
  titleGraphicOverlaps: string[];
  hasFocalTarget: boolean;
}

export interface ManimFrameObservation {
  id: string;
  frame: number;
  fps: number;
  currentTime: number;
  duration?: number;
  marker?: string;
  markerCount: number;
}

export interface DesignStageObservation {
  left: number;
  top: number;
  width: number;
  height: number;
  designWidth: number;
  designHeight: number;
  fit: 'contain' | 'cover' | 'stretch' | 'native';
  align: 'center' | 'top-left';
}

export function diagnoseDesignStage(
  design: NonNullable<RenderableMeta['design']> | undefined,
  observation: DesignStageObservation | undefined,
  viewport: { width: number; height: number },
  frame: number,
): QaDiagnostic[] {
  if (!design) return [];
  if (!observation) {
    return [{
      severity: 'error',
      code: 'design_stage_missing',
      path: 'design',
      frame,
      message: 'The composition declares a design coordinate system but the active scene has no DesignStage.',
      repair: 'Wrap scene content in <DesignStage> or remove the design metadata if the scene is authored directly at output size.',
    }];
  }
  const fit = design.fit ?? 'contain';
  const ratioX = viewport.width / design.width;
  const ratioY = viewport.height / design.height;
  const scale = fit === 'cover' ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY);
  const expectedWidth = design.width * (fit === 'stretch' ? ratioX : fit === 'native' ? 1 : scale);
  const expectedHeight = design.height * (fit === 'stretch' ? ratioY : fit === 'native' ? 1 : scale);
  const expectedLeft = (design.align ?? 'center') === 'top-left' ? 0 : (viewport.width - expectedWidth) / 2;
  const expectedTop = (design.align ?? 'center') === 'top-left' ? 0 : (viewport.height - expectedHeight) / 2;
  const tolerance = 3;
  const differs = (actual: number, expected: number) => Math.abs(actual - expected) > tolerance;
  if (!differs(observation.left, expectedLeft) && !differs(observation.top, expectedTop) && !differs(observation.width, expectedWidth) && !differs(observation.height, expectedHeight)) return [];
  return [{
    severity: 'error',
    code: 'design_stage_mismatch',
    path: 'design',
    frame,
    message: `DesignStage bounds ${Math.round(observation.width)}x${Math.round(observation.height)} at (${Math.round(observation.left)},${Math.round(observation.top)}) do not match the ${fit} layout expected for ${design.width}x${design.height} in ${viewport.width}x${viewport.height}.`,
    repair: 'Use the core DesignStage component and let it compute the fit from the composition output size.',
  }];
}

export function diagnoseManimFrame(observation: ManimFrameObservation, frame: number): QaDiagnostic[] {
  const issues: QaDiagnostic[] = [];
  const rawExpectedTime = observation.frame / Math.max(1, observation.fps);
  const expectedTime = observation.duration && Number.isFinite(observation.duration)
    ? Math.min(rawExpectedTime, observation.duration)
    : rawExpectedTime;
  if (Math.abs(observation.currentTime - expectedTime) > Math.max(0.08, 2 / Math.max(1, observation.fps))) {
    issues.push({ severity: 'warning', code: 'manim_seek_misaligned', path: `manim.${observation.id}`, frame, message: `Manim clip "${observation.id}" is at ${observation.currentTime.toFixed(3)}s; expected ${expectedTime.toFixed(3)}s.`, repair: 'Verify the clip fps metadata and retain a seekable MP4 output from the adapter.' });
  }
  if (observation.markerCount > 0 && observation.frame > 0 && !observation.marker) {
    issues.push({ severity: 'warning', code: 'manim_marker_unresolved', path: `manim.${observation.id}.marker`, frame, message: `Manim clip "${observation.id}" has named markers but none resolves at this frame.`, repair: 'Add a frame-zero marker or align the first marker to the narration beat that introduces the clip.' });
  }
  return issues;
}

export function diagnoseProductFrame(
  observation: ProductFrameObservation | undefined,
  frame: number,
): QaDiagnostic[] {
  if (!observation) return [];
  const issues: QaDiagnostic[] = [];
  for (const id of observation.fullSentenceOverlayIds) {
    issues.push({ severity: 'warning', code: 'full_sentence_overlay', path: `productText.${id}`, frame, message: `Primary overlay "${id}" reads like narration rather than concise screen text.`, repair: 'Keep the sentence in narration and reduce the overlay to a label, keyword, command, filename, or short conclusion.' });
  }
  if (observation.primaryTextCount > observation.primaryTextBudget) {
    issues.push({ severity: 'warning', code: 'concurrent_primary_text', path: 'productText.primary', frame, message: `${observation.primaryTextCount} primary text elements exceed the frame budget of ${observation.primaryTextBudget}.`, repair: 'Choose one primary message and demote or sequence the remaining text.' });
  }
  for (const id of observation.repeatedTemplateIds) {
    issues.push({ severity: 'warning', code: 'repeated_scene_template', path: `productTemplate.${id}`, frame, message: `Template "${id}" is repeated concurrently.`, repair: 'Vary the composition around the visual role instead of duplicating the same header or rail.' });
  }
  for (const pair of observation.titleGraphicOverlaps) {
    issues.push({ severity: 'warning', code: 'title_graphic_overlap', path: `productLayout.${pair}`, frame, message: `Primary title and graphic "${pair}" overlap.`, repair: 'Reserve separate title and graphic regions or reduce the text footprint.' });
  }
  if (!observation.hasFocalTarget) {
    issues.push({ severity: 'warning', code: 'missing_focal_target', path: 'productLayout.focalTarget', frame, message: 'The product-explainer frame has no visible declared focal target.', repair: 'Mark the single element carrying this beat with data-seqvio-focal-target.' });
  }
  return issues;
}

export function promoteQaWarnings(issues: QaDiagnostic[], codes: ReadonlySet<string>): QaDiagnostic[] {
  return issues.map((issue) =>
    issue.severity === 'warning' && (codes.has('*') || codes.has(issue.code))
      ? { ...issue, severity: 'error' }
      : issue,
  );
}

export function diagnosePacing(meta: RenderableMeta, fps: number, profileId?: string): QaDiagnostic[] {
  const issues: QaDiagnostic[] = [];
  const pacingProfile = resolvePacingProfile(profileId ?? meta.audio?.pacingProfile ?? meta.pacing?.profile);
  for (const [index, cue] of (meta.audio?.narration ?? []).entries()) {
    if (cue.silent) continue;
    const times = resolveNarrationCueTimes(cue, fps);
    const analysis = analyzeSpeechRate(cue.text, times.endMs - times.startMs, pacingProfile.policy);
    if (!analysis || analysis.status === 'ok') continue;
    const rate = analysis.unit === 'words_per_minute'
      ? `${Math.round(analysis.rate)} words/min`
      : `${analysis.rate.toFixed(1)} chars/sec`;
    issues.push({
      severity: 'warning',
      code: analysis.status === 'too_fast' ? 'speech_rate_too_fast' : 'speech_rate_too_slow',
      path: `audio.narration[${index}]`,
      message: `Narration cue "${cue.id}" is ${analysis.status === 'too_fast' ? 'too fast' : 'too slow'} at ${rate}.`,
      repair: analysis.status === 'too_fast'
        ? 'Shorten or split the narration, then extend the scene and resynthesize at a natural rate.'
        : 'Trim silence, tighten the cue window, or combine low-density narration.',
    });
  }
  for (const [index, highlight] of (meta.pacing?.highlights ?? []).entries()) {
    const minDurationFrames = Math.ceil((pacingProfile.policy.minHighlightMs / 1000) * fps);
    if (highlight.endFrame - highlight.startFrame >= minDurationFrames) continue;
    issues.push({
      severity: 'warning',
      code: 'highlight_too_short',
      path: `pacing.highlights[${index}]`,
      frame: highlight.startFrame,
      message: `Highlight "${highlight.id}" is visible for fewer than ${minDurationFrames} frames under ${pacingProfile.id}.`,
      repair: 'Extend the stable highlight window, delay the next focus, or simplify the highlighted content.',
    });
  }
  for (const [index, scene] of (meta.audio?.sceneTimings ?? []).entries()) {
    const sourceDuration = scene.sourceDurationFrames ?? scene.durationFrames;
    const stretchRatio = scene.durationFrames / Math.max(1, sourceDuration);
    if (stretchRatio <= pacingProfile.policy.maxSceneStretchRatio) continue;
    issues.push({
      severity: 'warning',
      code: 'scene_time_stretch_excessive',
      path: `audio.sceneTimings[${index}]`,
      message: `Scene "${scene.sceneId}" is stretched ${stretchRatio.toFixed(2)}x by narration timing.`,
      repair: 'Shorten or split the narration, add another visual scene, or capture the workflow at a more suitable pace.',
    });
  }
  return issues;
}

export function expectedNarrationTrackDurationMs(
  meta: RenderableMeta,
  trackId: string,
  fps: number,
): number | undefined {
  const cues = (meta.audio?.narration ?? []).filter((cue) => !cue.silent);
  const matchingCue = cues.find((cue) => cue.id === trackId);
  if (matchingCue) {
    const times = resolveNarrationCueTimes(matchingCue, fps);
    return times.endMs - times.startMs;
  }
  const narrationTrackCount = (meta.audio?.tracks ?? []).filter((track) => track.kind === 'narration').length;
  if (narrationTrackCount !== 1 || cues.length === 0) return undefined;
  const times = cues.map((cue) => resolveNarrationCueTimes(cue, fps));
  return Math.max(...times.map((item) => item.endMs)) - Math.min(...times.map((item) => item.startMs));
}

export function classifyQaRuntimeError(message: string): string {
  if (/Invalid QA config/i.test(message)) return 'invalid_qa_config';
  if (/load seekable video metadata|loading seekable video metadata/i.test(message)) {
    return 'media_metadata_load_failed';
  }
  if (/seek video|seeking video/i.test(message)) {
    return 'media_seek_failed';
  }
  return 'qa_runtime_failed';
}
