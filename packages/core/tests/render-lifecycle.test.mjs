import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prepareSeekables,
  registerSeekable,
  renderSeekables,
  unregisterSeekable,
  waitForSeekablesReady,
} from '../dist/index.js';

test('render lifecycle prepares, waits, renders arbitrary frames, and disposes', async () => {
  const calls = [];
  const values = new Map();
  registerSeekable({
    id: 'lifecycle-test',
    seek() {},
    async prepare() { calls.push('prepare'); },
    async ready() { calls.push('ready'); },
    render({ frame }) {
      values.set(frame, `frame-${frame}`);
      calls.push(`render:${frame}`);
    },
    dispose() { calls.push('dispose'); },
  });

  await prepareSeekables();
  await waitForSeekablesReady();
  for (const frame of [90, 0, 45, 45, 12]) await renderSeekables(frame, 30);
  await unregisterSeekable('lifecycle-test');

  assert.deepEqual(calls, [
    'prepare', 'ready', 'render:90', 'render:0', 'render:45', 'render:45', 'render:12', 'dispose',
  ]);
  assert.equal(values.get(45), 'frame-45');
});

test('legacy seek adapters remain deterministic under backward and repeated seeks', async () => {
  const observed = [];
  registerSeekable({
    id: 'legacy-seek-test',
    seek(timeSeconds, frame) { observed.push([timeSeconds, frame]); },
  });
  for (const frame of [60, 10, 10, 0]) await renderSeekables(frame, 20);
  await unregisterSeekable('legacy-seek-test');
  assert.deepEqual(observed, [[3, 60], [0.5, 10], [0.5, 10], [0, 0]]);
});

test('render lifecycle timeout identifies adapter, phase, frame, and stable code', async () => {
  registerSeekable({
    id: 'stalled-renderer',
    seek() {},
    render() { return new Promise(() => {}); },
  });

  await assert.rejects(
    renderSeekables(42, 30, { renderMs: 10 }),
    (error) => {
      assert.equal(error.name, 'RenderLifecycleError');
      assert.equal(error.code, 'render_lifecycle_timeout');
      assert.equal(error.adapterId, 'stalled-renderer');
      assert.equal(error.phase, 'render');
      assert.equal(error.frame, 42);
      assert.equal(error.timeoutMs, 10);
      return true;
    },
  );
  await unregisterSeekable('stalled-renderer');
});

test('render lifecycle wraps adapter failures with a stable diagnostic', async () => {
  registerSeekable({
    id: 'broken-preparer',
    seek() {},
    prepare() { throw new Error('fixture unavailable'); },
  });

  await assert.rejects(
    prepareSeekables(),
    /render_lifecycle_failed: adapter=broken-preparer phase=prepare failed: fixture unavailable/,
  );
  await unregisterSeekable('broken-preparer');
});

test('dispose timeout removes the adapter and reports the dispose phase', async () => {
  registerSeekable({
    id: 'stalled-disposer',
    seek() {},
    dispose() { return new Promise(() => {}); },
  });

  await assert.rejects(
    unregisterSeekable('stalled-disposer', { disposeMs: 10 }),
    (error) => error.code === 'render_lifecycle_timeout' && error.phase === 'dispose',
  );

  // Removal happens before disposal, so a failed cleanup cannot poison later frames.
  assert.equal(await renderSeekables(1, 30), false);
});
