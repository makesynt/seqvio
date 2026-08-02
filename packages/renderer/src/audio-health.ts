import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import { promisify } from 'node:util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import type { QaDiagnostic } from './qa-diagnostics';

const execFileAsync = promisify(execFile);

export interface AudioHealthMetrics {
  durationMs: number;
  meanVolumeDb?: number;
  maxVolumeDb?: number;
  silenceRanges: Array<{ startMs: number; endMs: number }>;
}

export function diagnoseAudioDurationMismatch(
  actualDurationMs: number,
  expectedDurationMs: number,
  pathName = 'audio',
  toleranceMs = 150,
): QaDiagnostic[] {
  const deltaMs = actualDurationMs - expectedDurationMs;
  if (!Number.isFinite(deltaMs) || Math.abs(deltaMs) <= toleranceMs) return [];
  return [{
    severity: 'error',
    code: 'audio_duration_mismatch',
    path: pathName,
    message: `Audio is ${Math.round(Math.abs(deltaMs))}ms ${deltaMs < 0 ? 'shorter' : 'longer'} than the narration cue window.`,
    repair: 'Regenerate or trim the narration so its duration matches the resolved cue timing.',
  }];
}

function parseClock(value: string): number {
  const parts = value.split(':').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return 0;
  return ((parts[0] * 60 + parts[1]) * 60 + parts[2]) * 1000;
}

export function parseAudioHealthOutput(stderr: string): AudioHealthMetrics {
  const durationMatch = stderr.match(/Duration:\s*(\d{2}:\d{2}:\d{2}(?:\.\d+)?)/);
  const meanMatch = stderr.match(/mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  const maxMatch = stderr.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/i);
  const events = [...stderr.matchAll(/silence_(start|end):\s*(-?\d+(?:\.\d+)?)/g)]
    .map((match) => ({ kind: match[1], timeMs: Number(match[2]) * 1000 }));
  const silenceRanges: AudioHealthMetrics['silenceRanges'] = [];
  let startMs: number | undefined;
  for (const event of events) {
    if (event.kind === 'start') {
      startMs = Math.max(0, event.timeMs);
    } else if (startMs !== undefined) {
      silenceRanges.push({ startMs, endMs: Math.max(startMs, event.timeMs) });
      startMs = undefined;
    }
  }
  const durationMs = durationMatch ? parseClock(durationMatch[1]) : 0;
  if (startMs !== undefined && durationMs > startMs) {
    silenceRanges.push({ startMs, endMs: durationMs });
  }
  const normalizedNumber = (value: string | undefined): number | undefined => {
    if (value === undefined) return undefined;
    const parsed = Number(value);
    return Object.is(parsed, -0) ? 0 : parsed;
  };
  return {
    durationMs,
    meanVolumeDb: normalizedNumber(meanMatch?.[1]),
    maxVolumeDb: normalizedNumber(maxMatch?.[1]),
    silenceRanges,
  };
}

export function diagnoseAudioHealth(
  metrics: AudioHealthMetrics,
  pathName = 'audio',
): QaDiagnostic[] {
  const diagnostics: QaDiagnostic[] = [];
  if (metrics.durationMs <= 0) {
    diagnostics.push({
      severity: 'error',
      code: 'invalid_audio_duration',
      path: pathName,
      message: 'Audio duration could not be determined or is zero.',
    });
    return diagnostics;
  }
  const totalSilence = metrics.silenceRanges.reduce(
    (sum, range) => sum + Math.max(0, range.endMs - range.startMs),
    0,
  );
  if (totalSilence / metrics.durationMs >= 0.95) {
    diagnostics.push({
      severity: 'error',
      code: 'audio_mostly_silent',
      path: pathName,
      message: 'Audio is silent for at least 95% of its duration.',
      repair: 'Regenerate the narration track or verify the selected input channel.',
    });
  }
  const leading = metrics.silenceRanges.find((range) => range.startMs <= 50);
  if (leading && leading.endMs - leading.startMs > 1000) {
    diagnostics.push({
      severity: 'warning',
      code: 'excessive_leading_silence',
      path: pathName,
      message: `Audio has ${Math.round(leading.endMs - leading.startMs)}ms of leading silence.`,
      repair: 'Trim leading silence or move the cue start to match the spoken audio.',
    });
  }
  const trailing = metrics.silenceRanges.find(
    (range) => metrics.durationMs - range.endMs <= 50,
  );
  if (trailing && trailing.endMs - trailing.startMs > 1200) {
    diagnostics.push({
      severity: 'warning',
      code: 'excessive_trailing_silence',
      path: pathName,
      message: `Audio has ${Math.round(trailing.endMs - trailing.startMs)}ms of trailing silence.`,
      repair: 'Trim trailing silence or shorten the resolved cue duration.',
    });
  }
  if (metrics.maxVolumeDb !== undefined && metrics.maxVolumeDb >= -0.1) {
    diagnostics.push({
      severity: 'warning',
      code: 'audio_clipping_risk',
      path: pathName,
      message: `Audio peak is ${metrics.maxVolumeDb.toFixed(1)}dB, close to digital clipping.`,
      repair: 'Normalize or limit the track below -0.1dBFS.',
    });
  }
  return diagnostics;
}

export async function inspectAudioFile(
  filePath: string,
  pathName = 'audio',
  expectedDurationMs?: number,
): Promise<QaDiagnostic[]> {
  if (!fs.existsSync(filePath)) {
    return [{
      severity: 'error',
      code: 'missing_audio_track_file',
      path: pathName,
      message: `Audio file does not exist: ${filePath}`,
    }];
  }
  try {
    const { stderr } = await execFileAsync(
      ffmpegInstaller.path,
      [
        '-hide_banner',
        '-i',
        filePath,
        '-af',
        'silencedetect=noise=-50dB:d=0.5,volumedetect',
        '-f',
        'null',
        '-',
      ],
      { windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
    );
    const metrics = parseAudioHealthOutput(stderr);
    return [
      ...diagnoseAudioHealth(metrics, pathName),
      ...(expectedDurationMs === undefined ? [] : diagnoseAudioDurationMismatch(metrics.durationMs, expectedDurationMs, pathName)),
    ];
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr;
    if (stderr && /Duration:/.test(stderr)) {
      const metrics = parseAudioHealthOutput(stderr);
      return [
        ...diagnoseAudioHealth(metrics, pathName),
        ...(expectedDurationMs === undefined ? [] : diagnoseAudioDurationMismatch(metrics.durationMs, expectedDurationMs, pathName)),
      ];
    }
    return [{
      severity: 'error',
      code: 'audio_probe_failed',
      path: pathName,
      message: `Unable to inspect audio file: ${filePath}`,
      repair: 'Verify that the track is a readable audio file.',
    }];
  }
}
