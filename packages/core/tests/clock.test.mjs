/**
 * Runs against the compiled dist (CommonJS). Build core first:
 * `npm run build -w @seqvio/core`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TransportClock } from '../dist/index.js';

describe('TransportClock', () => {
  it('starts paused at initial time', () => {
    let ms = 0;
    const clock = new TransportClock({ initialTime: 1.5, nowMs: () => ms });
    assert.strictEqual(clock.now(), 1.5);
    assert.strictEqual(clock.isPlaying(), false);
  });

  it('advances time when playing (monotonic)', () => {
    let ms = 0;
    const clock = new TransportClock({ nowMs: () => ms });
    clock.play();
    ms = 1000;
    assert.strictEqual(clock.now(), 1.0);
    ms = 2500;
    assert.strictEqual(clock.now(), 2.5);
  });

  it('respects playback rate', () => {
    let ms = 0;
    const clock = new TransportClock({ rate: 2, nowMs: () => ms });
    clock.play();
    ms = 1000;
    assert.strictEqual(clock.now(), 2.0);
  });

  it('pause freezes time', () => {
    let ms = 0;
    const clock = new TransportClock({ nowMs: () => ms });
    clock.play();
    ms = 1000;
    clock.pause();
    ms = 5000;
    assert.strictEqual(clock.now(), 1.0);
    assert.strictEqual(clock.isPlaying(), false);
  });

  it('seek clamps to [0, duration]', () => {
    let ms = 0;
    const clock = new TransportClock({ duration: 10, nowMs: () => ms });
    clock.seek(15);
    assert.strictEqual(clock.now(), 10);
    clock.seek(-5);
    assert.strictEqual(clock.now(), 0);
  });

  it('seek while playing resets anchor without jump', () => {
    let ms = 0;
    const clock = new TransportClock({ nowMs: () => ms });
    clock.play();
    ms = 1000;
    clock.seek(5.0);
    assert.strictEqual(clock.now(), 5.0);
    ms = 2000;
    assert.strictEqual(clock.now(), 6.0);
  });

  it('clamps to duration while playing', () => {
    let ms = 0;
    const clock = new TransportClock({ duration: 3, nowMs: () => ms });
    clock.play();
    ms = 5000;
    assert.strictEqual(clock.now(), 3);
    assert.strictEqual(clock.reachedEnd(), true);
  });

  it('refuses to play at end', () => {
    let ms = 0;
    const clock = new TransportClock({ duration: 5, initialTime: 5, nowMs: () => ms });
    assert.strictEqual(clock.play(), false);
  });

  it('setRate re-anchors to avoid time jump', () => {
    let ms = 0;
    const clock = new TransportClock({ nowMs: () => ms });
    clock.play();
    ms = 1000;
    clock.setRate(2);
    assert.strictEqual(clock.now(), 1.0);
    ms = 2000;
    assert.strictEqual(clock.now(), 3.0);
  });

  it('audio source drives time', () => {
    let ms = 0;
    const clock = new TransportClock({ nowMs: () => ms });
    clock.attachAudioSource({ currentTimeSeconds: 4.2 });
    clock.play();
    assert.strictEqual(clock.now(), 4.2);
    assert.strictEqual(clock.getSource(), 'audio');
  });

  it('audio source with HTMLMediaElement', () => {
    let ms = 0;
    const el = { currentTime: 2.5, playbackRate: 1 };
    const clock = new TransportClock({ nowMs: () => ms });
    clock.attachAudioSource({ el, compositionStart: 0, mediaStart: 0.5 });
    clock.play();
    assert.strictEqual(clock.now(), 2.0);
  });

  it('detachAudioSource falls back to monotonic', () => {
    let ms = 0;
    const clock = new TransportClock({ nowMs: () => ms });
    clock.attachAudioSource({ currentTimeSeconds: 3.0 });
    clock.play();
    ms = 100;
    clock.detachAudioSource();
    assert.strictEqual(clock.getSource(), 'monotonic');
    assert.ok(Math.abs(clock.now() - 3.0) < 0.01);
  });

  it('snapshot returns full state', () => {
    let ms = 0;
    const clock = new TransportClock({ duration: 30, rate: 1.5, nowMs: () => ms });
    const snap = clock.snapshot();
    assert.strictEqual(snap.time, 0);
    assert.strictEqual(snap.playing, false);
    assert.strictEqual(snap.rate, 1.5);
    assert.strictEqual(snap.duration, 30);
    assert.strictEqual(snap.source, 'monotonic');
  });
});
