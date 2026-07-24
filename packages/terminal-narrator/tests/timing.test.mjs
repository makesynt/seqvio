import assert from 'node:assert/strict';
import test from 'node:test';

import {
  extractCommandFromStdin,
  findCommandEchoTimeMs,
  refineStepTimings,
} from '../dist/timing.js';

test('extractCommandFromStdin accepts legacy prompt-prefixed input', () => {
  assert.equal(extractCommandFromStdin('$ echo Hello\n'), 'echo Hello');
  assert.equal(extractCommandFromStdin(''), null);
});

test('extractCommandFromStdin accepts current raw stdin format', () => {
  assert.equal(extractCommandFromStdin('echo raw'), 'echo raw');
});

test('findCommandEchoTimeMs matches stdout after stdin write', () => {
  const events = [
    { timeMs: 100, kind: 'stdin', text: '$ echo Hello\n' },
    { timeMs: 120, kind: 'stdout', text: '\u001b[0m' },
    {
      timeMs: 180,
      kind: 'stdout',
      text: 'D:\\repo\u001b[0;31;91m# \u001b[0mecho Hello\r\nHello\r\n',
    },
  ];

  assert.equal(findCommandEchoTimeMs(events, 'echo Hello', 100, 1000), 180);
  assert.equal(findCommandEchoTimeMs(events, 'echo Missing', 100, 1000), null);
});

test('refineStepTimings moves steps to stdout echo / output', () => {
  const refined = refineStepTimings({
    version: '1.0',
    name: 'demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 3000,
    cols: 120,
    rows: 36,
    steps: [
      { id: 'hello', label: '打印 Hello', timeMs: 402 },
      { id: 'world', label: '打印 World', timeMs: 1109 },
    ],
    events: [
      { timeMs: 402, kind: 'stdin', text: '$ echo Hello\n' },
      {
        timeMs: 483,
        kind: 'stdout',
        text: 'echo Hello\r\nHello\r\n',
      },
      { timeMs: 1109, kind: 'stdin', text: '$ echo World\n' },
      {
        timeMs: 1112,
        kind: 'stdout',
        text: 'echo World\r\nWorld\r\n',
      },
    ],
  });

  assert.equal(refined.length, 2);
  assert.equal(refined[0].inputTimeMs, 402);
  assert.equal(refined[0].timeMs, 483);
  assert.equal(refined[1].inputTimeMs, 1109);
  assert.equal(refined[1].timeMs, 1112);
});

test('refineStepTimings falls back to first output when echo is missing', () => {
  const refined = refineStepTimings({
    version: '1.0',
    name: 'demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 1000,
    cols: 120,
    rows: 36,
    steps: [{ id: 'opaque', label: 'Opaque', timeMs: 200 }],
    events: [
      { timeMs: 200, kind: 'stdin', text: '$ secret-tool\n' },
      { timeMs: 400, kind: 'stdout', text: 'ok\n' },
    ],
  });

  // Command echo not found; aligned to first non-empty stdout output.
  assert.equal(refined[0].timeMs, 400);
  assert.equal(refined[0].inputTimeMs, 200);
  assert.equal(refined[0].echoFound, false);
  assert.equal(refined[0].command, 'secret-tool');
});

test('refineStepTimings keeps stdin time when there is no output at all', () => {
  const refined = refineStepTimings({
    version: '1.0',
    name: 'demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    durationMs: 1000,
    cols: 120,
    rows: 36,
    steps: [{ id: 'silent', label: 'Silent', timeMs: 200 }],
    events: [],
  });

  assert.equal(refined[0].timeMs, 200);
  assert.equal(refined[0].inputTimeMs, 200);
  assert.equal(refined[0].echoFound, false);
  assert.equal(refined[0].command, null);
});
