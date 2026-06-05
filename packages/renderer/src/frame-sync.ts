/**
 * Frame synchronization helpers (Node-side metadata only).
 * Browser runtime handles frame updates via the Seqvio runtime globals.
 */

export type FrameSyncFn = (frame: number) => void;

export interface FrameSyncContext {
  componentPath: string;
  sceneModule: Record<string, unknown>;
}

/**
 * @deprecated Browser runtime handles frame sync. Kept for backwards compatibility.
 */
export function resolveFrameSync(_context: FrameSyncContext): {
  name: string | null;
  setFrame: FrameSyncFn | null;
} {
  return { name: 'browser-runtime', setFrame: null };
}
