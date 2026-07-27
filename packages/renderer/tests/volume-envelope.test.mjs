import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normaliseEnvelope,
  interpolateVolumeGain,
  buildVolumeExpression,
} from '../dist/audio/volume-envelope.js';
import { generateDuckingEnvelope } from '../dist/audio/ducking.js';

describe('normaliseEnvelope', () => {
  it('returns base volume anchor for empty keyframes', () => {
    const result = normaliseEnvelope([], 0, 0.8);
    assert.deepEqual(result, [{ time: 0, volume: 0.8 }]);
  });

  it('converts absolute times to track-relative', () => {
    const kfs = [
      { time: 5, volume: 0.3 },
      { time: 8, volume: 1.0 },
    ];
    const result = normaliseEnvelope(kfs, 3, 1);
    assert.equal(result[0].time, 0);
    assert.equal(result[0].volume, 1);
    assert.equal(result[1].time, 2);
    assert.equal(result[1].volume, 0.3);
    assert.equal(result[2].time, 5);
    assert.equal(result[2].volume, 1);
  });

  it('clamps volume to [0, 1]', () => {
    const kfs = [{ time: 1, volume: 1.5 }, { time: 2, volume: -0.2 }];
    const result = normaliseEnvelope(kfs, 0, 1);
    assert.equal(result[1].volume, 1);
    assert.equal(result[2].volume, 0);
  });

  it('deduplicates same-time keyframes', () => {
    const kfs = [
      { time: 1, volume: 0.5 },
      { time: 1, volume: 0.8 },
    ];
    const result = normaliseEnvelope(kfs, 0, 1);
    const atOne = result.filter((k) => Math.abs(k.time - 1) < 0.001);
    assert.equal(atOne.length, 1);
    assert.equal(atOne[0].volume, 0.8);
  });
});

describe('interpolateVolumeGain', () => {
  const envelope = [
    { time: 0, volume: 1 },
    { time: 1, volume: 0.5 },
    { time: 2, volume: 0.5 },
    { time: 3, volume: 1 },
  ];

  it('returns first volume before start', () => {
    assert.equal(interpolateVolumeGain(envelope, -1), 1);
  });

  it('returns last volume after end', () => {
    assert.equal(interpolateVolumeGain(envelope, 5), 1);
  });

  it('interpolates linearly between keyframes', () => {
    assert.equal(interpolateVolumeGain(envelope, 0.5), 0.75);
  });

  it('holds constant in flat region', () => {
    assert.equal(interpolateVolumeGain(envelope, 1.5), 0.5);
  });

  it('returns 1 for empty envelope', () => {
    assert.equal(interpolateVolumeGain([], 1), 1);
  });
});

describe('buildVolumeExpression', () => {
  it('returns static volume for single keyframe', () => {
    const expr = buildVolumeExpression([{ time: 0, volume: 0.7 }], 0);
    assert.equal(expr, 'volume=0.7');
  });

  it('returns if-based expression for multiple keyframes', () => {
    const kfs = [
      { time: 0, volume: 1 },
      { time: 2, volume: 0.3 },
    ];
    const expr = buildVolumeExpression(kfs, 0);
    assert.ok(expr.startsWith('volume=if(lt(t'));
    assert.ok(expr.includes('eval=frame'));
  });
});

describe('generateDuckingEnvelope', () => {
  it('returns empty for no cues', () => {
    assert.deepEqual(generateDuckingEnvelope([], 30), []);
  });

  it('generates duck region around narration cue', () => {
    const cues = [{ startMs: 2000, endMs: 4000 }];
    const kfs = generateDuckingEnvelope(cues, 30, {
      duckLevel: 0.3,
      attackSeconds: 0.1,
      releaseSeconds: 0.5,
    });

    assert.ok(kfs.length >= 4);
    assert.equal(kfs[0].time, 0);
    assert.equal(kfs[0].volume, 1);

    const ducked = kfs.filter((k) => k.volume === 0.3);
    assert.ok(ducked.length >= 1);

    const lastKf = kfs[kfs.length - 1];
    assert.equal(lastKf.volume, 1);
  });

  it('merges overlapping duck regions', () => {
    const cues = [
      { startMs: 1000, endMs: 2000 },
      { startMs: 2200, endMs: 3000 },
    ];
    const kfs = generateDuckingEnvelope(cues, 30, {
      duckLevel: 0.2,
      attackSeconds: 0.1,
      releaseSeconds: 0.5,
    });

    const ducked = kfs.filter((k) => k.volume === 0.2);
    assert.ok(ducked.length >= 1);
    const restored = kfs.filter((k) => k.volume === 1 && k.time > 0.5);
    assert.ok(restored.length >= 1);
  });

  it('uses frame-based timing when ms not available', () => {
    const cues = [{ startFrame: 60, endFrame: 120 }];
    const kfs = generateDuckingEnvelope(cues, 30);
    assert.ok(kfs.length >= 4);
    const duckStart = kfs.find((k) => k.volume < 1 && k.time > 0);
    assert.ok(duckStart);
    assert.ok(duckStart.time >= 1.9);
  });
});
