import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  sanitizeCachedSvgMarkup,
  svgDataUrl,
  waitForImageReady,
} from '../dist/whiteboard-layer-cache.js';

describe('whiteboard bitmap layer cache helpers', () => {
  it('serializes previously hidden SVGs as visible in rebuilt bitmap layers', () => {
    const markup =
      '<svg data-seqvio-draw-end="1" data-seqvio-layer-hidden="true" style="visibility: hidden; opacity: 1">' +
      '<path d="M0 0L10 10"></path>' +
      '</svg>';

    const sanitized = sanitizeCachedSvgMarkup(markup);

    assert.match(sanitized, /M0 0L10 10/);
    assert.doesNotMatch(sanitized, /visibility:\s*hidden/);
    assert.doesNotMatch(sanitized, /data-seqvio-layer-hidden/);
    assert.match(sanitized, /opacity:\s*1/);
  });

  it('builds an SVG data URL from sanitized markup', () => {
    const url = svgDataUrl(
      '<svg style="visibility:hidden" data-seqvio-layer-hidden="true"></svg>'
    );
    const decoded = decodeURIComponent(url.split(',')[1]);

    assert.match(decoded, /^<svg/);
    assert.doesNotMatch(decoded, /visibility:\s*hidden/);
    assert.doesNotMatch(decoded, /data-seqvio-layer-hidden/);
  });

  it('awaits decode for newly inserted bitmap cache images', async () => {
    let decoded = false;
    const image = {
      decode() {
        return new Promise((resolve) => {
          setTimeout(() => {
            decoded = true;
            resolve();
          }, 10);
        });
      },
    };

    await waitForImageReady(image);

    assert.equal(decoded, true);
  });
});
