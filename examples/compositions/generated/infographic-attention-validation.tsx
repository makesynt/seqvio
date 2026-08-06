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
  TerminalXtermDemo,
} from '@seqvio/technical';


const W = 1280;
const H = 720;
const FPS = 30;


function ResultsScene0() {
  return (
    <TechnicalScene width={W} height={H} annotations={[]}>
      <InfographicScene
        id="results"
        title="One explanation, guided attention"
        metrics={[
  {
    "id": "throughput",
    "label": "Throughput",
    "value": "4.8x",
    "detail": "after batching",
    "color": "#38bdf8",
    "at": 0
  },
  {
    "id": "latency",
    "label": "Latency",
    "value": "120ms",
    "detail": "p95 response",
    "color": "#34d399",
    "at": 39
  },
  {
    "id": "errors",
    "label": "Errors",
    "value": "0.7%",
    "detail": "verified run",
    "color": "#fbbf24"
  }
]}
        comparisons={[
  {
    "id": "build-time",
    "label": "Build time",
    "before": 18,
    "after": 7,
    "beforeLabel": "Before",
    "afterLabel": "After",
    "at": 78
  },
  {
    "id": "review-steps",
    "label": "Review steps",
    "before": 9,
    "after": 4,
    "beforeLabel": "Manual",
    "afterLabel": "Guided"
  }
]}
        process={[
  {
    "id": "capture",
    "label": "Capture",
    "detail": "record the real event"
  },
  {
    "id": "explain",
    "label": "Explain",
    "detail": "show the causal model"
  },
  {
    "id": "verify",
    "label": "Verify",
    "detail": "check the result",
    "at": 123
  }
]}
        timeline={[]}
        relationshipNodes={[]}
        relationships={[]}
        attention={[
  {
    "id": "results.throughput-beat.attention-1",
    "targetId": "throughput",
    "kind": "spotlight",
    "start": 0,
    "duration": 39,
    "minHoldFrames": 39,
    "sourceBeatId": "results.throughput-beat",
    "sceneId": "results",
    "persistence": "until-handoff",
    "handoffTo": "latency"
  },
  {
    "id": "results.latency-beat.attention-1",
    "targetId": "latency",
    "kind": "box",
    "start": 39,
    "duration": 39,
    "minHoldFrames": 39,
    "sourceBeatId": "results.latency-beat",
    "sceneId": "results",
    "persistence": "until-handoff",
    "handoffTo": "build-time"
  },
  {
    "id": "results.comparison-beat.attention-1",
    "targetId": "build-time",
    "kind": "arrow",
    "start": 78,
    "duration": 45,
    "minHoldFrames": 45,
    "sourceBeatId": "results.comparison-beat",
    "sceneId": "results",
    "persistence": "until-handoff",
    "handoffTo": "verify"
  },
  {
    "id": "results.verify-beat.attention-1",
    "targetId": "verify",
    "kind": "spotlight",
    "start": 123,
    "duration": 42,
    "minHoldFrames": 42,
    "sourceBeatId": "results.verify-beat",
    "sceneId": "results",
    "persistence": "until-handoff"
  }
]}
        width={W}
        height={H}
      />
    </TechnicalScene>
  );
}

export default function InfographicAttentionValidation() {
  return (
    <VideoComposition
      id="infographic-attention-validation"
      width={W}
      height={H}
      fps={FPS}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="results" duration={244}>
        <ResultsScene0 />
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: 244,
  width: W,
  height: H,
  pacing: { profile: "explainer-v1", highlights: [
  {
    "id": "results.throughput-beat",
    "source": "beat",
    "startFrame": 0,
    "endFrame": 39,
    "minDurationFrames": 27
  },
  {
    "id": "results.latency-beat",
    "source": "beat",
    "startFrame": 39,
    "endFrame": 78,
    "minDurationFrames": 27
  },
  {
    "id": "results.comparison-beat",
    "source": "beat",
    "startFrame": 78,
    "endFrame": 123,
    "minDurationFrames": 27
  },
  {
    "id": "results.verify-beat",
    "source": "beat",
    "startFrame": 123,
    "endFrame": 165,
    "minDurationFrames": 27
  }
] },
  direction: {
  "sceneActions": [
    {
      "segmentId": "results.throughput-beat",
      "sceneId": "results",
      "purpose": "establish-model",
      "pace": "hold",
      "camera": "follow-target"
    },
    {
      "segmentId": "results.latency-beat",
      "sceneId": "results",
      "purpose": "establish-model",
      "pace": "hold",
      "camera": "follow-target"
    },
    {
      "segmentId": "results.comparison-beat",
      "sceneId": "results",
      "purpose": "establish-model",
      "pace": "hold",
      "camera": "follow-target"
    },
    {
      "segmentId": "results.verify-beat",
      "sceneId": "results",
      "purpose": "establish-model",
      "pace": "hold",
      "camera": "follow-target",
      "transition": "cut"
    }
  ],
  "attention": [
    {
      "segmentId": "results.throughput-beat",
      "sceneId": "results",
      "targetId": "throughput",
      "sourceBeatId": "throughput-beat",
      "start": 0,
      "duration": 1
    },
    {
      "segmentId": "results.latency-beat",
      "sceneId": "results",
      "targetId": "latency",
      "sourceBeatId": "latency-beat",
      "start": 1,
      "duration": 1
    },
    {
      "segmentId": "results.comparison-beat",
      "sceneId": "results",
      "targetId": "build-time",
      "sourceBeatId": "comparison-beat",
      "start": 2,
      "duration": 1
    },
    {
      "segmentId": "results.verify-beat",
      "sceneId": "results",
      "targetId": "verify",
      "sourceBeatId": "verify-beat",
      "start": 3,
      "duration": 1
    }
  ],
  "timingHints": [
    {
      "segmentId": "results.throughput-beat",
      "pace": "hold",
      "minHoldFrames": 30
    },
    {
      "segmentId": "results.latency-beat",
      "pace": "hold",
      "minHoldFrames": 30
    },
    {
      "segmentId": "results.comparison-beat",
      "pace": "hold",
      "minHoldFrames": 30
    },
    {
      "segmentId": "results.verify-beat",
      "pace": "hold",
      "minHoldFrames": 30
    }
  ]
},
  audio: {
    fps: FPS,
    lockToAudio: true,
    pacingProfile: "explainer-v1",
    sceneTimings: [
  {
    "sceneId": "results",
    "startFrame": 0,
    "durationFrames": 244,
    "sourceDurationFrames": 244,
    "transitionAfterFrames": 0,
    "highlights": [
      {
        "id": "results.throughput-beat",
        "source": "beat",
        "startFrame": 0,
        "endFrame": 39,
        "minDurationFrames": 27
      },
      {
        "id": "results.latency-beat",
        "source": "beat",
        "startFrame": 39,
        "endFrame": 78,
        "minDurationFrames": 27
      },
      {
        "id": "results.comparison-beat",
        "source": "beat",
        "startFrame": 78,
        "endFrame": 123,
        "minDurationFrames": 27
      },
      {
        "id": "results.verify-beat",
        "source": "beat",
        "startFrame": 123,
        "endFrame": 165,
        "minDurationFrames": 27
      }
    ]
  }
],
    explanationBeats: [
  {
    "id": "results.throughput-beat",
    "sceneId": "results",
    "cueId": "results.guided",
    "anchor": {
      "text": "Throughput rises first"
    },
    "sourceFrame": 0,
    "visuals": [
      {
        "targetId": "throughput",
        "action": "reveal"
      },
      {
        "targetId": "throughput",
        "action": "focus",
        "minHoldMs": 1300
      }
    ]
  },
  {
    "id": "results.latency-beat",
    "sceneId": "results",
    "cueId": "results.guided",
    "anchor": {
      "text": "Latency is the key measure"
    },
    "sourceFrame": 39,
    "visuals": [
      {
        "targetId": "latency",
        "action": "reveal"
      },
      {
        "targetId": "latency",
        "action": "highlight",
        "minHoldMs": 1300
      }
    ]
  },
  {
    "id": "results.comparison-beat",
    "sceneId": "results",
    "cueId": "results.guided",
    "anchor": {
      "text": "compare the build time"
    },
    "sourceFrame": 78,
    "visuals": [
      {
        "targetId": "build-time",
        "action": "reveal"
      },
      {
        "targetId": "build-time",
        "action": "annotate",
        "minHoldMs": 1500
      }
    ]
  },
  {
    "id": "results.verify-beat",
    "sceneId": "results",
    "cueId": "results.guided",
    "anchor": {
      "text": "verify the result"
    },
    "sourceFrame": 123,
    "visuals": [
      {
        "targetId": "verify",
        "action": "reveal"
      },
      {
        "targetId": "verify",
        "action": "focus",
        "minHoldMs": 1400
      }
    ]
  }
],
    narration: [
  {
    "id": "results.guided",
    "sceneId": "results",
    "text": "Throughput rises first. Latency is the key measure. Then compare the build time and verify the result.",
    "startMs": 0,
    "endMs": 7520
  }
],
  },
};
