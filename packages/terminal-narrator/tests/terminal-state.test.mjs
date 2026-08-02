import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTerminalSnapshotEvents,
  coalesceTerminalSnapshotBursts,
  scheduleTerminalSnapshotEvents,
} from '../dist/terminal-state.js';

test('buildTerminalSnapshotEvents applies cursor rewrites', async () => {
  const events = await buildTerminalSnapshotEvents(
    [
      { timeMs: 0, kind: 'stdout', text: 'hello' },
      { timeMs: 100, kind: 'stdout', text: '\rbye' },
    ],
    { cols: 20, rows: 4 }
  );

  assert.equal(events.length, 2);
  assert.equal(events[1].snapshot, true);
  assert.match(events[1].text, /^byelo/);
});

test('buildTerminalSnapshotEvents tracks alternate-screen transitions', async () => {
  const events = await buildTerminalSnapshotEvents(
    [
      { timeMs: 0, kind: 'stdout', text: 'normal' },
      { timeMs: 100, kind: 'stdout', text: '\x1b[?1049hALT' },
      { timeMs: 200, kind: 'stdout', text: '\x1b[?1049l' },
    ],
    { cols: 20, rows: 4 }
  );

  assert.match(events[0].text, /normal/);
  assert.match(events[1].text, /ALT/);
  assert.doesNotMatch(events[1].text, /normal/);
  assert.match(events[2].text, /normal/);
  assert.doesNotMatch(events[2].text, /ALT/);
});

test('buildTerminalSnapshotEvents preserves wide characters', async () => {
  const events = await buildTerminalSnapshotEvents(
    [{ timeMs: 0, kind: 'stdout', text: '中文 output' }],
    { cols: 20, rows: 4 }
  );

  assert.match(events[0].text, /中文 output/);
  assert.equal(events[0].grid.cols, 20);
  assert.equal(events[0].grid.lines[0][0].chars, '中');
  assert.equal(events[0].grid.lines[0][0].width, 2);
});

test('buildTerminalSnapshotEvents preserves palette and truecolor cells', async () => {
  const events = await buildTerminalSnapshotEvents(
    [
      {
        timeMs: 0,
        kind: 'stdout',
        text: '\x1b[31mred\x1b[0m \x1b[38;2;12;34;56mrgb\x1b[0m',
      },
    ],
    { cols: 20, rows: 4 }
  );

  const cells = events[0].grid.lines[0];
  assert.equal(cells[0].foreground, '#D74E6F');
  assert.equal(cells.find((cell) => cell.chars === 'r' && cell.x > 3).foreground, '#0c2238');
});

test('scheduleTerminalSnapshotEvents compresses idle gaps and preserves readable states', () => {
  const timeline = scheduleTerminalSnapshotEvents(
    [
      { timeMs: 400, kind: 'stdout', text: 'boot', snapshot: true },
      { timeMs: 2900, kind: 'stdin', text: '/help', transient: true },
      { timeMs: 3100, kind: 'stdout', text: 'home', snapshot: true },
      { timeMs: 3300, kind: 'stdout', text: 'help', snapshot: true },
    ],
    { minimumSnapshotMs: 900, maximumGapMs: 1800 }
  );

  assert.deepEqual(timeline.events.map((event) => event.timeMs), [400, 2200, 3000, 3900]);
  assert.equal(timeline.durationMs, 4800);
  assert.equal(timeline.mapTime(3100), 3000);
  assert.ok(timeline.durationMs < 28_000);
});

test('coalesceTerminalSnapshotBursts keeps the final stable TUI redraw', () => {
  const events = coalesceTerminalSnapshotBursts([
    { timeMs: 100, kind: 'stdin', text: '/help', transient: true },
    { timeMs: 300, kind: 'stdout', text: '/', raw: 'first-', snapshot: true },
    { timeMs: 370, kind: 'stdout', text: 'help screen', raw: 'second', snapshot: true },
  ]);
  assert.deepEqual(events.map((event) => event.text), ['/help', 'help screen']);
  assert.equal(events[1].raw, 'first-second');
});
