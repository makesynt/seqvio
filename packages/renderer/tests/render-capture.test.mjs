import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCdpScreenshotParams } from '../dist/render-capture.js';

describe('CDP screenshot capture', () => {
  it('uses the fast JPEG capture path with DPR-aware clipping', () => {
    assert.deepEqual(
      buildCdpScreenshotParams({
        width: 1280,
        height: 720,
        pixelRatio: 2,
        frameFormat: 'jpeg',
        jpegQuality: 80,
      }),
      {
        format: 'jpeg',
        quality: 80,
        fromSurface: true,
        captureBeyondViewport: true,
        optimizeForSpeed: true,
        clip: { x: 0, y: 0, width: 1280, height: 720, scale: 2 },
      }
    );
  });

  it('keeps PNG lossless while still using exact viewport clipping', () => {
    assert.deepEqual(
      buildCdpScreenshotParams({
        width: 1920,
        height: 1080,
        pixelRatio: 1,
        frameFormat: 'png',
        jpegQuality: 90,
      }),
      {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        optimizeForSpeed: false,
        clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 },
      }
    );
  });
});
