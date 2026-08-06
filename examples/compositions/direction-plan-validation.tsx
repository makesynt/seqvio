import React from 'react';
import type { AttentionSequenceItem, RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const SCENE_DURATION = 105;
const TRANSITION_DURATION = 15;
const DURATION = SCENE_DURATION * 2 + TRANSITION_DURATION;

const attention: AttentionSequenceItem[] = [
  { id: 'follow-input', sceneId: 'model', targetId: 'input', kind: 'box', start: 10, duration: 28, persistence: 'timed' },
  {
    id: 'match-output', sceneId: 'model', targetId: 'output', kind: 'spotlight', start: 45, duration: 48,
    persistence: 'until-clear', clearAt: 100, handoffTo: 'resolved', handoffToSceneId: 'result', minHoldFrames: 36,
  },
  { id: 'confirm-resolved', sceneId: 'result', targetId: 'resolved', kind: 'spotlight', start: 5, duration: 52, persistence: 'timed', minHoldFrames: 36 },
];

function ModelScene() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene
        id="model" title="Follow the explanation, not the clock" width={W} height={H}
        metrics={[
          { id: 'input', label: 'Evidence', value: 'Input', detail: 'first semantic target', color: '#38bdf8', at: 5 },
          { id: 'model-step', label: 'Reasoning', value: 'Model', detail: 'the mechanism stays visible', color: '#a78bfa', at: 20 },
          { id: 'output', label: 'Candidate', value: 'Output', detail: 'source object for the scene handoff', color: '#fbbf24', at: 35 },
        ]}
        process={[
          { id: 'read', label: 'Read', detail: 'focus enters', at: 54 },
          { id: 'explain', label: 'Explain', detail: 'camera follows meaning', at: 66 },
          { id: 'handoff', label: 'Handoff', detail: 'object identity is preserved', at: 78 },
        ]}
        attention={attention}
      />
    </TechnicalScene>
  );
}

function ResultScene() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene
        id="result" title="The same idea lands in the next scene" width={W} height={H}
        metrics={[
          { id: 'resolved', label: 'Verified result', value: 'Resolved', detail: 'destination object receives the focal handoff', color: '#34d399', at: 2 },
          { id: 'semantic-plan', label: 'DirectionPlan', value: 'Stable', detail: 'duration and chapter reflow do not change intent', color: '#38bdf8', at: 24 },
          { id: 'diagnostics', label: 'Conflicts', value: 'Caught', detail: 'invalid focus and camera combinations fail early', color: '#fbbf24', at: 42 },
        ]}
        attention={attention}
      />
    </TechnicalScene>
  );
}

export default function DirectionPlanValidation() {
  return (
    <VideoComposition id="direction-plan-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <Scene id="model" duration={SCENE_DURATION}><ModelScene /></Scene>
      <Transition type="fade" duration={TRANSITION_DURATION} />
      <Scene id="result" duration={SCENE_DURATION}><ResultScene /></Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = { fps: FPS, duration: DURATION, width: W, height: H };
