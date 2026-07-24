import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveTerminalZoomCamera } from '../dist/TerminalDemo.js';

const OPTS = { contentWidth: 1000, contentHeight: 600, maxZoom: 2.2, transitionMs: 400 };
// Zoom into an input line at t=1000, then ease back to overview at t=2000.
const FRAMES = [
  { timeMs: 1000, zoomIn: true, centerX: 100, centerY: 50 },
  { timeMs: 2000, zoomIn: false, centerX: 500, centerY: 300 },
];

test('no keyframes returns the base overview camera', () => {
  const cam = resolveTerminalZoomCamera(500, [], OPTS);
  assert.equal(cam.scale, 1);
  assert.equal(cam.translateX, 0);
  assert.equal(cam.translateY, 0);
  assert.equal(cam.centerX, 500);
  assert.equal(cam.centerY, 300);
});

test('before the first keyframe stays at overview', () => {
  const cam = resolveTerminalZoomCamera(0, FRAMES, OPTS);
  assert.equal(cam.scale, 1);
});

test('after the zoom-in transition reaches maxZoom', () => {
  const cam = resolveTerminalZoomCamera(1400, FRAMES, OPTS);
  assert.equal(cam.scale, 2.2);
});

test('after the reset transition eases back to overview', () => {
  const cam = resolveTerminalZoomCamera(2400, FRAMES, OPTS);
  assert.equal(cam.scale, 1);
});

test('mid-transition scale eases between 1 and maxZoom', () => {
  const cam = resolveTerminalZoomCamera(1200, FRAMES, OPTS);
  // smoothstep(0.5) = 0.5 -> 1 + (2.2 - 1) * 0.5 = 1.6
  assert.ok(cam.scale > 1 && cam.scale < 2.2);
  assert.equal(Math.round(cam.scale * 100) / 100, 1.6);
});

test('translate keeps the focus center on screen and within bounds', () => {
  const opts = { contentWidth: 1000, contentHeight: 600, maxZoom: 1.5, transitionMs: 400 };
  const frames = [{ timeMs: 0, zoomIn: true, centerX: 500, centerY: 300 }];
  const cam = resolveTerminalZoomCamera(400, frames, opts);
  assert.equal(cam.scale, 1.5);
  // The focus center maps to the output center.
  assert.equal(Math.round(cam.centerX * cam.scale + cam.translateX), 500);
  assert.equal(Math.round(cam.centerY * cam.scale + cam.translateY), 300);
  // translate is clamped so the scaled canvas never reveals a blank margin.
  const scaledW = 1000 * cam.scale;
  const scaledH = 600 * cam.scale;
  assert.ok(cam.translateX >= Math.min(0, 1000 - scaledW) - 1e-6);
  assert.ok(cam.translateX <= Math.max(0, 1000 - scaledW) + 1e-6);
  assert.ok(cam.translateY >= Math.min(0, 600 - scaledH) - 1e-6);
  assert.ok(cam.translateY <= Math.max(0, 600 - scaledH) + 1e-6);
});

test('heavy zoom on an off-center input line clamps to the edge', () => {
  const frames = [{ timeMs: 0, zoomIn: true, centerX: 50, centerY: 30 }];
  const cam = resolveTerminalZoomCamera(400, frames, OPTS);
  assert.equal(cam.scale, 2.2);
  const scaledW = 1000 * cam.scale;
  const scaledH = 600 * cam.scale;
  // Canvas is larger than the viewport, so translate is pinned to [min, max].
  assert.ok(cam.translateX >= Math.min(0, 1000 - scaledW) - 1e-6);
  assert.ok(cam.translateX <= Math.max(0, 1000 - scaledW) + 1e-6);
  assert.ok(cam.translateY >= Math.min(0, 600 - scaledH) - 1e-6);
  assert.ok(cam.translateY <= Math.max(0, 600 - scaledH) + 1e-6);
});
