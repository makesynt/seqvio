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


function OverviewScene0() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <InfographicScene
        id="overview"
        title="From evidence to explanation"
        metrics={[
  {
    "id": "evidence",
    "label": "Evidence",
    "value": "Recorded",
    "detail": "source state",
    "color": "#38bdf8",
    "at": 0
  },
  {
    "id": "model",
    "label": "Model",
    "value": "Explained",
    "detail": "semantic path",
    "color": "#a78bfa",
    "at": 14
  }
]}
        comparisons={[]}
        process={[]}
        timeline={[]}
        relationshipNodes={[]}
        relationships={[]}
        attention={[
  {
    "id": "overview.evidence-beat.attention-1",
    "targetId": "evidence",
    "kind": "spotlight",
    "start": 0,
    "duration": 14,
    "minHoldFrames": 14,
    "sourceBeatId": "overview.evidence-beat",
    "sceneId": "overview",
    "persistence": "until-handoff",
    "handoffTo": "model"
  },
  {
    "id": "overview.model-beat.attention-1",
    "targetId": "model",
    "kind": "box",
    "start": 14,
    "duration": 14,
    "minHoldFrames": 14,
    "sourceBeatId": "overview.model-beat",
    "sceneId": "overview",
    "persistence": "until-handoff"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

function EquationScene1() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <ManimClip
        id="equation"
        src="file:///D:/video-agent/seqvio/output/manim-adapter-media-v2/videos/equation/480p15/EquationDerivation.mp4"
        width={854}
        height={480}
        fps={15}
        fit="contain"
        markers={[
  {
    "id": "equation-result",
    "frame": 30
  }
]}
      />
    </TechnicalScene>
  );
}

export default function IntegratedSemanticValidation() {
  return (
    <VideoComposition
      id="integrated-semantic-validation"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#0f172a"
      audio={meta.audio}
    >
      <Scene id="overview" duration={75}>
        <OverviewScene0 />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="equation" duration={60}>
        <EquationScene1 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 147,
  width: W,
  height: H,
  pacing: { profile: "explainer-v1", highlights: [
  {
    "id": "overview.evidence-beat",
    "source": "beat",
    "startFrame": 0,
    "endFrame": 14,
    "minDurationFrames": 14
  },
  {
    "id": "overview.model-beat",
    "source": "beat",
    "startFrame": 14,
    "endFrame": 28,
    "minDurationFrames": 14
  }
] },
  direction: {
  "sceneActions": [
    {
      "segmentId": "overview.evidence-beat",
      "sceneId": "overview",
      "purpose": "hook",
      "pace": "steady",
      "camera": "follow-target"
    },
    {
      "segmentId": "overview.model-beat",
      "sceneId": "overview",
      "purpose": "hook",
      "pace": "steady",
      "camera": "follow-target",
      "transition": "cut"
    },
    {
      "segmentId": "equation.overview",
      "sceneId": "equation",
      "purpose": "summarize",
      "pace": "steady",
      "camera": "overview",
      "transition": "cut"
    }
  ],
  "attention": [
    {
      "segmentId": "overview.evidence-beat",
      "sceneId": "overview",
      "targetId": "evidence",
      "sourceBeatId": "evidence-beat",
      "start": 0,
      "duration": 1
    },
    {
      "segmentId": "overview.model-beat",
      "sceneId": "overview",
      "targetId": "model",
      "sourceBeatId": "model-beat",
      "start": 1,
      "duration": 1
    }
  ],
  "timingHints": [
    {
      "segmentId": "overview.evidence-beat",
      "pace": "steady",
      "minHoldFrames": 18
    },
    {
      "segmentId": "overview.model-beat",
      "pace": "steady",
      "minHoldFrames": 18
    },
    {
      "segmentId": "equation.overview",
      "pace": "steady",
      "minHoldFrames": 18
    }
  ]
},
  audio: {
    fps: FPS,
    lockToAudio: true,
    pacingProfile: "explainer-v1",
    sceneTimings: [
  {
    "sceneId": "overview",
    "startFrame": 0,
    "durationFrames": 75,
    "sourceDurationFrames": 75,
    "transitionAfterFrames": 12,
    "highlights": [
      {
        "id": "overview.evidence-beat",
        "source": "beat",
        "startFrame": 0,
        "endFrame": 14,
        "minDurationFrames": 14
      },
      {
        "id": "overview.model-beat",
        "source": "beat",
        "startFrame": 14,
        "endFrame": 28,
        "minDurationFrames": 14
      }
    ]
  },
  {
    "sceneId": "equation",
    "startFrame": 87,
    "durationFrames": 60,
    "sourceDurationFrames": 60,
    "transitionAfterFrames": 0,
    "highlights": []
  }
],
    explanationBeats: [
  {
    "id": "overview.evidence-beat",
    "sceneId": "overview",
    "cueId": "overview.overview-cue",
    "anchor": {
      "text": "Evidence"
    },
    "sourceFrame": 0,
    "visuals": [
      {
        "targetId": "evidence",
        "action": "focus",
        "minHoldMs": 800
      }
    ]
  },
  {
    "id": "overview.model-beat",
    "sceneId": "overview",
    "cueId": "overview.overview-cue",
    "anchor": {
      "text": "explanation"
    },
    "sourceFrame": 14,
    "visuals": [
      {
        "targetId": "model",
        "action": "highlight",
        "minHoldMs": 800
      }
    ]
  }
],
    narration: [
  {
    "id": "overview.overview-cue",
    "sceneId": "overview",
    "text": "Evidence becomes an explanation.",
    "startMs": 0,
    "endMs": 1840
  }
],
  },
};
