import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { markerAtFrame, resolveManimMarkerFrames } from '../dist/index.js';

describe('ManimClip markers', () => {
  it('resolves named markers deterministically for direct and reverse seek', () => {
    const markers = [{ id: 'start', frame: 0 }, { id: 'proof', frame: 30 }, { id: 'result', frame: 60 }];
    assert.equal(markerAtFrame(markers, 45).id, 'proof');
    assert.equal(markerAtFrame(markers, 15).id, 'start');
    assert.equal(markerAtFrame(markers, 60).id, 'result');
  });

  it('reflows a named marker from the resolved narration beat', () => {
    const markers = [{ id: 'result', frame: 60, beatId: 'result-beat' }];
    const beats = [{ id: 'equation.result-beat', sceneId: 'equation', sourceFrame: 60, outputFrame: 92 }];
    assert.equal(resolveManimMarkerFrames(markers, beats, 'equation')[0].frame, 92);
  });
});
