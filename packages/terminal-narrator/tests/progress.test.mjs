import assert from 'node:assert/strict';
import test from 'node:test';
import { terminalRenderProgressPercent } from '../dist/render.js';

test('terminal render phase mapping is monotonic', () => {
  const points = [
    { phase: 'setup', percent: 0 },
    { phase: 'rendering', percent: 0 },
    { phase: 'rendering', percent: 100 },
    { phase: 'encoding', percent: 0 },
    { phase: 'encoding', percent: 100 },
    { phase: 'cleanup', percent: 0 },
    { phase: 'done', percent: 100 },
  ].map((progress) => terminalRenderProgressPercent({ ...progress, message: '' }));
  assert.deepEqual(points, [...points].sort((a, b) => a - b));
  assert.equal(points[0], 75);
  assert.equal(points.at(-1), 99);
});
