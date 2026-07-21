import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { writeComposition } from '../dist/compose.js';

test('writeComposition emits a renderable Seqvio contract', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-recorder-'));
  const manifest = {
    version: '1.0', name: 'Demo', sourceVideo: path.join(dir, 'raw.mp4'),
    recordingWidth: 1280, recordingHeight: 720, captureFps: 12, renderFps: 30,
    durationMs: 2000, frameCount: 24, maxZoom: 2.2,
    cursorPoints: [], focusTargets: [], clicks: [],
  };
  fs.writeFileSync(path.join(dir, 'recording-manifest.json'), JSON.stringify(manifest));
  const component = writeComposition(manifest, dir);
  const source = fs.readFileSync(component, 'utf8');
  assert.match(source, /RecordedBrowserDemo/);
  assert.match(source, /duration: DURATION/);
  assert.match(source, /width: recording\.recordingWidth/);
});
