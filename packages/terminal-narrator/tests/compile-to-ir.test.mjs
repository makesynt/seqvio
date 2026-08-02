import { test } from 'node:test';
import assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileTerminalCapture } from '../dist/compile-to-ir.js';
import { compileCompositionDocumentToTsx, validateCompositionDocument } from '@seqvio/core';

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
  assert.equal(scene.explanation.cues[0].id, 's1');
  assert.equal(scene.explanation.beats[0].evidence.captureStepId, 's1');
  assert.deepEqual(validateCompositionDocument(seed.document), []);

  // audio manifest written
  assert.ok(seed.audioManifestPath);
  assert.ok(fs.existsSync(seed.audioManifestPath));
  const audio = JSON.parse(fs.readFileSync(seed.audioManifestPath, 'utf8'));
  assert.equal(audio.narration.length, 1);
  assert.equal(audio.narration[0].text, 'run echo'); // label fallback (no NarrationProvider)
  assert.equal(audio.narration[0].id, 'terminal.s1');
  assert.equal(audio.captions.length, 1);
  assert.equal(audio.explanationBeats[0].cueId, 'terminal.s1');
  assert.equal(audio.explanationBeats[0].sourceFrame, 0);
  assert.equal(audio.sceneTimings[0].highlights[0].source, 'beat');
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

test('compileCompositionDocumentToTsx emits TerminalXtermDemo with renderOptions', () => {
  const doc = {
    version: '2.0',
    id: 'render-options',
    width: 1280,
    height: 720,
    fps: 30,
    scenes: [
      {
        type: 'terminal',
        id: 'terminal',
        events: [{ timeMs: 0, kind: 'stdout', text: 'hello' }],
        steps: [{ id: 's1', label: 'step', timeMs: 0 }],
        cols: 80,
        rows: 24,
        maxLines: 1000,
        renderOptions: {
          title: 'Demo',
          presentation: 'vhs',
          typingCps: 30,
          cursorBlink: true,
          zoomOnInput: true,
          maxZoom: 2.5,
          zoomTransitionMs: 500,
          zoomHoldMs: 200,
        },
      },
    ],
  };
  const { code } = compileCompositionDocumentToTsx(doc);
  assert.ok(code.includes('TerminalXtermDemo'), 'tsx should include TerminalXtermDemo');
  assert.ok(code.includes('maxZoom={2.5}'), 'tsx should pass maxZoom');
  assert.ok(code.includes('zoomOnInput={true}'), 'tsx should pass zoomOnInput');
  assert.ok(code.includes('presentation="vhs"'), 'tsx should pass presentation');
  assert.ok(code.includes('typingCps={30}'), 'tsx should pass typingCps');
  assert.ok(code.includes('cursorBlink={true}'), 'tsx should pass cursorBlink');
  assert.ok(code.includes('cols={80}'), 'tsx should pass cols');
  assert.ok(code.includes('maxLines={1000}'), 'tsx should pass maxLines');
  assert.ok(code.includes('title="Demo"'), 'tsx should pass title');
});
