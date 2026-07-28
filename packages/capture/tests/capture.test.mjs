import { test } from 'node:test';
import assert from 'node:assert';
import { compileCaptureManifestToCompositionDocument } from '../dist/compile.js';

const terminalManifest = {
  kind: 'terminal',
  name: 't',
  durationMs: 1000,
  viewport: { width: 1280, height: 720 },
  renderFps: 30,
  steps: [],
  events: [],
  cols: 80,
  rows: 24,
};

test('dispatcher calls the compiler registered for the manifest kind', async () => {
  const compiler = async (m) => ({
    document: { version: '2.0', id: m.name, width: 1280, height: 720, fps: 30, scenes: [] },
  });
  const seed = await compileCaptureManifestToCompositionDocument(terminalManifest, {
    compilers: { terminal: compiler },
  });
  assert.equal(seed.document.id, 't');
});

test('dispatcher throws when no compiler is registered for the kind', async () => {
  await assert.rejects(
    () => compileCaptureManifestToCompositionDocument(terminalManifest, { compilers: {} }),
    /No compiler registered for capture kind "terminal"/
  );
});

test('dispatcher passes options through to the compiler', async () => {
  let receivedOpts;
  const compiler = async (m, opts) => {
    receivedOpts = opts;
    return { document: { version: '2.0', id: 'x', scenes: [] } };
  };
  const narration = { narrate: async () => 'n' };
  await compileCaptureManifestToCompositionDocument(terminalManifest, {
    compilers: { terminal: compiler },
    narration,
    jobDir: '/tmp/job',
  });
  assert.equal(receivedOpts.narration, narration);
  assert.equal(receivedOpts.jobDir, '/tmp/job');
});
