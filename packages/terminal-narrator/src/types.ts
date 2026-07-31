export type TerminalEventKind = 'stdin' | 'stdout' | 'stderr';

export interface TerminalGridCell {
  x: number;
  chars: string;
  width: number;
  foreground?: string;
  background?: string;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
  invisible?: boolean;
  strikethrough?: boolean;
}

export interface TerminalGridSnapshot {
  cols: number;
  rows: number;
  cursorX: number;
  cursorY: number;
  lines: TerminalGridCell[][];
}

export interface TerminalEvent {
  timeMs: number;
  kind: TerminalEventKind;
  text: string;
  /**
   * If true, this event is only shown transiently while it is being typed and
   * does not persist in the scrollback. Input events are typically transient.
   */
  transient?: boolean;
  /** Complete terminal viewport produced by a terminal emulator. */
  snapshot?: boolean;
  grid?: TerminalGridSnapshot;
  /** Raw ANSI escape-sequence input that produced this snapshot. */
  raw?: string;
}

export interface TerminalInputStep {
  id: string;
  label: string;
  /** Text to send to the terminal (without trailing Enter). */
  text: string;
  /** Delay after sending this input (wait for Claude / tool output). */
  afterMs?: number;
  /** Per-step override for human-like typing delay between characters. */
  typeDelayMs?: number;
  /**
   * Optional regex matched against accumulated stdout after this input is sent.
   * When set, recording waits for a match (up to `waitTimeoutMs`) before
   * proceeding to `afterMs`, instead of blindly sleeping `afterMs`.
   * Mirrors VHS `Wait+Screen /regex/`.
   */
  waitForPattern?: string;
  /** Timeout for `waitForPattern`. Defaults to DEFAULT_WAIT_TIMEOUT_MS. */
  waitTimeoutMs?: number;
}

export interface TerminalShell {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  cols?: number;
  rows?: number;
  /**
   * Windows-only: whether to force ConPTY usage.
   * If set to false, node-pty may fall back to a less noisy path.
   */
  useConpty?: boolean;
}

export type TerminalPresentation = 'minimal' | 'vhs';

export interface TerminalNarratorPlan {
  version: '1.0';
  name: string;
  viewport: { width: number; height: number };
  renderFps?: number;
  /** Captured timeline is based on real wall-clock time of the running subprocess. */
  maxLines?: number;
  shell: TerminalShell;
  inputs: TerminalInputStep[];
  /**
   * Wait after PTY spawn before the first input (Claude Code cold start).
   */
  startupWaitMs?: number;
  /**
   * Optional regex matched against accumulated stdout before first input.
   * Useful for waiting until Claude Code prompt is ready.
   */
  readyPattern?: string;
  /**
   * Human-like delay between keystrokes when writing input (mechanism 1).
   * Set to 0 to dump the whole line at once.
   */
  typeDelayMs?: number;
  /**
   * Visual presentation for TerminalDemo render (VHS-like = gradient + floating window).
   */
  presentation?: TerminalPresentation;
  /**
   * Wait time after the last input before terminating the session.
   * Helps flush async tool output.
   */
  finalWaitMs?: number;
  /**
   * Overall timeout guard (including finalWaitMs). Measured from session start.
   */
  timeoutMs?: number;
  /**
   * Characters per second for the native typewriter replay.
   */
  typingCps?: number;
  /**
   * Hold time after the last captured event so the final terminal state is visible.
   */
  trailingHoldMs?: number;
  /**
   * Maximum idle gap between events during render-time scheduling. Gaps longer
   * than this are compressed to this value. Mirrors asciinema `idle_time_limit`.
   * Maps to `scheduleTerminalSnapshotEvents` `maximumGapMs`.
   */
  idleTimeLimitMs?: number;
  /**
   * Minimum on-screen duration for a terminal snapshot during render-time
   * scheduling, so readable TUI states are not flashed past. Maps to
   * `scheduleTerminalSnapshotEvents` `minimumSnapshotMs`.
   */
  minSnapshotMs?: number;
  /**
   * Narration/caption sentence locale.
   */
  narrationLocale?: 'zh' | 'en';
  /**
   * Cinematic zoom-to-input: while a command is being typed the content area
   * pushes in toward the input line, then eases back out to show the output.
   * Defaults to true for the native engine.
   */
  zoomOnInput?: boolean;
  /** Maximum magnification when zoomed into an input line. */
  maxZoom?: number;
  /** Ease duration (ms) between overview and input-line focus. */
  zoomTransitionMs?: number;
  /** Hold (ms) after an input finishes typing before easing back out. */
  zoomHoldMs?: number;
  /**
   * Additional regex patterns (as strings) for secret redaction.
   */
  redactPatterns?: string[];
}

export interface TerminalRecordingManifest {
  version: '1.0';
  name: string;
  viewport: { width: number; height: number };
  renderFps: number;
  maxLines: number;
  durationMs: number;
  cols: number;
  rows: number;
  /**
   * Step boundaries captured when we write input to the PTY.
   * Compose may refine these to stdout echo / first-output times for demos.
   */
  steps: Array<{ id: string; label: string; timeMs: number }>;
  /**
   * Output stream events from the subprocess.
   */
  events: TerminalEvent[];
  /**
   * Captured exit code of the recorded subprocess (signal exits become
   * 128 + signal, mirroring asciinema's Exit event). Undefined if not captured.
   */
  exitCode?: number;
}

export type TtsProvider = 'elevenlabs' | 'minimax' | 'edge-tts' | 'openai';

export interface PipelineOptions {
  withAudio?: boolean;
  audioProvider?: TtsProvider;
  audioVoice?: string;
}

export interface PipelineProgress {
  phase:
    | 'queued'
    | 'recording'
    | 'encoding'
    | 'composing'
    | 'synthesizing'
    | 'rendering'
    | 'done'
    | 'failed';
  percent: number;
  message: string;
}

export interface PipelineResult {
  /** Engine is always native (node-pty + TerminalDemo). */
  engine: 'native';
  manifest: TerminalRecordingManifest;
  manifestPath: string;
  /** Asciinema cast exported from the native recording. */
  castPath: string;
  componentPath?: string;
  audioManifestPath?: string;
  resolvedAudioManifestPath?: string;
  outputVideoPath: string;
}

export interface RecorderJob extends PipelineProgress {
  id: string;
  createdAt: string;
  plan: TerminalNarratorPlan;
  manifestPath?: string;
  outputVideoPath?: string;
  error?: string;
}
