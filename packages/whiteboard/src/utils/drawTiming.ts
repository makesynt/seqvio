/**
 * Single-pen draw scheduling: at most one stroke animates at a time per scene.
 */

export interface DrawTimingInput {
  id: string;
  start: number;
  duration: number;
  order: number;
}

export function sortDrawsBySchedule(draws: DrawTimingInput[]): DrawTimingInput[] {
  return [...draws].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.order - b.order;
  });
}

/**
 * When sequential is true, each draw starts after the previous stroke finishes
 * (effectiveStart = max(authoredStart, previousEnd)).
 */
export function computeEffectiveStartMap(
  draws: DrawTimingInput[],
  sequential: boolean
): Map<string, number> {
  const map = new Map<string, number>();
  if (!sequential) {
    for (const draw of draws) {
      map.set(draw.id, draw.start);
    }
    return map;
  }

  let cursor = 0;
  for (const draw of sortDrawsBySchedule(draws)) {
    const effective = Math.max(draw.start, cursor);
    map.set(draw.id, effective);
    cursor = effective + draw.duration;
  }
  return map;
}

/** Last frame (exclusive) needed for all serialized draws in a scene. */
export function getSerializedSceneEnd(
  draws: DrawTimingInput[],
  sequential: boolean
): number {
  if (draws.length === 0) return 0;
  const map = computeEffectiveStartMap(draws, sequential);
  let end = 0;
  for (const draw of draws) {
    const start = map.get(draw.id) ?? draw.start;
    end = Math.max(end, start + draw.duration);
  }
  return end;
}
