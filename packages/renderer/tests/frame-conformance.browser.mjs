import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import puppeteer from 'puppeteer';

import { getMetaFromPage, loadRenderShell, setFrameAndWait } from '../dist/browser-shell.js';
import { bundleScene } from '../dist/bundle-scene.js';
import { captureFrameBuffer } from '../dist/render-capture.js';
import { inspectAudioFile } from '../dist/audio-health.js';

const execFileAsync = promisify(execFile);
const WIDTH = 640;
const HEIGHT = 360;
const FPS = 30;
const GOLDEN_PATH = new URL('./fixtures/frame-conformance.golden.json', import.meta.url);
const GOLDEN = JSON.parse(readFileSync(GOLDEN_PATH, 'utf8'));
const ARTIFACT_DIR = process.env.SEQVIO_CONFORMANCE_ARTIFACT_DIR
  ? path.resolve(process.env.SEQVIO_CONFORMANCE_ARTIFACT_DIR)
  : null;

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function generateVideo(target) {
  await execFileAsync(
    ffmpegInstaller.path,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=320x180:rate=30:duration=2',
      '-an',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      target,
    ],
    { windowsHide: true },
  );
}

async function generateSilentAudio(target) {
  await execFileAsync(
    ffmpegInstaller.path,
    [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=48000:cl=mono',
      '-t',
      '2',
      target,
    ],
    { windowsHide: true },
  );
}

function writeMixedScene(target, videoUrl) {
  writeFileSync(
    target,
    `import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { TerminalXtermDemo } from '@seqvio/technical';
import { RecordedBrowserDemo } from '@seqvio/product-demo';

const terminalEvents = [
  {
    timeMs: 0,
    kind: 'stdout',
    text: '$ ',
    snapshot: true,
    grid: { cols: 40, rows: 10, cursorX: 2, cursorY: 0, lines: [] },
  },
  { timeMs: 200, kind: 'stdin', text: 'echo seqvio', transient: true },
  {
    timeMs: 900,
    kind: 'stdout',
    text: '$ echo seqvio\\nseqvio\\n$ ',
    raw: 'seqvio\\r\\n$ ',
    snapshot: true,
    grid: { cols: 40, rows: 10, cursorX: 2, cursorY: 2, lines: [] },
  },
];

export default function FrameConformanceScene() {
  return (
    <div style={{ width: ${WIDTH}, height: ${HEIGHT}, display: 'flex', background: '#101010' }}>
      <TerminalXtermDemo
        id="terminal-conformance"
        events={terminalEvents}
        width={320}
        height={${HEIGHT}}
        cols={40}
        rows={10}
        presentation="minimal"
        typingCps={20}
      />
      <RecordedBrowserDemo
        src=${JSON.stringify(videoUrl)}
        recordingWidth={320}
        recordingHeight={180}
        width={320}
        height={${HEIGHT}}
        fps={${FPS}}
        cursorPoints={[
          { timeMs: 0, x: 20, y: 20 },
          { timeMs: 1200, x: 280, y: 150 },
        ]}
        focusTargets={[
          { timeMs: 400, x: 180, y: 40, width: 90, height: 50 },
          { timeMs: 1400, x: 0, y: 0, width: 0, height: 0, reset: true },
        ]}
        clicks={[{ timeMs: 800, x: 230, y: 100 }]}
      />
    </div>
  );
}

export const meta: RenderableMeta = {
  fps: ${FPS},
  duration: 60,
  width: ${WIDTH},
  height: ${HEIGHT},
};
`,
    'utf8',
  );
}

function writeMissingMediaScene(target, missingVideoUrl) {
  writeFileSync(
    target,
    `import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { RecordedBrowserDemo } from '@seqvio/product-demo';

export default function MissingMediaScene() {
  return (
    <RecordedBrowserDemo
      src=${JSON.stringify(missingVideoUrl)}
      recordingWidth={320}
      recordingHeight={180}
      width={${WIDTH}}
      height={${HEIGHT}}
    />
  );
}

export const meta: RenderableMeta = {
  fps: ${FPS},
  duration: 30,
  width: ${WIDTH},
  height: ${HEIGHT},
};
`,
    'utf8',
  );
}

function writeReflowScene(target, videoUrl) {
  writeFileSync(target, `import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
import { RecordedBrowserDemo } from '@seqvio/product-demo';

export default function ReflowScene() {
  return <VideoComposition id="reflow" width={${WIDTH}} height={${HEIGHT}} fps={${FPS}} audio={meta.audio}>
    <Scene id="one" duration={30}><div style={{ width: '100%', height: '100%', background: 'red' }} /></Scene>
    <Transition type="fade" duration={12} />
    <Scene id="two" duration={30}><RecordedBrowserDemo src=${JSON.stringify(videoUrl)} recordingWidth={320} recordingHeight={180} width={${WIDTH}} height={${HEIGHT}} fps={${FPS}} /></Scene>
  </VideoComposition>;
}

export const meta: RenderableMeta = {
  fps: ${FPS}, duration: 72, width: ${WIDTH}, height: ${HEIGHT},
  audio: { lockToAudio: true, sceneTimings: [
    { sceneId: 'one', startFrame: 0, durationFrames: 30, transitionAfterFrames: 12 },
    { sceneId: 'two', startFrame: 42, durationFrames: 30 },
  ] },
};
`, 'utf8');
}

async function bundleAndOpen(browser, componentPath, outDir, resolvedAudioManifest) {
  const bundle = await bundleScene({
    componentPath,
    outDir,
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    duration: 60,
    resolvedAudioManifest,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await loadRenderShell(page, bundle.shellPath);
  return page;
}

async function captureHashes(page, frame) {
  await setFrameAndWait(page, frame);
  const full = await captureFrameBuffer(page, {
      width: WIDTH,
      height: HEIGHT,
      pixelRatio: 1,
      frameFormat: 'png',
      jpegQuality: 90,
  });
  const [terminal, browser] = await Promise.all([
    page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 320, height: HEIGHT } }),
    page.screenshot({ type: 'png', clip: { x: 320, y: 0, width: 320, height: HEIGHT } }),
  ]);
  return {
    full: { hash: hash(full), buffer: Buffer.from(full) },
    terminal: { hash: hash(terminal), buffer: Buffer.from(terminal) },
    browser: { hash: hash(browser), buffer: Buffer.from(browser) },
  };
}

async function captureSemanticState(page) {
  return page.evaluate(() => {
    const terminal = document.querySelector('[data-terminal-demo-id]');
    const browser = document.querySelector('[data-seqvio-browser-demo="true"]');
    const cursor = document.querySelector('[data-seqvio-browser-cursor="true"]');
    const video = document.querySelector('video[data-seqvio-seekable-media="true"]');
    if (!terminal || !browser || !cursor || !(video instanceof HTMLVideoElement)) {
      throw new Error('Conformance fixture is missing semantic state markers');
    }
    const number = (value) => Math.round(Number(value) * 1000) / 1000;
    return {
      terminal: {
        timeMs: Number(terminal.getAttribute('data-seqvio-terminal-time-ms')),
        activeInput: terminal.getAttribute('data-seqvio-terminal-active-input') ?? '',
        cursorX: Number(terminal.getAttribute('data-seqvio-terminal-cursor-x')),
        cursorY: Number(terminal.getAttribute('data-seqvio-terminal-cursor-y')),
      },
      browser: {
        timeMs: Number(browser.getAttribute('data-seqvio-browser-time-ms')),
        scale: number(browser.getAttribute('data-seqvio-browser-scale')),
        centerX: number(browser.getAttribute('data-seqvio-browser-center-x')),
        centerY: number(browser.getAttribute('data-seqvio-browser-center-y')),
        translateX: number(browser.getAttribute('data-seqvio-browser-translate-x')),
        translateY: number(browser.getAttribute('data-seqvio-browser-translate-y')),
        cursorX: number(cursor.getAttribute('data-seqvio-browser-cursor-x')),
        cursorY: number(cursor.getAttribute('data-seqvio-browser-cursor-y')),
        clickVisible: Boolean(document.querySelector('[data-seqvio-browser-click="true"]')),
        mediaTime: number(video.currentTime),
      },
    };
  });
}

async function comparePngPixels(page, expected, actual) {
  return page.evaluate(async ({ expectedBase64, actualBase64 }) => {
    const decode = async (base64) => {
      const response = await fetch(`data:image/png;base64,${base64}`);
      return createImageBitmap(await response.blob());
    };
    const [a, b] = await Promise.all([decode(expectedBase64), decode(actualBase64)]);
    if (a.width !== b.width || a.height !== b.height) {
      return { psnr: 0, significantPixelRatio: 1, maxDelta: 255 };
    }
    const canvas = new OffscreenCanvas(a.width, a.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(a, 0, 0);
    const left = context.getImageData(0, 0, a.width, a.height).data;
    context.clearRect(0, 0, a.width, a.height);
    context.drawImage(b, 0, 0);
    const right = context.getImageData(0, 0, b.width, b.height).data;
    let squaredError = 0;
    let maxDelta = 0;
    let significantPixels = 0;
    for (let offset = 0; offset < left.length; offset += 4) {
      let significant = false;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(left[offset + channel] - right[offset + channel]);
        squaredError += delta * delta;
        maxDelta = Math.max(maxDelta, delta);
        if (delta > 8) significant = true;
      }
      if (significant) significantPixels += 1;
    }
    const channelCount = (left.length / 4) * 3;
    const mse = squaredError / Math.max(1, channelCount);
    return {
      psnr: mse === 0 ? Number.POSITIVE_INFINITY : 10 * Math.log10((255 * 255) / mse),
      significantPixelRatio: significantPixels / Math.max(1, left.length / 4),
      maxDelta,
    };
  }, {
    expectedBase64: expected.toString('base64'),
    actualBase64: actual.toString('base64'),
  });
}

async function assertVisuallyEquivalent(page, label, expected, actual) {
  if (expected.hash === actual.hash) return;
  const metrics = await comparePngPixels(page, expected.buffer, actual.buffer);
  assert.ok(
    metrics.psnr >= 48 && metrics.significantPixelRatio <= 0.001,
    `${label} changed materially: ${JSON.stringify(metrics)}`,
  );
}

test('Chromium output is seek-order deterministic and reports missing media', { timeout: 120_000 }, async (t) => {
  const tempRoot = path.resolve(process.cwd(), '..', '..', 'temp');
  mkdirSync(tempRoot, { recursive: true });
  const jobDir = mkdtempSync(path.join(tempRoot, 'frame-conformance-'));
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 120_000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--allow-file-access-from-files',
      '--enable-gpu',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--disable-font-subpixel-positioning',
    ],
  });
  const report = {
    schemaVersion: 1,
    fixture: GOLDEN.fixture,
    environment: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      browser: await browser.version(),
      viewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    },
    samples: [],
    status: 'running',
  };
  t.after(async () => {
    await browser.close();
    rmSync(jobDir, { recursive: true, force: true });
    if (ARTIFACT_DIR) {
      mkdirSync(ARTIFACT_DIR, { recursive: true });
      if (report.status === 'running') report.status = 'failed';
      writeFileSync(
        path.join(ARTIFACT_DIR, 'conformance-report.json'),
        `${JSON.stringify(report, null, 2)}\n`,
        'utf8',
      );
    }
  });

  assert.deepEqual(
    { width: WIDTH, height: HEIGHT, fps: FPS, frames: [0, 9, 18, 30, 45] },
    { width: GOLDEN.width, height: GOLDEN.height, fps: GOLDEN.fps, frames: GOLDEN.frames },
    'fixture constants must match the committed golden contract',
  );

  const videoPath = path.join(jobDir, 'fixture.mp4');
  await generateVideo(videoPath);
  const silentAudioPath = path.join(jobDir, 'silent.wav');
  await generateSilentAudio(silentAudioPath);
  const audioIssues = await inspectAudioFile(silentAudioPath, 'audio.tracks[0].src');
  assert.ok(
    audioIssues.some((issue) => issue.code === 'audio_mostly_silent'),
    'real FFmpeg audio inspection must reject a silent narration track',
  );
  const mixedScenePath = path.join(jobDir, 'mixed-scene.tsx');
  writeMixedScene(mixedScenePath, pathToFileURL(videoPath).href);
  const page = await bundleAndOpen(browser, mixedScenePath, path.join(jobDir, 'mixed-bundle'));
  report.environment.fonts = await page.evaluate(() => ({
    documentStatus: document.fonts.status,
    jetBrainsMono: document.fonts.check('16px "JetBrains Mono"'),
    terminalFamily: getComputedStyle(document.querySelector('[data-terminal-demo-id]')).fontFamily,
  }));

  const frames = [0, 9, 18, 30, 45];
  const baseline = new Map();
  for (const frame of frames) {
    const captured = await captureHashes(page, frame);
    const semantic = await captureSemanticState(page);
    baseline.set(frame, captured);
    report.samples.push({
      frame,
      semantic,
      hashes: {
        full: captured.full.hash,
        terminal: captured.terminal.hash,
        browser: captured.browser.hash,
      },
    });
    if (ARTIFACT_DIR) {
      mkdirSync(ARTIFACT_DIR, { recursive: true });
      writeFileSync(path.join(ARTIFACT_DIR, `mixed-frame-${String(frame).padStart(3, '0')}.png`), captured.full.buffer);
    }
    assert.deepEqual(
      semantic,
      GOLDEN.samples[String(frame)],
      `semantic golden changed at frame ${frame}`,
    );
  }
  assert.ok(
    new Set([...baseline.values()].map((sample) => sample.full.hash)).size >= 4,
    'fixture must contain meaningful visual changes',
  );

  for (const frame of [45, 18, 0, 30, 9, 18, 45, 0]) {
    const actual = await captureHashes(page, frame);
    const expected = baseline.get(frame);
    await assertVisuallyEquivalent(page, `terminal frame ${frame}`, expected.terminal, actual.terminal);
    await assertVisuallyEquivalent(page, `browser frame ${frame}`, expected.browser, actual.browser);
    await assertVisuallyEquivalent(page, `full frame ${frame}`, expected.full, actual.full);
  }
  await page.close();

  const reflowScenePath = path.join(jobDir, 'reflow-scene.tsx');
  writeReflowScene(reflowScenePath, pathToFileURL(videoPath).href);
  const reflowPage = await bundleAndOpen(
    browser,
    reflowScenePath,
    path.join(jobDir, 'reflow-bundle'),
    {
      fps: FPS,
      lockToAudio: true,
      sceneTimings: [
        { sceneId: 'one', startFrame: 0, durationFrames: 60, transitionAfterFrames: 12 },
        { sceneId: 'two', startFrame: 72, durationFrames: 60, sourceDurationFrames: 30 },
      ],
    },
  );
  assert.equal((await getMetaFromPage(reflowPage)).duration, 132);
  await setFrameAndWait(reflowPage, 50);
  assert.equal(await reflowPage.$eval('[data-scene-id]', (element) => element.getAttribute('data-scene-id')), 'one');
  await setFrameAndWait(reflowPage, 92);
  assert.equal(await reflowPage.$eval('[data-scene-id]', (element) => element.getAttribute('data-scene-id')), 'two');
  assert.ok(await reflowPage.$eval('video', (video) => video.currentTime > 0.25 && video.currentTime < 0.4));
  await reflowPage.close();

  const missingScenePath = path.join(jobDir, 'missing-media.tsx');
  writeMissingMediaScene(
    missingScenePath,
    pathToFileURL(path.join(jobDir, 'does-not-exist.mp4')).href,
  );
  await assert.rejects(
    () => bundleAndOpen(browser, missingScenePath, path.join(jobDir, 'missing-bundle')),
    /render_runtime_failed: operation=initialize.*Unable to load seekable video metadata/,
  );

  const videoBytes = readFileSync(videoPath);
  const corruptVideoPath = path.join(jobDir, 'corrupt.mp4');
  writeFileSync(corruptVideoPath, videoBytes.subarray(0, 96));
  const corruptScenePath = path.join(jobDir, 'corrupt-media.tsx');
  writeMissingMediaScene(corruptScenePath, pathToFileURL(corruptVideoPath).href);
  await assert.rejects(
    () => bundleAndOpen(browser, corruptScenePath, path.join(jobDir, 'corrupt-bundle')),
    /render_runtime_failed: operation=initialize.*Unable to load seekable video metadata/,
  );

  report.status = 'passed';
});
