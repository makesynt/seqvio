import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileBrowserCapture } from '../dist/compile-to-ir.js';

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

  assert.equal(seed.document.version, '2.0');
  assert.equal(seed.document.id, 'browser-capture-smoke');
  assert.equal(seed.document.scenes.length, 1);
  const scene = seed.document.scenes[0];
  assert.equal(scene.type, 'browser');
  assert.equal(scene.sourceVideo, '/tmp/smoke.mp4');
  assert.equal(scene.cursorPoints.length, 1);
  assert.equal(scene.recordingWidth, 1280);

  // audio manifest with per-step narration (label fallback)
  assert.ok(seed.audioManifestPath);
  const audio = JSON.parse(fs.readFileSync(seed.audioManifestPath, 'utf8'));
  assert.equal(audio.narration.length, 2);
  assert.equal(audio.narration[0].text, 'click login');
  assert.equal(audio.narration[1].text, 'fill email');
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
