import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileBrowserCapture } from '../dist/compile-to-ir.js';
import { toBrowserCaptureManifest } from '../dist/capture-session.js';
import { validateExplainerDocument } from '@seqvio/core';

test('compileBrowserCapture produces a browser IR scene from a manifest', async () => {
  const manifest = {
    kind: 'browser',
    name: 'smoke',
    durationMs: 2000,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    steps: [
      { id: 'a1', label: 'click login', timeMs: 0 },
      { id: 'a2', label: 'fill email', timeMs: 1000 },
    ],
    sourceVideo: '/tmp/smoke.mp4',
    cursorPoints: [{ timeMs: 0, x: 100, y: 200 }],
    focusTargets: [],
    clicks: [{ timeMs: 500, x: 100, y: 200 }],
  };
  const jobDir = path.resolve('./temp/compile-browser-smoke');
  fs.rmSync(jobDir, { recursive: true, force: true });
  const seed = await compileBrowserCapture(manifest, { jobDir });

  assert.equal(seed.document.format, 'seqvio-explainer');
  assert.equal(seed.document.schemaVersion, '1.0');
  assert.equal(seed.document.id, 'browser-capture-smoke');
  assert.equal(seed.document.scenes.length, 1);
  const scene = seed.document.scenes[0];
  assert.equal(scene.type, 'browser');
  assert.equal(scene.sourceVideo, '/tmp/smoke.mp4');
  assert.equal(scene.cursorPoints.length, 1);
  assert.equal(scene.recordingWidth, 1280);
  assert.equal(scene.steps[1].id, 'a2');
  assert.equal(scene.explanation.beats[1].evidence.captureStepId, 'a2');
  assert.deepEqual(validateExplainerDocument(seed.document), []);

  // audio manifest with per-step narration (label fallback)
  assert.ok(seed.audioManifestPath);
  const audio = JSON.parse(fs.readFileSync(seed.audioManifestPath, 'utf8'));
  assert.equal(audio.narration.length, 2);
  assert.equal(audio.narration[0].text, 'click login');
  assert.equal(audio.narration[1].text, 'fill email');
  assert.equal(audio.narration[0].id, 'browser.a1');
  assert.equal(audio.explanationBeats[1].sourceFrame, 30);
});

test('browser capture adaptation preserves exact recorded action times', () => {
  const adapted = toBrowserCaptureManifest({
    version: '1.0', name: 'clock', sourceVideo: 'clock.mp4',
    recordingWidth: 1280, recordingHeight: 720, captureFps: 15, renderFps: 30,
    durationMs: 4000, frameCount: 60, maxZoom: 2,
    cursorPoints: [], focusTargets: [], clicks: [],
    actionTimings: [{ id: 'first', timeMs: 240 }, { id: 'second', timeMs: 2870 }],
  }, {
    version: '1.0', name: 'clock', startUrl: 'https://example.test',
    viewport: { width: 1280, height: 720 },
    actions: [
      { id: 'first', type: 'wait', label: 'First' },
      { id: 'second', type: 'wait', label: 'Second' },
    ],
  });
  assert.deepEqual(adapted.steps.map((step) => step.timeMs), [240, 2870]);
});

test('compileBrowserCapture uses NarrationProvider for AI explain', async () => {
  const manifest = {
    kind: 'browser',
    name: 'ai',
    durationMs: 1000,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    steps: [{ id: 'a1', label: 'click login', timeMs: 0 }],
    sourceVideo: '/tmp/ai.mp4',
    cursorPoints: [],
    focusTargets: [],
    clicks: [],
  };
  const jobDir = path.resolve('./temp/compile-browser-ai');
  fs.rmSync(jobDir, { recursive: true, force: true });
  const narration = {
    narrate: async (step) => `The agent clicked ${step.label} on the page.`,
  };
  const seed = await compileBrowserCapture(manifest, { jobDir, narration });
  const audio = JSON.parse(fs.readFileSync(seed.audioManifestPath, 'utf8'));
  assert.equal(audio.narration[0].text, 'The agent clicked click login on the page.');
});
