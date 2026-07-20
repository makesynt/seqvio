import { useCurrentFrame } from '@seqvio/core';

export type TechnicalEasing = 'linear' | 'ease-out';

export function ease(progress: number, easing: TechnicalEasing = 'ease-out'): number {
  const t = Math.max(0, Math.min(1, progress));
  if (easing === 'linear') return t;
  return 1 - Math.pow(1 - t, 3);
}

export function useReveal(start = 0, duration = 18, easing: TechnicalEasing = 'ease-out'): number {
  const frame = useCurrentFrame();
  return ease((frame - start) / Math.max(1, duration), easing);
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
