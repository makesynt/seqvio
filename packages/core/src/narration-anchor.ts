import type { NarrationCue } from './audio';
import type { ExplanationBeatAnchorSpec } from './composition-document/schema';
import { resolveNarrationCueTimes } from './time';

export type NarrationAnchorMethod = 'chunk-character' | 'cue-character';

export interface ResolvedNarrationAnchor {
  ok: true;
  method: NarrationAnchorMethod;
  cueLocalFrame: number;
  absoluteFrame: number;
  confidence: number;
  characterIndex: number;
  occurrence: number;
  chunkIndex?: number;
}

export interface UnresolvedNarrationAnchor {
  ok: false;
  code: 'anchor_not_found' | 'anchor_ambiguous';
  message: string;
  matchCount: number;
}

export type NarrationAnchorResolution =
  | ResolvedNarrationAnchor
  | UnresolvedNarrationAnchor;

const LANGUAGE_TAG = /<\|[^|>]+\|>/g;

export function normalizeNarrationText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(LANGUAGE_TAG, '')
    .replace(/\s+/g, '');
}

export function findNarrationAnchorMatches(text: string, anchor: string): number[] {
  const normalizedText = normalizeNarrationText(text);
  const normalizedAnchor = normalizeNarrationText(anchor);
  if (!normalizedAnchor) return [];
  const matches: number[] = [];
  let cursor = 0;
  while (cursor <= normalizedText.length - normalizedAnchor.length) {
    const index = normalizedText.indexOf(normalizedAnchor, cursor);
    if (index < 0) break;
    matches.push(index);
    cursor = index + Math.max(1, normalizedAnchor.length);
  }
  return matches;
}

export function resolveNarrationAnchor(
  cue: NarrationCue,
  anchor: ExplanationBeatAnchorSpec,
  fps: number,
): NarrationAnchorResolution {
  const safeFps = Math.max(1, fps);
  const normalizedAnchor = normalizeNarrationText(anchor.text);
  const normalizedCue = normalizeNarrationText(cue.text);
  const matches = findNarrationAnchorMatches(cue.text, anchor.text);
  const requestedOccurrence = anchor.occurrence;

  if (matches.length === 0 || !normalizedAnchor) {
    return {
      ok: false,
      code: 'anchor_not_found',
      message: `Anchor "${anchor.text}" was not found in narration cue "${cue.id}".`,
      matchCount: 0,
    };
  }
  if (requestedOccurrence === undefined && matches.length > 1) {
    return {
      ok: false,
      code: 'anchor_ambiguous',
      message: `Anchor "${anchor.text}" occurs ${matches.length} times in narration cue "${cue.id}"; set occurrence.`,
      matchCount: matches.length,
    };
  }
  const occurrence = requestedOccurrence ?? 1;
  const characterIndex = matches[occurrence - 1];
  if (characterIndex === undefined) {
    return {
      ok: false,
      code: 'anchor_not_found',
      message: `Anchor occurrence ${occurrence} does not exist in narration cue "${cue.id}".`,
      matchCount: matches.length,
    };
  }

  const cueTimes = resolveNarrationCueTimes(cue, safeFps);
  const cueStartFrame = cue.startFrame ?? Math.round((cueTimes.startMs / 1000) * safeFps);
  const chunks = (cue.chunks ?? []).map((chunk, index) => ({
    ...chunk,
    index,
    clean: normalizeNarrationText(chunk.text),
  }));
  if (chunks.length > 0) {
    let chunkCharacterStart = 0;
    for (const chunk of chunks) {
      const chunkCharacterEnd = chunkCharacterStart + chunk.clean.length;
      if (characterIndex >= chunkCharacterStart && characterIndex < chunkCharacterEnd) {
        const localCharacter = characterIndex - chunkCharacterStart;
        const ratio = chunk.clean.length > 0 ? localCharacter / chunk.clean.length : 0;
        const cueLocalFrame = chunk.offsetFrame + Math.round(ratio * chunk.durationFrame);
        return {
          ok: true,
          method: 'chunk-character',
          cueLocalFrame,
          absoluteFrame: cueStartFrame + cueLocalFrame,
          confidence: 0.75,
          characterIndex,
          occurrence,
          chunkIndex: chunk.index,
        };
      }
      chunkCharacterStart = chunkCharacterEnd;
    }
  }

  const cueDurationFrames = Math.max(
    1,
    (cue.endFrame ?? Math.round((cueTimes.endMs / 1000) * safeFps)) - cueStartFrame,
  );
  const ratio = normalizedCue.length > 0 ? characterIndex / normalizedCue.length : 0;
  const cueLocalFrame = Math.round(ratio * cueDurationFrames);
  return {
    ok: true,
    method: 'cue-character',
    cueLocalFrame,
    absoluteFrame: cueStartFrame + cueLocalFrame,
    confidence: 0.45,
    characterIndex,
    occurrence,
  };
}
