import assert from 'node:assert/strict';
import test from 'node:test';
import { formatRuntimeFailure } from '../dist/browser-shell.js';

test('runtime failures include the active lifecycle stage and frame', () => {
  const error = formatRuntimeFailure('set-frame', new Error('evaluation timed out'), {
    stage: 'frame.resources',
    status: 'running',
    timeoutMs: 15_000,
    frame: 72,
  });

  assert.match(error.message, /^render_runtime_failed: operation=set-frame/);
  assert.match(error.message, /stage=frame\.resources/);
  assert.match(error.message, /status=running/);
  assert.match(error.message, /frame=72/);
  assert.match(error.message, /timeoutMs=15000/);
  assert.match(error.message, /evaluation timed out$/);
});

test('runtime failures remain useful before lifecycle state exists', () => {
  assert.equal(
    formatRuntimeFailure('initialize', 'navigation failed').message,
    'render_runtime_failed: operation=initialize: navigation failed',
  );
});
