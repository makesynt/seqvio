export const SOUND_CUES = [
  "whoosh.soft",
  "whoosh.fast",
  "whoosh.digital",
  "impact.soft",
  "impact.deep",
  "ui.click",
  "ui.pop",
  "riser.short",
  "riser.long",
  "tonal.hit",
  "typing",
] as const;

export type SoundCueName = (typeof SOUND_CUES)[number];
export type SoundTrigger = "start" | "end" | "enter" | "exit" | "marker";

export interface SoundCueSpec {
  cue: SoundCueName;
  trigger?: SoundTrigger;
  offsetMs?: number;
  intensity?: number;
  variant?: string;
  repeat?: number;
  staggerMs?: number;
  duckUnderNarration?: boolean;
}

export interface SoundAsset {
  id: string;
  file: string;
  durationMs: number;
  source?: "local";
  license?: string;
  tags?: string[];
  maxIntensity?: number;
}

export type SoundAssetRegistry = Partial<Record<SoundCueName, SoundAsset[]>>;

export interface ResolvedSoundCue extends SoundCueSpec {
  id: string;
  assetId: string;
  file: string;
  startMs: number;
  durationMs: number;
  volume: number;
}

export function isSoundCueName(value: unknown): value is SoundCueName {
  return (
    typeof value === "string" &&
    (SOUND_CUES as readonly string[]).includes(value)
  );
}

export function intensityToVolume(intensity = 0.35): number {
  const value = Math.max(0, Math.min(1, intensity));
  return Number((value * 0.8).toFixed(4));
}

export function defaultSoundForVisualAction(
  action: string,
): SoundCueName | undefined {
  switch (action) {
    case "trace":
    case "connect":
    case "compare":
      return "ui.click";
    case "reveal":
      return "ui.pop";
    case "transform":
      return "whoosh.soft";
    case "focus":
    case "highlight":
    case "emphasize":
      return "tonal.hit";
    default:
      return undefined;
  }
}
