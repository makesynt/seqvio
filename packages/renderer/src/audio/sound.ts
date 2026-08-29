import * as fs from "node:fs";
import * as path from "node:path";
import {
  framesToMs,
  defaultSoundForVisualAction,
  intensityToVolume,
  isSoundCueName,
  mapSceneSourceFrameToOutput,
  resolveNarrationCueTimes,
  type AudioTrackSpec,
  type CompositionAudioManifest,
  type ExplanationBeatTiming,
  type ResolvedSoundCue,
  type SoundAsset,
  type SoundAssetRegistry,
  type SoundCueSpec,
} from "@seqvio/core";

export interface SoundPlanEntry {
  id: string;
  sceneId: string;
  beatId: string;
  targetId?: string;
  visualAction?: string;
  cue: SoundCueSpec["cue"];
  trigger: NonNullable<SoundCueSpec["trigger"]>;
  intensity: number;
  startMs: number;
  source: "authored" | "suggested";
}

export interface SoundRegistryIssue {
  severity: "error" | "warning";
  code: string;
  path: string;
  message: string;
}

export interface LoadedSoundRegistry {
  registry: SoundAssetRegistry;
  path: string;
  baseDir: string;
}

export function loadLocalSoundAssetRegistry(
  filePath: string,
): LoadedSoundRegistry {
  const resolvedPath = path.resolve(filePath);
  const parsed = JSON.parse(
    fs.readFileSync(resolvedPath, "utf8"),
  ) as SoundAssetRegistry;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Sound registry must contain an object: ${resolvedPath}`);
  }
  return {
    registry: parsed,
    path: resolvedPath,
    baseDir: path.dirname(resolvedPath),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateLocalSoundAssetRegistry(
  registry: SoundAssetRegistry,
  baseDir: string,
): SoundRegistryIssue[] {
  const issues: SoundRegistryIssue[] = [];
  const seenAssetIds = new Set<string>();

  for (const [cueName, rawAssets] of Object.entries(registry)) {
    const cuePath = `registry.${cueName}`;
    if (!isSoundCueName(cueName)) {
      issues.push({
        severity: "error",
        code: "unsupported_sound_cue",
        path: cuePath,
        message: `Unsupported SoundCue "${cueName}".`,
      });
      continue;
    }
    if (!Array.isArray(rawAssets) || rawAssets.length === 0) {
      issues.push({
        severity: "error",
        code: "empty_sound_assets",
        path: cuePath,
        message: `SoundCue "${cueName}" has no local assets.`,
      });
      continue;
    }
    rawAssets.forEach((rawAsset, index) => {
      const assetPath = `${cuePath}[${index}]`;
      if (!isObject(rawAsset)) {
        issues.push({
          severity: "error",
          code: "invalid_sound_asset",
          path: assetPath,
          message: "Sound asset must be an object.",
        });
        return;
      }
      const asset = rawAsset as Partial<SoundAsset>;
      if (!asset.id || typeof asset.id !== "string") {
        issues.push({
          severity: "error",
          code: "missing_sound_asset_id",
          path: `${assetPath}.id`,
          message: "Sound asset is missing id.",
        });
      } else if (seenAssetIds.has(`${cueName}:${asset.id}`)) {
        issues.push({
          severity: "error",
          code: "duplicate_sound_asset_id",
          path: `${assetPath}.id`,
          message: `Duplicate sound asset id "${asset.id}" for "${cueName}".`,
        });
      } else {
        seenAssetIds.add(`${cueName}:${asset.id}`);
      }
      if (!asset.file || typeof asset.file !== "string") {
        issues.push({
          severity: "error",
          code: "missing_sound_asset_file",
          path: `${assetPath}.file`,
          message: "Sound asset is missing file.",
        });
      } else if (!fs.existsSync(path.resolve(baseDir, asset.file))) {
        issues.push({
          severity: "error",
          code: "missing_sound_asset_file",
          path: `${assetPath}.file`,
          message: `Sound asset file does not exist: ${path.resolve(baseDir, asset.file)}`,
        });
      }
      if (
        typeof asset.durationMs !== "number" ||
        !Number.isFinite(asset.durationMs) ||
        asset.durationMs <= 0
      ) {
        issues.push({
          severity: "error",
          code: "invalid_sound_asset_duration",
          path: `${assetPath}.durationMs`,
          message: "Sound asset durationMs must be greater than zero.",
        });
      }
      if (asset.source !== undefined && asset.source !== "local") {
        issues.push({
          severity: "error",
          code: "unsupported_sound_asset_source",
          path: `${assetPath}.source`,
          message: "Only the local sound asset source is supported.",
        });
      }
      if (
        asset.maxIntensity !== undefined &&
        (!Number.isFinite(asset.maxIntensity) ||
          asset.maxIntensity < 0 ||
          asset.maxIntensity > 1)
      ) {
        issues.push({
          severity: "error",
          code: "invalid_sound_asset_intensity",
          path: `${assetPath}.maxIntensity`,
          message: "Sound asset maxIntensity must be between 0 and 1.",
        });
      }
    });
  }

  return issues;
}

export function validateSoundCueCoverage(
  manifest: CompositionAudioManifest,
  registry: SoundAssetRegistry,
): SoundRegistryIssue[] {
  const issues: SoundRegistryIssue[] = [];
  for (const [beatIndex, beat] of (manifest.explanationBeats ?? []).entries()) {
    for (const [soundIndex, sound] of (beat.sounds ?? []).entries()) {
      const soundPath = `explanationBeats[${beatIndex}].sounds[${soundIndex}]`;
      const assets = registry[sound.cue] ?? [];
      if (assets.length === 0) {
        issues.push({
          severity: "error",
          code: "unregistered_sound_cue",
          path: `${soundPath}.cue`,
          message: `SoundCue "${sound.cue}" has no asset in the local registry.`,
        });
      } else if (
        sound.variant &&
        !assets.some((asset) => asset.id === sound.variant)
      ) {
        issues.push({
          severity: "error",
          code: "unregistered_sound_variant",
          path: `${soundPath}.variant`,
          message: `Sound variant "${sound.variant}" is not registered for "${sound.cue}".`,
        });
      }
    }
  }
  return issues;
}

function resolveBeatFrame(
  beat: ExplanationBeatTiming,
  scene:
    | NonNullable<CompositionAudioManifest["sceneTimings"]>[number]
    | undefined,
): number {
  if (
    typeof beat.outputFrame === "number" &&
    Number.isFinite(beat.outputFrame)
  ) {
    return Math.max(0, beat.outputFrame);
  }
  if (!scene) return Math.max(0, beat.sourceFrame);
  return mapSceneSourceFrameToOutput(
    beat.sourceFrame,
    scene.sourceDurationFrames ?? scene.durationFrames,
    scene.durationFrames,
    scene.timeMap,
  );
}

function resolveTriggerFrame(
  beat: ExplanationBeatTiming,
  sound: SoundCueSpec,
  scene:
    | NonNullable<CompositionAudioManifest["sceneTimings"]>[number]
    | undefined,
  fps: number,
): number {
  const frame = resolveBeatFrame(beat, scene);
  if (sound.trigger !== "end" && sound.trigger !== "exit") return frame;
  const holdMs = Math.max(
    0,
    ...beat.visuals.map((visual) => visual.minHoldMs ?? 0),
  );
  return frame + Math.round((holdMs / 1000) * fps);
}

function relativeAssetPath(file: string, outputDir: string): string {
  return path.relative(outputDir, file).split(path.sep).join("/");
}

function isExternalMediaSource(src: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(src);
}

function rebaseExistingTrackSource(
  src: string,
  sourceDir: string,
  outputDir: string,
): string {
  if (path.isAbsolute(src) || isExternalMediaSource(src)) return src;
  return relativeAssetPath(path.resolve(sourceDir, src), outputDir);
}

function soundPlanEntriesForBeat(
  beat: ExplanationBeatTiming,
  scene:
    | NonNullable<CompositionAudioManifest["sceneTimings"]>[number]
    | undefined,
  fps: number,
  includeDefaults: boolean,
): SoundPlanEntry[] {
  const authored = beat.sounds ?? [];
  const specs: Array<{
    sound: SoundCueSpec;
    source: SoundPlanEntry["source"];
    visualIndex: number;
  }> =
    authored.length > 0
      ? authored.map((sound, index) => ({
          sound,
          source: "authored",
          visualIndex: index,
        }))
      : includeDefaults
        ? beat.visuals.flatMap((visual, index) => {
            const cue = defaultSoundForVisualAction(visual.action);
            return cue
              ? [
                  {
                    sound: { cue, offsetMs: visual.offsetMs },
                    source: "suggested" as const,
                    visualIndex: index,
                  },
                ]
              : [];
          })
        : [];

  return specs.map(({ sound, source, visualIndex }, index) => {
    const visual = beat.visuals[visualIndex] ?? beat.visuals[0];
    const localFrame = resolveTriggerFrame(beat, sound, scene, fps);
    const absoluteFrame = (scene?.startFrame ?? 0) + localFrame;
    return {
      id: `${source === "authored" ? "sfx" : "suggestion"}.${beat.id}.${index + 1}`,
      sceneId: beat.sceneId,
      beatId: beat.id,
      targetId: visual?.targetId,
      visualAction: visual?.action,
      cue: sound.cue,
      trigger: sound.trigger ?? "start",
      intensity: sound.intensity ?? 0.35,
      startMs: Math.max(
        0,
        framesToMs(absoluteFrame, fps) + (sound.offsetMs ?? 0),
      ),
      source,
    };
  });
}

export function planSoundDesign(
  manifest: CompositionAudioManifest,
  options: { includeDefaults?: boolean } = {},
): SoundPlanEntry[] {
  const fps = Math.max(1, manifest.fps ?? 30);
  const scenes = manifest.sceneTimings ?? [];
  return (manifest.explanationBeats ?? [])
    .flatMap((beat) =>
      soundPlanEntriesForBeat(
        beat,
        scenes.find((scene) => scene.sceneId === beat.sceneId),
        fps,
        options.includeDefaults ?? true,
      ),
    )
    .sort((a, b) => a.startMs - b.startMs || a.id.localeCompare(b.id));
}

function escapeMarkdownCell(value: string | undefined): string {
  return (value ?? "-").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export function formatSoundDesignMarkdown(entries: SoundPlanEntry[]): string {
  const lines = [
    "# Sound design plan",
    "",
    "Local-only cue plan. Suggested rows are review candidates and are not added to the manifest automatically.",
    "",
    "| Time | Scene | Beat | Visual action | Target | Sound cue | Trigger | Intensity | Source |",
    "| ---: | --- | --- | --- | --- | --- | --- | ---: | --- |",
  ];
  for (const entry of entries) {
    lines.push(
      `| ${(entry.startMs / 1000).toFixed(2)}s | ${escapeMarkdownCell(entry.sceneId)} | ${escapeMarkdownCell(entry.beatId)} | ${escapeMarkdownCell(entry.visualAction)} | ${escapeMarkdownCell(entry.targetId)} | ${entry.cue} | ${entry.trigger} | ${entry.intensity.toFixed(2)} | ${entry.source} |`,
    );
  }
  if (entries.length === 0)
    lines.push("| - | - | - | - | - | - | - | - | No soundable beats found |");
  return `${lines.join("\n")}\n`;
}

export function diagnoseResolvedSoundTracks(
  manifest: CompositionAudioManifest,
): SoundRegistryIssue[] {
  const issues: SoundRegistryIssue[] = [];
  const fps = Math.max(1, manifest.fps ?? 30);
  const durationMs =
    manifest.duration === undefined
      ? undefined
      : framesToMs(manifest.duration, fps);
  const beats = new Set(
    (manifest.explanationBeats ?? []).map((beat) => beat.id),
  );
  const narration = (manifest.narration ?? []).map((cue) =>
    resolveNarrationCueTimes(cue, fps),
  );
  const sounds = (manifest.tracks ?? [])
    .map((track, index) => ({ track, index, startMs: track.offsetMs ?? 0 }))
    .filter(({ track }) => track.kind === "sfx")
    .sort((a, b) => a.startMs - b.startMs);

  for (const { track, index, startMs } of sounds) {
    const trackPath = `tracks[${index}]`;
    const endMs = startMs + Math.max(0, track.durationMs ?? 0);
    if (startMs < 0) {
      issues.push({
        severity: "error",
        code: "sound_time_before_zero",
        path: `${trackPath}.offsetMs`,
        message: `SFX track "${track.id}" starts before zero.`,
      });
    }
    if (durationMs !== undefined && endMs > durationMs + 100) {
      issues.push({
        severity: "warning",
        code: "sound_tail_out_of_range",
        path: trackPath,
        message: `SFX track "${track.id}" extends beyond the composition.`,
      });
    }
    if (track.beatId && !beats.has(track.beatId)) {
      issues.push({
        severity: "error",
        code: "unknown_sound_beat",
        path: `${trackPath}.beatId`,
        message: `SFX track "${track.id}" references unknown beat "${track.beatId}".`,
      });
    }
    const isProminent =
      /^(impact\.|riser\.|tonal\.hit)/.test(track.sourceCue ?? "") &&
      (track.volume ?? 1) >= 0.3;
    const overlapsNarration = narration.some(
      (cue) => startMs < cue.endMs && endMs > cue.startMs,
    );
    if (
      isProminent &&
      overlapsNarration &&
      track.duckUnderNarration === false
    ) {
      issues.push({
        severity: "warning",
        code: "sound_narration_overlap",
        path: trackPath,
        message: `Prominent SFX track "${track.id}" overlaps narration without ducking.`,
      });
    }
  }

  for (let index = 0; index < sounds.length; index += 1) {
    const window = sounds.filter(
      (sound) =>
        sound.startMs >= sounds[index].startMs &&
        sound.startMs < sounds[index].startMs + 1000,
    );
    if (window.length > 6) {
      issues.push({
        severity: "warning",
        code: "sound_density_high",
        path: `tracks[${sounds[index].index}]`,
        message: `${window.length} SFX cues occur within one second; reduce or stagger them.`,
      });
      break;
    }
  }

  const occurrences = new Map<string, number[]>();
  for (const sound of sounds) {
    const key = sound.track.assetId ?? sound.track.src;
    occurrences.set(key, [...(occurrences.get(key) ?? []), sound.startMs]);
  }
  for (const [asset, times] of occurrences) {
    for (let index = 0; index < times.length; index += 1) {
      const repeats = times.filter(
        (time) => time >= times[index] && time <= times[index] + 4000,
      ).length;
      if (repeats > 3) {
        issues.push({
          severity: "warning",
          code: "repeated_sound_asset",
          path: "tracks",
          message: `Sound asset "${asset}" is used ${repeats} times within four seconds.`,
        });
        break;
      }
    }
  }
  return issues;
}

export function resolveLocalSoundCues(
  manifest: CompositionAudioManifest,
  registryPath: string,
  options: {
    outputManifestPath?: string;
    sourceManifestBaseDir?: string;
    replaceResolvedSfx?: boolean;
  } = {},
): {
  tracks: AudioTrackSpec[];
  cues: ResolvedSoundCue[];
  registry: LoadedSoundRegistry;
} {
  const registry = loadLocalSoundAssetRegistry(registryPath);
  const registryIssues = validateLocalSoundAssetRegistry(
    registry.registry,
    registry.baseDir,
  );
  const errors = registryIssues.filter((issue) => issue.severity === "error");
  if (errors.length > 0) {
    throw new Error(
      errors.map((issue) => `${issue.path}: ${issue.message}`).join("\n"),
    );
  }

  const fps = Math.max(1, manifest.fps ?? 30);
  const sceneTimings = manifest.sceneTimings ?? [];
  const resolved: ResolvedSoundCue[] = [];
  for (const beat of manifest.explanationBeats ?? []) {
    for (const [soundIndex, sound] of (beat.sounds ?? []).entries()) {
      const scene = sceneTimings.find((item) => item.sceneId === beat.sceneId);
      const localFrame = resolveTriggerFrame(beat, sound, scene, fps);
      const absoluteFrame = (scene?.startFrame ?? 0) + localFrame;
      const startMs = framesToMs(absoluteFrame, fps);
      const assets = registry.registry[sound.cue] ?? [];
      const asset = sound.variant
        ? assets.find((item) => item.id === sound.variant)
        : assets[0];
      if (!asset) {
        throw new Error(`No local sound asset registered for "${sound.cue}".`);
      }
      const file = path.resolve(registry.baseDir, asset.file);
      const repeat = Math.max(1, Math.floor(sound.repeat ?? 1));
      const staggerMs = Math.max(0, sound.staggerMs ?? 0);
      const volume = intensityToVolume(
        Math.min(sound.intensity ?? 0.35, asset.maxIntensity ?? 1),
      );
      for (let repeatIndex = 0; repeatIndex < repeat; repeatIndex += 1) {
        resolved.push({
          ...sound,
          id: `sfx.${beat.id}.${soundIndex + 1}${repeat > 1 ? `.${repeatIndex + 1}` : ""}`,
          assetId: asset.id,
          file,
          startMs: Math.max(
            0,
            startMs + (sound.offsetMs ?? 0) + repeatIndex * staggerMs,
          ),
          durationMs: asset.durationMs,
          volume,
        });
      }
    }
  }

  const outputDir = path.dirname(
    path.resolve(options.outputManifestPath ?? registry.path),
  );
  const tracks: AudioTrackSpec[] = resolved.map((cue) => {
    const beat = (manifest.explanationBeats ?? []).find((item) =>
      cue.id.startsWith(`sfx.${item.id}.`),
    );
    return {
      id: cue.id,
      src: relativeAssetPath(cue.file, outputDir),
      kind: "sfx",
      volume: cue.volume,
      offsetMs: cue.startMs,
      durationMs: cue.durationMs,
      sourceCue: cue.cue,
      assetId: cue.assetId,
      beatId: beat?.id,
      visualTargetId: beat?.visuals[0]?.targetId,
      duckUnderNarration: cue.duckUnderNarration ?? true,
    };
  });
  const existing =
    options.replaceResolvedSfx === false
      ? (manifest.tracks ?? [])
      : (manifest.tracks ?? []).filter((track) => !track.sourceCue);
  const sourceDir = path.resolve(options.sourceManifestBaseDir ?? outputDir);
  const rebasedExisting = existing.map((track) => ({
    ...track,
    src: rebaseExistingTrackSource(track.src, sourceDir, outputDir),
  }));
  return { tracks: [...rebasedExisting, ...tracks], cues: resolved, registry };
}
