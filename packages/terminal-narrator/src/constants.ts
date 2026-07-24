/**
 * Central defaults and clamp bounds for terminal-narrator plans and rendering.
 */

export const DEFAULT_RENDER_FPS = 30;
export const DEFAULT_MAX_LINES = 220;
export const DEFAULT_FINAL_WAIT_MS = 1200;
export const DEFAULT_STARTUP_WAIT_MS = 0;
export const DEFAULT_TYPE_DELAY_MS = 0;
export const DEFAULT_TYPING_CPS = 52;
export const DEFAULT_TRAILING_HOLD_MS = 1200;
export const DEFAULT_PRESENTATION = 'vhs' as const;
export const DEFAULT_COLS = 120;
export const DEFAULT_ROWS = 36;
export const DEFAULT_TIMEOUT_MS = 60000;
export const DEFAULT_AFTER_MS = 600;
export const DEFAULT_SKILL_AFTER_MS = 20000;
export const DEFAULT_WAIT_TIMEOUT_MS = 30_000;

export const MIN_RENDER_FPS = 24;
export const MAX_RENDER_FPS = 60;

export const MIN_MAX_LINES = 50;
export const MAX_MAX_LINES = 500;

export const MIN_VIEWPORT_WIDTH = 640;
export const MAX_VIEWPORT_WIDTH = 3840;
export const MIN_VIEWPORT_HEIGHT = 360;
export const MAX_VIEWPORT_HEIGHT = 2160;

export const MIN_SECRET_LENGTH = 4;

/** If compressed events JSON exceeds this size, write to an external module. */
export const INLINE_EVENTS_THRESHOLD = 32768;
