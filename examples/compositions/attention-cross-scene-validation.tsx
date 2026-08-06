import React from 'react';
import type { AttentionSequenceItem, RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const SCENE_DURATION = 120;
const TRANSITION_DURATION = 12;
const DURATION = SCENE_DURATION * 2 + TRANSITION_DURATION;

const attentionPlan: AttentionSequenceItem[] = [
  {
    id: 'inspect-signal',
    sceneId: 'observe',
    targetId: 'signal',
    kind: 'spotlight',
    start: 10,
    duration: 24,
    persistence: 'until-clear',
    clearAt: 102,
    minHoldFrames: 36,
    handoffTo: 'decision',
    handoffToSceneId: 'decide',
  },
  {
    id: 'explain-decision',
    sceneId: 'decide',
    targetId: 'decision',
    kind: 'box',
    start: 8,
    duration: 70,
    persistence: 'timed',
    minHoldFrames: 48,
  },
];

function ObserveScene() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene
        id="observe"
        title="01  Observe the signal"
        width={W}
        height={H}
        metrics={[
          { id: 'signal', label: 'Queue pressure', value: '82%', detail: 'attention persists until evidence is complete', color: '#fbbf24', at: 0 },
          { id: 'noise', label: 'Background noise', value: '14%', detail: 'kept outside the focal path', color: '#94a3b8', at: 20 },
          { id: 'window', label: 'Review window', value: '3.4s', detail: 'explicit clear before transition', color: '#38bdf8', at: 40 },
        ]}
        comparisons={[
          { id: 'pressure-change', label: 'Pressure change', before: 31, after: 82, beforeLabel: 'Start', afterLabel: 'Now', at: 55 },
        ]}
        attention={attentionPlan}
      />
    </TechnicalScene>
  );
}

function DecideScene() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene
        id="decide"
        title="02  Transfer attention to the decision"
        width={W}
        height={H}
        metrics={[
          { id: 'decision', label: 'Selected action', value: 'Scale', detail: 'new scene, new target, same semantic thread', color: '#34d399', at: 0 },
          { id: 'workers', label: 'Workers', value: '+4', detail: 'bounded response', color: '#38bdf8', at: 24 },
          { id: 'result', label: 'Pressure after', value: '46%', detail: 'verified outcome', color: '#fbbf24', at: 48 },
        ]}
        process={[
          { id: 'read', label: 'Read', detail: 'observe the signal', at: 60 },
          { id: 'act', label: 'Act', detail: 'apply the decision', at: 76 },
          { id: 'confirm', label: 'Confirm', detail: 'measure the result', at: 92 },
        ]}
        attention={attentionPlan}
      />
    </TechnicalScene>
  );
}

export default function AttentionCrossSceneValidation() {
  return (
    <VideoComposition id="attention-cross-scene-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <Scene id="observe" duration={SCENE_DURATION}><ObserveScene /></Scene>
      <Transition type="fade" duration={TRANSITION_DURATION} />
      <Scene id="decide" duration={SCENE_DURATION}><DecideScene /></Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: DURATION,
  width: W,
  height: H,
};
