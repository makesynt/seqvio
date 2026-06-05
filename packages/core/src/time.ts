import type { CaptionCue } from './captions';
import type { CompositionAudioManifest, NarrationCue } from './audio';

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.max(0, Math.round(seconds * fps));
}

export function msToFrames(ms: number, fps: number): number {
  return Math.max(0, Math.round((ms / 1000) * fps));
}

export function framesToMs(frames: number, fps: number): number {
  return Math.max(0, Math.round((frames / fps) * 1000));
}

export function resolveNarrationCueTimes(
  cue: NarrationCue,
  fps: number
): { startMs: number; endMs: number } {
  const startMs =
    cue.startMs ??
    (cue.startFrame !== undefined ? framesToMs(cue.startFrame, fps) : 0);
  const endMs =
    cue.endMs ??
    (cue.endFrame !== undefined ? framesToMs(cue.endFrame, fps) : startMs);

  return {
    startMs,
    endMs: Math.max(endMs, startMs),
  };
}

export function resolveCompositionDurationFrames(
  baseDuration: number | undefined,
  fps: number,
  manifest?: CompositionAudioManifest,
  captions?: CaptionCue[]
): number {
  let maxFrames = Math.max(0, baseDuration ?? 0);
  const effectiveCaptions = captions ?? manifest?.captions ?? [];

  for (const cue of manifest?.narration ?? []) {
    const times = resolveNarrationCueTimes(cue, fps);
    maxFrames = Math.max(maxFrames, msToFrames(times.endMs, fps));
  }

  for (const cue of effectiveCaptions) {
    maxFrames = Math.max(maxFrames, msToFrames(cue.endMs, fps));
  }

  return maxFrames;
}

export function resolveSceneDurationFrames(
  sceneId: string,
  fps: number,
  manifest?: CompositionAudioManifest
): number | undefined {
  if (!manifest) {
    return undefined;
  }

  let minStartMs = Number.POSITIVE_INFINITY;
  let maxEndMs = 0;
  let found = false;

  for (const cue of manifest.narration ?? []) {
    if (cue.sceneId !== sceneId) {
      continue;
    }
    const times = resolveNarrationCueTimes(cue, fps);
    minStartMs = Math.min(minStartMs, times.startMs);
    maxEndMs = Math.max(maxEndMs, times.endMs);
    found = true;
  }

  for (const cue of manifest.captions ?? []) {
    if (cue.sceneId !== sceneId) {
      continue;
    }
    minStartMs = Math.min(minStartMs, cue.startMs);
    maxEndMs = Math.max(maxEndMs, cue.endMs);
    found = true;
  }

  if (!found) {
    return undefined;
  }

  return Math.max(1, msToFrames(maxEndMs - minStartMs, fps));
}
