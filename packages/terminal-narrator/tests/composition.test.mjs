import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { writeCaptureArtifacts } from '../dist/composition.js';

test('writeCaptureArtifacts dispatches terminal capture through IR to TSX', async () => {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-artifacts-'));
  const artifacts = await writeCaptureArtifacts({
    kind: 'terminal',
    name: 'Terminal demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    durationMs: 2000,
    cols: 120,
    rows: 36,
    maxLines: 220,
    renderOptions: { zoomOnInput: false, maxZoom: 3, title: 'Terminal demo' },
    steps: [{
      id: 'hello',
      label: 'Run hello',
      timeMs: 0,
      capturedState: { kind: 'terminal', stdout: 'hello' },
    }],
    events: [
      { timeMs: 0, kind: 'stdin', text: '$ echo hello\n' },
      { timeMs: 100, kind: 'stdout', text: 'echo hello\nhello\n' },
    ],
  }, jobDir);

  assert.equal(artifacts.document.scenes[0].type, 'terminal');
  assert.equal(artifacts.document.scenes[0].explanation.beats[0].evidence.captureStepId, 'hello');
  assert.equal(artifacts.componentPath, path.join(jobDir, 'composition.tsx'));
  assert.equal(artifacts.audioManifestPath, path.join(jobDir, 'audio-manifest.json'));
  assert.equal(fs.existsSync(artifacts.captureManifestPath), true);
  assert.equal(fs.existsSync(artifacts.explainerDocumentPath), true);

  const source = fs.readFileSync(artifacts.componentPath, 'utf8');
  assert.match(source, /TerminalXtermDemo/);
  assert.match(source, /zoomOnInput=\{false\}/);
  assert.match(source, /maxZoom=\{3\}/);

  const audio = JSON.parse(fs.readFileSync(artifacts.audioManifestPath, 'utf8'));
  assert.equal(audio.narration[0].id, 'terminal.hello');
  assert.equal(audio.explanationBeats[0].id, 'terminal.beat-hello');
});
