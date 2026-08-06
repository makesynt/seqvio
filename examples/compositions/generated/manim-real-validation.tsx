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
const FPS = 15;


function EquationScene0() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <ManimClip
        id="equation"
        src="file:///D:/video-agent/seqvio/output/manim-adapter-media/videos/equation/480p15/EquationDerivation.mp4"
        width={854}
        height={480}
        fps={15}
        fit="contain"
        markers={[
  {
    "id": "equation-written",
    "frame": 30
  }
]}
      />
    </TechnicalScene>
  );
}

export default function ManimRealValidation() {
  return (
    <VideoComposition
      id="manim-real-validation"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
    >
      <Scene id="equation" duration={60}>
        <EquationScene0 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 60,
  width: W,
  height: H,
  pacing: { profile: "explainer-v1", highlights: [] },
  direction: {
  "sceneActions": [
    {
      "segmentId": "equation.overview",
      "sceneId": "equation",
      "purpose": "establish-model",
      "pace": "steady",
      "camera": "overview",
      "transition": "cut"
    }
  ],
  "attention": [],
  "timingHints": [
    {
      "segmentId": "equation.overview",
      "pace": "steady",
      "minHoldFrames": 18
    }
  ]
},
};
