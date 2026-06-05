/**
 * Transition rendering helpers
 */

import { SEQVIO_BRAND } from './brand';

export type SupportedTransitionType = 'fade' | 'slide' | 'wipe';

export interface TransitionStyle {
  outgoingOpacity: number;
  incomingOpacity: number;
  incomingTransform: string;
  overlayClipPath?: string;
}

export function normalizeTransitionType(type: string): SupportedTransitionType {
  if (type === 'slide' || type === 'wipe') {
    return type;
  }
  if (type !== 'fade') {
    console.warn(`[${SEQVIO_BRAND.slug}] Transition "${type}" not implemented; falling back to fade`);
  }
  return 'fade';
}

export function getTransitionProgress(
  frame: number,
  transitionStart: number,
  transitionDuration: number
): number {
  if (transitionDuration <= 0) return 1;
  const raw = (frame - transitionStart) / transitionDuration;
  return Math.max(0, Math.min(1, raw));
}

export function getTransitionStyle(
  type: string,
  progress: number
): TransitionStyle {
  const normalized = normalizeTransitionType(type);
  const eased = progress * progress * (3 - 2 * progress);

  if (normalized === 'slide') {
    const incomingX = (1 - eased) * 100;
    return {
      outgoingOpacity: 1 - eased,
      incomingOpacity: eased,
      incomingTransform: `translateX(${incomingX}%)`,
    };
  }

  if (normalized === 'wipe') {
    const clip = eased * 100;
    return {
      outgoingOpacity: 1,
      incomingOpacity: 1,
      incomingTransform: 'none',
      overlayClipPath: `inset(0 ${100 - clip}% 0 0)`,
    };
  }

  return {
    outgoingOpacity: 1 - eased,
    incomingOpacity: eased,
    incomingTransform: 'none',
  };
}
