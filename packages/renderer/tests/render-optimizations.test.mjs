import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeJpegQuality,
  resolveAutoWorkers,
  shouldReuseStaticFrame,
} from '../dist/render-optimizations.js';

describe('render optimizations', () => {
  it('clamps jpeg quality into Chrome screenshot range', () => {
    assert.equal(normalizeJpegQuality(undefined), 90);
    assert.equal(normalizeJpegQuality(20), 30);
    assert.equal(normalizeJpegQuality(80), 80);
    assert.equal(normalizeJpegQuality(120), 100);
  });

  it('chooses one worker for short renders', () => {
    assert.equal(
      resolveAutoWorkers({ totalFrames: 80, cpuCount: 16, measuredP95Ms: 100 }),
      1
    );
  });

  it('caps auto workers using frame count, cpu count, and measured cost', () => {
    assert.equal(
      resolveAutoWorkers({ totalFrames: 600, cpuCount: 16, measuredP95Ms: 150 }),
      6
    );
    assert.equal(
      resolveAutoWorkers({ totalFrames: 600, cpuCount: 16, measuredP95Ms: 900 }),
      3
    );
  });

  it('reuses only adjacent frames with identical reusable signatures', () => {
    assert.equal(
      shouldReuseStaticFrame({
        previousOutputIndex: 10,
        outputIndex: 11,
        previousSignature: 'abc',
        signature: 'abc',
        signatureReusable: true,
      }),
      true
    );
    assert.equal(
      shouldReuseStaticFrame({
        previousOutputIndex: 10,
        outputIndex: 12,
        previousSignature: 'abc',
        signature: 'abc',
        signatureReusable: true,
      }),
      false
    );
    assert.equal(
      shouldReuseStaticFrame({
        previousOutputIndex: 10,
        outputIndex: 11,
        previousSignature: 'abc',
        signature: 'abc',
        signatureReusable: false,
      }),
      false
    );
  });

});
