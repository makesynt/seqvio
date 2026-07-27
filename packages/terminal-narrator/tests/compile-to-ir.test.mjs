import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileTerminalCapture } from '../dist/compile-to-ir.js';

test('compileTerminalCapture produces a terminal IR scene from a manifest', async () => {
  const manifest = {
    kind: 'terminal',
    name: 'smoke',
    durationMs: 1000,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    steps: [
      {
        id: 's1',
        label: 'run echo',
        timeMs: 0,
        capturedState: { kind: 'terminal', stdout: 'hello\n' },
      },
    ],
    events: [
      { timeMs: 0, kind: 'stdin', text: 'echo hello\n' },
      { timeMs: 100, kind: 'stdout', text: 'hello\n' },
    ],
    cols: 80,
    rows: 24,
    castPath: '/tmp/smoke.cast',
  };
  const jobDir = path.resolve('./temp/compile-to-ir-smoke');
  fs.rmSync(jobDir, { recursive: true, force: true });
  const seed = await compileTerminalCapture(manifest, { jobDir });

  // IR document
  assert.equal(seed.document.version, '2.0');
  assert.equal(seed.document.id, 'terminal-capture-smoke');
  assert.equal(seed.document.scenes.length, 1);
  const scene = seed.document.scenes[0];
  assert.equal(scene.type, 'terminal');
  assert.equal(scene.id, 'terminal');
  assert.ok(scene.events.length > 0, 'events should be scheduled');
  assert.equal(scene.steps.length, 1);
  assert.equal(scene.steps[0].id, 's1');

  // audio manifest written
  assert.ok(seed.audioManifestPath);
  assert.ok(fs.existsSync(seed.audioManifestPath));
  const audio = JSON.parse(fs.readFileSync(seed.audioManifestPath, 'utf8'));
  assert.equal(audio.narration.length, 1);
  assert.equal(audio.narration[0].text, 'run echo'); // label fallback (no NarrationProvider)
  assert.equal(audio.captions.length, 1);
});

test('compileTerminalCapture uses NarrationProvider for AI explain', async () => {
  const manifest = {
    kind: 'terminal',
    name: 'ai',
    durationMs: 500,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    steps: [{ id: 's1', label: 'list files', timeMs: 0 }],
    events: [{ timeMs: 0, kind: 'stdin', text: 'ls\n' }],
    cols: 80,
    rows: 24,
  };
  const jobDir = path.resolve('./temp/compile-to-ir-ai');
  fs.rmSync(jobDir, { recursive: true, force: true });
  const narration = {
    narrate: async (step) => `The agent ran ${step.label} and saw the output.`,
  };
  const seed = await compileTerminalCapture(manifest, { jobDir, narration });
  const audio = JSON.parse(fs.readFileSync(seed.audioManifestPath, 'utf8'));
  assert.equal(
    audio.narration[0].text,
    'The agent ran list files and saw the output.'
  );
});
