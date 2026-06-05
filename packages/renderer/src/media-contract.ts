export interface WordTiming {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number;
}

export interface CaptionCue {
  id?: string;
  sceneId?: string;
  text: string;
  startMs: number;
  endMs: number;
  words?: WordTiming[];
}

export interface NarrationCue {
  id: string;
  sceneId?: string;
  text: string;
  startFrame?: number;
  endFrame?: number;
  startMs?: number;
  endMs?: number;
  voice?: string;
  silent?: boolean;
}

export type AudioTrackKind = 'narration' | 'music' | 'sfx';

export interface AudioTrackSpec {
  id: string;
  src: string;
  kind: AudioTrackKind;
  volume?: number;
  offsetMs?: number;
}

export interface CompositionAudioManifest {
  fps?: number;
  duration?: number;
  lockToAudio?: boolean;
  narration?: NarrationCue[];
  tracks?: AudioTrackSpec[];
  captions?: CaptionCue[];
}

export interface RenderableMeta {
  duration?: number;
  fps?: number;
  audio?: CompositionAudioManifest;
  captions?: CaptionCue[];
}

export function framesToMs(frames: number, fps: number): number {
  return Math.max(0, Math.round((frames / fps) * 1000));
}

export function msToFrames(ms: number, fps: number): number {
  return Math.max(0, Math.round((ms / 1000) * fps));
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
    endMs: Math.max(startMs, endMs),
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

export function getActiveCaption(
  cues: CaptionCue[] | undefined,
  currentMs: number
): CaptionCue | null {
  if (!cues || cues.length === 0) {
    return null;
  }

  for (const cue of cues) {
    if (currentMs >= cue.startMs && currentMs < cue.endMs) {
      return cue;
    }
  }

  return null;
}
