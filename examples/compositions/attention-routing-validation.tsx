import React from 'react';
import type { AttentionSequenceItem, RenderableMeta } from '@seqvio/core';
import { VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 210;

const attention: AttentionSequenceItem[] = [
  { id: 'safe-callout', sceneId: 'routing', targetId: 'input', kind: 'callout', start: 4, duration: 42, persistence: 'timed', label: 'Placed inside the safe area' },
  { id: 'routed-connector', sceneId: 'routing', targetId: 'input', toTargetId: 'result', kind: 'connector', start: 54, duration: 44, persistence: 'timed', label: 'orthogonal route' },
  { id: 'guided-explanation', sceneId: 'routing', targetId: 'input', pathTargetIds: ['input', 'model', 'process-explain', 'result'], kind: 'guided-path', start: 108, duration: 88, persistence: 'timed' },
];

export default function AttentionRoutingValidation() {
  return (
    <VideoComposition id="attention-routing-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <TechnicalScene width={W} height={H}>
        <InfographicScene
          id="routing"
          title="Guided focus path and safe routing"
          width={W}
          height={H}
          metrics={[
            { id: 'input', label: 'Input', value: 'Events', detail: 'top-edge callout target', color: '#38bdf8', at: 0 },
            { id: 'model', label: 'Model', value: 'Meaning', detail: 'second path stop', color: '#a78bfa', at: 18 },
            { id: 'result', label: 'Result', value: 'Verified', detail: 'final path stop', color: '#34d399', at: 36 },
          ]}
          comparisons={[
            { id: 'effort', label: 'Viewer effort', before: 17, after: 6, beforeLabel: 'Unguided', afterLabel: 'Guided', at: 48 },
          ]}
          process={[
            { id: 'process-capture', label: 'Capture', detail: 'preserve evidence', at: 64 },
            { id: 'process-explain', label: 'Explain', detail: 'route attention', at: 80 },
            { id: 'process-verify', label: 'Verify', detail: 'close the loop', at: 96 },
          ]}
          attention={attention}
        />
      </TechnicalScene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = { fps: FPS, duration: DURATION, width: W, height: H };
