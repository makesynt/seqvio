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
