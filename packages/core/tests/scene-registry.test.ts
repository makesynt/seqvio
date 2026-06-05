import { describe, it, expect } from 'node:test';
import assert from 'node:assert';
import { buildCompositionLayout } from '../src/scene-registry';
import React from 'react';
import { Scene, Transition } from '../src/composition';

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
