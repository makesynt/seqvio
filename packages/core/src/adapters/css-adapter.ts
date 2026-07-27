import type { SeekableAdapter } from '../seekable';

export interface CssAdapterOptions {
  id?: string;
  resolveStartSeconds?: (element: Element) => number;
}

interface CssEntry {
  el: HTMLElement;
  baseDelay: string;
  basePlayState: string;
}

export function createCssAdapter(options?: CssAdapterOptions): SeekableAdapter {
  const id = options?.id ?? 'css-keyframes';
  const resolveStart = options?.resolveStartSeconds;
  let entries: CssEntry[] = [];
  let discovered = false;

  function discover(): void {
    entries = [];
    if (typeof document === 'undefined') return;
    const all = document.querySelectorAll('*');
    for (const rawEl of all) {
      const el = rawEl as unknown as HTMLElement;
      if (!el || typeof el.style === 'undefined') continue;
      const style = window.getComputedStyle(el);
      if (!style.animationName || style.animationName === 'none') continue;
      entries.push({
        el,
        baseDelay: el.style.animationDelay || '',
        basePlayState: el.style.animationPlayState || '',
      });
    }
    discovered = true;
  }

  function seekAnimations(animations: Animation[], timeMs: number): void {
    for (const animation of animations) {
      try {
        animation.currentTime = timeMs;
      } catch { /* cancelled */ }
      try {
        animation.pause();
      } catch { /* cancelled */ }
    }
  }

  return {
    id,
    requiresRaf: false,
    seek(timeSeconds: number) {
      if (!discovered) discover();

      const timeMs = Math.max(0, timeSeconds * 1000);

      for (const entry of entries) {
        if (!entry.el.isConnected) continue;

        const startSeconds = resolveStart ? resolveStart(entry.el) : 0;
        const localTimeMs = Math.max(0, timeMs - startSeconds * 1000);

        const animations =
          typeof entry.el.getAnimations === 'function'
            ? entry.el.getAnimations()
            : [];

        if (animations.length > 0) {
          seekAnimations(animations, localTimeMs);
        } else {
          entry.el.style.animationPlayState = 'paused';
          entry.el.style.animationDelay = `-${(localTimeMs / 1000).toFixed(3)}s`;
        }
      }
    },
  };
}
