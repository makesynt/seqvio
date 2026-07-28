import type { CaptionCue } from './captions';

export type AudioTrackKind = 'narration' | 'music' | 'sfx';

/** A sub-sentence timing chunk produced by TTS synthesis. */
export interface NarrationChunk {
  /** The sentence fragment exactly as sent to the TTS engine. */
  text: string;
  /** Scene-local frame offset where this chunk begins. */
  offsetFrame: number;
  /** Audio duration of this chunk in frames. */
  durationFrame: number;
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
  /**
   * Per-chunk timing from CosyVoice synthesis (optional).
   * When present, composition hooks can anchor visual elements to exact
   * sentence boundaries instead of guessing frame offsets.
   */
  chunks?: NarrationChunk[];
}

export interface VolumeKeyframe {
  time: number;
  volume: number;
}

export interface AudioTrackSpec {
  id: string;
  src: string;
  kind: AudioTrackKind;
  volume?: number;
  offsetMs?: number;
  volumeKeyframes?: VolumeKeyframe[];
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
  width?: number;
  height?: number;
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
