import * as fs from 'fs';
import * as path from 'path';
import {
  resolveNarrationCueTimes,
  type CaptionCue,
  type CompositionAudioManifest,
  type RenderableMeta,
} from '../media-contract';

export interface LoadedAudioManifest {
  manifest: CompositionAudioManifest;
  path: string;
  baseDir: string;
}

export interface ManifestValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

export function buildManifestFromMeta(
  meta: RenderableMeta | undefined
): CompositionAudioManifest | undefined {
  if (!meta) {
    return undefined;
  }

  const hasAudio =
    Boolean(meta.audio) ||
    Boolean(meta.captions?.length);

  if (!hasAudio) {
    return undefined;
  }

  const manifest: CompositionAudioManifest = {
    fps: meta.audio?.fps ?? meta.fps,
    duration: meta.audio?.duration ?? meta.duration,
    narration: meta.audio?.narration,
    tracks: meta.audio?.tracks,
    captions: meta.captions ?? meta.audio?.captions,
  };

  return manifest;
}

export function loadAudioManifest(manifestPath: string): LoadedAudioManifest {
  const resolvedPath = path.resolve(manifestPath);
  const parsed = JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as CompositionAudioManifest;
  return {
    manifest: parsed,
    path: resolvedPath,
    baseDir: path.dirname(resolvedPath),
  };
}

export function loadCaptionCues(captionsPath: string): CaptionCue[] {
  const resolvedPath = path.resolve(captionsPath);
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as CaptionCue[];
}

export function validateAudioManifest(
  manifest: CompositionAudioManifest,
  options: { baseDir?: string } = {}
): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  const fps = Math.max(1, manifest.fps ?? 30);
  const seenNarrationIds = new Set<string>();
  const seenTrackIds = new Set<string>();

  for (const cue of manifest.narration ?? []) {
    if (!cue.id) {
      issues.push({ severity: 'error', message: 'Narration cue is missing "id".' });
    } else if (seenNarrationIds.has(cue.id)) {
      issues.push({
        severity: 'error',
        message: `Duplicate narration cue id "${cue.id}".`,
      });
    } else {
      seenNarrationIds.add(cue.id);
    }

    if (!cue.text && !cue.silent) {
      issues.push({
        severity: 'error',
        message: `Narration cue "${cue.id}" is missing text and is not marked silent.`,
      });
    }

    const times = resolveNarrationCueTimes(cue, fps);
    if (times.endMs < times.startMs) {
      issues.push({
        severity: 'error',
        message: `Narration cue "${cue.id}" ends before it starts.`,
      });
    }
  }

  let lastCaptionEnd = -1;
  for (const cue of manifest.captions ?? []) {
    if (cue.endMs < cue.startMs) {
      issues.push({
        severity: 'error',
        message: `Caption "${cue.text}" ends before it starts.`,
      });
    }
    if (cue.startMs < lastCaptionEnd) {
      issues.push({
        severity: 'warning',
        message: `Caption "${cue.text}" overlaps a prior caption.`,
      });
    }
    lastCaptionEnd = Math.max(lastCaptionEnd, cue.endMs);
  }

  for (const track of manifest.tracks ?? []) {
    if (!track.id) {
      issues.push({ severity: 'error', message: 'Audio track is missing "id".' });
    } else if (seenTrackIds.has(track.id)) {
      issues.push({
        severity: 'error',
        message: `Duplicate audio track id "${track.id}".`,
      });
    } else {
      seenTrackIds.add(track.id);
    }

    if (!track.src) {
      issues.push({
        severity: 'error',
        message: `Audio track "${track.id}" is missing "src".`,
      });
      continue;
    }

    if (options.baseDir) {
      const resolvedTrack = resolveMaybeRelativePath(track.src, options.baseDir);
      if (!fs.existsSync(resolvedTrack)) {
        issues.push({
          severity: 'error',
          message: `Audio track "${track.id}" points to a missing file: ${resolvedTrack}`,
        });
      }
    }
  }

  return issues;
}

export function resolveMaybeRelativePath(filePath: string, baseDir: string): string {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return path.resolve(baseDir, filePath);
}
