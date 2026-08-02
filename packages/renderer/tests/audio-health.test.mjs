import assert from 'node:assert/strict';
import test from 'node:test';

import {
  diagnoseAudioHealth,
  diagnoseAudioDurationMismatch,
  parseAudioHealthOutput,
} from '../dist/audio-health.js';

test('audio duration mismatch respects tolerance', () => {
  assert.deepEqual(diagnoseAudioDurationMismatch(5000, 4900), []);
  assert.equal(diagnoseAudioDurationMismatch(5000, 4500)[0].code, 'audio_duration_mismatch');
});

test('audio health parser extracts duration, volume, and silence ranges', () => {
  const metrics = parseAudioHealthOutput(`
Duration: 00:00:05.00, start: 0.000000, bitrate: 256 kb/s
[silencedetect] silence_start: 0
[silencedetect] silence_end: 1.5 | silence_duration: 1.5
[silencedetect] silence_start: 4
[silencedetect] silence_end: 5 | silence_duration: 1
[Parsed_volumedetect] mean_volume: -20.0 dB
[Parsed_volumedetect] max_volume: -0.0 dB
`);
  assert.equal(metrics.durationMs, 5000);
  assert.equal(metrics.maxVolumeDb, 0);
  assert.deepEqual(metrics.silenceRanges, [
    { startMs: 0, endMs: 1500 },
    { startMs: 4000, endMs: 5000 },
  ]);
});

test('audio health diagnostics report silence and clipping risks', () => {
  const issues = diagnoseAudioHealth({
    durationMs: 5000,
    maxVolumeDb: 0,
    silenceRanges: [{ startMs: 0, endMs: 4800 }],
  });
  const codes = issues.map((issue) => issue.code);
  assert.ok(codes.includes('audio_mostly_silent'));
  assert.ok(codes.includes('excessive_leading_silence'));
  assert.ok(codes.includes('audio_clipping_risk'));
});
