import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveClaudeBin, sampleClaudePlan } from '../dist/sample.js';

test('sampleClaudePlan uses the shared Claude executable resolver', () => {
  const explicit = sampleClaudePlan({ claudeBin: 'custom-claude' });
  assert.equal(explicit.shell.command, 'custom-claude');

  const resolved = resolveClaudeBin();
  const defaultPlan = sampleClaudePlan();
  assert.equal(defaultPlan.shell.command, resolved);
  assert.equal(defaultPlan.readyPattern, '❯');
  assert.equal(resolved, process.platform === 'win32' ? 'claude.exe' : 'claude');
});
