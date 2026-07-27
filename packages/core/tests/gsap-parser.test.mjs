/**
 * Runs against the compiled dist (CommonJS). Build core first:
 * `npm run build -w @seqvio/core`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseGsapFromSource,
  validateGsapDeterminism,
  tweensToKeyframes,
  serializeTimeline,
} from '../dist/index.js';

describe('parseGsapFromSource', () => {
  it('parses a simple timeline with .to() calls', () => {
    const source = `
      const tl = gsap.timeline({ paused: true });
      tl.to('#title', { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
      tl.to('#subtitle', { opacity: 1, duration: 0.5 }, '-=0.3');
    `;
    const result = parseGsapFromSource(source);
    assert.equal(result.errors.length, 0);
    assert.equal(result.timelines.length, 1);

    const tl = result.timelines[0];
    assert.equal(tl.timelineVar, 'tl');
    assert.equal(tl.tweens.length, 2);

    assert.equal(tl.tweens[0].target, '#title');
    assert.equal(tl.tweens[0].method, 'to');
    assert.equal(tl.tweens[0].properties.opacity, 1);
    assert.equal(tl.tweens[0].properties.y, 0);
    assert.equal(tl.tweens[0].duration, 0.8);
    assert.equal(tl.tweens[0].ease, 'power2.out');
    assert.equal(tl.tweens[0].resolvedStart, 0);

    assert.equal(tl.tweens[1].target, '#subtitle');
    assert.equal(tl.tweens[1].position, '-=0.3');
    assert.ok(Math.abs(tl.tweens[1].resolvedStart - 0.5) < 0.001);
  });

  it('parses .from() and .fromTo() methods', () => {
    const source = `
      const tl = gsap.timeline();
      tl.from('.card', { scale: 0, duration: 0.6 });
      tl.fromTo('.logo', { opacity: 0 }, { opacity: 1, duration: 1 }, 2);
    `;
    const result = parseGsapFromSource(source);
    assert.equal(result.timelines.length, 1);
    const tl = result.timelines[0];

    assert.equal(tl.tweens[0].method, 'from');
    assert.equal(tl.tweens[0].properties.scale, 0);

    assert.equal(tl.tweens[1].method, 'fromTo');
    assert.equal(tl.tweens[1].fromProperties.opacity, 0);
    assert.equal(tl.tweens[1].properties.opacity, 1);
    assert.equal(tl.tweens[1].resolvedStart, 2);
  });

  it('parses .set() with zero duration', () => {
    const source = `
      const tl = gsap.timeline();
      tl.set('.el', { visibility: 'visible' });
    `;
    const result = parseGsapFromSource(source);
    const tween = result.timelines[0].tweens[0];
    assert.equal(tween.method, 'set');
    assert.equal(tween.duration, 0);
    assert.equal(tween.properties.visibility, 'visible');
  });

  it('resolves sequential positions (implicit)', () => {
    const source = `
      const tl = gsap.timeline();
      tl.to('.a', { x: 100, duration: 1 });
      tl.to('.b', { x: 100, duration: 1 });
      tl.to('.c', { x: 100, duration: 1 });
    `;
    const result = parseGsapFromSource(source);
    const tweens = result.timelines[0].tweens;
    assert.equal(tweens[0].resolvedStart, 0);
    assert.equal(tweens[1].resolvedStart, 1);
    assert.equal(tweens[2].resolvedStart, 2);
    assert.equal(result.timelines[0].totalDuration, 3);
  });

  it('resolves < and > position strings', () => {
    const source = `
      const tl = gsap.timeline();
      tl.to('.a', { x: 100, duration: 2 });
      tl.to('.b', { y: 50, duration: 1 }, '<');
      tl.to('.c', { z: 10, duration: 1 }, '>');
    `;
    const result = parseGsapFromSource(source);
    const tweens = result.timelines[0].tweens;
    assert.equal(tweens[1].resolvedStart, 0);
    assert.equal(tweens[2].resolvedStart, 1);
  });

  it('returns warning for no timeline found', () => {
    const source = `const x = 42;`;
    const result = parseGsapFromSource(source);
    assert.equal(result.timelines.length, 0);
    assert.ok(result.warnings.length > 0);
  });

  it('returns error for unparseable source', () => {
    const result = parseGsapFromSource(`const = {`);
    assert.ok(result.errors.length > 0);
  });

  it('generates stable IDs', () => {
    const source = `
      const tl = gsap.timeline();
      tl.to('.a', { x: 1, duration: 1 });
      tl.to('.b', { y: 2, duration: 1 });
    `;
    const result = parseGsapFromSource(source);
    assert.equal(result.timelines[0].tweens[0].id, 'tl-tween-0');
    assert.equal(result.timelines[0].tweens[1].id, 'tl-tween-1');
  });
});

describe('validateGsapDeterminism', () => {
  it('passes clean GSAP code', () => {
    const source = `tl.to('.el', { opacity: 1, duration: 0.5 });`;
    const result = validateGsapDeterminism(source);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it('rejects Math.random', () => {
    const source = `tl.to('.el', { x: Math.random() * 100 });`;
    const result = validateGsapDeterminism(source);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Math.random')));
  });

  it('rejects ScrollTrigger', () => {
    const source = `gsap.registerPlugin(ScrollTrigger);`;
    const result = validateGsapDeterminism(source);
    assert.equal(result.valid, false);
  });

  it('rejects infinite repeat', () => {
    const source = `tl.to('.el', { rotation: 360, repeat: -1 });`;
    const result = validateGsapDeterminism(source);
    assert.equal(result.valid, false);
  });

  it('warns about callbacks but still valid', () => {
    const source = `tl.to('.el', { x: 10, onComplete: () => {} });`;
    const result = validateGsapDeterminism(source);
    assert.equal(result.valid, true);
    assert.ok(result.warnings.length > 0);
  });
});

describe('tweensToKeyframes', () => {
  it('converts tweens to sorted keyframes', () => {
    const source = `
      const tl = gsap.timeline();
      tl.to('.a', { opacity: 1, duration: 1 });
      tl.to('.b', { x: 100, duration: 0.5 }, 0.5);
    `;
    const { timelines } = parseGsapFromSource(source);
    const kfs = tweensToKeyframes(timelines[0].tweens);
    assert.ok(kfs.length >= 2);
    assert.ok(kfs[0].time <= kfs[1].time);
  });

  it('expands fromTo into two keyframes', () => {
    const source = `
      const tl = gsap.timeline();
      tl.fromTo('.el', { opacity: 0 }, { opacity: 1, duration: 1 });
    `;
    const { timelines } = parseGsapFromSource(source);
    const kfs = tweensToKeyframes(timelines[0].tweens);
    assert.equal(kfs.length, 2);
    assert.equal(kfs[0].properties.opacity, 0);
    assert.equal(kfs[1].properties.opacity, 1);
  });
});

describe('serializeTimeline', () => {
  it('round-trips a parsed timeline back to code', () => {
    const source = `
      const tl = gsap.timeline();
      tl.to('.title', { opacity: 1, duration: 0.8, ease: 'power2.out' });
    `;
    const { timelines } = parseGsapFromSource(source);
    const code = serializeTimeline(timelines[0]);
    assert.ok(code.includes('gsap.timeline'));
    assert.ok(code.includes('.to('));
    assert.ok(code.includes('.title'));
  });
});
