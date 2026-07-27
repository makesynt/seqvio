/**
 * browser-recorder's CaptureSession implementation.
 *
 * record() runs the plan via the existing puppeteer recorder and adapts the
 * result to @seqvio/capture's BrowserCaptureManifest. Step timeMs is evenly
 * spaced across the recording duration for now (browser actions don't carry
 * absolute timestamps); deriving precise per-action timeMs from clicks/cursor
 * is a Phase 1.3 follow-up.
 */

import type {
  CaptureContext,
  CaptureSession,
  BrowserCaptureManifest,
} from '@seqvio/capture';
import type { BrowserRecordingPlan, RecordingManifest } from './types';
import { recordPlan } from './record';

/**
 * Adapt a browser-recorder RecordingManifest (+ the plan for action labels) to
 * a capture BrowserCaptureManifest.
 */
export function toBrowserCaptureManifest(
  recording: RecordingManifest,
  plan: BrowserRecordingPlan,
): BrowserCaptureManifest {
  const stepCount = plan.actions.length;
  const stepDuration =
    stepCount > 0 ? recording.durationMs / stepCount : recording.durationMs;
  return {
    kind: 'browser',
    name: recording.name,
    durationMs: recording.durationMs,
    viewport: { width: recording.recordingWidth, height: recording.recordingHeight },
    renderFps: recording.renderFps,
    steps: plan.actions.map((action, index) => ({
      id: action.id,
      label: action.label,
      timeMs: index * stepDuration,
      capturedState: { kind: 'browser', url: plan.startUrl },
    })),
    sourceVideo: recording.sourceVideo,
    cursorPoints: recording.cursorPoints,
    focusTargets: recording.focusTargets,
    clicks: recording.clicks,
  };
}

export const browserCaptureSession: CaptureSession<BrowserRecordingPlan> = {
  kind: 'browser',
  async record(plan, ctx: CaptureContext) {
    const recorded = await recordPlan(plan, ctx.jobDir);
    return toBrowserCaptureManifest(recorded.manifest, plan);
  },
};
