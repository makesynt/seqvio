import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition } from '@seqvio/core';
import { ManimClip } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 180;

export default function ManimClipValidation() {
  return (
    <VideoComposition id="manim-clip-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a" audio={meta.audio}>
      <ManimClip
        id="external-animation"
        src="file:///D:/video-agent/seqvio/output/direction-plan-validation-v2.mp4"
        width={W}
        height={H}
        fps={FPS}
        markers={[
          { id: 'start', frame: 0, targetId: 'animation-start' },
          { id: 'explain', frame: 60, targetId: 'animation-explain', beatId: 'explain-beat' },
          { id: 'result', frame: 140, targetId: 'animation-result', beatId: 'result-beat' },
        ]}
      />
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS, duration: DURATION, width: W, height: H,
  audio: {
    fps: FPS,
    lockToAudio: false,
    explanationBeats: [
      { id: 'external-animation.explain-beat', sceneId: 'external-animation', cueId: 'narration', anchor: { text: 'explain' }, sourceFrame: 60, outputFrame: 82, visuals: [] },
      { id: 'external-animation.result-beat', sceneId: 'external-animation', cueId: 'narration', anchor: { text: 'result' }, sourceFrame: 140, outputFrame: 155, visuals: [] },
    ],
  },
};
