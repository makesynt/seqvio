/**
 * Generates and syncs a RenderPlanManifest from the seqvio composition
 * pipeline (tsx → manifest → resolved manifest), bridging the gap between
 * the existing `scenes[]`/CosyVoice workflow and the chapter-render engine.
 *
 * Each scene = one chapter.  The content hash covers narration text, the
 * scene's own frame count (NOT its absolute position), and render settings.
 * This means a timing shift from an earlier scene doesn't invalidate
 * downstream chapter caches.
 */

import { createHash } from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs';
import type { RenderPlanManifest, ChapterRenderPlanEntry } from '@seqvio/core';

// ── types ──────────────────────────────────────────────────────────────────

export interface RenderSettings {
  width: number;
  height: number;
  fps: number;
  quality: string;
  pixelRatio: number;
}

export interface ManifestCue {
  id: string;
  text: string;
  startFrame: number;
  endFrame: number;
}

// ── hash ───────────────────────────────────────────────────────────────────

export function hashChapterContent(
  narration: string,
  frameCount: number,
  settings: RenderSettings,
): string {
  const payload = { narration, frameCount, settings };
  return createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16);
}

// ── generate ───────────────────────────────────────────────────────────────

export function generateRenderPlan(options: {
  compositionId: string;
  cues: ManifestCue[];
  settings: RenderSettings;
  planPath: string;
}): RenderPlanManifest {
  const plan = buildPlan(options);
  fs.mkdirSync(path.dirname(options.planPath), { recursive: true });
  fs.writeFileSync(options.planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  return plan;
}

// ── sync ───────────────────────────────────────────────────────────────────

export interface SyncPlanResult {
  plan: RenderPlanManifest;
  changedChapterIds: string[];
}

/**
 * Refresh frame ranges from up-to-date manifest cues and re-compute content
 * hashes.  Chapters whose content (narration + frame count + settings) is
 * unchanged keep their existing `outputPath` / `status` so the chapter
 * render engine can skip them when `--resume` is set.
 */
export function syncPlanWithManifest(
  existingPlan: RenderPlanManifest,
  options: {
    cues: ManifestCue[];
    settings: RenderSettings;
    planPath: string;
  },
): SyncPlanResult {
  const previous = new Map(
    existingPlan.chapters.map((ch) => [ch.id, ch]),
  );
  const fresh = buildPlan({
    compositionId: existingPlan.compositionId,
    cues: options.cues,
    settings: options.settings,
    planPath: options.planPath,
  }).chapters;

  const changedChapterIds: string[] = [];

  const chapters: ChapterRenderPlanEntry[] = fresh.map((chapter) => {
    const prev = previous.get(chapter.id);

    // Mark as changed if: new chapter, content hash differs, or frame range moved.
    if (
      !prev ||
      prev.contentHash !== chapter.contentHash ||
      prev.startFrame !== chapter.startFrame ||
      prev.endFrame !== chapter.endFrame
    ) {
      changedChapterIds.push(chapter.id);
      return { ...chapter, status: 'pending' as const };
    }

    return prev; // unchanged — preserve outputPath, status, etc.
  });

  const plan = { ...existingPlan, chapters };
  fs.mkdirSync(path.dirname(options.planPath), { recursive: true });
  fs.writeFileSync(options.planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

  return { plan, changedChapterIds };
}

// ── helpers ────────────────────────────────────────────────────────────────

function buildPlan(options: {
  compositionId: string;
  cues: ManifestCue[];
  settings: RenderSettings;
  planPath: string;
}): RenderPlanManifest {
  const chapters: ChapterRenderPlanEntry[] = options.cues.map((cue) => ({
    id: cue.id,
    startFrame: cue.startFrame,
    endFrame: cue.endFrame,
    contentHash: hashChapterContent(
      cue.text,
      cue.endFrame - cue.startFrame,
      options.settings,
    ),
    status: 'pending' as const,
  }));

  return {
    compositionId: options.compositionId,
    chapters,
  };
}
