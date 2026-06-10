/**
 * Runs against the compiled dist (CommonJS). Build core first:
 * `npm run build -w @seqvio/core`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import React from 'react';
import { buildCompositionLayout, Scene, Transition } from '../dist/index.js';

describe('scene-registry', () => {
  it('computes global scene and transition ranges', () => {
    const layout = buildCompositionLayout([
      React.createElement(Scene, { id: 'a', duration: 60 }, 'A'),
      React.createElement(Transition, { type: 'fade', duration: 15 }),
      React.createElement(Scene, { id: 'b', duration: 45 }, 'B'),
    ]);

    assert.strictEqual(layout.totalDuration, 120);
    assert.strictEqual(layout.scenes[0].globalStart, 0);
    assert.strictEqual(layout.scenes[1].globalStart, 75);
    assert.strictEqual(layout.transitions[0].globalStart, 60);
    assert.strictEqual(layout.transitions[0].afterSceneId, 'a');
    assert.strictEqual(layout.transitions[0].beforeSceneId, 'b');
  });
});
