/**
 * Chapter-based rendering with manifest, content hashing, resume, and stitch.
 */

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  isExplainerDocument,
  syncRenderPlanWithDocument,
  type ExplainerDocument,
  type RenderPlanManifest,
  type ChapterRenderPlanEntry,
} from '@seqvio/core';
import { hasAudioInputs, muxAudioIntoVideo } from './audio-mux';
import { render, type RenderOptions, type RenderProgress, type RenderResult } from './renderer';
// @ts-ignore
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

const execFileAsync = promisify(execFile);

export interface ChapterRenderOptions extends RenderOptions {
  renderPlanPath: string;
  chapterDir: string;
  resume?: boolean;
  presetName?: string;
  /** ExplainerDocument IR used to refresh hashes and frame ranges. */
  documentPath?: string;
  /** Render only these chapter ids (useful for dev iteration). */
  onlyChapters?: string[];
}

export interface ChapterRenderReport {
  compositionId: string;
  output: string;
  chapterDir: string;
  settingsHash: string;
  resumed: boolean;
  changedChapterIds: string[];
  chapters: ChapterRenderPlanEntry[];
  stitchedAt?: string;
  audioMuxed: boolean;
}

export function hashRenderSettings(
  options: RenderOptions,
  presetName?: string
): string {
  const payload = {
    preset: presetName ?? null,
    width: options.width ?? null,
    height: options.height ?? null,
    fps: options.fps ?? null,
    quality: options.quality ?? null,
    pixelRatio: options.pixelRatio ?? null,
    frameFormat: options.frameFormat ?? null,
    jpegQuality: options.jpegQuality ?? null,
    whiteboardOptimize: options.whiteboardOptimize ?? null,
    burnCaptions: options.burnCaptions ?? false,
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}

export function loadRenderPlan(planPath: string): RenderPlanManifest {
  const resolved = path.resolve(planPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Render plan not found: ${resolved}`);
  }
  return JSON.parse(fs.readFileSync(resolved, 'utf8')) as RenderPlanManifest;
}

export function loadExplainerDocument(documentPath: string): ExplainerDocument {
  const resolved = path.resolve(documentPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Explainer document not found: ${resolved}`);
  }
  const parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
  if (!isExplainerDocument(parsed)) {
    throw new Error('documentPath must point to an ExplainerDocument IR (format "seqvio-explainer")');
  }
  return parsed;
}

export function saveRenderPlan(planPath: string, plan: RenderPlanManifest): void {
  const resolved = path.resolve(planPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
}

export function chapterOutputPath(chapterDir: string, chapterId: string): string {
  return path.join(path.resolve(chapterDir), `${chapterId}.mp4`);
}

export function shouldSkipChapter(
  entry: ChapterRenderPlanEntry,
  contentHash: string,
  settingsHash: string,
  resume: boolean
): boolean {
  if (!resume) return false;
  if (entry.status !== 'complete') return false;
  if (entry.contentHash !== contentHash) return false;
  if (entry.settingsHash !== settingsHash) return false;
  if (!entry.outputPath || !fs.existsSync(entry.outputPath)) return false;
  return true;
}

export function buildConcatListFile(chapterPaths: string[]): string {
  return chapterPaths.map((filePath) => `file '${filePath.replace(/'/g, "'\\''")}'`).join('\n');
}

export async function stitchChapterVideos(
  chapterPaths: string[],
  outputPath: string
): Promise<void> {
  if (chapterPaths.length === 0) {
    throw new Error('No chapter videos to stitch');
  }
  if (chapterPaths.length === 1) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(chapterPaths[0], outputPath);
    return;
  }

  const tempDir = path.join(path.dirname(outputPath), '.chapter-stitch');
  fs.mkdirSync(tempDir, { recursive: true });
  const listPath = path.join(tempDir, 'concat-list.txt');
  fs.writeFileSync(listPath, `${buildConcatListFile(chapterPaths)}\n`, 'utf8');

  await execFileAsync(ffmpegPath.path, [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-c',
    'copy',
    outputPath,
  ]);

  fs.rmSync(tempDir, { recursive: true, force: true });
}

function resolveChaptersToRender(
  plan: RenderPlanManifest,
  onlyChapters?: string[]
): ChapterRenderPlanEntry[] {
  if (!onlyChapters || onlyChapters.length === 0) {
    return plan.chapters;
  }
  const allowed = new Set(onlyChapters);
  const selected = plan.chapters.filter((chapter) => allowed.has(chapter.id));
  if (selected.length === 0) {
    throw new Error(
      `No chapters matched --onlyChapters (${onlyChapters.join(', ')}). Available: ${plan.chapters.map((c) => c.id).join(', ')}`
    );
  }
  return selected;
}

export async function renderChapters(
  options: ChapterRenderOptions,
  onProgress?: (progress: RenderProgress) => void
): Promise<{ result: RenderResult; report: ChapterRenderReport }> {
  const planPath = path.resolve(options.renderPlanPath);
  const chapterDir = path.resolve(options.chapterDir);
  const componentDir = path.dirname(options.component);
  let plan = loadRenderPlan(planPath);
  let changedChapterIds: string[] = [];

  if (options.documentPath) {
    const doc = loadExplainerDocument(options.documentPath);
    const synced = syncRenderPlanWithDocument(plan, doc);
    plan = synced.plan;
    changedChapterIds = synced.changedChapterIds;
    saveRenderPlan(planPath, plan);
    if (changedChapterIds.length > 0) {
      onProgress?.({
        phase: 'setup',
        message: `Synced render plan from IR (${changedChapterIds.length} chapter(s) marked pending)`,
      });
    }
  }

  const settingsHash = hashRenderSettings(options, options.presetName);
  fs.mkdirSync(chapterDir, { recursive: true });

  const reportPath = path.join(chapterDir, 'render-report.json');
  const chaptersToRender = resolveChaptersToRender(plan, options.onlyChapters);
  let rendered = 0;
  let skipped = 0;

  for (const entry of chaptersToRender) {
    const contentHash = entry.contentHash ?? '';
    const outputPath = chapterOutputPath(chapterDir, entry.id);

    if (shouldSkipChapter(entry, contentHash, settingsHash, Boolean(options.resume))) {
      skipped += 1;
      onProgress?.({
        phase: 'rendering',
        message: `Skipping chapter "${entry.id}" (cache hit)`,
      });
      entry.outputPath = entry.outputPath ?? outputPath;
      continue;
    }

    onProgress?.({
      phase: 'rendering',
      message: `Rendering chapter "${entry.id}" frames ${entry.startFrame}-${entry.endFrame}`,
    });

    try {
      await render(
        {
          ...options,
          output: outputPath,
          startFrame: entry.startFrame,
          endFrame: entry.endFrame,
          audioManifest: undefined,
          audioTrack: undefined,
          mixMusic: undefined,
        },
        onProgress
      );
      entry.status = 'complete';
      entry.outputPath = outputPath;
      entry.contentHash = contentHash;
      entry.settingsHash = settingsHash;
      entry.previewComplete = options.presetName === 'preview' ? true : entry.previewComplete;
      entry.finalComplete =
        options.presetName === 'final' || options.presetName === 'high'
          ? true
          : entry.finalComplete;
      entry.diagnostics = undefined;
      rendered += 1;
    } catch (error) {
      entry.status = 'failed';
      entry.diagnostics = [
        error instanceof Error ? error.message : String(error),
      ];
      saveRenderPlan(planPath, plan);
      throw error;
    }

    saveRenderPlan(planPath, plan);
  }

  const chaptersForStitch =
    options.onlyChapters && options.onlyChapters.length > 0
      ? chaptersToRender
      : plan.chapters;

  const chapterPaths = chaptersForStitch.map((entry) => {
    const chapterPath = entry.outputPath ?? chapterOutputPath(chapterDir, entry.id);
    if (!fs.existsSync(chapterPath)) {
      throw new Error(
        `Missing chapter output "${entry.id}". Render it first or run without --onlyChapters.`
      );
    }
    return chapterPath;
  });

  const stitchedVideoPath = `${options.output}.video-only.mp4`;
  onProgress?.({
    phase: 'muxing',
    message: `Stitching ${chapterPaths.length} chapter video(s)...`,
  });
  await stitchChapterVideos(chapterPaths, stitchedVideoPath);

  const effectiveFps = Math.max(1, options.fps ?? 30);
  const totalFrames = chaptersForStitch.reduce(
    (sum, chapter) => sum + (chapter.endFrame - chapter.startFrame + 1),
    0
  );
  const durationSeconds = totalFrames / effectiveFps;

  let audioMuxed = false;
  if (hasAudioInputs({
    videoPath: stitchedVideoPath,
    outputPath: options.output,
    durationSeconds,
    audioManifest: options.audioManifest,
    audioTrack: options.audioTrack,
    mixMusic: options.mixMusic,
    componentDir,
  })) {
    onProgress?.({
      phase: 'muxing',
      message: 'Muxing narration and music into final video...',
    });
    await muxAudioIntoVideo({
      videoPath: stitchedVideoPath,
      outputPath: options.output,
      durationSeconds,
      audioManifest: options.audioManifest,
      audioTrack: options.audioTrack,
      mixMusic: options.mixMusic,
      componentDir,
    });
    audioMuxed = true;
    if (fs.existsSync(stitchedVideoPath)) {
      fs.unlinkSync(stitchedVideoPath);
    }
  } else {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.renameSync(stitchedVideoPath, options.output);
  }

  plan.settingsHash = settingsHash;
  saveRenderPlan(planPath, plan);

  const report: ChapterRenderReport = {
    compositionId: plan.compositionId,
    output: options.output,
    chapterDir,
    settingsHash,
    resumed: Boolean(options.resume) && skipped > 0,
    changedChapterIds,
    chapters: plan.chapters,
    stitchedAt: new Date().toISOString(),
    audioMuxed,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const stat = fs.statSync(options.output);
  const result: RenderResult = {
    output: options.output,
    totalFrames,
    renderedFps: 0,
    outputBytes: stat.size,
    reusedFrames: 0,
    cacheHitRate: 0,
    workers: typeof options.workers === 'number' ? options.workers : 1,
    pixelRatio: options.pixelRatio ?? 1,
    frameFormat: options.frameFormat ?? 'png',
    totalMs: 0,
    phaseMs: { setup: 0, rendering: 0, muxing: 0, cleanup: 0 },
  };

  onProgress?.({
    phase: 'done',
    percent: 100,
    message: `Chapter render complete (${rendered} rendered, ${skipped} skipped)`,
  });

  return { result, report };
}
