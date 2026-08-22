import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveDesignStageLayout } from '../dist/index.js';

test('contain scales and centers a same-aspect design stage', () => {
  assert.deepEqual(resolveDesignStageLayout(1920, 1080, {
    width: 1280,
    height: 720,
    fit: 'contain',
  }), {
    left: 0,
    top: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    renderedWidth: 1920,
    renderedHeight: 1080,
  });
});

test('contain letterboxes and centers a different-aspect design stage', () => {
  assert.deepEqual(resolveDesignStageLayout(1080, 1080, {
    width: 1920,
    height: 1080,
  }), {
    left: 0,
    top: 236.25,
    scaleX: 0.5625,
    scaleY: 0.5625,
    renderedWidth: 1080,
    renderedHeight: 607.5,
  });
});

test('cover centers deliberate crop and stretch fills both axes', () => {
  assert.deepEqual(resolveDesignStageLayout(1080, 1080, {
    width: 1920,
    height: 1080,
    fit: 'cover',
  }), {
    left: -420,
    top: 0,
    scaleX: 1,
    scaleY: 1,
    renderedWidth: 1920,
    renderedHeight: 1080,
  });
  assert.deepEqual(resolveDesignStageLayout(1080, 1080, {
    width: 1920,
    height: 1080,
    fit: 'stretch',
  }), {
    left: 0,
    top: 0,
    scaleX: 0.5625,
    scaleY: 1,
    renderedWidth: 1080,
    renderedHeight: 1080,
  });
});

test('native rejects output-size mismatch', () => {
  assert.throws(() => resolveDesignStageLayout(1920, 1080, {
    width: 1280,
    height: 720,
    fit: 'native',
}), /does not match output/);
});
