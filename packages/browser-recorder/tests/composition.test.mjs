import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { writeCaptureArtifacts } from '../dist/composition.js';

test('writeCaptureArtifacts dispatches browser capture through IR to TSX', async () => {
  const jobDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-browser-artifacts-'));
  const artifacts = await writeCaptureArtifacts({
    kind: 'browser',
    name: 'Browser demo',
    sourceVideo: path.join(jobDir, 'raw.mp4'),
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    durationMs: 2000,
    maxZoom: 2.2,
    cursorPoints: [],
    focusTargets: [],
    clicks: [],
    steps: [{
      id: 'open',
      label: 'Open the dashboard',
      timeMs: 200,
      capturedState: { kind: 'browser', url: 'https://example.test/dashboard' },
    }],
  }, jobDir);

  assert.equal(artifacts.document.scenes[0].type, 'browser');
  assert.equal(artifacts.document.scenes[0].explanation.beats[0].evidence.captureStepId, 'open');
  assert.equal(artifacts.componentPath, path.join(jobDir, 'composition.tsx'));
  assert.equal(artifacts.audioManifestPath, path.join(jobDir, 'audio-manifest.json'));
  assert.equal(fs.existsSync(artifacts.captureManifestPath), true);
  assert.equal(fs.existsSync(artifacts.compositionDocumentPath), true);

  const source = fs.readFileSync(artifacts.componentPath, 'utf8');
  assert.match(source, /RecordedBrowserDemo/);
  assert.match(source, /maxZoom=\{2\.2\}/);

  const audio = JSON.parse(fs.readFileSync(artifacts.audioManifestPath, 'utf8'));
  assert.equal(audio.narration[0].id, 'browser.open');
  assert.equal(audio.explanationBeats[0].id, 'browser.beat-open');
});
