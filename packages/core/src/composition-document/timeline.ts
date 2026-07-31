/**
 * Deterministic composition timeline and chapter render-plan builders.
 */

import {
  COMPOSITION_DOCUMENT_DEFAULTS,
  type ChapterSpec,
  type CompositionDocument,
  type RenderPlanManifest,
  type SceneSpec,
} from './schema';
import { resolveScenePacing } from '../pacing';
import { resolvePacingProfile } from '../pacing';

export interface DocumentTimelineScene {
  id: string;
  startFrame: number;
  endFrame: number;
  duration: number;
}

export interface DocumentTimeline {
  fps: number;
  transitionDuration: number;
  scenes: DocumentTimelineScene[];
  /** Exclusive upper bound; valid frames are 0 .. totalFrames - 1 */
  totalFrames: number;
}

export function sceneDurationFrames(scene: SceneSpec, fps: number = COMPOSITION_DOCUMENT_DEFAULTS.fps): number {
  return resolveScenePacing(scene, fps).durationFrames;
}

export function computeDocumentTimeline(doc: CompositionDocument): DocumentTimeline {
  const transitionDuration =
    doc.transitionDuration ?? COMPOSITION_DOCUMENT_DEFAULTS.transitionDuration;
  const fps = doc.fps ?? COMPOSITION_DOCUMENT_DEFAULTS.fps;
  let cursor = 0;
  const scenes: DocumentTimelineScene[] = [];
  const pacingPolicy = resolvePacingProfile(doc.pacingProfile).policy;

  doc.scenes.forEach((scene, index) => {
    const duration = resolveScenePacing(scene, fps, pacingPolicy).durationFrames;
    const startFrame = cursor;
    const endFrame = cursor + duration - 1;
    scenes.push({ id: scene.id, startFrame, endFrame, duration });
    cursor += duration;
    if (index < doc.scenes.length - 1) {
      cursor += transitionDuration;
    }
  });

  return {
    fps: doc.fps ?? COMPOSITION_DOCUMENT_DEFAULTS.fps,
    transitionDuration,
    scenes,
    totalFrames: cursor,
  };
}

function sceneIndexById(doc: CompositionDocument): Map<string, number> {
  const map = new Map<string, number>();
  doc.scenes.forEach((scene, index) => map.set(scene.id, index));
  return map;
}

export function chapterFrameRange(
  doc: CompositionDocument,
  chapter: ChapterSpec,
  chapterIndex: number,
  chapters: ChapterSpec[],
  timeline: DocumentTimeline
): { startFrame: number; endFrame: number } {
  const indexById = sceneIndexById(doc);
  const indices = chapter.sceneIds
    .map((id) => indexById.get(id))
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => a - b);

  if (indices.length === 0) {
    throw new Error(`Chapter "${chapter.id}" references no scenes in the document`);
  }

  const firstIndex = indices[0];
  const lastIndex = indices[indices.length - 1];
  const startFrame = timeline.scenes[firstIndex].startFrame;
  let endFrame = timeline.scenes[lastIndex].endFrame;

  const hasNextChapter = chapterIndex < chapters.length - 1;
  const hasTrailingTransition = lastIndex < doc.scenes.length - 1;
  if (hasNextChapter && hasTrailingTransition) {
    endFrame += timeline.transitionDuration;
  }

  return { startFrame, endFrame };
}

export function hashStableJson(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function chapterContentHash(
  doc: CompositionDocument,
  chapter: ChapterSpec
): string {
  const sceneById = new Map(doc.scenes.map((scene) => [scene.id, scene]));
  const payload = {
    compositionId: doc.id,
    version: doc.version,
    width: doc.width,
    height: doc.height,
    fps: doc.fps,
    transitionDuration: doc.transitionDuration,
    chapterId: chapter.id,
    scenes: chapter.sceneIds.map((id) => sceneById.get(id)),
  };
  return hashStableJson(payload);
}

export function buildRenderPlanFromDocument(doc: CompositionDocument): RenderPlanManifest {
  const timeline = computeDocumentTimeline(doc);
  const chapters =
    doc.chapters && doc.chapters.length > 0
      ? doc.chapters
      : [{ id: 'full', sceneIds: doc.scenes.map((scene) => scene.id) }];

  return {
    compositionId: doc.id,
    chapters: chapters.map((chapter, index) => {
      const range = chapterFrameRange(doc, chapter, index, chapters, timeline);
      return {
        id: chapter.id,
        startFrame: range.startFrame,
        endFrame: range.endFrame,
        contentHash: chapterContentHash(doc, chapter),
        status: 'pending' as const,
      };
    }),
  };
}

export interface SyncRenderPlanResult {
  plan: RenderPlanManifest;
  changedChapterIds: string[];
}

/**
 * Refresh frame ranges and content hashes from the source document while
 * preserving completed chapter outputs when their content is unchanged.
 */
export function syncRenderPlanWithDocument(
  plan: RenderPlanManifest,
  doc: CompositionDocument
): SyncRenderPlanResult {
  const fresh = buildRenderPlanFromDocument(doc);
  const previous = new Map(plan.chapters.map((chapter) => [chapter.id, chapter]));
  const changedChapterIds: string[] = [];

  const chapters = fresh.chapters.map((chapter) => {
    const prev = previous.get(chapter.id);
    if (!prev) {
      changedChapterIds.push(chapter.id);
      return chapter;
    }

    const contentUnchanged =
      prev.contentHash === chapter.contentHash &&
      prev.startFrame === chapter.startFrame &&
      prev.endFrame === chapter.endFrame;

    if (!contentUnchanged) {
      changedChapterIds.push(chapter.id);
      return {
        ...chapter,
        status: 'pending' as const,
        outputPath: undefined,
        settingsHash: undefined,
        previewComplete: false,
        finalComplete: false,
        diagnostics: undefined,
      };
    }

    return {
      ...chapter,
      status: prev.status,
      outputPath: prev.outputPath,
      settingsHash: prev.settingsHash,
      previewComplete: prev.previewComplete,
      finalComplete: prev.finalComplete,
      diagnostics: prev.diagnostics,
      narrationManifestPath: prev.narrationManifestPath,
      captionManifestPath: prev.captionManifestPath,
    };
  });

  return {
    plan: {
      compositionId: fresh.compositionId,
      rendererVersion: plan.rendererVersion,
      settingsHash: plan.settingsHash,
      chapters,
    },
    changedChapterIds,
  };
}
