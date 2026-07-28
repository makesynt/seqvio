export interface NarrationCueTiming {
  startMs?: number;
  endMs?: number;
  startFrame?: number;
  endFrame?: number;
}

export interface VolumeKeyframe {
  time: number;
  volume: number;
}

export interface DuckingOptions {
  duckLevel?: number;
  releaseSeconds?: number;
  attackSeconds?: number;
}

interface DuckRegion {
  start: number;
  end: number;
}

export function generateDuckingEnvelope(
  cues: NarrationCueTiming[],
  fps: number,
  options?: DuckingOptions
): VolumeKeyframe[] {
  const duckLevel = options?.duckLevel ?? 0.3;
  const release = options?.releaseSeconds ?? 0.5;
  const attack = options?.attackSeconds ?? 0.1;

  const regions: DuckRegion[] = [];

  for (const cue of cues) {
    let startSec: number | undefined;
    let endSec: number | undefined;

    if (cue.startMs != null) startSec = cue.startMs / 1000;
    else if (cue.startFrame != null) startSec = cue.startFrame / fps;

    if (cue.endMs != null) endSec = cue.endMs / 1000;
    else if (cue.endFrame != null) endSec = cue.endFrame / fps;

    if (startSec == null) continue;
    if (endSec == null) endSec = startSec + 2;

    regions.push({
      start: Math.max(0, startSec - attack),
      end: endSec + release,
    });
  }

  if (regions.length === 0) return [];

  regions.sort((a, b) => a.start - b.start);

  const merged: DuckRegion[] = [regions[0]];
  for (let i = 1; i < regions.length; i++) {
    const prev = merged[merged.length - 1];
    if (regions[i].start <= prev.end) {
      prev.end = Math.max(prev.end, regions[i].end);
    } else {
      merged.push(regions[i]);
    }
  }

  const keyframes: VolumeKeyframe[] = [];
  keyframes.push({ time: 0, volume: 1 });

  for (const region of merged) {
    const rampStart = region.start;
    const duckStart = region.start + attack;
    const duckEnd = region.end - release;
    const rampEnd = region.end;

    keyframes.push({ time: rampStart, volume: 1 });
    keyframes.push({ time: duckStart, volume: duckLevel });
    if (duckEnd > duckStart) {
      keyframes.push({ time: duckEnd, volume: duckLevel });
    }
    keyframes.push({ time: rampEnd, volume: 1 });
  }

  return keyframes;
}
