import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import puppeteer, { type ElementHandle, type KeyInput, type Page } from 'puppeteer';
import type {
  BrowserAction,
  BrowserRecordingPlan,
  PipelineProgress,
  RecordedFocusTarget,
  RecordingManifest,
  TimedPoint,
} from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function encodeFrames(framesDir: string, fps: number, output: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath.path, [
      '-y', '-framerate', String(fps), '-i', path.join(framesDir, '%06d.jpg'),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'fast',
      '-movflags', '+faststart', output,
    ], { windowsHide: true });
    let stderr = '';
    ffmpeg.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    ffmpeg.on('error', reject);
    ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr || `FFmpeg exited ${code}`)));
  });
}

async function resolveElement(page: Page, selector: string): Promise<ElementHandle<Element>> {
  const element = await page.$(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  return element;
}

export async function recordPlan(
  plan: BrowserRecordingPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<{ manifest: RecordingManifest; manifestPath: string; rawVideoPath: string }> {
  const framesDir = path.join(jobDir, 'frames');
  fs.mkdirSync(framesDir, { recursive: true });
  const captureFps = plan.captureFps ?? 15;
  const renderFps = plan.renderFps ?? 30;
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setViewport({ ...plan.viewport, deviceScaleFactor: 1 });
  await page.goto(plan.startUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  const startedAt = Date.now();
  const now = () => Date.now() - startedAt;
  const cursorPoints: TimedPoint[] = [{ timeMs: 0, x: 48, y: 48 }];
  const focusTargets: RecordedFocusTarget[] = [];
  const clicks: TimedPoint[] = [];
  const actionTimings: Array<{ id: string; timeMs: number }> = [];
  let cursor = { x: 48, y: 48 };
  let frameCount = 0;
  let stopCapture = false;
  let captureError: Error | undefined;

  const captureLoop = (async () => {
    const frameInterval = 1000 / captureFps;
    while (!stopCapture) {
      try {
        await page.screenshot({
          path: path.join(framesDir, `${String(frameCount).padStart(6, '0')}.jpg`),
          type: 'jpeg',
          quality: 88,
          optimizeForSpeed: true,
        });
        frameCount += 1;
        const waitMs = startedAt + frameCount * frameInterval - Date.now();
        if (waitMs > 0) await delay(waitMs);
      } catch (error) {
        captureError = error instanceof Error ? error : new Error(String(error));
        stopCapture = true;
      }
    }
  })();

  const moveCursor = async (x: number, y: number, durationMs = 360) => {
    const steps = Math.max(4, Math.round(durationMs / 24));
    const from = { ...cursor };
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const eased = t * t * (3 - 2 * t);
      cursor = { x: from.x + (x - from.x) * eased, y: from.y + (y - from.y) * eased };
      await page.mouse.move(cursor.x, cursor.y);
      cursorPoints.push({ timeMs: now(), ...cursor });
      await delay(durationMs / steps);
    }
  };

  const focusElement = async (action: BrowserAction, element: ElementHandle<Element>) => {
    let box = await element.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
    const outsideViewport = box.width <= 0 || box.height <= 0
      || box.x + box.width < 0 || box.y + box.height < 0
      || box.x > plan.viewport.width || box.y > plan.viewport.height;
    if (outsideViewport) {
      await element.evaluate((node) => node.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' }));
      await delay(350);
      box = await element.evaluate((node) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });
    }
    if (box.width <= 0 || box.height <= 0) throw new Error(`Element is not visible: ${action.selector}`);
    if (action.focus !== false) {
      focusTargets.push({ id: `focus-${action.id}`, timeMs: now(), x: box.x, y: box.y, width: box.width, height: box.height });
    }
    await moveCursor(box.x + box.width / 2, box.y + box.height / 2);
    return box;
  };

  const resetFocus = (id?: string) => {
    focusTargets.push({
      id: id ? `focus-${id}` : undefined,
      timeMs: now(),
      x: 0,
      y: 0,
      width: plan.viewport.width,
      height: plan.viewport.height,
      reset: true,
    });
  };

  try {
    onProgress?.({ phase: 'recording', percent: 3, message: 'Browser ready' });
    for (let index = 0; index < plan.actions.length; index += 1) {
      const action = plan.actions[index];
      actionTimings.push({ id: action.id, timeMs: now() });
      onProgress?.({
        phase: 'recording',
        percent: 5 + Math.round((index / plan.actions.length) * 60),
        message: action.label,
      });
      if (action.type === 'click') {
        const element = await resolveElement(page, action.selector!);
        await focusElement(action, element);
        clicks.push({ timeMs: now(), ...cursor });
        await page.mouse.click(cursor.x, cursor.y);
      } else if (action.type === 'fill') {
        const element = await resolveElement(page, action.selector!);
        await focusElement(action, element);
        clicks.push({ timeMs: now(), ...cursor });
        await page.mouse.click(cursor.x, cursor.y, { count: 3 });
        await page.keyboard.press('Backspace');
        await page.keyboard.type(action.value ?? '', { delay: 42 });
      } else if (action.type === 'scroll') {
        resetFocus(action.id);
        const x = action.x ?? 0;
        const y = action.y ?? 520;
        await page.evaluate(({ dx, dy }) => window.scrollBy({ left: dx, top: dy, behavior: 'smooth' }), { dx: x, dy: y });
        await delay(action.durationMs ?? 700);
      } else if (action.type === 'navigate') {
        resetFocus(action.id);
        await page.goto(action.value!, { waitUntil: 'networkidle2', timeout: 60000 });
      } else if (action.type === 'press') {
        resetFocus(action.id);
        await page.keyboard.press(action.key! as KeyInput);
      } else if (action.type === 'wait') {
        await delay(action.durationMs ?? 1000);
      }
      await delay(action.afterMs ?? 500);
    }
    resetFocus();
    await delay(700);
  } finally {
    stopCapture = true;
    await captureLoop;
    await browser.close();
  }
  if (captureError) throw captureError;
  if (frameCount === 0) throw new Error('Recorder captured no frames');

  onProgress?.({ phase: 'encoding', percent: 70, message: `Encoding ${frameCount} captured frames` });
  const rawVideoPath = path.join(jobDir, 'raw.mp4');
  await encodeFrames(framesDir, captureFps, rawVideoPath);
  const durationMs = Math.round((frameCount / captureFps) * 1000);
  const manifest: RecordingManifest = {
    version: '1.0',
    name: plan.name,
    sourceVideo: rawVideoPath,
    recordingWidth: plan.viewport.width,
    recordingHeight: plan.viewport.height,
    captureFps,
    renderFps,
    durationMs,
    frameCount,
    maxZoom: plan.maxZoom ?? 2.2,
    cursorPoints,
    focusTargets,
    clicks,
    actionTimings,
  };
  const manifestPath = path.join(jobDir, 'recording-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.rmSync(framesDir, { recursive: true, force: true });
  return { manifest, manifestPath, rawVideoPath };
}
