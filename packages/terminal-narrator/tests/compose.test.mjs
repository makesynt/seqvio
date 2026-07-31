import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { writeComposition } from '../dist/compose.js';

test('writeComposition emits TerminalXtermDemo with audio metadata', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-narrator-'));
  const manifest = {
    version: '1.0',
    name: 'Terminal demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 2000,
    cols: 120,
    rows: 36,
    steps: [{ id: 'hello', label: 'Run hello', timeMs: 0 }],
    events: [
      { timeMs: 0, kind: 'stdin', text: '$ echo hello\n' },
      { timeMs: 100, kind: 'stdout', text: 'echo hello\nhello\n' },
    ],
  };

  fs.writeFileSync(path.join(dir, 'recording-manifest.json'), JSON.stringify(manifest));

  const result = await writeComposition(
    manifest,
    dir,
    {
      version: '1.0',
      name: 'Terminal demo',
      viewport: { width: 1280, height: 720 },
      shell: { command: 'cmd.exe' },
      inputs: [{ id: 'hello', label: 'Run hello', text: 'echo hello' }],
    }
  );

  const source = fs.readFileSync(result.componentPath, 'utf8');
  assert.match(source, /TerminalXtermDemo/);
  assert.match(source, /zoomOnInput=\{true\}/);
  assert.match(source, /maxZoom=\{2\.2\}/);
  assert.match(source, /audio=\{meta\.audio\}/);
  assert.match(source, /narration/);
  assert.match(source, /captions/);
  assert.match(source, /"timeMs": 100/);
  assert.equal(fs.existsSync(result.audioManifestPath), true);
  const audioManifest = JSON.parse(fs.readFileSync(result.audioManifestPath, 'utf8'));
  assert.ok(Array.isArray(audioManifest.narration));
  assert.ok(audioManifest.narration.length > 0);
  assert.equal(audioManifest.narration[0].startMs, 100);
  assert.match(audioManifest.captions[0].text, /hello/i);
});

test('writeComposition honors zoomOnInput=false and custom maxZoom from the plan', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-terminal-narrator-'));
  const manifest = {
    version: '1.0',
    name: 'Terminal demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 2000,
    cols: 120,
    rows: 36,
    steps: [{ id: 'hello', label: 'Run hello', timeMs: 0 }],
    events: [
      { timeMs: 0, kind: 'stdin', text: '$ echo hello\n' },
      { timeMs: 100, kind: 'stdout', text: 'echo hello\nhello\n' },
    ],
  };

  fs.writeFileSync(path.join(dir, 'recording-manifest.json'), JSON.stringify(manifest));

  const result = await writeComposition(manifest, dir, {
    version: '1.0',
    name: 'Terminal demo',
    viewport: { width: 1280, height: 720 },
    shell: { command: 'cmd.exe' },
    inputs: [{ id: 'hello', label: 'Run hello', text: 'echo hello' }],
    zoomOnInput: false,
    maxZoom: 3,
  });

  const source = fs.readFileSync(result.componentPath, 'utf8');
  assert.match(source, /zoomOnInput=\{false\}/);
  assert.match(source, /maxZoom=\{3\}/);
  assert.doesNotMatch(source, /zoomOnInput=\{true\}/);
});
