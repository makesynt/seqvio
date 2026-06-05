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
import {
  setGlobalFrame,
  preloadHandwritingFonts,
  preloadPathFonts,
} from '@seqvio/whiteboard';
import {
  runtimeGlobalName,
  SeqvioRuntimeKey,
} from '../brand';

export interface BrowserRuntimeOptions {
  width: number;
  height: number;
  defaultFps?: number;
  defaultDuration?: number;
  burnCaptions?: boolean;
  captions?: CaptionCue[];
  resolvedAudioManifest?: CompositionAudioManifest;
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
  }
}

let root: Root | null = null;
let sceneMeta: Required<Pick<RenderableMeta, 'duration' | 'fps'>> & {
  audio?: CompositionAudioManifest;
  captions?: CaptionCue[];
} = { duration: 300, fps: 30 };
let setFrameState: ((frame: number) => void) | null = null;

function readRuntimeGlobal<T>(key: SeqvioRuntimeKey): T | undefined {
  const runtimeKey = runtimeGlobalName(key);
  return (window as Record<string, unknown>)[runtimeKey] as T ?? undefined;
}

function writeRuntimeGlobal<T>(key: SeqvioRuntimeKey, value: T): void {
  (window as Record<string, unknown>)[runtimeGlobalName(key)] = value;
}

async function waitForResources(): Promise<void> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(document.images);
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        })
    )
  );

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function applyFrame(frame: number): void {
  const timeline = readRuntimeGlobal<TimelineLike>('timeline');
  if (timeline && typeof timeline.seekToFrame === 'function') {
    timeline.seekToFrame(frame);
  }
  setGlobalFrame(frame);
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

  writeRuntimeGlobal('getMeta', () => ({
    ...(readRuntimeGlobal<RenderableMeta>('compositionMeta') ?? {}),
    duration: readRuntimeGlobal<RenderableMeta>('compositionMeta')?.duration ?? sceneMeta.duration,
    fps: readRuntimeGlobal<RenderableMeta>('compositionMeta')?.fps ?? sceneMeta.fps,
    audio: readRuntimeGlobal<RenderableMeta>('compositionMeta')?.audio ?? sceneMeta.audio,
    captions: readRuntimeGlobal<RenderableMeta>('compositionMeta')?.captions ?? sceneMeta.captions,
  }));

  writeRuntimeGlobal('setFrame', async (frame: number) => {
    writeRuntimeGlobal('frameReady', false);
    flushSync(() => {
      applyFrame(frame);
      setFrameState?.(frame);
    });
    await waitForResources();
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
    writeRuntimeGlobal('ready', true);
    writeRuntimeGlobal('frameReady', true);
  })();
}
