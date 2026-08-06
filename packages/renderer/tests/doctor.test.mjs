import assert from 'node:assert/strict';
import test from 'node:test';

import { doctorExitCode, resolveManimPythonCommand, supportsNodeVersion } from '../dist/doctor.js';

test('doctor enforces the supported Node.js floor', () => {
  assert.equal(supportsNodeVersion('v18.0.0'), true);
  assert.equal(supportsNodeVersion('24.1.0'), true);
  assert.equal(supportsNodeVersion('v17.9.1'), false);
  assert.equal(supportsNodeVersion('unknown'), false);
});

test('doctor exit code follows blocking failures', () => {
  assert.equal(doctorExitCode({ ok: true }), 0);
  assert.equal(doctorExitCode({ ok: false }), 1);
});

test('doctor honors an explicit Manim Python command', () => {
  assert.equal(resolveManimPythonCommand(process.cwd(), 'custom-python'), 'custom-python');
});
