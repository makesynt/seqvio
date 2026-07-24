import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePlan } from '../dist/validate.js';

test('validatePlan normalizes a minimal valid plan', () => {
  const plan = validatePlan({
    version: '1.0',
    name: ' Demo ',
    viewport: { width: 1280, height: 720 },
    shell: { command: 'cmd.exe' },
    inputs: [{ id: 'hello', label: 'Say hello', text: 'echo Hello' }],
  });

  assert.equal(plan.name, 'Demo');
  assert.equal(plan.renderFps, 30);
  assert.equal(plan.maxLines, 220);
  assert.deepEqual(plan.shell.args, []);
});

test('validatePlan rejects missing shell command', () => {
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: {},
        inputs: [{ id: 'x', label: 'X', text: 'echo X' }],
      }),
    /plan\.shell\.command is required/
  );
});

test('validatePlan accepts waitForPattern and idle timing options', () => {
  const plan = validatePlan({
    version: '1.0',
    name: 'Demo',
    viewport: { width: 1280, height: 720 },
    shell: { command: 'cmd.exe' },
    inputs: [
      {
        id: 'hello',
        label: 'Say hello',
        text: 'echo Hello',
        waitForPattern: 'Hello',
        waitTimeoutMs: 5000,
      },
    ],
    idleTimeLimitMs: 2000,
    minSnapshotMs: 600,
  });
  assert.equal(plan.inputs[0].waitForPattern, 'Hello');
  assert.equal(plan.inputs[0].waitTimeoutMs, 5000);
  assert.equal(plan.idleTimeLimitMs, 2000);
  assert.equal(plan.minSnapshotMs, 600);
});

test('validatePlan rejects invalid waitForPattern regex', () => {
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: { command: 'cmd.exe' },
        inputs: [{ id: 'x', label: 'X', text: 'echo X', waitForPattern: '(' }],
      }),
    /waitForPattern is not a valid regular expression/
  );
});

test('validatePlan rejects non-positive waitTimeoutMs', () => {
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: { command: 'cmd.exe' },
        inputs: [{ id: 'x', label: 'X', text: 'echo X', waitTimeoutMs: 0 }],
      }),
    /waitTimeoutMs must be > 0/
  );
});

test('validatePlan rejects non-positive idle timing options', () => {
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: { command: 'cmd.exe' },
        inputs: [{ id: 'x', label: 'X', text: 'echo X' }],
        idleTimeLimitMs: 0,
      }),
    /idleTimeLimitMs must be > 0/
  );
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: { command: 'cmd.exe' },
        inputs: [{ id: 'x', label: 'X', text: 'echo X' }],
        minSnapshotMs: -1,
      }),
    /minSnapshotMs must be > 0/
  );
});

test('validatePlan rejects non-boolean zoomOnInput', () => {
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: { command: 'cmd.exe' },
        inputs: [{ id: 'x', label: 'X', text: 'echo X' }],
        zoomOnInput: 'yes',
      }),
    /zoomOnInput must be a boolean/
  );
});

test('validatePlan rejects maxZoom not greater than 1', () => {
  assert.throws(
    () =>
      validatePlan({
        version: '1.0',
        name: 'Bad',
        viewport: { width: 1280, height: 720 },
        shell: { command: 'cmd.exe' },
        inputs: [{ id: 'x', label: 'X', text: 'echo X' }],
        maxZoom: 1,
      }),
    /maxZoom must be a number > 1/
  );
});

test('validatePlan accepts valid zoom fields and returns them', () => {
  const plan = validatePlan({
    version: '1.0',
    name: 'Demo',
    viewport: { width: 1280, height: 720 },
    shell: { command: 'cmd.exe' },
    inputs: [{ id: 'x', label: 'X', text: 'echo X' }],
    zoomOnInput: false,
    maxZoom: 3,
    zoomTransitionMs: 600,
    zoomHoldMs: 300,
  });
  assert.equal(plan.zoomOnInput, false);
  assert.equal(plan.maxZoom, 3);
  assert.equal(plan.zoomTransitionMs, 600);
  assert.equal(plan.zoomHoldMs, 300);
});

