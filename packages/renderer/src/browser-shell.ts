/**
 * Puppeteer browser shell helpers for frame rendering
 */

import { Page } from 'puppeteer';
import * as path from 'path';
import type { CaptionCue, CompositionAudioManifest, RenderableMeta } from './media-contract';
import { runtimeGlobalName } from './brand';

const runtimeKeys = {
  ready: runtimeGlobalName('ready'),
  frameReady: runtimeGlobalName('frameReady'),
  setFrame: runtimeGlobalName('setFrame'),
  getMeta: runtimeGlobalName('getMeta'),
} as const;

export async function loadRenderShell(page: Page, shellPath: string): Promise<void> {
  const shellUrl = `file:///${shellPath.split(path.sep).join('/')}`;
  await page.goto(shellUrl, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction(
    (keys) => {
      const runtime = window as unknown as Record<string, unknown>;
      return runtime[keys.ready] === true;
    },
    { timeout: 60000 },
    runtimeKeys
  );
}

export async function setFrameAndWait(page: Page, frame: number): Promise<void> {
  await page.evaluate(async ({ f, keys }) => {
    const runtime = window as unknown as Record<string, unknown>;
    const setFrame = runtime[keys.setFrame];
    if (!setFrame) {
      throw new Error(`Browser runtime missing ${keys.setFrame}`);
    }
    await (setFrame as (frame: number) => Promise<void>)(f);
  }, { f: frame, keys: runtimeKeys });

  await page.waitForFunction(
    (keys) => {
      const runtime = window as unknown as Record<string, unknown>;
      return runtime[keys.frameReady] === true;
    },
    { timeout: 30000 },
    runtimeKeys
  );
}

export async function getMetaFromPage(page: Page): Promise<RenderableMeta> {
  return page.evaluate((keys) => {
    const runtime = window as unknown as Record<string, unknown>;
    const getMeta = runtime[keys.getMeta];
    if (!getMeta) {
      return { duration: 300, fps: 30 };
    }
    return (getMeta as () => RenderableMeta)();
  }, runtimeKeys);
}

declare global {
  interface Window {
    __seqvio_ready?: boolean;
    __seqvio_frameReady?: boolean;
    __seqvio_setFrame?: (frame: number) => Promise<void>;
    __seqvio_getMeta?: () => {
      duration?: number;
      fps?: number;
      audio?: CompositionAudioManifest;
      captions?: CaptionCue[];
    };
  }
}
