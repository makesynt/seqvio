import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRecordingDurationMs, resolveExitCode } from '../dist/record.js';

test('resolveRecordingDurationMs covers silent input without preserving wait-only tail time', () => {
  assert.equal(
    resolveRecordingDurationMs({
      nowMs: 5000,
      lastEventTimeMs: 0,
      steps: [{ timeMs: 3200 }],
      events: [{ timeMs: 3200 }],
      trailingHoldMs: 900,
    }),
    4100
  );
});

test('resolveExitCode maps signal terminations to 128+signal', () => {
  assert.equal(resolveExitCode({ exitCode: 0, signal: 0 }), 0);
  assert.equal(resolveExitCode({ exitCode: 0, signal: 2 }), 130);
  assert.equal(resolveExitCode({ exitCode: 0, signal: 9 }), 137);
  assert.equal(resolveExitCode({ exitCode: 1 }), 1);
  assert.equal(resolveExitCode({ exitCode: 0, signal: undefined }), 0);
});
