/**
 * @seqvio/capture - capture-session contract and manifest types.
 *
 * Capture is agent-driven: an agent controls the session (runs commands, clicks
 * the UI) and explains it (generates narration from what actually happened, not
 * from the plan). The contract unifies terminal, browser, git, CI, and trace
 * capture sources behind a single CaptureSession interface, compiled to a
 * CompositionDocument IR so narration, groundTruth, and CI-diffability all
 * attach in one place.
 */

import type {
  CompositionDocument,
  TerminalRenderOptions,
  TimedPoint,
  RecordedFocusTarget,
} from '@seqvio/core';

// === Capture kinds ===

export type CaptureKind = 'terminal' | 'browser';

// === Capture context / progress ===

export interface CaptureContext {
  jobDir: string;
  onProgress?: (progress: CaptureProgress) => void;
}

export interface CaptureProgress {
  phase: 'recording' | 'encoding' | 'done' | 'failed';
  percent: number;
  message: string;
}

// === Capture step: operation semantics + captured real state (for AI explain) ===

export interface CaptureStep {
  id: string;
  /** What the agent did (operation semantics). */
  label: string;
  timeMs: number;
  /**
   * What really happened at this step. Feeds AI explain (narration generated
   * from real state, not the plan) and Phase 2 verification.
   */
  capturedState?: CaptureState;
}

export type CaptureState =
  | { kind: 'terminal'; stdout?: string; stderr?: string }
  | { kind: 'browser'; screenshot?: string; url?: string; pageTitle?: string };

// === Capture manifest (per-kind union) ===

export interface CaptureManifestBase {
  kind: CaptureKind;
  name: string;
  durationMs: number;
  viewport: { width: number; height: number };
  renderFps: number;
  /** Per-step operation semantics + captured real state. */
  steps: CaptureStep[];
}

// --- Terminal ---

export interface TerminalCaptureEvent {
  timeMs: number;
  kind: 'stdin' | 'stdout' | 'stderr';
  text: string;
  transient?: boolean;
}

export interface TerminalCaptureManifest extends CaptureManifestBase {
  kind: 'terminal';
  events: TerminalCaptureEvent[];
  cols: number;
  rows: number;
  maxLines?: number;
  renderOptions?: TerminalRenderOptions;
  /** Asciinema cast path. */
  castPath?: string;
  exitCode?: number;
}

// --- Browser ---
// TimedPoint, RecordedFocusTarget imported from @seqvio/core - shared with the IR.

export interface BrowserCaptureManifest extends CaptureManifestBase {
  kind: 'browser';
  sourceVideo: string;
  cursorPoints: TimedPoint[];
  focusTargets: RecordedFocusTarget[];
  clicks: TimedPoint[];
  maxZoom?: number;
}

export type CaptureManifest =
  | TerminalCaptureManifest
  | BrowserCaptureManifest;

// === Capture plan (per-kind; adapters define their own plan types) ===

export type CapturePlan = Record<string, unknown>;

// === CaptureSession contract ===

export interface CaptureSession<P = CapturePlan> {
  kind: CaptureKind;
  record(plan: P, ctx: CaptureContext): Promise<CaptureManifest>;
}

// === AI explain: narration provider ===

export interface NarrationProvider {
  /**
   * Generate narration text for a step, given the captured real state. This is
   * the AI explain step: narration follows what actually happened, not the plan.
   */
  narrate(step: CaptureStep, manifest: CaptureManifest): Promise<string>;
}

// === Compile: manifest -> CompositionDocument IR ===

export interface CompileOptions {
  /** AI explain: if provided, narration is generated per step from capturedState. */
  narration?: NarrationProvider;
  /** Working directory for artifacts (audio manifest). Required to emit audio. */
  jobDir?: string;
}

export interface CompositionDocumentSeed {
  document: CompositionDocument;
  audioManifestPath?: string;
}
