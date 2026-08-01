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
  error: runtimeGlobalName('error'),
  lifecycle: runtimeGlobalName('lifecycle'),
  dispose: runtimeGlobalName('dispose'),
} as const;

interface RuntimeLifecycleState {
  stage?: string;
  status?: string;
  timeoutMs?: number;
  frame?: number;
  message?: string;
}

export function formatRuntimeFailure(
  operation: string,
  error: unknown,
  lifecycle?: RuntimeLifecycleState | null,
): Error {
  const cause = error instanceof Error ? error.message : String(error);
  const state = lifecycle?.stage
    ? ` stage=${lifecycle.stage} status=${lifecycle.status ?? 'unknown'}`
      + `${lifecycle.frame === undefined ? '' : ` frame=${lifecycle.frame}`}`
      + `${lifecycle.timeoutMs === undefined ? '' : ` timeoutMs=${lifecycle.timeoutMs}`}`
      + `${lifecycle.message ? ` detail=${lifecycle.message}` : ''}`
    : '';
  return new Error(`render_runtime_failed: operation=${operation}${state}: ${cause}`);
}

async function readLifecycle(page: Page): Promise<RuntimeLifecycleState | null> {
  return page.evaluate((keys) => {
    const runtime = window as unknown as Record<string, unknown>;
    return (runtime[keys.lifecycle] as RuntimeLifecycleState | undefined) ?? null;
  }, runtimeKeys).catch(() => null);
}

export async function loadRenderShell(page: Page, shellPath: string): Promise<void> {
  const shellUrl = `file:///${shellPath.split(path.sep).join('/')}`;
  try {
    await page.goto(shellUrl, { waitUntil: 'networkidle0', timeout: 120000 });
  } catch (error) {
    throw formatRuntimeFailure('navigate', error);
  }
  try {
    await page.waitForFunction(
      (keys) => {
        const runtime = window as unknown as Record<string, unknown>;
        return runtime[keys.ready] === true || typeof runtime[keys.error] === 'string';
      },
      { timeout: 120000 },
      runtimeKeys
    );
  } catch (error) {
    throw formatRuntimeFailure('initialize', error, await readLifecycle(page));
  }
  const runtimeError = await page.evaluate(
    (keys) => {
      const runtime = window as unknown as Record<string, unknown>;
      return typeof runtime[keys.error] === 'string' ? runtime[keys.error] : null;
    },
    runtimeKeys,
  );
  if (runtimeError) {
    throw formatRuntimeFailure('initialize', runtimeError, await readLifecycle(page));
  }
}

export async function setFrameAndWait(page: Page, frame: number): Promise<void> {
  try {
    await page.evaluate(async ({ f, keys }) => {
      const runtime = window as unknown as Record<string, unknown>;
      const setFrame = runtime[keys.setFrame];
      if (!setFrame) {
        throw new Error(`Browser runtime missing ${keys.setFrame}`);
      }
      await (setFrame as (frame: number) => Promise<void>)(f);
    }, { f: frame, keys: runtimeKeys });
  } catch (error) {
    throw formatRuntimeFailure('set-frame', error, await readLifecycle(page));
  }

  await page.waitForFunction(
    (keys) => {
      const runtime = window as unknown as Record<string, unknown>;
      return runtime[keys.frameReady] === true;
    },
    { timeout: 30000 },
    runtimeKeys
  );
}

export async function disposeRenderShell(page: Page): Promise<void> {
  try {
    await page.evaluate(async (keys) => {
      const runtime = window as unknown as Record<string, unknown>;
      const dispose = runtime[keys.dispose];
      if (typeof dispose === 'function') await (dispose as () => Promise<void>)();
    }, runtimeKeys);
  } catch (error) {
    throw formatRuntimeFailure('dispose', error, await readLifecycle(page));
  }
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
    __seqvio_error?: string;
    __seqvio_lifecycle?: RuntimeLifecycleState;
    __seqvio_dispose?: () => Promise<void>;
  }
}
