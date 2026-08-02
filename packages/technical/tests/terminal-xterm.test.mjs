import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveTerminalCursorVisible,
  resolveTerminalFitScale,
  resolveTerminalFrameState,
} from '../dist/TerminalXtermDemo.js';

const prompt = {
  timeMs: 0,
  kind: 'stdout',
  text: '$ ',
  snapshot: true,
  grid: { cols: 20, rows: 4, cursorX: 2, cursorY: 0, lines: [] },
};

test('terminal frame state applies typingCps as characters per second', () => {
  const state = resolveTerminalFrameState(
    [prompt, { timeMs: 100, kind: 'stdin', text: 'hello', transient: true }],
    300,
    10
  );
  assert.equal(state.activeInput, 'he');
  assert.ok(state.ansi.endsWith('he'));
});

test('terminal frame state stops synthetic input after PTY output arrives', () => {
  const state = resolveTerminalFrameState(
    [
      prompt,
      { timeMs: 100, kind: 'stdin', text: 'echo hello', transient: true },
      {
        timeMs: 500,
        kind: 'stdout',
        text: '$ echo hello\nhello\n$ ',
        raw: 'hello\r\n',
        snapshot: true,
        grid: { cols: 20, rows: 4, cursorX: 2, cursorY: 2, lines: [] },
      },
    ],
    600,
    10
  );
  assert.equal(state.activeInput, '');
  assert.equal((state.ansi.match(/echo hello/g) ?? []).length, 1);
  assert.match(state.ansi, /hello/);
});

test('terminal frame state respects event order when input and output share a timestamp', () => {
  const state = resolveTerminalFrameState(
    [
      prompt,
      { timeMs: 100, kind: 'stdin', text: 'echo hello', transient: true },
      {
        timeMs: 100,
        kind: 'stdout',
        text: '$ echo hello\nhello',
        snapshot: true,
        grid: { cols: 20, rows: 4, cursorX: 5, cursorY: 1, lines: [] },
      },
    ],
    200,
    10
  );
  assert.equal(state.activeInput, '');
  assert.equal((state.ansi.match(/echo hello/g) ?? []).length, 1);
});

test('terminal frame state is independent of prior seeks', () => {
  const events = [
    prompt,
    {
      timeMs: 500,
      kind: 'stdout',
      text: 'later',
      snapshot: true,
      grid: { cols: 20, rows: 4, cursorX: 5, cursorY: 0, lines: [] },
    },
  ];
  const later = resolveTerminalFrameState(events, 600, 10);
  const earlier = resolveTerminalFrameState(events, 100, 10);
  assert.match(later.ansi, /later/);
  assert.doesNotMatch(earlier.ansi, /later/);
  assert.match(earlier.ansi, /\$ /);
});

test('terminal frame state is stable across repeated and shuffled frame requests', () => {
  const events = [
    prompt,
    { timeMs: 200, kind: 'stdin', text: 'printf hello', transient: true },
    {
      timeMs: 900,
      kind: 'stdout',
      text: '$ printf hello\nhello',
      raw: 'hello',
      snapshot: true,
      grid: { cols: 20, rows: 4, cursorX: 5, cursorY: 1, lines: [] },
    },
  ];
  const times = [0, 250, 500, 950, 1200];
  const expected = new Map(
    times.map((timeMs) => [timeMs, resolveTerminalFrameState(events, timeMs, 20)]),
  );

  for (const timeMs of [950, 250, 1200, 0, 500, 250, 950]) {
    assert.deepEqual(
      resolveTerminalFrameState(events, timeMs, 20),
      expected.get(timeMs),
    );
  }
});

test('terminal fit scale keeps the default 120x36 terminal inside 1920x1080', () => {
  const naturalWidth = 120 * 13 + 20 + 32;
  const naturalHeight = 36 * 28 + 5 + 32 + 44;
  const scale = resolveTerminalFitScale(1920, 1080, naturalWidth, naturalHeight, true);
  assert.ok(scale < 1);
  assert.ok(naturalWidth * scale <= 1920 * 0.94 + 0.001);
  assert.ok(naturalHeight * scale <= 1080 * 0.9 + 0.001);
});

test('terminal cursor blink is deterministic from video time', () => {
  assert.equal(resolveTerminalCursorVisible(0, true), true);
  assert.equal(resolveTerminalCursorVisible(499, true), true);
  assert.equal(resolveTerminalCursorVisible(500, true), false);
  assert.equal(resolveTerminalCursorVisible(999, true), false);
  assert.equal(resolveTerminalCursorVisible(1000, true), true);
  assert.equal(resolveTerminalCursorVisible(750, false), true);
});
