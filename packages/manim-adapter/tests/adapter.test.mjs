import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  buildManimCommand,
  executeManimScene,
  hashManimAssets,
  hashManimSource,
  hashManimRender,
  probeManimMedia,
  validateManimScene,
} from '../dist/index.js';

const assetPath = fileURLToPath(new URL('../../../examples/manim/equation.py', import.meta.url));
const scene = {
  format: 'seqvio-manim-scene', version: '1.0', id: 'equation',
  pythonFile: 'examples/manim/equation.py', className: 'EquationDerivation',
  width: 1280, height: 720, fps: 30, quality: 'medium', assets: [assetPath],
};
const unavailable = { available: false, pythonVersion: 'Python test', manimVersion: 'Manim test', capabilities: [], diagnostics: ['test_preflight'] };

describe('Manim adapter', () => {
  it('validates and constructs a deterministic command', () => {
    assert.deepEqual(validateManimScene(scene), []);
    assert.deepEqual(buildManimCommand(scene), ['-m', 'manim', '-qm', '--fps', '30', '-r', '1280,720', scene.pythonFile, scene.className]);
  });

  it('hashes source and produces an inspectable dry-run manifest', async () => {
    assert.equal(await hashManimRender(scene, unavailable), await hashManimRender(scene, unavailable));
    assert.match((await hashManimAssets(scene))[assetPath], /^[a-f0-9]{64}$/);
    assert.match(await hashManimSource(scene), /^[a-f0-9]{64}$/);
    const events = [];
    const manifest = await executeManimScene(scene, { preflight: unavailable, dryRun: true, onProgress: (event) => events.push(event) });
    assert.equal(manifest.status, 'planned');
    assert.equal(manifest.cached, false);
    assert.ok(manifest.cacheKey);
    assert.match(manifest.sourceHash, /^[a-f0-9]{64}$/);
    assert.match(manifest.runtimeHash, /^[a-f0-9]{64}$/);
    assert.equal(events[0].phase, 'planned');
  });

  it('fails before execution when a declared asset is missing', async () => {
    const manifest = await executeManimScene({ ...scene, assets: ['missing.asset'] }, { preflight: unavailable });
    assert.equal(manifest.status, 'failed');
    assert.ok(manifest.diagnostics.includes('missing_asset:missing.asset'));
  });

  it('returns a machine-readable media probe failure for missing output', () => {
    assert.equal(probeManimMedia('missing-manim-output.mp4'), undefined);
  });
});
