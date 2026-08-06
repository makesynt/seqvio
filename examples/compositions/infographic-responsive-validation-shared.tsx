import React from 'react';
import { VideoComposition, type RenderableMeta } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const FPS = 15;
const DURATION = 105;

export function infographicResponsiveMeta(width: number, height: number): RenderableMeta {
  return { width, height, fps: FPS, duration: DURATION };
}

export function InfographicResponsiveValidation({ width, height, id }: { width: number; height: number; id: string }) {
  return <VideoComposition id={id} width={width} height={height} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
    <TechnicalScene width={width} height={height}>
      <InfographicScene id="responsive" title="Evidence to verified result" width={width} height={height} density="auto"
        metrics={[
          { id: 'evidence', label: 'Evidence', value: '2.4k', detail: 'recorded events', color: '#38bdf8', at: 2 },
          { id: 'model', label: 'Model', value: '12', detail: 'semantic relationships', color: '#a78bfa', at: 12 },
          { id: 'result', label: 'Result', value: '98%', detail: 'verified confidence', color: '#34d399', at: 22 },
        ]}
        comparisons={[{ id: 'effort', label: 'Review effort', before: 17, after: 6, beforeLabel: 'Before', afterLabel: 'After', at: 34 }]}
        process={[
          { id: 'observe', label: 'Observe', detail: 'collect evidence', at: 48 },
          { id: 'explain', label: 'Explain', detail: 'show the mechanism', at: 60 },
          { id: 'verify', label: 'Verify', detail: 'confirm the outcome', at: 72 },
        ]}
        attention={[{ id: 'focus-result', sceneId: 'responsive', targetId: 'result', kind: 'focus-ring', start: 78, duration: 24, persistence: 'timed', priority: 10 }]}
      />
    </TechnicalScene>
  </VideoComposition>;
}
