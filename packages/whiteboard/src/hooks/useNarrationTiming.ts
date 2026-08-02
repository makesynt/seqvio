import { useMemo } from 'react';
import type { NarrationChunk } from '@seqvio/core';

/**
 * Hook that returns per-sentence timing data for the current scene from a
 * CosyVoice-produced audio manifest.  Callers anchor visual elements to the
 * exact frame where a particular sentence is spoken, instead of guessing
 * frame offsets.
 *
 * @param sceneId — must match the `id` of the enclosing `<Scene>`.
 * @param manifest — optional override (defaults to window.__seqvio_resolvedAudioManifest).
 * @returns chunk metadata, or `null` when no manifest / no chunks found.
 */
export function useNarrationTiming(
  sceneId: string,
  manifest?: unknown,
): { chunks: NarrationChunk[]; at(index: number): number } | null {
  const resolved =
    manifest ??
    (typeof window !== 'undefined'
      ? (window as unknown as Record<string, unknown>)
          .__seqvio_resolvedAudioManifest
      : undefined);

  return useMemo(() => {
    const r = resolved as Record<string, unknown> | null | undefined;
    if (!r || !Array.isArray(r.narration)) return null;

    const cues = r.narration as unknown[];
    const cue = cues.find(
      (c: unknown) =>
        (c as Record<string, unknown> | null | undefined)?.id === sceneId,
    ) as Record<string, unknown> | undefined;
    if (!cue) return null;

    const chunks: NarrationChunk[] = Array.isArray(cue.chunks)
      ? (cue.chunks as NarrationChunk[])
      : [];

    if (chunks.length === 0) return null;

    return {
      chunks,
      at(index: number): number {
        if (index < 0 || index >= chunks.length) return 0;
        return chunks[index].offsetFrame;
      },
    };
  }, [resolved, sceneId]);
}
