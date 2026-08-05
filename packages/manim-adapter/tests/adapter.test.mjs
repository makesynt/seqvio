import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildManimCommand,
  executeManimScene,
  hashManimRender,
  probeManimMedia,
  validateManimScene,
} from '../dist/index.js';

const scene = {
  format: 'seqvio-manim-scene', version: '1.0', id: 'equation',
  pythonFile: 'examples/manim/equation.py', className: 'EquationDerivation',
  fps: 30, quality: 'medium',
};
const unavailable = { available: false, pythonVersion: 'Python test', manimVersion: 'Manim test', capabilities: [], diagnostics: ['test_preflight'] };

describe('Manim adapter', () => {
  it('validates and constructs a deterministic command', () => {
    assert.deepEqual(validateManimScene(scene), []);
    assert.deepEqual(buildManimCommand(scene), ['-m', 'manim', '-qm', '--fps', '30', scene.pythonFile, scene.className]);
  });

  it('hashes source and produces an inspectable dry-run manifest', async () => {
    assert.equal(await hashManimRender(scene, unavailable), await hashManimRender(scene, unavailable));
    const events = [];
    const manifest = await executeManimScene(scene, { preflight: unavailable, dryRun: true, onProgress: (event) => events.push(event) });
    assert.equal(manifest.status, 'planned');
    assert.equal(manifest.cached, false);
    assert.ok(manifest.cacheKey);
    assert.equal(events[0].phase, 'planned');
  });

  it('returns a machine-readable media probe failure for missing output', () => {
    assert.equal(probeManimMedia('missing-manim-output.mp4'), undefined);
  });
});
