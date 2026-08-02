import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeSpeechRate,
  estimateNarrationDurationMs,
  resolveScenePacing,
  resolvePacingProfile,
  mapSceneOutputFrameToSource,
  mapSceneSourceFrameToOutput,
} from '../dist/index.js';

test('pacing profiles are versioned and reject unknown ids', () => {
  assert.equal(resolvePacingProfile().id, 'explainer-v1');
  assert.equal(resolvePacingProfile().version, 1);
  assert.throws(() => resolvePacingProfile('future-v9'), /Unsupported pacing profile/);
});

test('scene frame mapping is monotonic and invertible at anchors', () => {
  assert.equal(mapSceneOutputFrameToSource(54, 60, 108), 30);
  assert.equal(mapSceneSourceFrameToOutput(30, 60, 108), 54);
  const timeMap = [
    { outputFrame: 0, sourceFrame: 0 },
    { outputFrame: 70, sourceFrame: 20 },
    { outputFrame: 120, sourceFrame: 60 },
  ];
  assert.equal(mapSceneOutputFrameToSource(70, 60, 120, timeMap), 20);
  assert.equal(mapSceneSourceFrameToOutput(20, 60, 120, timeMap), 70);
});

test('speech pacing distinguishes natural and excessive rates', () => {
  assert.equal(analyzeSpeechRate('这是一个清楚的中文解释。', 3000).status, 'ok');
  assert.equal(analyzeSpeechRate('one two three four five six seven eight nine ten', 1000).status, 'too_fast');
  assert.ok(estimateNarrationDurationMs('This is a short explanation.') > 1000);
});

test('authored code highlights are spread to the minimum perceptual duration', () => {
  const resolved = resolveScenePacing({
    type: 'code',
    id: 'code',
    language: 'ts',
    source: 'const value = 1;',
    steps: [
      { at: 0, action: 'focus', range: { startLine: 1, endLine: 1 } },
      { at: 2, action: 'type', range: { startLine: 1, endLine: 1 } },
    ],
  }, 30);
  assert.equal(resolved.scene.steps[1].at, 27);
  assert.ok(resolved.highlights.every((highlight) => highlight.endFrame - highlight.startFrame >= 27));
});

test('captured terminal timing remains unchanged and exposes short highlights to QA', () => {
  const resolved = resolveScenePacing({
    type: 'terminal',
    id: 'terminal',
    events: [{ timeMs: 0, kind: 'stdout', text: 'ok' }],
    steps: [
      { id: 'one', label: 'one', timeMs: 0 },
      { id: 'two', label: 'two', timeMs: 100 },
    ],
  }, 30);
  assert.equal(resolved.scene.steps[1].timeMs, 100);
  assert.ok(resolved.highlights[0].endFrame - resolved.highlights[0].startFrame < 27);
});
