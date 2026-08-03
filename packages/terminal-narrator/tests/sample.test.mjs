import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveClaudeBin, sampleClaudePlan, samplePlan } from '../dist/sample.js';

test('Windows sample uses the platform PTY default and waits for observed output', () => {
  const plan = samplePlan();
  assert.equal(plan.shell.useConpty, undefined);

  if (process.platform === 'win32') {
    assert.equal(plan.readyPattern, 'PS [^\\r\\n>]*>');
    assert.deepEqual(
      plan.inputs.map((input) => input.waitForPattern),
      ['\u001b\\[32mHello', '\u001b\\[36mWorld', '\u001b\\[35mDone']
    );
  }
});

test('samplePlan has an explicit short CI profile without changing the default', () => {
  const previous = process.env.SEQVIO_CAPTURE_SMOKE_PROFILE;
  process.env.SEQVIO_CAPTURE_SMOKE_PROFILE = 'quick';
  try {
    const quick = samplePlan();
    assert.deepEqual(quick.viewport, { width: 640, height: 360 });
    assert.equal(quick.renderFps, 10);
    assert.equal(quick.startupWaitMs, 5000);
    assert.equal(quick.typeDelayMs, 28);
    assert.equal(quick.finalWaitMs, 250);
    assert.equal(quick.inputs.length, 1);
  } finally {
    if (previous === undefined) delete process.env.SEQVIO_CAPTURE_SMOKE_PROFILE;
    else process.env.SEQVIO_CAPTURE_SMOKE_PROFILE = previous;
  }
  const full = samplePlan();
  assert.deepEqual(full.viewport, { width: 1280, height: 720 });
  assert.equal(full.renderFps, 30);
  assert.equal(full.inputs.length, 3);
});

test('sampleClaudePlan uses the shared Claude executable resolver', () => {
  const explicit = sampleClaudePlan({ claudeBin: 'custom-claude' });
  assert.equal(explicit.shell.command, 'custom-claude');

  const resolved = resolveClaudeBin();
  const defaultPlan = sampleClaudePlan();
  assert.equal(defaultPlan.shell.command, resolved);
  assert.equal(defaultPlan.shell.useConpty, undefined);
  assert.equal(defaultPlan.readyPattern, '❯');
  assert.equal(resolved, process.platform === 'win32' ? 'claude.exe' : 'claude');
});
