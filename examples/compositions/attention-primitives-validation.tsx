import React from 'react';
import type { AttentionSequenceItem, RenderableMeta } from '@seqvio/core';
import { VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 210;

const attention: AttentionSequenceItem[] = [
  { id: 'ring', sceneId: 'primitives', targetId: 'input', kind: 'focus-ring', start: 6, duration: 32, persistence: 'timed' },
  { id: 'callout', sceneId: 'primitives', targetId: 'model', kind: 'callout', start: 42, duration: 34, persistence: 'timed', label: 'The key transformation' },
  { id: 'bracket', sceneId: 'primitives', targetId: 'process-explain', kind: 'bracket', start: 82, duration: 34, persistence: 'timed', label: 'semantic step' },
  { id: 'shade', sceneId: 'primitives', targetId: 'comparison', kind: 'region-shade', start: 122, duration: 34, persistence: 'timed' },
  { id: 'connector', sceneId: 'primitives', targetId: 'input', toTargetId: 'result', kind: 'connector', start: 162, duration: 40, persistence: 'timed', label: 'cause to outcome' },
];

export default function AttentionPrimitivesValidation() {
  return (
    <VideoComposition id="attention-primitives-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <TechnicalScene width={W} height={H}>
        <InfographicScene
          id="primitives"
          title="Reusable attention primitives"
          width={W}
          height={H}
          metrics={[
            { id: 'input', label: 'Input events', value: '2.4k', detail: 'captured evidence', color: '#38bdf8', at: 0 },
            { id: 'model', label: 'Resolved model', value: '12', detail: 'semantic relationships', color: '#a78bfa', at: 18 },
            { id: 'result', label: 'Verified result', value: '98%', detail: 'review confidence', color: '#34d399', at: 36 },
          ]}
          comparisons={[
            { id: 'comparison', label: 'Explanation effort', before: 16, after: 6, beforeLabel: 'Manual', afterLabel: 'Guided', at: 54 },
          ]}
          process={[
            { id: 'process-capture', label: 'Capture', detail: 'preserve what happened', at: 66 },
            { id: 'process-explain', label: 'Explain', detail: 'direct viewer attention', at: 78 },
            { id: 'process-verify', label: 'Verify', detail: 'confirm the outcome', at: 90 },
          ]}
          attention={attention}
        />
      </TechnicalScene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: DURATION,
  width: W,
  height: H,
};
