/**
 * Video Renderer
 * Captures frames via browser React runtime and generates MP4 video
 */

import { execFile, spawn } from 'node:child_process';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { resolveCompositionDurationFrames, type CompositionAudioManifest } from './media-contract';
import {
  buildManifestFromMeta,
  loadAudioManifest,
  loadCaptionCues,
  resolveMaybeRelativePath,
} from './audio/manifest';
import { bundleScene, resolveComponentPath, writeRenderShell } from './bundle-scene';
import { getMetaFromPage, loadRenderShell, setFrameAndWait } from './browser-shell';
// @ts-ignore
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

export interface RenderOptions {
  component: string;
  output: string;
  width?: number;
  height?: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | '4k';
  startFrame?: number;
  endFrame?: number;
  duration?: number;
  tempDir?: string;
  keepFrames?: boolean;
  /** Device pixel ratio for screenshots (default: 2). Output MP4 is scaled to width×height. */
  pixelRatio?: number;
  /**
   * Per-frame screenshot format. 'png' is lossless and sharp (default, best for
   * final delivery); 'jpeg' is much cheaper to encode and transfer — ideal for
   * fast previews. Does NOT affect the final MP4 codec, only the intermediate
   * captured frames.
   */
  frameFormat?: 'png' | 'jpeg';
  /**
   * Number of concurrent browser pages used to capture frames (default: 1).
   * With workers > 1 the renderer opens N pages in ONE browser, captures the
   * frame range in parallel to numbered files, then encodes once with a single
   * FFmpeg pass (Remotion-style local model — parallelism at the bottleneck
   * step, encoding stays seam-free). workers=1 uses the streaming image2pipe
   * path with identical behaviour to before.
   */
  workers?: number;
  audioManifest?: string;
  audioTrack?: string;
  captions?: string;
  burnCaptions?: boolean;
  mixMusic?: string;
}

export interface RenderProgress {
  phase: 'setup' | 'rendering' | 'encoding' | 'muxing' | 'cleanup' | 'done';
  currentFrame?: number;
  totalFrames?: number;
  percent?: number;
  message: string;
}

/** Per-phase wall-clock timings (ms) plus throughput, returned by render(). */
export interface RenderResult {
  output: string;
  totalFrames: number;
  totalMs: number;
  renderedFps: number;
  phaseMs: {
    setup: number;
    rendering: number;
    muxing: number;
    cleanup: number;
  };
  outputBytes: number;
  workers: number;
  frameFormat: 'png' | 'jpeg';
  pixelRatio: number;
}

interface ResolvedAudioTrack {
  id: string;
  path: string;
  kind: 'narration' | 'music' | 'sfx';
  volume: number;
  offsetMs: number;
}

interface ResolvedRenderOptions {
  component: string;
  output: string;
  width: number;
  height: number;
  fps: number;
  quality: 'low' | 'medium' | 'high' | '4k';
  startFrame: number;
  endFrame: number;
  duration: number;
  tempDir: string;
  keepFrames: boolean;
  pixelRatio: number;
  frameFormat: 'png' | 'jpeg';
  workers: number;
  audioManifest?: string;
  audioTrack?: string;
  captions?: string;
  burnCaptions: boolean;
  mixMusic?: string;
}

export class VideoRenderer {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private options: ResolvedRenderOptions;
  private effectiveFps = 30;
  private sceneDuration = 300;
  private shellPath = '';
  private frameFileCount = 0;
  private componentDir = process.cwd();
  private audioManifest: CompositionAudioManifest | undefined;
  private audioManifestBaseDir: string | undefined;
  private resolvedAudioTracks: ResolvedAudioTrack[] = [];
  private onProgress?: (progress: RenderProgress) => void;
  private cliWidth: number | undefined;
  private cliHeight: number | undefined;

  constructor(options: RenderOptions, onProgress?: (progress: RenderProgress) => void) {
    this.cliWidth = options.width;
    this.cliHeight = options.height;
    this.options = {
      component: options.component,
      output: options.output,
      width: options.width || 1920,
      height: options.height || 1080,
      fps: options.fps || 30,
      quality: options.quality || 'high',
      startFrame: Math.max(0, options.startFrame ?? 0),
      endFrame: options.endFrame ?? Number.MAX_SAFE_INTEGER,
      duration: options.duration ?? 0,
      tempDir: options.tempDir || path.join(process.cwd(), 'temp'),
      keepFrames: options.keepFrames || false,
      pixelRatio: options.pixelRatio ?? 2,
      frameFormat: options.frameFormat ?? 'png',
      workers: Math.max(1, Math.floor(options.workers ?? 1)),
      audioManifest: options.audioManifest,
      audioTrack: options.audioTrack,
      captions: options.captions,
      burnCaptions: options.burnCaptions || false,
      mixMusic: options.mixMusic,
    };
    this.onProgress = onProgress;
  }

  private reportProgress(progress: RenderProgress) {
    if (this.onProgress) {
      this.onProgress(progress);
      return;
    }
    console.log(`[${progress.phase}] ${progress.message}`);
  }

  async render(): Promise<RenderResult> {
    try {
      const t0 = Date.now();
      this.reportProgress({
        phase: 'setup',
        message: 'Bundling scene and setting up browser...',
      });
      await this.setup();
      const tSetup = Date.now();

      this.effectiveFps = Math.max(1, this.options.fps);
      const totalFrames = this.resolveRenderFrameCount(this.sceneDuration);
      if (totalFrames <= 0) {
        throw new Error('Render frame range is empty. Check startFrame/endFrame/duration.');
      }

      this.reportProgress({
        phase: 'rendering',
        currentFrame: 0,
        totalFrames,
        percent: 0,
        message: `Rendering ${totalFrames} frames...`,
      });
      const encodedVideoPath = await this.renderAndEncode(totalFrames);
      const tRender = Date.now();

      let tMux = tRender;
      if (this.resolvedAudioTracks.length > 0) {
        this.reportProgress({
          phase: 'muxing',
          percent: 0,
          message: `Muxing ${this.resolvedAudioTracks.length} audio track(s)...`,
        });
        await this.muxAudio(encodedVideoPath);
        tMux = Date.now();
      }

      this.reportProgress({
        phase: 'cleanup',
        message: 'Cleaning up...',
      });
      await this.cleanup();
      const tCleanup = Date.now();

      this.reportProgress({
        phase: 'done',
        percent: 100,
        message: `Video saved to: ${this.options.output}`,
      });

      const totalMs = tCleanup - t0;
      const renderMs = tRender - tSetup;
      let outputBytes = 0;
      try {
        outputBytes = fs.statSync(this.options.output).size;
      } catch {
        // Output may be elsewhere or unreadable; report 0 rather than fail.
      }

      return {
        output: this.options.output,
        totalFrames,
        totalMs,
        renderedFps: renderMs > 0 ? (totalFrames / renderMs) * 1000 : 0,
        phaseMs: {
          setup: tSetup - t0,
          rendering: renderMs,
          muxing: tMux - tRender,
          cleanup: tCleanup - tMux,
        },
        outputBytes,
        workers: this.options.workers,
        frameFormat: this.options.frameFormat,
        pixelRatio: this.options.pixelRatio,
      };
    } catch (error) {
      console.error('Render error:', error);
      throw error;
    }
  }

  private async setup(): Promise<void> {
    const renderTempDir = path.join(
      this.options.tempDir,
      `render-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
    this.options.tempDir = renderTempDir;
    fs.mkdirSync(this.options.tempDir, { recursive: true });

    const outputDir = path.dirname(this.options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const resolvedComponent = resolveComponentPath(this.options.component);
    this.componentDir = path.dirname(resolvedComponent);
    const explicitManifest = this.options.audioManifest
      ? loadAudioManifest(this.options.audioManifest)
      : null;
    const explicitCaptions = this.options.captions
      ? loadCaptionCues(this.options.captions)
      : undefined;

    const bundleResult = await bundleScene({
      componentPath: resolvedComponent,
      outDir: this.options.tempDir,
      width: this.options.width,
      height: this.options.height,
      fps: this.options.fps,
      duration: this.options.duration > 0 ? this.options.duration : undefined,
      burnCaptions: this.options.burnCaptions,
      captions: explicitCaptions ?? explicitManifest?.manifest.captions,
      resolvedAudioManifest: explicitManifest?.manifest,
    });
    this.shellPath = bundleResult.shellPath;

    this.browser = await puppeteer.launch({
      headless: true,
      protocolTimeout: 1_200_000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--allow-file-access-from-files',
      ],
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: this.options.width,
      height: this.options.height,
      deviceScaleFactor: this.options.pixelRatio,
    });

    await loadRenderShell(this.page, this.shellPath);

    const pageMeta = await getMetaFromPage(this.page);

    // If meta declares dimensions and the caller didn't override them on the
    // CLI, re-open at the correct size. Only the HTML shell and viewport need
    // updating — the JS bundle is size-independent, so no esbuild re-run.
    const metaWidth = pageMeta.width;
    const metaHeight = pageMeta.height;
    if (!this.cliWidth && metaWidth) this.options.width = metaWidth;
    if (!this.cliHeight && metaHeight) this.options.height = metaHeight;
    if (
      this.options.width !== this.page.viewport()!.width ||
      this.options.height !== this.page.viewport()!.height
    ) {
      this.shellPath = writeRenderShell(this.options.tempDir, this.options.width, this.options.height);
      await this.page.setViewport({
        width: this.options.width,
        height: this.options.height,
        deviceScaleFactor: this.options.pixelRatio,
      });
      await loadRenderShell(this.page, this.shellPath);
    }

    this.effectiveFps = Math.max(1, this.options.fps || pageMeta.fps || 30);
    const metaManifest = buildManifestFromMeta(pageMeta);
    this.audioManifest = explicitManifest?.manifest ?? metaManifest;
    this.audioManifestBaseDir = explicitManifest?.baseDir ?? this.componentDir;

    if (this.audioManifest) {
      this.audioManifest = {
        ...this.audioManifest,
        captions: explicitCaptions ?? this.audioManifest.captions,
      };
    } else if (explicitCaptions && explicitCaptions.length > 0) {
      this.audioManifest = {
        fps: this.effectiveFps,
        captions: explicitCaptions,
      };
      this.audioManifestBaseDir = this.componentDir;
    }

    this.sceneDuration = resolveCompositionDurationFrames(
      this.options.duration > 0 ? this.options.duration : pageMeta.duration,
      this.effectiveFps,
      this.audioManifest,
      explicitCaptions
    );
    this.resolvedAudioTracks = this.resolveAudioTracks();
  }

  private resolveRenderFrameCount(duration: number): number {
    const totalDuration = Math.max(1, duration);
    const maxFrame = totalDuration - 1;
    const start = Math.min(this.options.startFrame, maxFrame);
    const end = Math.min(this.options.endFrame, maxFrame);
    return end >= start ? end - start + 1 : 0;
  }

  private crfForQuality(): number {
    const qualitySettings: Record<string, number> = {
      low: 28,
      medium: 20,
      high: 18,
      '4k': 15,
    };
    return qualitySettings[this.options.quality];
  }

  private buildEncodeArgs(targetPath: string): string[] {
    const args = [
      '-y',
      '-f', 'image2pipe',
      '-framerate', String(this.effectiveFps),
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', String(this.crfForQuality()),
      '-preset', 'medium',
      '-movflags', '+faststart',
    ];
    if (this.options.pixelRatio > 1) {
      args.push('-vf', `scale=${this.options.width}:${this.options.height}`);
    }
    args.push('-r', String(this.effectiveFps), targetPath);
    return args;
  }

  private buildEncodeArgsFromFiles(framePattern: string, targetPath: string): string[] {
    const args = [
      '-y',
      '-f', 'image2',
      '-framerate', String(this.effectiveFps),
      '-i', framePattern,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', String(this.crfForQuality()),
      '-preset', 'medium',
      '-movflags', '+faststart',
    ];
    if (this.options.pixelRatio > 1) {
      args.push('-vf', `scale=${this.options.width}:${this.options.height}`);
    }
    args.push('-r', String(this.effectiveFps), targetPath);
    return args;
  }

  private async encodeFromFiles(framePattern: string, targetPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn(
        ffmpegPath.path,
        this.buildEncodeArgsFromFiles(framePattern, targetPath),
        { windowsHide: true }
      );
      let ffmpegStderr = '';
      ffmpeg.stderr.on('data', (chunk) => {
        ffmpegStderr += chunk.toString();
      });
      ffmpeg.on('error', reject);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(ffmpegStderr || `FFmpeg exited with code ${code}`));
      });
    });
  }

  /**
   * Render a contiguous frame segment on the given page and stream each captured
   * PNG straight into a dedicated FFmpeg process via stdin (image2pipe). No
   * intermediate PNG files touch disk; rendering and encoding overlap.
   *
   * onFrame is invoked once per encoded frame so the caller can aggregate
   * progress across concurrent segments.
   */
  private async encodeSegment(
    page: Page,
    firstSourceFrame: number,
    frameCount: number,
    targetPath: string,
    onFrame: () => void
  ): Promise<void> {
    const ffmpeg = spawn(ffmpegPath.path, this.buildEncodeArgs(targetPath), {
      windowsHide: true,
    });

    let ffmpegStderr = '';
    ffmpeg.stderr.on('data', (chunk) => {
      ffmpegStderr += chunk.toString();
    });

    const ffmpegExit = new Promise<void>((resolve, reject) => {
      ffmpeg.on('error', reject);
      ffmpeg.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(ffmpegStderr || `FFmpeg exited with code ${code}`));
      });
    });

    const writeFrame = (buffer: Buffer): Promise<void> =>
      new Promise((resolve, reject) => {
        ffmpeg.stdin.write(buffer, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

    try {
      for (let i = 0; i < frameCount; i++) {
        const sourceFrame = firstSourceFrame + i;
        await setFrameAndWait(page, sourceFrame);

        const buffer = (await page.screenshot(
          this.options.frameFormat === 'jpeg'
            ? { type: 'jpeg', quality: 90, omitBackground: false }
            : { type: 'png', omitBackground: false }
        )) as Buffer;

        await writeFrame(buffer);

        // Optional debug tee: also persist frames when --keepFrames is set.
        if (this.options.keepFrames) {
          const ext = this.options.frameFormat === 'jpeg' ? 'jpg' : 'png';
          fs.writeFileSync(
            path.join(this.options.tempDir, `frame-${String(sourceFrame).padStart(6, '0')}.${ext}`),
            buffer
          );
        }

        onFrame();
      }

      ffmpeg.stdin.end();
      await ffmpegExit;
    } catch (error) {
      ffmpeg.stdin.destroy();
      ffmpeg.kill();
      throw error;
    }
  }

  /**
   * Render all frames to an encoded (video-only) MP4.
   *
   * Two paths depending on workers:
   * - workers=1 (default): stream each frame directly into a single FFmpeg via
   *   stdin (image2pipe). No disk IO; rendering and encoding overlap.
   * - workers>1: open N pages in the same browser, capture frames in parallel
   *   to numbered files, then encode once with a single FFmpeg pass. This is
   *   the Remotion local model — parallel at the bottleneck (screenshot), single
   *   encode at the end, no concat, no seams.
   *
   * NOTE: The approach that was previously prototyped and rejected was "slice +
   * concat" — N Chrome processes each with their own FFmpeg, outputs merged with
   * concat. That model contends for CPU and has seam artefacts. The multi-page
   * capture + single encode model above is different and has NOT been disabled.
   * Single-machine slice+concat is still inadvisable; cross-machine is a
   * separate orchestration concern.
   */
  private async renderAndEncode(totalFrames: number): Promise<string> {
    const targetPath =
      this.resolvedAudioTracks.length > 0
        ? path.join(this.options.tempDir, 'video-only.mp4')
        : this.options.output;

    if (this.options.workers > 1) {
      const result = await this.renderFramesParallel(totalFrames);
      this.frameFileCount = result;
      this.reportProgress({ phase: 'encoding', percent: 0, message: 'Encoding frames...' });
      const ext = this.options.frameFormat === 'jpeg' ? 'jpg' : 'png';
      const framePattern = path.join(this.options.tempDir, `frame-%06d.${ext}`);
      await this.encodeFromFiles(framePattern, targetPath);
      if (!this.options.keepFrames) {
        this.cleanupFrameFiles(ext);
      }
      this.reportProgress({ phase: 'encoding', percent: 100, message: 'Encoding: 100%' });
      return targetPath;
    }

    this.frameFileCount = 0;
    let done = 0;
    const onFrame = () => {
      done += 1;
      if (done % 30 === 0 || done === totalFrames) {
        this.reportProgress({
          phase: 'rendering',
          currentFrame: done,
          totalFrames,
          percent: Math.round((done / totalFrames) * 100),
          message: `Rendered ${done}/${totalFrames} frames`,
        });
      }
    };

    await this.encodeSegment(
      this.page!,
      this.options.startFrame,
      totalFrames,
      targetPath,
      onFrame
    );
    this.frameFileCount = done;
    this.reportProgress({ phase: 'encoding', percent: 100, message: 'Encoding: 100%' });
    return targetPath;
  }

  /**
   * Remotion-style local parallel: open N pages in the same browser, distribute
   * frame range across them, capture to numbered files, return total count.
   * All pages share the same browser process so startup cost is paid once.
   */
  private async renderFramesParallel(totalFrames: number): Promise<number> {
    const n = this.options.workers;
    const ext = this.options.frameFormat === 'jpeg' ? 'jpg' : 'png';

    // Open N-1 extra pages (the primary page is already open).
    const extraPages: Page[] = [];
    for (let i = 1; i < n; i++) {
      const p = await this.browser!.newPage();
      await p.setViewport({
        width: this.options.width,
        height: this.options.height,
        deviceScaleFactor: this.options.pixelRatio,
      });
      await loadRenderShell(p, this.shellPath);
      extraPages.push(p);
    }
    const pages = [this.page!, ...extraPages];

    let done = 0;
    const onFrame = () => {
      done += 1;
      if (done % 30 === 0 || done === totalFrames) {
        this.reportProgress({
          phase: 'rendering',
          currentFrame: done,
          totalFrames,
          percent: Math.round((done / totalFrames) * 100),
          message: `Rendered ${done}/${totalFrames} frames (${n} workers)`,
        });
      }
    };

    // Distribute frames: page i handles all source frames where (sourceFrame % n) === i.
    // This gives round-robin interleaving so each page gets a similar variety of scenes.
    const tasks = pages.map((page, workerIdx) =>
      (async () => {
        for (let i = 0; i < totalFrames; i++) {
          if (i % n !== workerIdx) continue;
          const sourceFrame = this.options.startFrame + i;
          await setFrameAndWait(page, sourceFrame);

          const screenshotOpts =
            this.options.frameFormat === 'jpeg'
              ? ({ type: 'jpeg', quality: 90, omitBackground: false } as const)
              : ({ type: 'png', omitBackground: false } as const);
          const buffer = (await page.screenshot(screenshotOpts)) as Buffer;

          // Global frame index for deterministic ordered file name.
          const filename = `frame-${String(sourceFrame).padStart(6, '0')}.${ext}`;
          fs.writeFileSync(path.join(this.options.tempDir, filename), buffer);
          onFrame();
        }
      })()
    );

    try {
      await Promise.all(tasks);
    } finally {
      for (const p of extraPages) {
        await p.close().catch(() => undefined);
      }
    }

    return done;
  }

  private cleanupFrameFiles(ext: string): void {
    try {
      const files = fs.readdirSync(this.options.tempDir).filter(
        (f) => /^frame-\d{6}\./.test(f) && f.endsWith(`.${ext}`)
      );
      for (const f of files) {
        fs.unlinkSync(path.join(this.options.tempDir, f));
      }
    } catch {
      // Best-effort cleanup; don't fail the render.
    }
  }

  private resolveAudioTracks(): ResolvedAudioTrack[] {
    const resolved: ResolvedAudioTrack[] = [];
    const manifestTracks = this.audioManifest?.tracks ?? [];
    const manifestBaseDir = this.audioManifestBaseDir ?? this.componentDir;

    for (const track of manifestTracks) {
      resolved.push({
        id: track.id,
        path: resolveMaybeRelativePath(track.src, manifestBaseDir),
        kind: track.kind,
        volume: track.volume ?? 1,
        offsetMs: track.offsetMs ?? 0,
      });
    }

    if (this.options.audioTrack) {
      resolved.push({
        id: 'cli-audio-track',
        path: resolveMaybeRelativePath(this.options.audioTrack, this.componentDir),
        kind: 'narration',
        volume: 1,
        offsetMs: 0,
      });
    }

    if (this.options.mixMusic) {
      resolved.push({
        id: 'cli-music-track',
        path: resolveMaybeRelativePath(this.options.mixMusic, this.componentDir),
        kind: 'music',
        volume: 0.35,
        offsetMs: 0,
      });
    }

    for (const track of resolved) {
      if (!fs.existsSync(track.path)) {
        throw new Error(`Audio track file not found: ${track.path}`);
      }
    }

    return resolved;
  }

  private async muxAudio(videoPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetDurationSeconds = this.sceneDuration / this.effectiveFps;
      const filters: string[] = [];
      const labels: string[] = [];
      const args: string[] = ['-y', '-i', videoPath];

      this.resolvedAudioTracks.forEach((track, index) => {
        const inputIndex = index + 1;
        args.push('-i', track.path);
        const filterParts: string[] = [];

        if (track.offsetMs > 0) {
          filterParts.push(`adelay=${track.offsetMs}|${track.offsetMs}`);
        }
        if (track.volume !== 1) {
          filterParts.push(`volume=${track.volume}`);
        }
        if (filterParts.length === 0) {
          filterParts.push('anull');
        }

        const label = `a${index}`;
        filters.push(`[${inputIndex}:a]${filterParts.join(',')}[${label}]`);
        labels.push(`[${label}]`);
      });

      filters.push(
        `anullsrc=r=24000:cl=mono,atrim=0:${targetDurationSeconds.toFixed(3)}[asilence]`
      );
      filters.push(
        `${labels.join('')}[asilence]amix=inputs=${labels.length + 1}:duration=longest:dropout_transition=0[aout]`
      );

      args.push(
        '-filter_complex',
        filters.join(';'),
        '-map',
        '0:v:0',
        '-map',
        '[aout]',
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-movflags',
        '+faststart',
        this.options.output
      );

      execFile(ffmpegPath.path, args, { windowsHide: true }, (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || error.message));
          return;
        }
        this.reportProgress({
          phase: 'muxing',
          percent: 100,
          message: 'Muxing: 100%',
        });
        resolve();
      });
    });
  }

  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }

    // Frames are streamed straight to FFmpeg, so no PNGs exist unless
    // --keepFrames was requested (in which case the caller wants to keep them).
  }
}

export async function render(
  options: RenderOptions,
  onProgress?: (progress: RenderProgress) => void
): Promise<RenderResult> {
  const renderer = new VideoRenderer(options, onProgress);
  return renderer.render();
}

export { resolveComponentPath };
