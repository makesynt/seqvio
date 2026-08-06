import React from 'react';
import { Scene, VideoComposition, type RenderableMeta } from '@seqvio/core';
import { ManimClip, TechnicalScene } from '@seqvio/technical';

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 30;
const GRAPH_DURATION = 213;
const PROOF_DURATION = 222;
const GRAPH = 'file:///D:/video-agent/seqvio/output/manim-fixtures/videos/graph/480p30/GraphExplanation.mp4';
const PROOF = 'file:///D:/video-agent/seqvio/output/manim-fixtures/videos/proof/480p30/AlgebraProof.mp4';

function ClipFrame({ label, detail, children }: { label: string; detail: string; children: React.ReactNode }) {
  return (
    <TechnicalScene width={WIDTH} height={HEIGHT} background="#0f172a">
      <div style={{ position: 'absolute', left: 52, top: 42, zIndex: 2, fontFamily: 'Inter, Arial, sans-serif' }}>
        <div style={{ color: '#7aa7ff', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>{label}</div>
        <div style={{ marginTop: 7, color: '#dfe7ef', fontSize: 28, fontWeight: 720 }}>{detail}</div>
      </div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 120, bottom: 58, overflow: 'hidden' }}>{children}</div>
    </TechnicalScene>
  );
}

export default function ManimEndToEndValidation() {
  return (
    <VideoComposition id="manim-end-to-end-validation" width={WIDTH} height={HEIGHT} fps={FPS} duration={GRAPH_DURATION + PROOF_DURATION} backgroundColor="#0f172a">
      <Scene id="graph" duration={GRAPH_DURATION}>
        <ClipFrame label="Graph" detail="曲线让增长速度直接可见">
          <ManimClip id="graph" src={GRAPH} width={1120} height={542} fps={FPS} markers={[{ id: 'axes', frame: 0 }, { id: 'curve', frame: 24 }, { id: 'acceleration', frame: 96, targetId: 'graph-result' }]} />
        </ClipFrame>
      </Scene>
      <Scene id="proof" duration={PROOF_DURATION}>
        <ClipFrame label="Proof" detail="等价变换保留勾股关系">
          <ManimClip id="proof" src={PROOF} width={1120} height={542} fps={FPS} markers={[{ id: 'identity', frame: 0 }, { id: 'transform', frame: 27 }, { id: 'result', frame: 93, targetId: 'proof-result' }]} />
        </ClipFrame>
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  width: WIDTH,
  height: HEIGHT,
  fps: FPS,
  duration: GRAPH_DURATION + PROOF_DURATION,
  audio: {
    fps: FPS,
    duration: GRAPH_DURATION + PROOF_DURATION,
    lockToAudio: true,
    narration: [
      { id: 'graph.voice', sceneId: 'graph', text: '先看曲线。点沿着曲线移动，让增长速度越来越快这件事直接可见。', startMs: 0, endMs: 5600 },
      { id: 'proof.voice', sceneId: 'proof', text: '再看代数证明。每一步只做等价变换，最后把勾股关系清楚地保留下来。', startMs: 6000, endMs: 11800 },
    ],
    sceneTimings: [
      { sceneId: 'graph', startFrame: 0, durationFrames: GRAPH_DURATION, sourceDurationFrames: 180 },
      { sceneId: 'proof', startFrame: GRAPH_DURATION, durationFrames: PROOF_DURATION, sourceDurationFrames: 180 },
    ],
  },
};
