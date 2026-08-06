import React from 'react';
import type { MotionGrammar, RenderableMeta } from '@seqvio/core';
import { compileMotionGrammar, Scene, Transition, VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const SCENE_DURATION = 108;
const TRANSITION_DURATION = 12;
const DURATION = SCENE_DURATION * 3 + TRANSITION_DURATION * 2;

const grammar: MotionGrammar = {
  format: 'seqvio-motion-grammar', version: '1.0', id: 'explanation-patterns',
  steps: [
    { id: 'compare-paths', sceneId: 'compare-merge', action: 'compare', targetId: 'manual', relatedTargetId: 'guided', startFrame: 22, holdFrames: 42 },
    { id: 'merge-result', sceneId: 'compare-merge', action: 'transform', targetId: 'merged', startFrame: 70, holdFrames: 28 },
    { id: 'show-problem', sceneId: 'problem-fix', action: 'emphasize', targetId: 'problem', startFrame: 12, holdFrames: 30 },
    { id: 'apply-fix', sceneId: 'problem-fix', action: 'transform', targetId: 'fix', startFrame: 48, holdFrames: 30 },
    { id: 'confirm-fix', sceneId: 'problem-fix', action: 'answer', targetId: 'verified', startFrame: 80, holdFrames: 22 },
    { id: 'trace-process', sceneId: 'process-verification', action: 'trace', targetId: 'observe', pathTargetIds: ['observe', 'decide', 'verify'], startFrame: 16, holdFrames: 62 },
    { id: 'show-verification', sceneId: 'process-verification', action: 'emphasize', targetId: 'verified-result', startFrame: 82, holdFrames: 22 },
  ],
};

const compiled = compileMotionGrammar(grammar);

function CompareMerge() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene id="compare-merge" title="Pattern 01  Compare, then merge" width={W} height={H}
        metrics={[
          { id: 'manual', label: 'Manual path', value: '17 steps', detail: 'repeated decisions', color: '#94a3b8', at: 5 },
          { id: 'guided', label: 'Guided path', value: '6 steps', detail: 'one reusable sequence', color: '#38bdf8', at: 14 },
          { id: 'merged', label: 'Shared model', value: '1 plan', detail: 'the comparison resolves into a model', color: '#34d399', at: 62 },
        ]} attention={compiled.attention} />
    </TechnicalScene>
  );
}

function ProblemFix() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene id="problem-fix" title="Pattern 02  Problem, fix, proof" width={W} height={H}
        metrics={[
          { id: 'problem', label: 'Problem', value: 'Ambiguous', detail: 'the failure is isolated first', color: '#fb7185', at: 4 },
          { id: 'fix', label: 'Fix', value: 'Explicit', detail: 'the changed rule receives focus', color: '#fbbf24', at: 38 },
          { id: 'verified', label: 'Proof', value: 'Passed', detail: 'the outcome closes the explanation', color: '#34d399', at: 70 },
        ]} attention={compiled.attention} />
    </TechnicalScene>
  );
}

function ProcessVerification() {
  return (
    <TechnicalScene width={W} height={H}>
      <InfographicScene id="process-verification" title="Pattern 03  Trace, then verify" width={W} height={H}
        process={[
          { id: 'observe', label: 'Observe', detail: 'collect evidence', at: 4 },
          { id: 'decide', label: 'Decide', detail: 'choose the action', at: 12 },
          { id: 'verify', label: 'Verify', detail: 'measure the result', at: 20 },
        ]}
        metrics={[{ id: 'verified-result', label: 'Verification', value: 'Stable', detail: 'seek-safe path timing', color: '#34d399', at: 72 }]}
        attention={compiled.attention} />
    </TechnicalScene>
  );
}

export default function MotionGrammarValidation() {
  return (
    <VideoComposition id="motion-grammar-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <Scene id="compare-merge" duration={SCENE_DURATION}><CompareMerge /></Scene>
      <Transition type="fade" duration={TRANSITION_DURATION} />
      <Scene id="problem-fix" duration={SCENE_DURATION}><ProblemFix /></Scene>
      <Transition type="fade" duration={TRANSITION_DURATION} />
      <Scene id="process-verification" duration={SCENE_DURATION}><ProcessVerification /></Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = { fps: FPS, duration: DURATION, width: W, height: H };
