/**
 * Runs against the compiled dist (CommonJS). Build core first:
 * `npm run build -w @seqvio/core`.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createWaapiAdapter, createCssAdapter } from '../dist/index.js';

function createMockAnimation(initialTime = 0) {
  let currentTime = initialTime;
  let paused = false;
  return {
    get currentTime() { return currentTime; },
    set currentTime(v) { currentTime = v; },
    pause() { paused = true; },
    play() { paused = false; },
    get playState() { return paused ? 'paused' : 'running'; },
  };
}

describe('createWaapiAdapter', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });

  it('seeks all document animations to the correct local time', () => {
    const anim1 = createMockAnimation(0);
    const anim2 = createMockAnimation(500);
    globalThis.document = {
      getAnimations: () => [anim1, anim2],
    };

    const adapter = createWaapiAdapter();
    assert.strictEqual(adapter.id, 'waapi');
    assert.strictEqual(adapter.requiresRaf, false);

    adapter.seek(2.0, 60);
    assert.strictEqual(anim1.currentTime, 2000);
    assert.strictEqual(anim2.currentTime, 2500);
    assert.strictEqual(anim1.playState, 'paused');
  });

  it('handles empty document gracefully', () => {
    globalThis.document = { getAnimations: () => [] };
    const adapter = createWaapiAdapter({ id: 'custom-waapi' });
    assert.strictEqual(adapter.id, 'custom-waapi');
    assert.doesNotThrow(() => adapter.seek(1.0, 30));
  });

  it('handles missing document.getAnimations', () => {
    globalThis.document = {};
    const adapter = createWaapiAdapter();
    assert.doesNotThrow(() => adapter.seek(0.5, 15));
  });
});

describe('createCssAdapter', () => {
  let originalDocument;
  let originalWindow;

  beforeEach(() => {
    originalDocument = globalThis.document;
    originalWindow = globalThis.window;
  });

  afterEach(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  });

  it('seeks CSS animations via getAnimations on elements', () => {
    const anim = createMockAnimation(0);
    const el = {
      isConnected: true,
      style: { animationDelay: '', animationPlayState: '' },
      getAnimations: () => [anim],
    };

    globalThis.window = {
      getComputedStyle: () => ({ animationName: 'spin' }),
    };
    globalThis.document = {
      querySelectorAll: () => [el],
    };

    const adapter = createCssAdapter();
    assert.strictEqual(adapter.id, 'css-keyframes');

    adapter.seek(1.5, 45);
    assert.strictEqual(anim.currentTime, 1500);
    assert.strictEqual(anim.playState, 'paused');
  });

  it('falls back to negative animation-delay when no WAAPI handles', () => {
    const el = {
      isConnected: true,
      style: { animationDelay: '', animationPlayState: '' },
      getAnimations: () => [],
    };

    globalThis.window = {
      getComputedStyle: () => ({ animationName: 'fade-in' }),
    };
    globalThis.document = {
      querySelectorAll: () => [el],
    };

    const adapter = createCssAdapter();
    adapter.seek(2.0, 60);
    assert.strictEqual(el.style.animationPlayState, 'paused');
    assert.strictEqual(el.style.animationDelay, '-2.000s');
  });

  it('respects resolveStartSeconds offset', () => {
    const anim = createMockAnimation(0);
    const el = {
      isConnected: true,
      style: { animationDelay: '', animationPlayState: '' },
      getAnimations: () => [anim],
    };

    globalThis.window = {
      getComputedStyle: () => ({ animationName: 'slide' }),
    };
    globalThis.document = {
      querySelectorAll: () => [el],
    };

    const adapter = createCssAdapter({
      resolveStartSeconds: () => 1.0,
    });
    adapter.seek(2.5, 75);
    assert.strictEqual(anim.currentTime, 1500);
  });

  it('skips disconnected elements', () => {
    const el = {
      isConnected: false,
      style: { animationDelay: '', animationPlayState: '' },
      getAnimations: () => [createMockAnimation(0)],
    };

    globalThis.window = {
      getComputedStyle: () => ({ animationName: 'bounce' }),
    };
    globalThis.document = {
      querySelectorAll: () => [el],
    };

    const adapter = createCssAdapter();
    assert.doesNotThrow(() => adapter.seek(1.0, 30));
  });
});
