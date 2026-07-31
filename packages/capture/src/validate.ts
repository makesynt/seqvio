import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  BrowserCaptureManifest,
  CaptureManifest,
  CaptureState,
  CaptureStep,
  TerminalCaptureManifest,
} from './types';

export type CaptureDiagnosticSeverity = 'error' | 'warning';

export interface CaptureDiagnostic {
  severity: CaptureDiagnosticSeverity;
  code: string;
  path: string;
  message: string;
  repair?: string;
}

export interface CaptureValidationOptions {
  /** Capture profile requires every operation to carry observed state. */
  requireCapturedState?: boolean;
  /** Resolve relative browser media paths from this directory. */
  baseDir?: string;
  /** Check local browser media existence when a baseDir is provided. */
  checkMediaFiles?: boolean;
}

function add(
  diagnostics: CaptureDiagnostic[],
  severity: CaptureDiagnosticSeverity,
  code: string,
  pathName: string,
  message: string,
  repair?: string,
): void {
  diagnostics.push({ severity, code, path: pathName, message, repair });
}

function finitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function finiteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validateState(
  state: CaptureState,
  expectedKind: CaptureManifest['kind'],
  statePath: string,
  diagnostics: CaptureDiagnostic[],
): void {
  if (state.kind !== expectedKind) {
    add(
      diagnostics,
      'error',
      'captured_state_kind_mismatch',
      `${statePath}.kind`,
      `Captured state kind "${state.kind}" does not match manifest kind "${expectedKind}".`,
      'Record state using the adapter kind that produced the step.',
    );
  }
}

function validateSteps(
  manifest: CaptureManifest,
  options: CaptureValidationOptions,
  diagnostics: CaptureDiagnostic[],
): void {
  if (!Array.isArray(manifest.steps)) {
    add(diagnostics, 'error', 'invalid_capture_steps', 'steps', 'steps must be an array.');
    return;
  }
  if (manifest.steps.length === 0) {
    add(
      diagnostics,
      'error',
      'missing_capture_steps',
      'steps',
      'Capture manifest must contain at least one operation step.',
      'Preserve the actions that explain the captured session.',
    );
  }

  const seenIds = new Set<string>();
  let previousTime = -1;
  manifest.steps.forEach((step: CaptureStep, index) => {
    const stepPath = `steps[${index}]`;
    if (!step || typeof step !== 'object') {
      add(diagnostics, 'error', 'invalid_capture_step', stepPath, 'Capture step must be an object.');
      return;
    }
    if (typeof step.id !== 'string' || step.id.trim().length === 0) {
      add(diagnostics, 'error', 'missing_capture_step_id', `${stepPath}.id`, 'Capture step id is required.');
    } else if (seenIds.has(step.id)) {
      add(diagnostics, 'error', 'duplicate_capture_step_id', `${stepPath}.id`, `Duplicate capture step id "${step.id}".`);
    } else {
      seenIds.add(step.id);
    }
    if (typeof step.label !== 'string' || step.label.trim().length === 0) {
      add(diagnostics, 'error', 'missing_capture_step_label', `${stepPath}.label`, 'Capture step label is required.');
    }
    if (!finiteNonNegative(step.timeMs)) {
      add(diagnostics, 'error', 'invalid_capture_step_time', `${stepPath}.timeMs`, 'Capture step timeMs must be finite and non-negative.');
    } else {
      if (step.timeMs < previousTime) {
        add(diagnostics, 'error', 'non_monotonic_capture_steps', `${stepPath}.timeMs`, 'Capture step timestamps must be non-decreasing.');
      }
      if (previousTime >= 0 && step.timeMs >= previousTime && step.timeMs - previousTime < 250) {
        add(
          diagnostics,
          'warning',
          'capture_steps_too_dense',
          `${stepPath}.timeMs`,
          'Consecutive capture steps are less than 250ms apart and may be hard to follow.',
          'Merge the operations or add a short explanatory hold.',
        );
      }
      if (step.timeMs > manifest.durationMs) {
        add(diagnostics, 'error', 'capture_step_after_duration', `${stepPath}.timeMs`, 'Capture step occurs after manifest duration.');
      }
      previousTime = step.timeMs;
    }
    if (options.requireCapturedState && !step.capturedState) {
      add(
        diagnostics,
        'error',
        'missing_captured_state',
        `${stepPath}.capturedState`,
        'Capture profile requires observed state for every operation.',
        'Record stdout/page state before generating narration.',
      );
    } else if (step.capturedState) {
      validateState(step.capturedState, manifest.kind, `${stepPath}.capturedState`, diagnostics);
    }
  });
}

function validateTerminal(
  manifest: TerminalCaptureManifest,
  diagnostics: CaptureDiagnostic[],
): void {
  if (!finitePositive(manifest.cols) || !finitePositive(manifest.rows)) {
    add(diagnostics, 'error', 'invalid_terminal_dimensions', 'cols', 'Terminal cols and rows must be positive numbers.');
  }
  if (!Array.isArray(manifest.events) || manifest.events.length === 0) {
    add(diagnostics, 'error', 'missing_terminal_events', 'events', 'Terminal capture must contain events.');
    return;
  }
  let previousTime = -1;
  manifest.events.forEach((event, index) => {
    const eventPath = `events[${index}]`;
    if (!finiteNonNegative(event.timeMs)) {
      add(diagnostics, 'error', 'invalid_terminal_event_time', `${eventPath}.timeMs`, 'Terminal event timeMs must be finite and non-negative.');
    } else {
      if (event.timeMs < previousTime) {
        add(diagnostics, 'error', 'non_monotonic_terminal_events', `${eventPath}.timeMs`, 'Terminal event timestamps must be non-decreasing.');
      }
      if (event.timeMs > manifest.durationMs) {
        add(diagnostics, 'error', 'terminal_event_after_duration', `${eventPath}.timeMs`, 'Terminal event occurs after manifest duration.');
      }
      previousTime = event.timeMs;
    }
    if (!['stdin', 'stdout', 'stderr'].includes(event.kind)) {
      add(diagnostics, 'error', 'invalid_terminal_event_kind', `${eventPath}.kind`, 'Terminal event kind must be stdin, stdout, or stderr.');
    }
    if (typeof event.text !== 'string') {
      add(diagnostics, 'error', 'invalid_terminal_event_text', `${eventPath}.text`, 'Terminal event text must be a string.');
    }
  });
}

function localMediaPath(sourceVideo: string, baseDir: string): string | undefined {
  if (sourceVideo.startsWith('data:') || /^https?:\/\//i.test(sourceVideo)) return undefined;
  if (sourceVideo.startsWith('file://')) {
    try {
      return new URL(sourceVideo).pathname.replace(/^\/(?:[A-Za-z]:)/, (match) => match.slice(1));
    } catch {
      return undefined;
    }
  }
  return path.resolve(baseDir, sourceVideo);
}

function validateTimedPoints(
  points: unknown,
  pathName: string,
  durationMs: number,
  diagnostics: CaptureDiagnostic[],
): void {
  if (!Array.isArray(points)) {
    add(diagnostics, 'error', 'invalid_browser_points', pathName, 'Browser timing points must be an array.');
    return;
  }
  let previous = -1;
  points.forEach((point, index) => {
    const pointPath = `${pathName}[${index}]`;
    if (!point || typeof point !== 'object' || !finiteNonNegative((point as { timeMs?: unknown }).timeMs)) {
      add(diagnostics, 'error', 'invalid_browser_point_time', `${pointPath}.timeMs`, 'Browser point timeMs must be finite and non-negative.');
      return;
    }
    const timeMs = (point as { timeMs: number }).timeMs;
    if (timeMs < previous) add(diagnostics, 'error', 'non_monotonic_browser_points', `${pointPath}.timeMs`, 'Browser timing points must be non-decreasing.');
    if (timeMs > durationMs) add(diagnostics, 'error', 'browser_point_after_duration', `${pointPath}.timeMs`, 'Browser timing point occurs after manifest duration.');
    previous = timeMs;
    if (!Number.isFinite((point as { x?: unknown }).x) || !Number.isFinite((point as { y?: unknown }).y)) {
      add(diagnostics, 'error', 'invalid_browser_point_coordinates', pointPath, 'Browser timing point x/y must be finite numbers.');
    }
  });
}

function validateBrowser(
  manifest: BrowserCaptureManifest,
  options: CaptureValidationOptions,
  diagnostics: CaptureDiagnostic[],
): void {
  if (typeof manifest.sourceVideo !== 'string' || manifest.sourceVideo.trim().length === 0) {
    add(diagnostics, 'error', 'missing_browser_media', 'sourceVideo', 'Browser capture sourceVideo is required.');
  } else if (options.checkMediaFiles && options.baseDir) {
    const localPath = localMediaPath(manifest.sourceVideo, options.baseDir);
    if (localPath && !fs.existsSync(localPath)) {
      add(diagnostics, 'error', 'missing_browser_media', 'sourceVideo', `Browser capture media does not exist: ${localPath}`, 'Re-record the browser session or restore the media artifact.');
    }
  }
  validateTimedPoints(manifest.cursorPoints, 'cursorPoints', manifest.durationMs, diagnostics);
  validateTimedPoints(manifest.focusTargets, 'focusTargets', manifest.durationMs, diagnostics);
  validateTimedPoints(manifest.clicks, 'clicks', manifest.durationMs, diagnostics);
}

export function validateCaptureManifest(
  input: unknown,
  options: CaptureValidationOptions = {},
): CaptureDiagnostic[] {
  const diagnostics: CaptureDiagnostic[] = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    add(diagnostics, 'error', 'invalid_capture_manifest', '$', 'Capture manifest must be an object.');
    return diagnostics;
  }
  const manifest = input as CaptureManifest;
  if (manifest.kind !== 'terminal' && manifest.kind !== 'browser') {
    add(diagnostics, 'error', 'unsupported_capture_kind', 'kind', 'Capture kind must be terminal or browser.');
    return diagnostics;
  }
  if (typeof manifest.name !== 'string' || manifest.name.trim().length === 0) add(diagnostics, 'error', 'missing_capture_name', 'name', 'Capture manifest name is required.');
  if (!finitePositive(manifest.durationMs)) add(diagnostics, 'error', 'invalid_capture_duration', 'durationMs', 'Capture durationMs must be a positive number.');
  if (!manifest.viewport || !finitePositive(manifest.viewport.width) || !finitePositive(manifest.viewport.height)) add(diagnostics, 'error', 'invalid_capture_viewport', 'viewport', 'Capture viewport width and height must be positive numbers.');
  if (!finitePositive(manifest.renderFps)) add(diagnostics, 'error', 'invalid_capture_fps', 'renderFps', 'Capture renderFps must be a positive number.');
  if (!finitePositive(manifest.durationMs)) return diagnostics;

  validateSteps(manifest, options, diagnostics);
  if (manifest.kind === 'terminal') validateTerminal(manifest, diagnostics);
  if (manifest.kind === 'browser') validateBrowser(manifest, options, diagnostics);
  return diagnostics;
}
