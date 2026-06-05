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
