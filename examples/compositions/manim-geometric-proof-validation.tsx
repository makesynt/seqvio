import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition } from '@seqvio/core';
import { ManimClip, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 123;

export default function ManimGeometricProofValidation() {
  return <VideoComposition id="manim-geometric-proof-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
    <TechnicalScene width={W} height={H}>
      <ManimClip id="geometric-proof" src="file:///D:/video-agent/seqvio/output/manim-geometric-proof-media/videos/geometric-proof/720p30/GeometricPythagoreanProof.mp4"
        width={W} height={H} fps={FPS} markers={[
          { id: 'triangle', frame: 0, targetId: 'triangle-stage' },
          { id: 'leg-squares', frame: 24, targetId: 'leg-area-stage' },
          { id: 'hypotenuse-square', frame: 54, targetId: 'hypotenuse-area-stage' },
          { id: 'area-identity', frame: 87, targetId: 'area-result-stage' },
        ]} />
    </TechnicalScene>
  </VideoComposition>;
}

export const meta: RenderableMeta = { width: W, height: H, fps: FPS, duration: DURATION };
