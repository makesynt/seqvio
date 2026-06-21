import { useCurrentFrame } from '@seqvio/core';

export type ProductEasing = 'linear' | 'ease-out' | 'back-out';

export function ease(progress: number, easing: ProductEasing = 'ease-out'): number {
  const t = Math.max(0, Math.min(1, progress));
  if (easing === 'linear') return t;
  if (easing === 'back-out') {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  return 1 - Math.pow(1 - t, 3);
}

export function useReveal(start = 0, duration = 18, easing: ProductEasing = 'ease-out'): number {
  const frame = useCurrentFrame();
  return ease((frame - start) / Math.max(1, duration), easing);
}

