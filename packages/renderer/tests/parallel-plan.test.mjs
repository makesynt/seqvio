import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createFrameReorderBuffer,
  frameFileName,
  planFrameChunks,
  planInterleavedFrameAssignments,
} from '../dist/parallel-plan.js';

describe('parallel frame planning', () => {
  it('splits work into contiguous chunks', () => {
    const chunks = planFrameChunks(10, 100, 3);

    assert.deepEqual(chunks, [
      { workerIndex: 0, sourceStartFrame: 100, outputStartIndex: 0, frameCount: 4 },
      { workerIndex: 1, sourceStartFrame: 104, outputStartIndex: 4, frameCount: 3 },
      { workerIndex: 2, sourceStartFrame: 107, outputStartIndex: 7, frameCount: 3 },
    ]);
  });

  it('uses contiguous output frame names independent of source frame', () => {
    assert.equal(frameFileName(0, 'jpg'), 'frame-000000.jpg');
    assert.equal(frameFileName(42, 'png'), 'frame-000042.png');
  });

  it('assigns streaming work in interleaved output order', () => {
    const assignments = planInterleavedFrameAssignments(10, 100, 3);

    assert.deepEqual(assignments, [
      {
        workerIndex: 0,
        frames: [
          { sourceFrame: 100, outputIndex: 0 },
          { sourceFrame: 103, outputIndex: 3 },
          { sourceFrame: 106, outputIndex: 6 },
          { sourceFrame: 109, outputIndex: 9 },
        ],
      },
      {
        workerIndex: 1,
        frames: [
          { sourceFrame: 101, outputIndex: 1 },
          { sourceFrame: 104, outputIndex: 4 },
          { sourceFrame: 107, outputIndex: 7 },
        ],
      },
      {
        workerIndex: 2,
        frames: [
          { sourceFrame: 102, outputIndex: 2 },
          { sourceFrame: 105, outputIndex: 5 },
          { sourceFrame: 108, outputIndex: 8 },
        ],
      },
    ]);
  });

  it('releases out-of-order frames only when their output index is next', async () => {
    const order = [];
    const reorder = createFrameReorderBuffer(0, 3);

    const second = reorder.waitForTurn(1).then(() => order.push(1));
    const first = reorder.waitForTurn(0).then(() => order.push(0));

    await Promise.resolve();
    assert.deepEqual(order, [0]);

    reorder.advanceTo(1);
    await second;
    assert.deepEqual(order, [0, 1]);

    const third = reorder.waitForTurn(2).then(() => order.push(2));
    reorder.advanceTo(2);
    await third;
    assert.deepEqual(order, [0, 1, 2]);
  });
});
