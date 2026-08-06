// AUTO-GENERATED from a Seqvio ExplainerDocument. Safe to edit by hand.
import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition, Scene, Transition } from '@seqvio/core';

import {
  TechnicalScene,
  AnnotationTarget,
  CodeWalkthrough,
  ArchitectureDiagram,
  InfographicScene,
  ManimClip,
  TerminalXtermDemo,
} from '@seqvio/technical';


const W = 1280;
const H = 720;
const FPS = 30;


function ExternalAnimationScene0() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <ManimClip
        id="external-animation"
        src="file:///D:/video-agent/seqvio/output/direction-plan-validation-v2.mp4"
        width={1280}
        height={720}
        fps={30}
        fit="contain"
        markers={[
  {
    "id": "start",
    "frame": 0,
    "targetId": "animation-start"
  },
  {
    "id": "explain",
    "frame": 60,
    "targetId": "animation-explain"
  },
  {
    "id": "result",
    "frame": 140,
    "targetId": "animation-result"
  }
]}
      />
    </TechnicalScene>
  );
}

export default function ManimIrValidation() {
  return (
    <VideoComposition
      id="manim-ir-validation"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
    >
      <Scene id="external-animation" duration={180}>
        <ExternalAnimationScene0 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 180,
  width: W,
  height: H,
  pacing: { profile: "explainer-v1", highlights: [] },
  direction: {
  "sceneActions": [
    {
      "segmentId": "external-animation.overview",
      "sceneId": "external-animation",
      "purpose": "establish-model",
      "pace": "steady",
      "camera": "overview",
      "transition": "cut"
    }
  ],
  "attention": [],
  "timingHints": [
    {
      "segmentId": "external-animation.overview",
      "pace": "steady",
      "minHoldFrames": 18
    }
  ]
},
};
