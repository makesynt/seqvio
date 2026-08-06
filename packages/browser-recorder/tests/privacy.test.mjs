import assert from 'node:assert/strict';
import test from 'node:test';
import puppeteer from 'puppeteer';
import { installPrivacyMasks, readPrivacyMaskStatus } from '../dist/privacy.js';

test('privacy masks cover selectors and fixed regions without intercepting input', async (t) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 360 });
  await page.setContent('<input id="secret" value="sk-live-private" style="position:fixed;left:100px;top:80px;width:220px;height:36px">');
  await installPrivacyMasks(page, { masks: [
    { id: 'token', selector: '#secret', padding: 4, color: '#123456', required: true },
    { id: 'account', rect: { x: 20, y: 24, width: 60, height: 30 }, padding: 0, color: '#000000', required: true },
  ] });

  const result = await page.evaluate(() => {
    const selectorMask = document.querySelector('[data-seqvio-privacy-mask="token"]');
    const regionMask = document.querySelector('[data-seqvio-privacy-mask="account"]');
    const selectorRect = selectorMask.getBoundingClientRect();
    const regionRect = regionMask.getBoundingClientRect();
    return {
      selector: {
        x: selectorRect.x, y: selectorRect.y, width: selectorRect.width, height: selectorRect.height,
        background: getComputedStyle(selectorMask).backgroundColor,
        pointerEvents: getComputedStyle(selectorMask).pointerEvents,
      },
      region: { x: regionRect.x, y: regionRect.y, width: regionRect.width, height: regionRect.height },
    };
  });
  assert.deepEqual(result.selector, {
    x: 96, y: 76, width: 228, height: 44,
    background: 'rgb(18, 52, 86)', pointerEvents: 'none',
  });
  assert.deepEqual(result.region, { x: 20, y: 24, width: 60, height: 30 });
  assert.deepEqual((await readPrivacyMaskStatus(page)).foundIds.sort(), ['account', 'token']);
});

test('privacy mask status does not report selectors that never matched', async (t) => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent('<main>Public content</main>');
  await installPrivacyMasks(page, { masks: [
    { id: 'missing-secret', selector: '#does-not-exist', padding: 4, color: '#111827', required: true },
  ] });
  assert.deepEqual((await readPrivacyMaskStatus(page)).foundIds, []);
});
