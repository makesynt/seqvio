/**
 * Seekable animation adapter interface.
 *
 * Allows external animation libraries (GSAP, Lottie, Three.js, CSS animations)
 * to be driven by the Seqvio render clock. On each frame the renderer calls
 * flushSeekables(frame, fps) and every registered adapter is seeked to the
 * corresponding time in seconds.
 */

import { useLayoutEffect } from 'react';

export interface RenderFrameContext {
  frame: number;
  fps: number;
  timeSeconds: number;
}

export interface SeekableAdapter {
  id: string;
  /** Called once per frame with the current time in seconds and frame index. */
  seek(timeSeconds: number, frame: number): void;
  /**
   * Set to true if the adapter needs an extra rAF after seek before the DOM
   * is ready to capture (e.g. Three.js renderers, Lottie). GSAP is false —
   * it applies properties synchronously.
   */
  requiresRaf?: boolean;
  /** One-time asynchronous resource preparation after the scene mounts. */
  prepare?(): void | Promise<void>;
  /** Resolves only when resources prepared by the adapter are capture-ready. */
  ready?(): void | Promise<void>;
  /** Deterministic frame renderer. When omitted, the legacy seek method is used. */
  render?(context: RenderFrameContext): void | Promise<void>;
  /** Releases adapter-owned resources when unregistered. */
  dispose?(): void | Promise<void>;
}

export type RenderLifecyclePhase = 'prepare' | 'ready' | 'render' | 'dispose';

export interface RenderLifecycleTimeouts {
  prepareMs: number;
  readyMs: number;
  renderMs: number;
  disposeMs: number;
}

export const DEFAULT_RENDER_LIFECYCLE_TIMEOUTS: Readonly<RenderLifecycleTimeouts> = {
  prepareMs: 30_000,
  readyMs: 30_000,
  renderMs: 10_000,
  disposeMs: 5_000,
};

export class RenderLifecycleError extends Error {
  readonly code: 'render_lifecycle_timeout' | 'render_lifecycle_failed';
  readonly phase: RenderLifecyclePhase;
  readonly adapterId: string;
  readonly timeoutMs?: number;
  readonly frame?: number;
  readonly cause?: unknown;

  constructor(options: {
    code: 'render_lifecycle_timeout' | 'render_lifecycle_failed';
    phase: RenderLifecyclePhase;
    adapterId: string;
    timeoutMs?: number;
    frame?: number;
    cause?: unknown;
  }) {
    const location = options.frame === undefined ? '' : ` frame=${options.frame}`;
    const detail = options.code === 'render_lifecycle_timeout'
      ? ` exceeded ${options.timeoutMs}ms`
      : ` failed: ${options.cause instanceof Error ? options.cause.message : String(options.cause)}`;
    super(`${options.code}: adapter=${options.adapterId} phase=${options.phase}${location}${detail}`);
    this.name = 'RenderLifecycleError';
    this.code = options.code;
    this.phase = options.phase;
    this.adapterId = options.adapterId;
    this.timeoutMs = options.timeoutMs;
    this.frame = options.frame;
    this.cause = options.cause;
  }
}

function resolveTimeouts(overrides?: Partial<RenderLifecycleTimeouts>): RenderLifecycleTimeouts {
  return { ...DEFAULT_RENDER_LIFECYCLE_TIMEOUTS, ...overrides };
}

async function runLifecycleStep<T>(
  adapter: SeekableAdapter,
  phase: RenderLifecyclePhase,
  timeoutMs: number,
  action: () => T | Promise<T>,
  frame?: number,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new RenderLifecycleError({
      code: 'render_lifecycle_timeout',
      phase,
      adapterId: adapter.id,
      timeoutMs,
      frame,
    })), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve().then(action), timeout]);
  } catch (error) {
    if (error instanceof RenderLifecycleError) throw error;
    throw new RenderLifecycleError({
      code: 'render_lifecycle_failed',
      phase,
      adapterId: adapter.id,
      frame,
      cause: error,
    });
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
  }
}

const registry = new Map<string, SeekableAdapter>();

export function registerSeekable(adapter: SeekableAdapter): void {
  const previous = registry.get(adapter.id);
  if (previous && previous !== adapter && previous.dispose) {
    void runLifecycleStep(
      previous,
      'dispose',
      DEFAULT_RENDER_LIFECYCLE_TIMEOUTS.disposeMs,
      () => previous.dispose!(),
    ).catch((error) => console.error(error));
  }
  registry.set(adapter.id, adapter);
}

export async function unregisterSeekable(
  id: string,
  timeouts?: Partial<RenderLifecycleTimeouts>,
): Promise<void> {
  const adapter = registry.get(id);
  registry.delete(id);
  if (adapter?.dispose) {
    await runLifecycleStep(adapter, 'dispose', resolveTimeouts(timeouts).disposeMs, () => adapter.dispose!());
  }
}

export async function disposeSeekables(timeouts?: Partial<RenderLifecycleTimeouts>): Promise<void> {
  const ids = [...registry.keys()];
  for (const id of ids) await unregisterSeekable(id, timeouts);
}

/** Prepare all currently mounted render adapters in registration order. */
export async function prepareSeekables(timeouts?: Partial<RenderLifecycleTimeouts>): Promise<void> {
  const timeoutMs = resolveTimeouts(timeouts).prepareMs;
  for (const adapter of registry.values()) {
    if (adapter.prepare) await runLifecycleStep(adapter, 'prepare', timeoutMs, () => adapter.prepare!());
  }
}

/** Wait until all currently mounted render adapters declare capture readiness. */
export async function waitForSeekablesReady(timeouts?: Partial<RenderLifecycleTimeouts>): Promise<void> {
  const timeoutMs = resolveTimeouts(timeouts).readyMs;
  for (const adapter of registry.values()) {
    if (adapter.ready) await runLifecycleStep(adapter, 'ready', timeoutMs, () => adapter.ready!());
  }
}

/** Render one frame and await all asynchronous adapters before capture. */
export async function renderSeekables(
  frame: number,
  fps: number,
  timeouts?: Partial<RenderLifecycleTimeouts>,
): Promise<boolean> {
  const context = { frame, fps, timeSeconds: frame / Math.max(1, fps) };
  const timeoutMs = resolveTimeouts(timeouts).renderMs;
  let needsExtraRaf = false;
  for (const adapter of registry.values()) {
    await runLifecycleStep(adapter, 'render', timeoutMs, () => {
      if (adapter.render) return adapter.render(context);
      return adapter.seek(context.timeSeconds, frame);
    }, frame);
    if (adapter.requiresRaf) needsExtraRaf = true;
  }
  return needsExtraRaf;
}

/**
 * Called by the renderer runtime after timeline.seekToFrame() on every frame.
 * Returns true if any adapter declared requiresRaf, so the runtime can add an
 * extra rAF before screenshotting.
 */
export function flushSeekables(frame: number, fps: number): boolean {
  const timeSeconds = frame / Math.max(1, fps);
  let needsExtraRaf = false;
  for (const adapter of registry.values()) {
    adapter.seek(timeSeconds, frame);
    if (adapter.requiresRaf) needsExtraRaf = true;
  }
  return needsExtraRaf;
}

/**
 * React hook: registers/unregisters a SeekableAdapter for the lifetime of the
 * component. Re-registers when the adapter reference changes.
 */
export function useSeekable(adapter: SeekableAdapter): void {
  useLayoutEffect(() => {
    registerSeekable(adapter);
    return () => {
      void unregisterSeekable(adapter.id).catch((error) => console.error(error));
    };
  }, [adapter]);
}

/**
 * Convenience helper for GSAP timelines. Wraps a paused GSAP timeline as a
 * SeekableAdapter. GSAP is an optional peer — the caller must have it installed.
 *
 * Usage:
 *   const tl = gsap.timeline({ paused: true }).to(...);
 *   useSeekable(gsapSeekable(tl, 'my-gsap-anim'));
 */
export function gsapSeekable(
  gsapTimeline: { seek(time: number): void },
  id: string
): SeekableAdapter {
  return {
    id,
    seek(timeSeconds) {
      gsapTimeline.seek(timeSeconds);
    },
    requiresRaf: false,
  };
}
