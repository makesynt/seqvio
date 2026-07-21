import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4175';
const outDir = path.resolve(process.argv[3] || 'output/browser-recorder/ui-smoke');
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
try {
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await desktop.goto(baseUrl, { waitUntil: 'networkidle0' });
  await desktop.screenshot({ path: path.join(outDir, 'desktop.png'), fullPage: true });

  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle0' });
  await mobile.screenshot({ path: path.join(outDir, 'mobile.png'), fullPage: true });
} finally {
  await browser.close();
}
