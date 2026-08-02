import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import puppeteer from 'puppeteer';

import { disposeRenderShell, getMetaFromPage, loadRenderShell, setFrameAndWait } from '../dist/browser-shell.js';
import { bundleScene } from '../dist/bundle-scene.js';
import { captureFrameBuffer } from '../dist/render-capture.js';

const WIDTH = 640;
const HEIGHT = 360;
const FPS = 30;
const GOLDEN = JSON.parse(readFileSync(new URL('./fixtures/authored-scenes.golden.json', import.meta.url), 'utf8'));
const ARTIFACT_DIR = process.env.SEQVIO_CONFORMANCE_ARTIFACT_DIR
  ? path.resolve(process.env.SEQVIO_CONFORMANCE_ARTIFACT_DIR)
  : null;

function writeScene(target) {
  writeFileSync(target, `import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { AnnotationTarget, Scene, Transition, VideoComposition, useCurrentFrame } from '@seqvio/core';
import { DrawShape, DrawText, WhiteboardScene, excalidrawTheme } from '@seqvio/whiteboard';
import { ArchitectureDiagram, CodeWalkthrough, TechnicalScene } from '@seqvio/technical';

const W = ${WIDTH};
const H = ${HEIGHT};

function LocalFrameMarker({ id }: { id: string }) {
  const frame = useCurrentFrame();
  return <span data-local-frame={frame} data-local-frame-scene={id} style={{ display: 'none' }} />;
}

function WhiteboardFixture() {
  return <TechnicalScene width={W} height={H} annotations={[
    { id: 'board-note', targetId: 'board', kind: 'box', start: 5, duration: 3, label: 'Board ready' },
  ]}>
    <AnnotationTarget id="board" style={{ width: W, height: H }}>
      <WhiteboardScene width={W} height={H} texture="whiteboard" theme={excalidrawTheme}>
        <DrawText text="Explain the system" position={{ x: 70, y: 100 }} fontSize={42} start={0} duration={8} />
        <DrawShape type="arrow" from={{ x: 90, y: 190 }} to={{ x: 500, y: 190 }} start={8} duration={10} />
      </WhiteboardScene>
    </AnnotationTarget>
    <LocalFrameMarker id="whiteboard" />
  </TechnicalScene>;
}

function CodeFixture() {
  return <TechnicalScene width={W} height={H} annotations={[
    { id: 'code-note', targetId: 'code:L1', kind: 'underline', start: 6, duration: 2 },
  ]}>
    <CodeWalkthrough id="code" language="typescript" source={"const answer = 42;\\nreturn answer;"} steps={[
      { at: 6, action: 'focus', range: { startLine: 1, endLine: 1 } },
    ]} width={W} height={H} />
    <LocalFrameMarker id="code" />
  </TechnicalScene>;
}

function DiagramFixture() {
  return <TechnicalScene width={W} height={H} annotations={[
    { id: 'diagram-note', targetId: 'api', kind: 'circle', start: 2, duration: 3 },
  ]}>
    <ArchitectureDiagram id="diagram" nodes={[
      { id: 'client', label: 'Client' },
      { id: 'api', label: 'API' },
    ]} edges={[{ id: 'request', from: 'client', to: 'api', label: 'request' }]} steps={[
      { at: 0, action: 'reveal', targetId: 'client' },
      { at: 0, action: 'reveal', targetId: 'api' },
      { at: 4, action: 'connect', edgeId: 'request' },
    ]} width={W} height={H} />
    <LocalFrameMarker id="diagram" />
  </TechnicalScene>;
}

export default function AuthoredConformance() {
  return <VideoComposition id="authored-conformance" width={W} height={H} fps={${FPS}} audio={meta.audio}>
    <Scene id="whiteboard" duration={30}><WhiteboardFixture /></Scene>
    <Transition type="fade" duration={6} />
    <Scene id="code" duration={30}><CodeFixture /></Scene>
    <Transition type="fade" duration={6} />
    <Scene id="diagram" duration={30}><DiagramFixture /></Scene>
  </VideoComposition>;
}

export const meta: RenderableMeta = {
  width: W, height: H, fps: ${FPS}, duration: 102,
  audio: {
    fps: ${FPS}, lockToAudio: true,
    sceneTimings: [
      { sceneId: 'whiteboard', startFrame: 0, durationFrames: 40, sourceDurationFrames: 30, transitionAfterFrames: 6 },
      { sceneId: 'code', startFrame: 46, durationFrames: 50, sourceDurationFrames: 30, transitionAfterFrames: 6 },
      { sceneId: 'diagram', startFrame: 102, durationFrames: 60, sourceDurationFrames: 30 },
    ],
    captions: [
      { id: 'caption-whiteboard', sceneId: 'whiteboard', text: 'Whiteboard explanation', startMs: 0, endMs: 1000 },
      { id: 'caption-transition-one', text: 'Move to code', startMs: 1300, endMs: 1533 },
      { id: 'caption-code', sceneId: 'code', text: 'Code explanation', startMs: 1533, endMs: 3200 },
      { id: 'caption-transition-two', text: 'Move to diagram', startMs: 3200, endMs: 3400 },
      { id: 'caption-diagram', sceneId: 'diagram', text: 'Diagram explanation', startMs: 3400, endMs: 5400 },
    ],
  },
};
`, 'utf8');
}

async function semanticState(page) {
  return page.evaluate(() => ({
    scenes: [...document.querySelectorAll('[data-scene-id]')].map((scene) => ({
      id: scene.getAttribute('data-scene-id'),
      localFrame: Number(scene.querySelector('[data-local-frame]')?.getAttribute('data-local-frame')),
      transitionRole: scene.getAttribute('data-seqvio-transition-role'),
      transitionProgress: scene.hasAttribute('data-seqvio-transition-progress')
        ? Number(scene.getAttribute('data-seqvio-transition-progress'))
        : null,
    })),
    caption: document.querySelector('[data-seqvio-caption="true"]')?.textContent ?? null,
    annotations: [...document.querySelectorAll('[data-seqvio-annotation-id]')]
      .map((element) => element.getAttribute('data-seqvio-annotation-id')).sort(),
    families: {
      whiteboard: Boolean(document.querySelector('.whiteboard-scene')),
      code: Boolean(document.querySelector('[data-line-id]')),
      diagram: Boolean(document.querySelector('[data-annotation-target="api"]')),
    },
  }));
}

async function capture(page, frame) {
  await setFrameAndWait(page, frame);
  const semantic = await semanticState(page);
  const annotationDiagnostics = await page.evaluate(() => [...document.querySelectorAll('[data-seqvio-annotation-id]')].map((wrapper) => {
    const overlay = wrapper.firstElementChild;
    const rect = overlay?.getBoundingClientRect();
    const style = overlay ? getComputedStyle(overlay) : null;
    return {
      id: wrapper.getAttribute('data-seqvio-annotation-id'),
      rect: rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
      opacity: style?.opacity ?? null,
      background: style?.backgroundColor ?? null,
    };
  }));
  const buffer = await captureFrameBuffer(page, {
    width: WIDTH,
    height: HEIGHT,
    pixelRatio: 1,
    frameFormat: 'png',
    jpegQuality: 90,
  });
  return { semantic, annotationDiagnostics, buffer, hash: createHash('sha256').update(buffer).digest('hex') };
}

async function comparePixels(page, expected, actual) {
  return page.evaluate(async ({ expectedBase64, actualBase64 }) => {
    const decode = async (base64) => {
      const response = await fetch(`data:image/png;base64,${base64}`);
      return createImageBitmap(await response.blob());
    };
    const [leftImage, rightImage] = await Promise.all([decode(expectedBase64), decode(actualBase64)]);
    const canvas = new OffscreenCanvas(leftImage.width, leftImage.height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(leftImage, 0, 0);
    const left = context.getImageData(0, 0, leftImage.width, leftImage.height).data;
    context.clearRect(0, 0, leftImage.width, leftImage.height);
    context.drawImage(rightImage, 0, 0);
    const right = context.getImageData(0, 0, rightImage.width, rightImage.height).data;
    let squaredError = 0;
    let significantPixels = 0;
    let minX = leftImage.width;
    let minY = leftImage.height;
    let maxX = -1;
    let maxY = -1;
    for (let offset = 0; offset < left.length; offset += 4) {
      let significant = false;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(left[offset + channel] - right[offset + channel]);
        squaredError += delta * delta;
        if (delta > 8) significant = true;
      }
      if (significant) {
        significantPixels += 1;
        const pixel = offset / 4;
        const x = pixel % leftImage.width;
        const y = Math.floor(pixel / leftImage.width);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
    const mse = squaredError / Math.max(1, (left.length / 4) * 3);
    return {
      psnr: mse === 0 ? Number.POSITIVE_INFINITY : 10 * Math.log10((255 * 255) / mse),
      significantPixelRatio: significantPixels / Math.max(1, left.length / 4),
      differenceBounds: significantPixels > 0 ? { minX, minY, maxX, maxY } : null,
    };
  }, { expectedBase64: expected.toString('base64'), actualBase64: actual.toString('base64') });
}

test('authored scene families share one narration-locked timeline', { timeout: 120_000 }, async (t) => {
  const tempRoot = path.resolve(process.cwd(), '..', '..', 'temp');
  mkdirSync(tempRoot, { recursive: true });
  if (ARTIFACT_DIR) mkdirSync(ARTIFACT_DIR, { recursive: true });
  const jobDir = mkdtempSync(path.join(tempRoot, 'authored-conformance-'));
  const componentPath = path.join(jobDir, 'authored-conformance.tsx');
  writeScene(componentPath);

  const bundle = await bundleScene({
    componentPath,
    outDir: path.join(jobDir, 'bundle'),
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    duration: 102,
    burnCaptions: true,
  });
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 120_000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--disable-font-subpixel-positioning'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  const report = { schemaVersion: 1, fixture: GOLDEN.fixture, environment: {
    platform: process.platform, arch: process.arch, node: process.version, browser: await browser.version(),
  }, samples: [], status: 'running' };

  t.after(async () => {
    await disposeRenderShell(page).catch(() => undefined);
    await browser.close();
    rmSync(jobDir, { recursive: true, force: true });
    if (ARTIFACT_DIR) {
      if (report.status === 'running') report.status = 'failed';
      writeFileSync(path.join(ARTIFACT_DIR, 'authored-scenes-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
  });

  await loadRenderShell(page, bundle.shellPath);
  assert.equal((await getMetaFromPage(page)).duration, GOLDEN.duration);

  const baseline = new Map();
  for (const frame of GOLDEN.frames) {
    const sample = await capture(page, frame);
    baseline.set(frame, sample);
    report.samples.push({ frame, semantic: sample.semantic, hash: sample.hash });
    if (ARTIFACT_DIR) writeFileSync(path.join(ARTIFACT_DIR, `authored-frame-${String(frame).padStart(3, '0')}.png`), sample.buffer);
    assert.deepEqual(sample.semantic, GOLDEN.samples[String(frame)], `authored semantic golden changed at frame ${frame}`);
  }

  for (const frame of [...GOLDEN.frames].reverse().concat([43, 60, 99])) {
    const actual = await capture(page, frame);
    const expected = baseline.get(frame);
    if (actual.hash !== expected.hash) {
      const metrics = await comparePixels(page, expected.buffer, actual.buffer);
      assert.ok(
        metrics.psnr >= 48 && metrics.significantPixelRatio <= 0.001,
        `authored frame ${frame} changed materially: ${JSON.stringify({ metrics, expectedAnnotations: expected.annotationDiagnostics, actualAnnotations: actual.annotationDiagnostics })}`,
      );
    }
  }
  report.status = 'passed';
});
