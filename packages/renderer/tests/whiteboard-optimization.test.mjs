import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeWhiteboardOptimize,
  usesStaticFrameDedup,
} from '../dist/whiteboard-optimization.js';

describe('whiteboard optimization modes', () => {
  it('maps numeric benchmark modes to named modes', () => {
    assert.equal(normalizeWhiteboardOptimize(undefined), 'none');
    assert.equal(normalizeWhiteboardOptimize('1'), 'react-static');
    assert.equal(normalizeWhiteboardOptimize('2'), 'bitmap-layer');
    assert.equal(normalizeWhiteboardOptimize('3'), 'frame-dedup');
  });

  it('accepts named modes and rejects unknown modes', () => {
    assert.equal(normalizeWhiteboardOptimize('react-static'), 'react-static');
    assert.equal(normalizeWhiteboardOptimize('bitmap-layer'), 'bitmap-layer');
    assert.equal(normalizeWhiteboardOptimize('frame-dedup'), 'frame-dedup');
    assert.throws(
      () => normalizeWhiteboardOptimize('wat'),
      /Unknown whiteboard optimization mode/
    );
  });

  it('enables screenshot dedup only for frame-dedup or the explicit legacy flag', () => {
    assert.equal(usesStaticFrameDedup('frame-dedup', false), true);
    assert.equal(usesStaticFrameDedup('react-static', true), true);
    assert.equal(usesStaticFrameDedup('bitmap-layer', false), false);
  });
});
