import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRecordedBrowserFrameState } from '../dist/components.js';

const baseOptions = {
  fps: 30,
  recordingWidth: 1440,
  recordingHeight: 900,
  width: 1280,
  height: 720,
  focusTargets: [
    { timeMs: 500, x: 900, y: 120, width: 240, height: 80 },
    { timeMs: 1500, x: 0, y: 0, width: 0, height: 0, reset: true },
  ],
  cursorPoints: [
    { timeMs: 0, x: 100, y: 100 },
    { timeMs: 1000, x: 1100, y: 600 },
  ],
  clicks: [
    { timeMs: 900, x: 1000, y: 500 },
    { timeMs: 300, x: 200, y: 150 },
  ],
  maxZoom: 2.2,
  focusPadding: 110,
  transitionMs: 520,
};

test('browser frame state is independent of seek order', () => {
  const frames = [0, 9, 18, 33, 48, 60];
  const forward = new Map(
    frames.map((frame) => [
      frame,
      resolveRecordedBrowserFrameState({ ...baseOptions, frame }),
    ]),
  );

  for (const frame of [...frames].reverse()) {
    assert.deepEqual(
      resolveRecordedBrowserFrameState({ ...baseOptions, frame }),
      forward.get(frame),
    );
  }
});

test('browser frame state does not mutate capture arrays', () => {
  const before = structuredClone(baseOptions);
  resolveRecordedBrowserFrameState({ ...baseOptions, frame: 30 });
  assert.deepEqual(baseOptions, before);
});

test('browser frame state selects the latest active click by timestamp', () => {
  const state = resolveRecordedBrowserFrameState({ ...baseOptions, frame: 30 });
  assert.equal(state.activeClick?.timeMs, 900);
  assert.ok(state.renderedClick);
});

test('browser frame state returns to the overview after a reset target', () => {
  const state = resolveRecordedBrowserFrameState({ ...baseOptions, frame: 63 });
  assert.equal(state.camera.scale, 1280 / 1440);
  assert.equal(state.camera.centerX, 720);
  assert.equal(state.camera.centerY, 450);
});
