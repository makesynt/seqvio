import type { CaptionCue } from './captions';
import type {
  ExplanationBeatAnchorSpec,
  VisualBeatAction,
} from './explainer-document/schema';

export type AudioTrackKind = 'narration' | 'music' | 'sfx';

/** A sub-sentence timing chunk produced by TTS synthesis. */
export interface NarrationChunk {
  /** The sentence fragment exactly as sent to the TTS engine. */
  text: string;
  /** Cue-local frame offset where this chunk begins. */
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

export interface AudioSceneTiming {
  sceneId: string;
  startFrame: number;
  durationFrames: number;
  /** Authored/captured local duration before narration-driven expansion. */
  sourceDurationFrames?: number;
  transitionAfterFrames?: number;
  /** Monotonic output-local -> source-local frame anchors. */
  timeMap?: Array<{ outputFrame: number; sourceFrame: number }>;
  highlights?: Array<{
    id: string;
    source: 'beat' | 'step' | 'annotation' | 'focus';
    startFrame: number;
    endFrame: number;
    minDurationFrames: number;
  }>;
}

export interface ExplanationBeatTiming {
  /** Composition-unique id, normally `${sceneId}.${localBeatId}`. */
  id: string;
  sceneId: string;
  cueId: string;
  anchor: ExplanationBeatAnchorSpec;
  /** Authored/captured scene-local visual frame. */
  sourceFrame: number;
  /** Resolved scene-local speech frame, populated after TTS. */
  outputFrame?: number;
  method?: 'chunk-character' | 'cue-character';
  confidence?: number;
  /** Populated after synthesis when the phrase cannot be placed on audio. */
  resolutionError?: 'anchor_not_found' | 'anchor_ambiguous';
  visuals: VisualBeatAction[];
}

export interface CompositionAudioManifest {
  fps?: number;
  duration?: number;
  lockToAudio?: boolean;
  narration?: NarrationCue[];
  tracks?: AudioTrackSpec[];
  captions?: CaptionCue[];
  /** Scene-local timing retained so synthesized narration can reflow visuals. */
  sceneTimings?: AudioSceneTiming[];
  explanationBeats?: ExplanationBeatTiming[];
  pacingProfile?: string;
}

export interface RenderableMeta {
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
  audio?: CompositionAudioManifest;
  captions?: CaptionCue[];
  pacing?: {
    profile?: string;
    highlights: Array<{
      id: string;
      source: 'beat' | 'step' | 'annotation' | 'focus';
      startFrame: number;
      endFrame: number;
      minDurationFrames: number;
    }>;
  };
  /** Reviewable renderer-agnostic direction compiled from semantic ids. */
  direction?: import('./direction').CompiledDirectionPlan;
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
