/**
 * terminal-narrator's CaptureSession implementation.
 *
 * record() runs the plan via the existing node-pty recorder and adapts the
 * result to @seqvio/capture's TerminalCaptureManifest. The adapter is thin:
 * per-step capturedState (stdout) is left empty for now, so compileTerminalCapture
 * falls back to the label for narration. Extracting per-step stdout for richer
 * AI explain is a Phase 1.2 follow-up.
 */

import type {
  CaptureContext,
  CaptureSession,
  TerminalCaptureManifest,
} from '@seqvio/capture';
import type { TerminalNarratorPlan, TerminalRecordingManifest } from './types';
import { recordPlan } from './record';

/**
 * Adapt a terminal-narrator TerminalRecordingManifest to a capture
 * TerminalCaptureManifest. Drops the raw snapshot/grid fields from events
 * (compileTerminalCapture re-renders grids via @xterm/headless).
 */
export function toCaptureManifest(
  recording: TerminalRecordingManifest,
  castPath?: string,
): TerminalCaptureManifest {
  return {
    kind: 'terminal',
    name: recording.name,
    durationMs: recording.durationMs,
    viewport: recording.viewport,
    renderFps: recording.renderFps,
    steps: recording.steps.map((step, index) => {
      const startMs = step.timeMs;
      const endMs =
        index + 1 < recording.steps.length
          ? recording.steps[index + 1].timeMs
          : recording.durationMs;
      const stdout = recording.events
        .filter((e) => e.kind === 'stdout' && e.timeMs >= startMs && e.timeMs < endMs)
        .map((e) => e.text)
        .join('');
      return {
        id: step.id,
        label: step.label,
        timeMs: step.timeMs,
        capturedState: stdout ? { kind: 'terminal', stdout } : undefined,
      };
    }),
    events: recording.events.map((event) => ({
      timeMs: event.timeMs,
      kind: event.kind,
      text: event.text,
      transient: event.transient,
    })),
    cols: recording.cols,
    rows: recording.rows,
    castPath,
    exitCode: recording.exitCode,
  };
}

export const terminalCaptureSession: CaptureSession<TerminalNarratorPlan> = {
  kind: 'terminal',
  async record(plan, ctx: CaptureContext) {
    const recording = await recordPlan(plan, ctx.jobDir);
    return toCaptureManifest(recording.manifest, recording.castPath);
  },
};
