import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findNarrationAnchorMatches,
  normalizeNarrationText,
  resolveNarrationAnchor,
} from '../dist/index.js';

test('normalizes language tags, width variants, and whitespace', () => {
  assert.equal(normalizeNarrationText('<|zh|>五十 × １０１'), '五十×101');
});

test('resolves an anchor inside a measured chunk by character ratio', () => {
  const result = resolveNarrationAnchor({
    id: 'math',
    text: '<|zh|>第一步。五十乘一百零一，等于五千零五十。',
    startFrame: 120,
    endFrame: 240,
    chunks: [
      { text: '<|zh|>第一步。', offsetFrame: 0, durationFrame: 24 },
      { text: '五十乘一百零一，等于五千零五十。', offsetFrame: 30, durationFrame: 90 },
    ],
  }, { text: '等于五千零五十' }, 24);

  assert.equal(result.ok, true);
  assert.equal(result.method, 'chunk-character');
  assert.equal(result.chunkIndex, 1);
  assert.ok(result.cueLocalFrame > 30);
  assert.equal(result.absoluteFrame, 120 + result.cueLocalFrame);
});

test('requires occurrence for repeated phrases', () => {
  const cue = { id: 'repeat', text: '先检查结果，再检查结果。', startFrame: 0, endFrame: 60 };
  const ambiguous = resolveNarrationAnchor(cue, { text: '检查结果' }, 30);
  assert.deepEqual(ambiguous, {
    ok: false,
    code: 'anchor_ambiguous',
    message: 'Anchor "检查结果" occurs 2 times in narration cue "repeat"; set occurrence.',
    matchCount: 2,
  });
  const second = resolveNarrationAnchor(cue, { text: '检查结果', occurrence: 2 }, 30);
  assert.equal(second.ok, true);
  assert.equal(second.occurrence, 2);
  assert.equal(findNarrationAnchorMatches(cue.text, '检查结果').length, 2);
});

test('falls back to cue character timing without chunks', () => {
  const result = resolveNarrationAnchor({
    id: 'plain', text: 'one two three four', startMs: 1000, endMs: 5000,
  }, { text: 'three' }, 30);
  assert.equal(result.ok, true);
  assert.equal(result.method, 'cue-character');
  assert.ok(result.absoluteFrame > 30);
});

test('reports an anchor that is absent', () => {
  const result = resolveNarrationAnchor({
    id: 'missing', text: 'Only this text', startFrame: 0, endFrame: 30,
  }, { text: 'another phrase' }, 30);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'anchor_not_found');
});
