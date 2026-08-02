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
