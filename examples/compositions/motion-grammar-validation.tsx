import React from 'react';
import type { MotionGrammar, RenderableMeta } from '@seqvio/core';
import { compileMotionGrammar, VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const DURATION = 150;

const grammar: MotionGrammar = {
  format: 'seqvio-motion-grammar', version: '1.0', id: 'compare-flow',
  steps: [
    { id: 'question', sceneId: 'results', action: 'question' },
    { id: 'reveal-before', sceneId: 'results', action: 'reveal', targetId: 'before' },
    { id: 'compare', sceneId: 'results', action: 'compare', targetId: 'before', relatedTargetId: 'after', startFrame: 45, holdFrames: 36 },
    { id: 'answer', sceneId: 'results', action: 'answer', targetId: 'after', startFrame: 96, holdFrames: 36 },
  ],
};
const compiled = compileMotionGrammar(grammar);

export default function MotionGrammarValidation() {
  return (
    <VideoComposition id="motion-grammar-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <TechnicalScene width={W} height={H}>
        <InfographicScene
          id="results"
          title="Question, compare, answer"
          width={W}
          height={H}
          metrics={[
            { id: 'before', label: 'Before', value: '17 steps', detail: 'manual review', color: '#94a3b8', at: 10 },
            { id: 'after', label: 'After', value: '6 steps', detail: 'guided review', color: '#34d399', at: 28 },
          ]}
          attention={compiled.attention}
        />
      </TechnicalScene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = { fps: FPS, duration: DURATION, width: W, height: H };
