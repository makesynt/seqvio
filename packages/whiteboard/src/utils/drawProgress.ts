/**
 * Split timeline: stroke first (pen follows), then optional wash on completed outline.
 */

export interface StrokeWashSplit {
  /** 0–1 along path for stroke-dash / pen tip */
  stroke: number;
  /** 0–1 for fill wash after stroke completes */
  wash: number;
}

/**
 * @param progress Overall animation progress 0–1
 * @param washTailFraction Share of timeline after stroke completes (e.g. 0.25 = last 25% is wash only)
 */
export function splitStrokeWashProgress(
  progress: number,
  washTailFraction: number
): StrokeWashSplit {
  const tail = Math.max(0, Math.min(0.9, washTailFraction));
  if (progress >= 1) {
    return { stroke: 1, wash: 1 };
  }
  if (tail === 0) {
    return { stroke: progress, wash: 0 };
  }

  const strokeEnd = 1 - tail;
  if (progress <= strokeEnd) {
    return {
      stroke: strokeEnd > 0 ? progress / strokeEnd : 1,
      wash: 0,
    };
  }

  return {
    stroke: 1,
    wash: (progress - strokeEnd) / tail,
  };
}

/** Map registry/Hand progress to stroke head when draw uses wash tail split. */
export function resolveStrokeHeadProgress(
  progress: number,
  washTailFraction?: number
): number {
  if (washTailFraction == null) {
    return progress;
  }
  return splitStrokeWashProgress(progress, washTailFraction).stroke;
}
