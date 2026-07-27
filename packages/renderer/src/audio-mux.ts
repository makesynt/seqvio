/**
 * FFmpeg audio muxing shared by full and chapter renders.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { loadAudioManifest, resolveMaybeRelativePath } from './audio/manifest';
import { applyVolumeEnvelopeToWav, buildVolumeExpression } from './audio/volume-envelope';
import { generateDuckingEnvelope } from './audio/ducking';
import type { VolumeKeyframe } from './audio/volume-envelope';
// @ts-ignore
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

const execFileAsync = promisify(execFile);

export interface ResolvedAudioTrack {
  id: string;
  path: string;
  kind: 'narration' | 'music' | 'sfx';
  volume: number;
  offsetMs: number;
  volumeKeyframes?: VolumeKeyframe[];
}

export interface AudioMuxOptions {
  videoPath: string;
  outputPath: string;
  durationSeconds: number;
  audioManifest?: string;
  audioTrack?: string;
  mixMusic?: string;
  componentDir: string;
  /** @internal No CLI wires autoDuck as of Phase 0. Unreachable until Phase 2
   *  audio work or explicit demand (wire-up needs narrationCues extraction from
   *  audioManifest, not just a flag). */
  autoDuck?: boolean;
  /** @internal Consumed only by autoDuck; same reachability gap. */
  narrationCues?: Array<{ startMs?: number; endMs?: number; startFrame?: number; endFrame?: number }>;
  fps?: number;
}

export function resolveAudioTracks(input: {
  audioManifest?: string;
  audioTrack?: string;
  mixMusic?: string;
  componentDir: string;
}): ResolvedAudioTrack[] {
  const resolved: ResolvedAudioTrack[] = [];
  const manifestBaseDir = input.componentDir;

  if (input.audioManifest) {
    const loaded = loadAudioManifest(input.audioManifest);
    for (const track of loaded.manifest.tracks ?? []) {
      resolved.push({
        id: track.id,
        path: resolveMaybeRelativePath(track.src, loaded.baseDir),
        kind: track.kind,
        volume: track.volume ?? 1,
        offsetMs: track.offsetMs ?? 0,
        volumeKeyframes: track.volumeKeyframes,
      });
    }
  }

  if (input.audioTrack) {
    resolved.push({
      id: 'cli-audio-track',
      path: resolveMaybeRelativePath(input.audioTrack, manifestBaseDir),
      kind: 'narration',
      volume: 1,
      offsetMs: 0,
    });
  }

  if (input.mixMusic) {
    resolved.push({
      id: 'cli-music-track',
      path: resolveMaybeRelativePath(input.mixMusic, manifestBaseDir),
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

export function hasAudioInputs(options: AudioMuxOptions): boolean {
  return Boolean(options.audioManifest || options.audioTrack || options.mixMusic);
}

export async function muxAudioIntoVideo(options: AudioMuxOptions): Promise<void> {
  const tracks = resolveAudioTracks(options);
  if (tracks.length === 0) {
    return;
  }

  const targetDurationSeconds = Math.max(0.001, options.durationSeconds);
  const filters: string[] = [];
  const narrationLabels: string[] = [];
  const musicLabels: string[] = [];
  const otherLabels: string[] = [];
  const args: string[] = ['-y', '-i', options.videoPath];

  let duckingEnvelope: VolumeKeyframe[] | undefined;
  if (options.autoDuck && options.narrationCues?.length) {
    duckingEnvelope = generateDuckingEnvelope(options.narrationCues, options.fps ?? 30);
  }

  tracks.forEach((track, index) => {
    const inputIndex = index + 1;
    args.push('-i', track.path);
    const filterParts: string[] = [
      'aresample=48000',
      'aformat=channel_layouts=stereo',
    ];
    if (track.offsetMs > 0) {
      filterParts.push(`adelay=${track.offsetMs}|${track.offsetMs}`);
    }

    const effectiveKeyframes =
      track.volumeKeyframes ??
      (track.kind === 'music' && duckingEnvelope?.length ? duckingEnvelope : undefined);

    if (effectiveKeyframes?.length) {
      filterParts.push(buildVolumeExpression(effectiveKeyframes, 0));
    } else if (track.volume !== 1) {
      filterParts.push(`volume=${track.volume}`);
    }

    const label = `a${index}`;
    filters.push(`[${inputIndex}:a]${filterParts.join(',')}[${label}]`);
    if (track.kind === 'music') {
      musicLabels.push(`[${label}]`);
    } else if (track.kind === 'narration') {
      narrationLabels.push(`[${label}]`);
    } else {
      otherLabels.push(`[${label}]`);
    }
  });

  const mixInputs: string[] = [];

  if (narrationLabels.length > 0) {
    if (narrationLabels.length === 1) {
      filters.push(`${narrationLabels[0]}anull[anarr0]`);
    } else {
      filters.push(
        `${narrationLabels.join('')}amix=inputs=${narrationLabels.length}:duration=longest:dropout_transition=0[anarr0]`
      );
    }
    if (musicLabels.length > 0) {
      filters.push('[anarr0]asplit=2[anarr][anarrkey]');
    } else {
      filters.push('[anarr0]anull[anarr]');
    }
    mixInputs.push('[anarr]');
  }

  if (musicLabels.length > 0) {
    if (musicLabels.length === 1) {
      filters.push(`${musicLabels[0]}anull[amus0]`);
    } else {
      filters.push(
        `${musicLabels.join('')}amix=inputs=${musicLabels.length}:duration=longest:dropout_transition=0[amus0]`
      );
    }
    if (narrationLabels.length > 0) {
      filters.push(
        '[amus0][anarrkey]sidechaincompress=threshold=0.02:ratio=8:attack=25:release=500:makeup=1[amus]'
      );
    } else {
      filters.push('[amus0]anull[amus]');
    }
    mixInputs.push('[amus]');
  }

  mixInputs.push(...otherLabels);
  filters.push(
    `anullsrc=r=48000:cl=stereo,atrim=0:${targetDurationSeconds.toFixed(3)}[asilence]`
  );
  mixInputs.push('[asilence]');
  filters.push(
    `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:dropout_transition=0,loudnorm=I=-14:TP=-1:LRA=11[aout]`
  );

  const tempOutput =
    options.outputPath === options.videoPath
      ? `${options.outputPath}.muxing.mp4`
      : options.outputPath;

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
    '-ar',
    '48000',
    '-ac',
    '2',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    tempOutput
  );

  await execFileAsync(ffmpegPath.path, args);

  if (tempOutput === options.outputPath) {
    return;
  }

  fs.mkdirSync(path.dirname(options.outputPath), { recursive: true });
  if (fs.existsSync(options.outputPath)) {
    fs.unlinkSync(options.outputPath);
  }
  fs.renameSync(tempOutput, options.outputPath);
}
