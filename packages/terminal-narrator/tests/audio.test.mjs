import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { resolveSeqvioAudioCli } from '../dist/audio.js';

test('resolveSeqvioAudioCli points to built seqvio-audio CLI', () => {
  const cliPath = resolveSeqvioAudioCli();
  assert.match(cliPath, /audio-cli\.js$/);
  assert.equal(fs.existsSync(cliPath), true);
});
