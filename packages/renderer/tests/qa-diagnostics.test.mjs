import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyQaRuntimeError, diagnosePacing, expectedNarrationTrackDurationMs, promoteQaWarnings } from '../dist/qa-diagnostics.js';
import { reflowSynthesizedTimeline, resolveSynthesizedCueTiming, validateAudioManifest } from '../dist/audio/manifest.js';

test('audio validation emits stable codes for invalid narration and captions', () => {
  const issues = validateAudioManifest({
    fps: 30,
    narration: [
      { id: 'voice', text: 'Hello', startMs: 1000, endMs: 500 },
    ],
    captions: [
      { id: 'caption', text: '', startMs: 100, endMs: 100 },
    ],
  });
  const codes = issues.map((issue) => issue.code);
  assert.ok(codes.includes('invalid_narration_range'));
  assert.ok(codes.includes('empty_caption_text'));
  assert.ok(codes.includes('invalid_caption_range'));
});

test('audio validation rejects invalid resolved scene timing', () => {
  const issues = validateAudioManifest({ sceneTimings: [
    { sceneId: 'scene', startFrame: 20, durationFrames: 0 },
    { sceneId: 'scene', startFrame: 10, durationFrames: 30 },
  ] });
  const codes = issues.map((issue) => issue.code);
  assert.ok(codes.includes('invalid_audio_scene_duration'));
  assert.ok(codes.includes('duplicate_audio_scene_timing'));
  assert.ok(codes.includes('non_monotonic_audio_scenes'));
});

test('audio validation rejects non-monotonic scene time maps', () => {
  const issues = validateAudioManifest({ sceneTimings: [{
    sceneId: 'scene', startFrame: 0, durationFrames: 60, sourceDurationFrames: 30,
    timeMap: [
      { outputFrame: 0, sourceFrame: 0 },
      { outputFrame: 20, sourceFrame: 15 },
      { outputFrame: 10, sourceFrame: 20 },
    ],
  }] });
  assert.ok(issues.some((issue) => issue.code === 'non_monotonic_scene_time_map'));
});

test('audio validation rejects unknown pacing profiles', () => {
  assert.ok(validateAudioManifest({ pacingProfile: 'future-v9' })
    .some((issue) => issue.code === 'unsupported_pacing_profile'));
});

test('synthesized narration replaces estimated end with probed audio duration', () => {
  assert.deepEqual(resolveSynthesizedCueTiming({
    id: 'voice', text: 'Hello', startMs: 1000, endMs: 9000,
  }, 30, 2200, 0), { startMs: 1000, endMs: 3200 });
});

test('synthesized narration reflows later scenes without shrinking visual timing', () => {
  const result = reflowSynthesizedTimeline({
    fps: 30,
    sceneTimings: [
      {
        sceneId: 'one', startFrame: 0, durationFrames: 60, transitionAfterFrames: 12,
        highlights: [
          { id: 'first', source: 'step', startFrame: 0, endFrame: 30, minDurationFrames: 27 },
          { id: 'second', source: 'step', startFrame: 30, endFrame: 60, minDurationFrames: 27 },
        ],
      },
      { sceneId: 'two', startFrame: 72, durationFrames: 60, transitionAfterFrames: 0 },
    ],
  }, [
    {
      id: 'one', sceneId: 'one', text: 'Long', startMs: 0, endMs: 3000,
      chunks: [
        { text: 'Long', offsetFrame: 0, durationFrame: 60 },
        { text: 'continued', offsetFrame: 75, durationFrame: 15 },
      ],
    },
    { id: 'two', sceneId: 'two', text: 'Short', startMs: 2400, endMs: 3400 },
  ], 30);
  assert.equal(result.sceneTimings[0].durationFrames, 108);
  assert.equal(result.sceneTimings[1].startFrame, 120);
  assert.deepEqual(result.narration.map((cue) => [cue.startMs, cue.endMs]), [[0, 3000], [4000, 5000]]);
  assert.equal(result.durationFrames, 180);
  assert.deepEqual(result.sceneTimings[0].timeMap, [
    { outputFrame: 0, sourceFrame: 0 },
    { outputFrame: 75, sourceFrame: 30 },
    { outputFrame: 108, sourceFrame: 60 },
  ]);
});

test('runtime media failures map to stable QA codes', () => {
  assert.equal(
    classifyQaRuntimeError('Unable to load seekable video metadata: bad.mp4'),
    'media_metadata_load_failed',
  );
  assert.equal(
    classifyQaRuntimeError('Timed out seeking video to 1.000s'),
    'media_seek_failed',
  );
  assert.equal(classifyQaRuntimeError('Unexpected browser failure'), 'qa_runtime_failed');
});

test('warning promotion is selective and preserves other diagnostics', () => {
  const issues = promoteQaWarnings([
    { severity: 'warning', code: 'text_overflow', message: 'overflow' },
    { severity: 'warning', code: 'low_contrast', message: 'contrast' },
  ], new Set(['text_overflow']));
  assert.equal(issues[0].severity, 'error');
  assert.equal(issues[1].severity, 'warning');
});

test('pacing diagnostics report fast speech and short highlights', () => {
  const issues = diagnosePacing({
    audio: {
      narration: [{ id: 'fast', text: 'one two three four five six seven eight', startMs: 0, endMs: 1000 }],
      sceneTimings: [{ sceneId: 'scene', startFrame: 0, durationFrames: 100, sourceDurationFrames: 30 }],
    },
    pacing: {
      highlights: [{ id: 'focus', source: 'step', startFrame: 0, endFrame: 2, minDurationFrames: 27 }],
    },
  }, 30);
  const codes = issues.map((issue) => issue.code);
  assert.ok(codes.includes('speech_rate_too_fast'));
  assert.ok(codes.includes('highlight_too_short'));
  assert.ok(codes.includes('scene_time_stretch_excessive'));
});

test('each narration track uses its matching cue duration', () => {
  const meta = { audio: {
    narration: [
      { id: 'one', text: 'One', startMs: 0, endMs: 1000 },
      { id: 'two', text: 'Two', startMs: 2000, endMs: 3500 },
    ],
    tracks: [
      { id: 'one', kind: 'narration', src: 'one.mp3' },
      { id: 'two', kind: 'narration', src: 'two.mp3' },
    ],
  } };
  assert.equal(expectedNarrationTrackDurationMs(meta, 'one', 30), 1000);
  assert.equal(expectedNarrationTrackDurationMs(meta, 'two', 30), 1500);
});
