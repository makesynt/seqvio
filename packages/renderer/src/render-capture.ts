import type { Page } from 'puppeteer';

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
