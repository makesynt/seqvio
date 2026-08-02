import * as fs from 'fs';
import * as path from 'path';
import {
  isPacingProfileId,
  resolveNarrationAnchor,
  resolveNarrationCueTimes,
  type CaptionCue,
  type CompositionAudioManifest,
  type NarrationCue,
  type RenderableMeta,
} from '../media-contract';

export interface LoadedAudioManifest {
  manifest: CompositionAudioManifest;
  path: string;
  baseDir: string;
}

export interface ManifestValidationIssue {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
  repair?: string;
}

export function resolveSynthesizedCueTiming(
  cue: import('../media-contract').NarrationCue,
  fps: number,
  probedDurationMs: number,
  sequentialOffsetMs: number,
): { startMs: number; endMs: number } {
  const authoredTimes = resolveNarrationCueTimes(cue, fps);
  const startMs = cue.startMs !== undefined || cue.startFrame !== undefined
    ? authoredTimes.startMs
    : sequentialOffsetMs;
  return { startMs, endMs: startMs + Math.max(1, probedDurationMs) };
}

export function reflowSynthesizedTimeline(
  manifest: CompositionAudioManifest,
  synthesizedNarration: NarrationCue[],
  fps: number,
  options: { cueGapMs?: number; sceneTailMs?: number } = {},
): {
  narration: NarrationCue[];
  sceneTimings: CompositionAudioManifest['sceneTimings'];
  explanationBeats: CompositionAudioManifest['explanationBeats'];
  durationFrames?: number;
} {
  if (!manifest.sceneTimings?.length) {
    return {
      narration: synthesizedNarration,
      sceneTimings: manifest.sceneTimings,
      explanationBeats: manifest.explanationBeats,
      durationFrames: manifest.duration,
    };
  }
  const cueGapMs = options.cueGapMs ?? 180;
  const sceneTailMs = options.sceneTailMs ?? 600;
  const resolvedById = new Map<string, NarrationCue>();
  const sceneTimings: NonNullable<CompositionAudioManifest['sceneTimings']> = [];
  const explanationBeats: NonNullable<CompositionAudioManifest['explanationBeats']> = [];
  let frameCursor = 0;

  for (const scene of manifest.sceneTimings) {
    const sourceDurationFrames = Math.max(1, scene.sourceDurationFrames ?? scene.durationFrames);
    const sceneStartMs = (frameCursor / fps) * 1000;
    let cueCursorMs = sceneStartMs;
    const sceneCues = synthesizedNarration.filter((cue) => cue.sceneId === scene.sceneId);
    for (const [index, cue] of sceneCues.entries()) {
      const authored = resolveNarrationCueTimes(cue, fps);
      const durationMs = Math.max(1, authored.endMs - authored.startMs);
      const resolved = {
        ...cue,
        startMs: Math.round(cueCursorMs),
        endMs: Math.round(cueCursorMs + durationMs),
        startFrame: Math.round((cueCursorMs / 1000) * fps),
        endFrame: Math.round(((cueCursorMs + durationMs) / 1000) * fps),
      };
      resolvedById.set(cue.id, resolved);
      cueCursorMs += durationMs + (index < sceneCues.length - 1 ? cueGapMs : 0);
    }
    const narrationFrames = Math.ceil((((cueCursorMs - sceneStartMs) + (sceneCues.length ? sceneTailMs : 0)) / 1000) * fps);
    const durationFrames = Math.max(scene.durationFrames, narrationFrames);
    const resolvedSceneBeats = (manifest.explanationBeats ?? [])
      .filter((beat) => beat.sceneId === scene.sceneId)
      .map((beat) => {
        const cue = resolvedById.get(beat.cueId);
        if (!cue) return beat;
        const resolution = resolveNarrationAnchor(cue, beat.anchor, fps);
        if (!resolution.ok) return { ...beat, resolutionError: resolution.code };
        return {
          ...beat,
          outputFrame: Math.max(0, resolution.absoluteFrame - frameCursor),
          method: resolution.method,
          confidence: resolution.confidence,
          resolutionError: undefined,
        };
      });
    explanationBeats.push(...resolvedSceneBeats);
    const semanticPoints = resolvedSceneBeats
      .filter((beat): beat is typeof beat & { outputFrame: number } =>
        typeof beat.outputFrame === 'number'
      )
      .sort((a, b) => a.outputFrame - b.outputFrame)
      .map((beat) => ({
        outputFrame: Math.min(durationFrames, beat.outputFrame),
        sourceFrame: Math.min(sourceDurationFrames, beat.sourceFrame),
      }));
    const orderedHighlights = [...(scene.highlights ?? [])].sort((a, b) => a.startFrame - b.startFrame);
    const chunkFrames = sceneCues
      .flatMap((cue) => {
        const resolvedCue = resolvedById.get(cue.id) ?? cue;
        const cueStartFrame = resolvedCue.startFrame
          ?? Math.round((resolveNarrationCueTimes(resolvedCue, fps).startMs / 1000) * fps);
        const cueSceneOffset = Math.max(0, cueStartFrame - frameCursor);
        return (cue.chunks ?? []).map((chunk) => cueSceneOffset + chunk.offsetFrame);
      })
      .filter((frame) => Number.isFinite(frame) && frame >= 0)
      .sort((a, b) => a - b);
    const mappedCount = Math.min(orderedHighlights.length, chunkFrames.length);
    const fallbackPoints = Array.from({ length: mappedCount }, (_, index) => ({
      outputFrame: Math.min(durationFrames, chunkFrames[index]),
      sourceFrame: Math.min(sourceDurationFrames, orderedHighlights[index].startFrame),
    }));
    const anchorPoints = semanticPoints.length > 0 ? semanticPoints : fallbackPoints;
    const timeMap = anchorPoints.length > 0
      ? [
          ...(anchorPoints[0].outputFrame === 0
            ? []
            : [{ outputFrame: 0, sourceFrame: 0 }]),
          ...anchorPoints,
          { outputFrame: durationFrames, sourceFrame: sourceDurationFrames },
        ].filter((point, index, points) => index === 0 || (
          point.outputFrame > points[index - 1].outputFrame &&
          point.sourceFrame >= points[index - 1].sourceFrame
        ))
      : undefined;
    sceneTimings.push({
      ...scene,
      startFrame: frameCursor,
      durationFrames,
      sourceDurationFrames,
      timeMap,
    });
    frameCursor += durationFrames + Math.max(0, scene.transitionAfterFrames ?? 0);
  }

  return {
    narration: synthesizedNarration.map((cue) => resolvedById.get(cue.id) ?? cue),
    sceneTimings,
    explanationBeats,
    durationFrames: frameCursor,
  };
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
    sceneTimings: meta.audio?.sceneTimings,
    explanationBeats: meta.audio?.explanationBeats,
    pacingProfile: meta.audio?.pacingProfile ?? meta.pacing?.profile,
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
  const narrationById = new Map<string, NarrationCue>();
  const seenTrackIds = new Set<string>();

  if (manifest.pacingProfile !== undefined && !isPacingProfileId(manifest.pacingProfile)) {
    issues.push({
      severity: 'error',
      code: 'unsupported_pacing_profile',
      path: 'pacingProfile',
      message: `Unsupported pacing profile "${manifest.pacingProfile}".`,
      repair: 'Regenerate the manifest with a supported versioned pacing profile.',
    });
  }

  let previousNarrationEnd = -1;
  for (const [index, cue] of (manifest.narration ?? []).entries()) {
    const cuePath = `narration[${index}]`;
    if (!cue.id) {
      issues.push({ severity: 'error', code: 'missing_narration_id', path: `${cuePath}.id`, message: 'Narration cue is missing "id".' });
    } else if (seenNarrationIds.has(cue.id)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_narration_id',
        path: `${cuePath}.id`,
        message: `Duplicate narration cue id "${cue.id}".`,
      });
    } else {
      seenNarrationIds.add(cue.id);
      narrationById.set(cue.id, cue);
    }

    if (!cue.text && !cue.silent) {
      issues.push({
        severity: 'error',
        code: 'missing_narration_text',
        path: `${cuePath}.text`,
        message: `Narration cue "${cue.id}" is missing text and is not marked silent.`,
      });
    }

    const times = resolveNarrationCueTimes(cue, fps);
    const authoredStart = cue.startMs ?? (cue.startFrame !== undefined ? (cue.startFrame / fps) * 1000 : 0);
    const authoredEnd = cue.endMs ?? (cue.endFrame !== undefined ? (cue.endFrame / fps) * 1000 : authoredStart);
    if (authoredStart < 0 || authoredEnd < authoredStart) {
      issues.push({
        severity: 'error',
        code: authoredStart < 0 ? 'negative_narration_time' : 'invalid_narration_range',
        path: cuePath,
        message:
          authoredStart < 0
            ? `Narration cue "${cue.id}" starts before zero.`
            : `Narration cue "${cue.id}" ends before it starts.`,
      });
    }
    if (times.startMs < previousNarrationEnd) {
      issues.push({
        severity: 'warning',
        code: 'overlapping_narration',
        path: cuePath,
        message: `Narration cue "${cue.id}" overlaps a prior narration cue.`,
      });
    }
    previousNarrationEnd = Math.max(previousNarrationEnd, times.endMs);
  }

  let lastCaptionEnd = -1;
  for (const [index, cue] of (manifest.captions ?? []).entries()) {
    const cuePath = `captions[${index}]`;
    if (!cue.text || cue.text.trim().length === 0) {
      issues.push({
        severity: 'error',
        code: 'empty_caption_text',
        path: `${cuePath}.text`,
        message: 'Caption text must not be empty.',
      });
    }
    if (cue.startMs < 0 || cue.endMs <= cue.startMs) {
      issues.push({
        severity: 'error',
        code: cue.startMs < 0 ? 'negative_caption_time' : 'invalid_caption_range',
        path: cuePath,
        message: `Caption "${cue.text}" ends before it starts.`,
      });
    }
    if (cue.startMs < lastCaptionEnd) {
      issues.push({
        severity: 'warning',
        code: 'overlapping_captions',
        path: cuePath,
        message: `Caption "${cue.text}" overlaps a prior caption.`,
      });
    }
    lastCaptionEnd = Math.max(lastCaptionEnd, cue.endMs);
  }

  const seenSceneIds = new Set<string>();
  let previousSceneStart = -1;
  for (const [index, scene] of (manifest.sceneTimings ?? []).entries()) {
    const scenePath = `sceneTimings[${index}]`;
    if (!scene.sceneId || seenSceneIds.has(scene.sceneId)) {
      issues.push({
        severity: 'error',
        code: scene.sceneId ? 'duplicate_audio_scene_timing' : 'missing_audio_scene_id',
        path: `${scenePath}.sceneId`,
        message: scene.sceneId ? `Duplicate audio scene timing "${scene.sceneId}".` : 'Audio scene timing is missing sceneId.',
      });
    }
    seenSceneIds.add(scene.sceneId);
    if (scene.startFrame < previousSceneStart || scene.durationFrames <= 0) {
      issues.push({
        severity: 'error',
        code: scene.durationFrames <= 0 ? 'invalid_audio_scene_duration' : 'non_monotonic_audio_scenes',
        path: scenePath,
        message: scene.durationFrames <= 0 ? 'Audio scene duration must be positive.' : 'Audio scene timings must be ordered by startFrame.',
      });
    }
    if (scene.sourceDurationFrames !== undefined && scene.sourceDurationFrames <= 0) {
      issues.push({
        severity: 'error',
        code: 'invalid_audio_scene_source_duration',
        path: `${scenePath}.sourceDurationFrames`,
        message: 'Audio scene source duration must be positive.',
      });
    }
    for (let pointIndex = 1; pointIndex < (scene.timeMap?.length ?? 0); pointIndex++) {
      const previous = scene.timeMap![pointIndex - 1];
      const current = scene.timeMap![pointIndex];
      if (current.outputFrame <= previous.outputFrame || current.sourceFrame < previous.sourceFrame) {
        issues.push({
          severity: 'error',
          code: 'non_monotonic_scene_time_map',
          path: `${scenePath}.timeMap[${pointIndex}]`,
          message: 'Scene time-map anchors must increase in output time without reversing source time.',
        });
      }
    }
    previousSceneStart = scene.startFrame;
  }

  const seenBeatIds = new Set<string>();
  const previousBeatByScene = new Map<string, { sourceFrame: number; outputFrame?: number }>();
  for (const [index, beat] of (manifest.explanationBeats ?? []).entries()) {
    const beatPath = `explanationBeats[${index}]`;
    if (!beat.id || seenBeatIds.has(beat.id)) {
      issues.push({
        severity: 'error',
        code: beat.id ? 'duplicate_explanation_beat_id' : 'missing_explanation_beat_id',
        path: `${beatPath}.id`,
        message: beat.id ? `Duplicate explanation beat id "${beat.id}".` : 'Explanation beat is missing id.',
      });
    }
    seenBeatIds.add(beat.id);
    const cue = narrationById.get(beat.cueId);
    if (!cue) {
      issues.push({
        severity: 'error', code: 'unknown_explanation_beat_cue', path: `${beatPath}.cueId`,
        message: `Explanation beat "${beat.id}" references unknown cue "${beat.cueId}".`,
      });
    }
    if (!seenSceneIds.has(beat.sceneId)) {
      issues.push({
        severity: 'error', code: 'unknown_explanation_beat_scene', path: `${beatPath}.sceneId`,
        message: `Explanation beat "${beat.id}" references unknown scene "${beat.sceneId}".`,
      });
    }
    if (!beat.anchor?.text?.trim()) {
      issues.push({
        severity: 'error', code: 'missing_explanation_beat_anchor', path: `${beatPath}.anchor`,
        message: `Explanation beat "${beat.id}" is missing its narration anchor.`,
      });
    }
    if (!Number.isFinite(beat.sourceFrame) || beat.sourceFrame < 0) {
      issues.push({
        severity: 'error', code: 'invalid_explanation_beat_source_frame', path: `${beatPath}.sourceFrame`,
        message: `Explanation beat "${beat.id}" has an invalid source frame.`,
      });
    }
    if (beat.outputFrame !== undefined && (!Number.isFinite(beat.outputFrame) || beat.outputFrame < 0)) {
      issues.push({
        severity: 'error', code: 'invalid_explanation_beat_output_frame', path: `${beatPath}.outputFrame`,
        message: `Explanation beat "${beat.id}" has an invalid resolved speech frame.`,
      });
    } else if (beat.resolutionError || (beat.outputFrame === undefined && (cue?.chunks?.length ?? 0) > 0)) {
      issues.push({
        severity: 'error', code: 'unresolved_explanation_beat_anchor', path: `${beatPath}.anchor`,
        message: `Explanation beat "${beat.id}" could not be resolved against synthesized narration${beat.resolutionError ? ` (${beat.resolutionError})` : ''}.`,
        repair: 'Correct the anchor text or occurrence and synthesize narration again.',
      });
    }
    if (beat.confidence !== undefined && beat.confidence < 0.7) {
      issues.push({
        severity: 'warning', code: 'low_confidence_explanation_beat', path: beatPath,
        message: `Explanation beat "${beat.id}" resolved with confidence ${beat.confidence.toFixed(2)}.`,
        repair: 'Use a more specific phrase anchor or a TTS provider with finer timing chunks.',
      });
    }
    const previous = previousBeatByScene.get(beat.sceneId);
    if (previous && (
      beat.sourceFrame < previous.sourceFrame ||
      (beat.outputFrame !== undefined && previous.outputFrame !== undefined && beat.outputFrame < previous.outputFrame)
    )) {
      issues.push({
        severity: 'error', code: 'non_monotonic_explanation_beats', path: beatPath,
        message: `Explanation beats in scene "${beat.sceneId}" must not reverse source or speech time.`,
      });
    }
    previousBeatByScene.set(beat.sceneId, {
      sourceFrame: beat.sourceFrame,
      outputFrame: beat.outputFrame,
    });
  }

  for (const [index, track] of (manifest.tracks ?? []).entries()) {
    const trackPath = `tracks[${index}]`;
    if (!track.id) {
      issues.push({ severity: 'error', code: 'missing_audio_track_id', path: `${trackPath}.id`, message: 'Audio track is missing "id".' });
    } else if (seenTrackIds.has(track.id)) {
      issues.push({
        severity: 'error',
        code: 'duplicate_audio_track_id',
        path: `${trackPath}.id`,
        message: `Duplicate audio track id "${track.id}".`,
      });
    } else {
      seenTrackIds.add(track.id);
    }

    if (!track.src) {
      issues.push({
        severity: 'error',
        code: 'missing_audio_track_source',
        path: `${trackPath}.src`,
        message: `Audio track "${track.id}" is missing "src".`,
      });
      continue;
    }

    if (options.baseDir) {
      const resolvedTrack = resolveMaybeRelativePath(track.src, options.baseDir);
      if (!fs.existsSync(resolvedTrack)) {
        issues.push({
          severity: 'error',
          code: 'missing_audio_track_file',
          path: `${trackPath}.src`,
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
