import assert from 'node:assert/strict';
import test from 'node:test';

import {
  manifestToAsciinemaCast,
  parseAsciinemaCast,
} from '../dist/cast.js';

test('manifestToAsciinemaCast emits v2 header and timed events', () => {
  const cast = manifestToAsciinemaCast({
    version: '1.0',
    name: 'demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 1500,
    cols: 120,
    rows: 36,
    steps: [{ id: 'a', label: 'A', timeMs: 0 }],
    events: [
      { timeMs: 0, kind: 'stdin', text: '$ echo hi\n' },
      { timeMs: 250, kind: 'stdout', text: 'hi\n' },
    ],
  });

  const lines = cast.trim().split('\n');
  const header = JSON.parse(lines[0]);
  assert.equal(header.version, 2);
  assert.equal(header.width, 120);
  assert.equal(header.height, 36);

  const rows = lines.slice(1).map((line) => JSON.parse(line));
  const input = rows.find((event) => event[1] === 'i');
  const output = rows.find((event) => event[1] === 'o');
  assert.ok(input, 'expected an input event');
  assert.ok(output, 'expected an output event');
  assert.equal(output[2], 'hi\n');
});

test('parseAsciinemaCast round-trips stdout events', () => {
  const source = [
    JSON.stringify({ version: 2, width: 80, height: 24, title: 't' }),
    JSON.stringify([0.1, 'o', 'hello\n']),
    JSON.stringify([0.5, 'i', 'ls\r']),
  ].join('\n');

  const parsed = parseAsciinemaCast(source);
  assert.equal(parsed.cols, 80);
  assert.equal(parsed.rows, 24);
  assert.equal(parsed.events[0].kind, 'stdout');
  assert.equal(parsed.events[0].text, 'hello\n');
  assert.equal(parsed.events[1].kind, 'stdin');
});

test('manifestToAsciinemaCast emits step markers as m events', () => {
  const cast = manifestToAsciinemaCast({
    version: '1.0',
    name: 'demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 1500,
    cols: 120,
    rows: 36,
    steps: [
      { id: 'a', label: 'Step A', timeMs: 0 },
      { id: 'b', label: 'Step B', timeMs: 1000 },
    ],
    events: [
      { timeMs: 0, kind: 'stdin', text: '$ echo hi\n' },
      { timeMs: 250, kind: 'stdout', text: 'hi\n' },
    ],
  });

  const rows = cast.trim().split('\n').map((line) => JSON.parse(line));
  const markers = rows.filter((event) => event[1] === 'm');
  assert.equal(markers.length, 2);
  assert.deepEqual(
    markers.map((event) => [event[0], event[2]]),
    [
      [0, 'Step A'],
      [1, 'Step B'],
    ]
  );
  // o/i events are preserved alongside markers
  assert.ok(rows.some((event) => event[1] === 'i'));
  assert.ok(rows.some((event) => event[1] === 'o'));
  // all event rows are sorted by non-decreasing time
  const times = rows.slice(1).map((event) => event[0]);
  assert.ok(times.every((t, i) => i === 0 || t >= times[i - 1]));
});

test('manifestToAsciinemaCast omits markers when steps are empty', () => {
  const cast = manifestToAsciinemaCast({
    version: '1.0',
    name: 'demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 1500,
    cols: 120,
    rows: 36,
    steps: [],
    events: [{ timeMs: 0, kind: 'stdout', text: 'hi\n' }],
  });
  const rows = cast.trim().split('\n').map((line) => JSON.parse(line));
  assert.ok(!rows.some((event) => event[1] === 'm'));
});
