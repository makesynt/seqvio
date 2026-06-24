/**
 * Browser-side render runtime for Puppeteer frame capture.
 */

import React, { useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  getActiveCaption,
  resolveCompositionDurationFrames,
  type CaptionCue,
  type CompositionAudioManifest,
  type RenderableMeta,
} from '../media-contract';
import { setGlobalFrame } from '@seqvio/core';
import {
  preloadHandwritingFonts,
  preloadPathFonts,
} from '@seqvio/whiteboard';
import {
  runtimeGlobalName,
  SeqvioRuntimeKey,
} from '../brand';
import { flushSeekables } from '@seqvio/core';

export interface BrowserRuntimeOptions {
  width: number;
  height: number;
  defaultFps?: number;
  defaultDuration?: number;
  burnCaptions?: boolean;
  captions?: CaptionCue[];
  resolvedAudioManifest?: CompositionAudioManifest;
  whiteboardOptimize?: string;
}

interface TimelineLike {
  seekToFrame(frame: number): void;
}

declare global {
  interface Window {
    __seqvio_ready?: boolean;
    __seqvio_frameReady?: boolean;
    __seqvio_setFrame?: (frame: number) => Promise<void>;
    __seqvio_getMeta?: () => RenderableMeta;
    __seqvio_timeline?: TimelineLike;
    __seqvio_resolvedAudioManifest?: CompositionAudioManifest;
    __seqvio_compositionMeta?: RenderableMeta;
    __seqvio_whiteboardOptimize?: string;
  }
}

let root: Root | null = null;
let sceneMeta: Required<Pick<RenderableMeta, 'duration' | 'fps'>> & {
  audio?: CompositionAudioManifest;
  captions?: CaptionCue[];
} = { duration: 300, fps: 30 };
let setFrameState: ((frame: number) => void) | null = null;
let lastLayerCacheFrame = -1;

function resetWhiteboardLayerCache(): void {
  for (const scene of Array.from(document.querySelectorAll<HTMLElement>('.whiteboard-scene'))) {
    scene.querySelectorAll<HTMLElement>('[data-seqvio-layer-hidden="true"]').forEach((element) => {
      element.style.visibility = '';
      element.removeAttribute('data-seqvio-layer-hidden');
    });
    scene.querySelectorAll<HTMLElement>('[data-seqvio-static-layer="true"]').forEach((element) => {
      element.remove();
    });
    scene.removeAttribute('data-seqvio-layer-cache-count');
  }
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function applyWhiteboardLayerCache(frame: number): void {
  if (window.__seqvio_whiteboardOptimize !== 'bitmap-layer') return;
  if (frame < lastLayerCacheFrame) {
    resetWhiteboardLayerCache();
  }
  lastLayerCacheFrame = frame;

  for (const scene of Array.from(document.querySelectorAll<HTMLElement>('.whiteboard-scene'))) {
    const width = scene.clientWidth || scene.getBoundingClientRect().width;
    const height = scene.clientHeight || scene.getBoundingClientRect().height;
    if (width <= 0 || height <= 0) continue;

    const completed = Array.from(
      scene.querySelectorAll<SVGSVGElement>('svg[data-seqvio-draw-end]')
    ).filter((element) => {
      if (element.getAttribute('data-seqvio-layer-hidden') === 'true') return true;
      if (element.querySelector('text, foreignObject, image')) return false;
      const end = Number(element.getAttribute('data-seqvio-draw-end'));
      return Number.isFinite(end) && end <= frame;
    });
    if (completed.length === 0) continue;

    const currentCount = Number(scene.getAttribute('data-seqvio-layer-cache-count') ?? '0');
    if (currentCount === completed.length) continue;

    const serialized = completed
      .map((element) => element.outerHTML)
      .join('');
    const combinedSvg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
      `viewBox="0 0 ${width} ${height}">${serialized}</svg>`;

    scene.querySelectorAll<HTMLElement>('[data-seqvio-static-layer="true"]').forEach((element) => {
      element.remove();
    });

    const image = document.createElement('img');
    image.setAttribute('data-seqvio-static-layer', 'true');
    image.decoding = 'sync';
    image.src = svgDataUrl(combinedSvg);
    Object.assign(image.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
    scene.insertBefore(image, scene.firstChild);

    for (const element of completed) {
      element.style.visibility = 'hidden';
      element.setAttribute('data-seqvio-layer-hidden', 'true');
    }
    scene.setAttribute('data-seqvio-layer-cache-count', String(completed.length));
  }
}

function readRuntimeGlobal<T>(key: SeqvioRuntimeKey): T | undefined {
  const runtimeKey = runtimeGlobalName(key);
  return (window as Record<string, unknown>)[runtimeKey] as T ?? undefined;
}

function writeRuntimeGlobal<T>(key: SeqvioRuntimeKey, value: T): void {
  (window as Record<string, unknown>)[runtimeGlobalName(key)] = value;
}

/** Await any <img> that has not finished loading. Cheap no-op when all complete. */
async function waitForPendingImages(): Promise<void> {
  const pending = Array.from(document.images).filter((img) => !img.complete);
  if (pending.length === 0) return;
  await Promise.all(
    pending.map(
      (img) =>
        new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );
}

/**
 * One-time resource gate, run once after the initial render. Fonts only need to
 * load once for the whole composition; awaiting document.fonts.ready every frame
 * was redundant work multiplied across thousands of frames.
 */
async function waitForInitialResources(): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForPendingImages();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Per-frame settle: flush the new frame to the DOM, await only images that are
 * still loading (e.g. a DrawImage appearing this frame), then one rAF so the
 * browser paints before we screenshot.
 */
async function waitForFrame(): Promise<void> {
  await waitForPendingImages();
  applyWhiteboardLayerCache(readRuntimeGlobal<number>('frame') ?? 0);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function applyFrame(frame: number): void {
  writeRuntimeGlobal('frame', frame);
  const timeline = readRuntimeGlobal<TimelineLike>('timeline');
  const fps = sceneMeta.fps;
  if (timeline && typeof timeline.seekToFrame === 'function') {
    timeline.seekToFrame(frame);
  }
  setGlobalFrame(frame);
  flushSeekables(frame, fps);
}

function CaptionOverlay({
  frame,
  fps,
  captions,
}: {
  frame: number;
  fps: number;
  captions: CaptionCue[];
}) {
  const activeCaption = getActiveCaption(captions, Math.round((frame / fps) * 1000));
  if (!activeCaption) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 42,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '12px 20px',
          borderRadius: 18,
          background: 'rgba(0, 0, 0, 0.72)',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.35,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        {activeCaption.text}
      </div>
    </div>
  );
}

function FrameRoot({
  SceneComponent,
  burnCaptions,
}: {
  SceneComponent: React.ComponentType;
  burnCaptions: boolean;
}) {
  const [frame, setFrame] = useState(0);
  setFrameState = setFrame;
  const captions = sceneMeta.captions ?? [];

  return (
    <>
      {React.createElement(SceneComponent)}
      {burnCaptions && captions.length > 0 ? (
        <CaptionOverlay frame={frame} fps={sceneMeta.fps} captions={captions} />
      ) : null}
    </>
  );
}

export function mountBrowserRuntime(
  SceneComponent: React.ComponentType,
  meta: RenderableMeta | undefined,
  options: BrowserRuntimeOptions
): void {
  const fps = meta?.fps ?? options.defaultFps ?? 30;
  const audio = options.resolvedAudioManifest ?? meta?.audio;
  const captions = options.captions ?? audio?.captions ?? meta?.captions ?? meta?.audio?.captions ?? [];
  const resolvedDuration = resolveCompositionDurationFrames(
    meta?.duration ?? options.defaultDuration ?? 300,
    fps,
    audio,
    captions
  );

  sceneMeta = {
    duration: resolvedDuration,
    fps,
    audio,
    captions,
  };

  const container = document.getElementById('root');
  if (!container) {
    throw new Error('Render shell missing #root element');
  }

  root = createRoot(container);
  if (options.resolvedAudioManifest) {
    writeRuntimeGlobal('resolvedAudioManifest', options.resolvedAudioManifest);
  }
  window.__seqvio_whiteboardOptimize = options.whiteboardOptimize ?? 'none';

  writeRuntimeGlobal('getMeta', () => {
    const compositionMeta = readRuntimeGlobal<RenderableMeta>('compositionMeta') ?? {};
    return {
      ...compositionMeta,
      duration: compositionMeta.duration ?? sceneMeta.duration,
      fps: compositionMeta.fps ?? sceneMeta.fps,
      width: compositionMeta.width ?? meta?.width,
      height: compositionMeta.height ?? meta?.height,
      audio: compositionMeta.audio ?? sceneMeta.audio,
      captions: compositionMeta.captions ?? sceneMeta.captions,
    };
  });

  writeRuntimeGlobal('setFrame', async (frame: number) => {
    writeRuntimeGlobal('frameReady', false);
    flushSync(() => {
      applyFrame(frame);
      setFrameState?.(frame);
    });
    await waitForFrame();
    writeRuntimeGlobal('frameReady', true);
  });

  void (async () => {
    await preloadPathFonts('./NotoSansSC-Regular.woff', './DejaVuSans.ttf');
    await preloadHandwritingFonts({
      virgilUrl: './Virgil.woff2',
      longcangUrl: './LongCang-Regular.ttf',
    });
    root!.render(
      React.createElement(FrameRoot, {
        SceneComponent,
        burnCaptions: Boolean(options.burnCaptions),
      })
    );
    await waitForInitialResources();
    writeRuntimeGlobal('ready', true);
    writeRuntimeGlobal('frameReady', true);
  })();
}
