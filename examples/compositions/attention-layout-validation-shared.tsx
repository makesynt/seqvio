import React from 'react';
import { AnnotationTarget, VideoComposition, type AnnotationItem, type RenderableMeta } from '@seqvio/core';
import { TechnicalScene } from '@seqvio/technical';

const FPS = 30;
const DURATION = 180;

export function attentionLayoutValidationMeta(width: number, height: number): RenderableMeta {
  return { width, height, fps: FPS, duration: DURATION };
}

export function AttentionLayoutValidationComposition({ width, height, id }: { width: number; height: number; id: string }) {
  const compact = width < height;
  const boxWidth = compact ? Math.min(190, width * 0.32) : Math.min(210, width * 0.18);
  const boxHeight = compact ? 74 : 82;
  const y = compact ? height * 0.38 : height * 0.43;
  const positions = compact ? [width * 0.08, width * 0.36, width * 0.64] : [width * 0.1, width * 0.41, width * 0.72];
  const annotations: AnnotationItem[] = [
    { id: 'label-input', targetId: 'input', kind: 'callout', start: 8, duration: 150, label: 'source event' },
    { id: 'label-model', targetId: 'model', kind: 'callout', start: 8, duration: 150, label: 'causal model' },
    { id: 'label-result', targetId: 'result', kind: 'callout', start: 8, duration: 150, label: 'verified result' },
    { id: 'route-around-model', targetId: 'input', toTargetId: 'result', kind: 'connector', start: 52, duration: 106, label: 'evidence flow' },
  ];
  return (
    <VideoComposition id={id} width={width} height={height} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
      <TechnicalScene width={width} height={height} background="#0f172a" annotations={annotations}>
        <div style={{ position: 'absolute', left: width * 0.07, top: height * 0.09, color: '#e6edf5', fontSize: compact ? 28 : 36, fontWeight: 760 }}>Attention stays readable</div>
        <div style={{ position: 'absolute', left: width * 0.07, top: height * 0.16, color: '#8494a6', fontSize: compact ? 15 : 18 }}>Labels share one layout pass. Routes avoid occupied regions.</div>
        {[
          ['input', 'Input', 'events', '#4f8cff'],
          ['model', 'Model', 'meaning', '#f0a43c'],
          ['result', 'Result', 'verified', '#21a179'],
        ].map(([targetId, title, detail, color], index) => (
          <AnnotationTarget key={targetId} id={targetId} style={{ position: 'absolute', left: positions[index], top: y, width: boxWidth, height: boxHeight, boxSizing: 'border-box', padding: compact ? 12 : 16, borderRadius: 7, background: '#1d2938', border: `1px solid ${color}` }}>
            <div style={{ color, fontSize: compact ? 14 : 16, fontWeight: 700 }}>{title}</div>
            <div style={{ marginTop: 7, color: '#aeb9c5', fontSize: compact ? 13 : 15 }}>{detail}</div>
          </AnnotationTarget>
        ))}
        <div style={{ position: 'absolute', left: width * 0.07, right: width * 0.07, bottom: height * 0.1, borderTop: '1px solid #2e3b4b', paddingTop: 16, color: '#6f8296', fontSize: compact ? 13 : 15 }}>Deterministic at 16:9, 1:1, and 9:16</div>
      </TechnicalScene>
    </VideoComposition>
  );
}
