import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 240;

function ValidationScene() {
  return (
    <TechnicalScene width={W} height={H} background="#0f172a">
      <InfographicScene
        id="infographic-validation"
        title="Explain the change"
        width={W}
        height={H}
        metrics={[
          { id: 'metric-throughput', label: 'Throughput', value: '4.8x', detail: 'after batching', color: '#38bdf8', at: 0 },
          { id: 'metric-latency', label: 'Latency', value: '120ms', detail: 'p95 response', color: '#34d399', at: 24 },
          { id: 'metric-errors', label: 'Errors', value: '0.7%', detail: 'verified run', color: '#fbbf24', at: 48 },
        ]}
        comparisons={[
          { id: 'comparison-build', label: 'Build time', before: 18, after: 7, beforeLabel: 'Before', afterLabel: 'After', at: 72 },
          { id: 'comparison-review', label: 'Review steps', before: 9, after: 4, beforeLabel: 'Manual', afterLabel: 'Guided', at: 96 },
        ]}
        process={[
          { id: 'process-capture', label: 'Capture', detail: 'record the real event', at: 120 },
          { id: 'process-explain', label: 'Explain', detail: 'show the causal model', at: 138 },
          { id: 'process-verify', label: 'Verify', detail: 'check the result', at: 156 },
        ]}
        relationshipNodes={[
          { id: 'node-agent', label: 'Agent', x: 190, y: 610 },
          { id: 'node-capture', label: 'Capture', x: 430, y: 610 },
          { id: 'node-video', label: 'Explanation', x: 700, y: 610 },
          { id: 'node-review', label: 'Review', x: 980, y: 610 },
        ]}
        relationships={[
          { id: 'rel-agent-capture', from: 'node-agent', to: 'node-capture', label: 'events', at: 174 },
          { id: 'rel-capture-video', from: 'node-capture', to: 'node-video', label: 'meaning', at: 192 },
          { id: 'rel-video-review', from: 'node-video', to: 'node-review', label: 'evidence', at: 210 },
        ]}
        attention={[
          { id: 'focus-throughput', targetId: 'metric-throughput', kind: 'spotlight', start: 12, duration: 54, label: 'key result', handoffTo: 'metric-latency', minHoldFrames: 36 },
          { id: 'focus-latency', targetId: 'metric-latency', kind: 'circle', start: 66, duration: 54, label: 'measure', handoffTo: 'comparison-build', minHoldFrames: 36 },
          { id: 'focus-build', targetId: 'comparison-build', kind: 'box', start: 120, duration: 60, label: 'compare', handoffTo: 'node-video', minHoldFrames: 42 },
          { id: 'focus-video', targetId: 'node-video', kind: 'arrow', start: 180, duration: 48, label: 'explain', minHoldFrames: 30 },
        ]}
      />
    </TechnicalScene>
  );
}

export default function InfographicValidation() {
  return (
    <VideoComposition id="infographic-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <ValidationScene />
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: DURATION,
  width: W,
  height: H,
};
