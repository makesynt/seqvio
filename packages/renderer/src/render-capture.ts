import type { Page, ElementHandle } from 'puppeteer';

export interface CdpScreenshotInput {
  width: number;
  height: number;
  pixelRatio: number;
  frameFormat: 'png' | 'jpeg';
  jpegQuality: number;
}

type CdpSession = Awaited<ReturnType<Page['createCDPSession']>>;

const cdpSessions = new WeakMap<Page, CdpSession>();

export function buildCdpScreenshotParams(input: CdpScreenshotInput) {
  const base = {
    format: input.frameFormat,
    fromSurface: true,
    captureBeyondViewport: true,
    optimizeForSpeed: input.frameFormat === 'jpeg',
    clip: {
      x: 0,
      y: 0,
      width: input.width,
      height: input.height,
      scale: input.pixelRatio,
    },
  };

  return input.frameFormat === 'jpeg'
    ? { ...base, quality: input.jpegQuality }
    : base;
}

export async function captureFrameBuffer(
  page: Page,
  input: CdpScreenshotInput
): Promise<Buffer> {
  let client = cdpSessions.get(page);
  if (!client) {
    client = await page.createCDPSession();
    cdpSessions.set(page, client);
  }
  const result = await client.send('Page.captureScreenshot', buildCdpScreenshotParams(input));
  return Buffer.from(result.data, 'base64');
}

/**
 * Check if the page has a terminal canvas element (from TerminalXtermDemo).
 * Returns the element handle if found, null otherwise.
 */
export async function findTerminalElement(page: Page): Promise<ElementHandle | null> {
  const el = await page.$('[data-seqvio-terminal]');
  return el ?? null;
}

/**
 * Capture just the terminal canvas element via Puppeteer element screenshot.
 * Returns the screenshot buffer and the element's pixel dimensions.
 */
export async function captureTerminalCanvas(
  page: Page,
  terminalEl: ElementHandle,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const box = await terminalEl.boundingBox();
  if (!box) throw new Error('Terminal element has no bounding box');

  const buffer = await terminalEl.screenshot({
    type: 'png',
    omitBackground: false,
  });

  return {
    buffer,
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
}
