import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStreamCopyMuxArgs } from '../dist/renderer.js';

test('stream-copy mux preserves the complete video when narration is shorter', () => {
  const args = buildStreamCopyMuxArgs('video.mp4', 'narration.aac', 'final.mp4');

  assert.equal(args.includes('-shortest'), false);
  assert.deepEqual(args.slice(-3), ['-movflags', '+faststart', 'final.mp4']);
});
