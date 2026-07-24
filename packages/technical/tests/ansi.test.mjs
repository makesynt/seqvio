import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ansiToSpans,
  applySimpleTerminalRewrites,
  normalizeTerminalNewlines,
  sliceAnsiByVisibleChars,
  sliceAnsiByVisibleLines,
  stripAnsi,
  visibleLength,
  VHS_CATPPUCCIN_MOCHA,
} from '../dist/ansi.js';

test('stripAnsi removes SGR and keeps text', () => {
  assert.equal(stripAnsi('[32mHello[0m'), 'Hello');
});

test('visibleLength ignores escape sequences', () => {
  assert.equal(visibleLength('[1;36m$[0m hi'), 4);
});

test('sliceAnsiByVisibleChars preserves SGR while typing', () => {
  const src = '[32mHello[0m';
  const partial = sliceAnsiByVisibleChars(src, 3);
  assert.equal(stripAnsi(partial), 'Hel');
  assert.match(partial, /\[32m/);
});

test('ansiToSpans maps 16-color SGR onto Catppuccin theme', () => {
  const spans = ansiToSpans('[32mok[0m done', VHS_CATPPUCCIN_MOCHA);
  assert.ok(spans.length >= 2);
  assert.equal(spans[0].text, 'ok');
  assert.equal(spans[0].style.color, VHS_CATPPUCCIN_MOCHA.green);
  assert.equal(spans[1].text, ' done');
});

test('ansiToSpans applies colors after a reset in the same SGR sequence', () => {
  const spans = ansiToSpans('\u001b[0;31mred');
  assert.equal(spans[0].style.color, VHS_CATPPUCCIN_MOCHA.red);
});

test('applySimpleTerminalRewrites preserves rewrites across concatenated PTY chunks', () => {
  const chunks = ['Progress 10%\r', 'Progress 20%\r'];
  assert.equal(applySimpleTerminalRewrites(chunks.join('')), 'Progress 20%');
});

test('applySimpleTerminalRewrites overwrites with carriage return', () => {
  const result = applySimpleTerminalRewrites('[32m50%[0m\r[31m100%[0m\n');
  const stripped = stripAnsi(result);
  assert.equal(stripped.trim(), '100%');
});

test('applySimpleTerminalRewrites handles backspace', () => {
  const result = applySimpleTerminalRewrites('AB\bC\n');
  assert.equal(stripAnsi(result).trim(), 'AC');
});

test('applySimpleTerminalRewrites handles carriage return overwrite', () => {
  // \r returns to col 0; new text overwrites. Longer or equal text fully covers old.
  const result = applySimpleTerminalRewrites('50%\r100%\n');
  assert.equal(stripAnsi(result).split('\n').length, 2);
  assert.equal(stripAnsi(result).split('\n')[0], '100%');
});

test('sliceAnsiByVisibleLines preserves SGR on tail', () => {
  const input = '[32mline1[0m\n[31mline2[0m\n[34mline3[0m';
  const result = sliceAnsiByVisibleLines(input, 2);
  assert.match(result, /\[0m/);
  assert.match(result, /\[31mline2\[0m/);
  assert.equal(result.indexOf('line1'), -1);
});

test('normalizeTerminalNewlines is exported', () => {
  assert.equal(normalizeTerminalNewlines('a\r\nb'), 'a\nb');
});
