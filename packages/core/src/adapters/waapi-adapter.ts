import type { SeekableAdapter } from '../seekable';

export interface WaapiAdapterOptions {
  id?: string;
}

interface AnimationBaseline {
  compositionTimeMs: number;
  animationTimeMs: number;
}

export function createWaapiAdapter(options?: WaapiAdapterOptions): SeekableAdapter {
  const id = options?.id ?? 'waapi';
  const baselines = new WeakMap<Animation, AnimationBaseline>();
  let discovered = false;

  function snapshotAnimations(): Animation[] {
    if (typeof document === 'undefined' || !document.getAnimations) return [];
    try {
      return document.getAnimations();
    } catch {
      return [];
    }
  }

  function readAnimationTimeMs(animation: Animation): number {
    const raw = Number(animation.currentTime);
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

  function ensureBaseline(animation: Animation, compositionTimeMs: number): AnimationBaseline {
    const existing = baselines.get(animation);
    if (existing) return existing;

    const animTimeMs = readAnimationTimeMs(animation);
    let baseAnimTime = animTimeMs;
    if (discovered && compositionTimeMs > 0 && animTimeMs >= compositionTimeMs) {
      baseAnimTime = Math.max(0, animTimeMs - compositionTimeMs);
    }

    const baseline: AnimationBaseline = {
      compositionTimeMs,
      animationTimeMs: baseAnimTime,
    };
    baselines.set(animation, baseline);
    return baseline;
  }

  return {
    id,
    requiresRaf: false,
    seek(timeSeconds: number) {
      const timeMs = Math.max(0, timeSeconds * 1000);

      if (!discovered) {
        discovered = true;
        for (const animation of snapshotAnimations()) {
          ensureBaseline(animation, 0);
        }
      }

      for (const animation of snapshotAnimations()) {
        const baseline = ensureBaseline(animation, timeMs);
        const localTimeMs =
          baseline.animationTimeMs + Math.max(0, timeMs - baseline.compositionTimeMs);
        try {
          animation.currentTime = localTimeMs;
        } catch { /* animation may be cancelled */ }
        try {
          animation.pause();
        } catch { /* animation may be cancelled */ }
      }
    },
  };
}
