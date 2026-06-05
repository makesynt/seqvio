import type { CaptionCue } from './captions';

export type AudioTrackKind = 'narration' | 'music' | 'sfx';

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

export function resolveCompositionAudioManifest(
  manifest: CompositionAudioManifest | undefined,
  fallbackCaptions?: CaptionCue[]
): CompositionAudioManifest | undefined {
  const runtimeOverride =
    typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>).__seqvio_resolvedAudioManifest as
          | CompositionAudioManifest
          | undefined
      : undefined;

  if (!runtimeOverride && !manifest && !fallbackCaptions?.length) {
    return undefined;
  }

  return {
    ...(manifest ?? {}),
    ...(runtimeOverride ?? {}),
    captions:
      runtimeOverride?.captions ??
      fallbackCaptions ??
      manifest?.captions,
  };
}
