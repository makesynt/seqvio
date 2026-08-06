import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ANNOTATION_KINDS, annotationOpacity, orderAnnotationsForStacking } from '../dist/index.js';

describe('annotation primitive determinism', () => {
  it('orders every primitive by priority and stable id independent of input order', () => {
    const annotations = ANNOTATION_KINDS.map((kind, index) => ({ id: `${kind}-${String(index).padStart(2, '0')}`, kind, priority: index % 3 }));
    const expected = orderAnnotationsForStacking(annotations).map((item) => item.id);
    const reversed = orderAnnotationsForStacking([...annotations].reverse()).map((item) => item.id);
    const shuffled = orderAnnotationsForStacking([...annotations].sort((a, b) => (a.id.charCodeAt(1) % 5) - (b.id.charCodeAt(1) % 5))).map((item) => item.id);
    assert.deepEqual(reversed, expected);
    assert.deepEqual(shuffled, expected);
  });

  it('derives every primitive opacity from the requested frame under random and reverse seek', () => {
    const frames = [0, 8, 17, 33, 64, 21, 9, 48];
    for (const kind of ANNOTATION_KINDS) {
      const forward = new Map(frames.map((frame) => [frame, annotationOpacity(frame, 8, 24)]));
      const reverse = new Map([...frames].reverse().map((frame) => [frame, annotationOpacity(frame, 8, 24)]));
      for (const frame of frames) assert.equal(reverse.get(frame), forward.get(frame), `${kind} changed at frame ${frame}`);
    }
  });
});
