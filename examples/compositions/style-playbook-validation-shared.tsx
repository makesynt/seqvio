import React from 'react';
import type { AttentionSequenceItem, RenderableMeta, StyleProfile } from '@seqvio/core';
import { Scene, StyleProfileProvider, Transition, VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

export const cleanTechnical: StyleProfile = {
  format: 'seqvio-style-profile', version: '1.0', id: 'clean-technical', label: 'Clean Technical',
  typography: { headingFamily: 'Inter', bodyFamily: 'Inter', monoFamily: 'JetBrains Mono', scale: 'editorial' },
  motionDensity: 'restrained', cameraPolicy: 'semantic-focus', transitionPolicy: 'focus-transfer',
  attentionPersistence: 'until-handoff', spacing: 'comfortable',
  paletteRoles: { background: '#0f172a', ink: '#f8fafc', accent: '#38bdf8', muted: '#94a3b8' },
};
export const editorialExplainer: StyleProfile = {
  format: 'seqvio-style-profile', version: '1.0', id: 'editorial-explainer', label: 'Editorial Explainer',
  typography: { headingFamily: 'Georgia', bodyFamily: 'Inter', monoFamily: 'JetBrains Mono', scale: 'large' },
  motionDensity: 'balanced', cameraPolicy: 'static', transitionPolicy: 'crossfade',
  attentionPersistence: 'until-handoff', spacing: 'airy',
  paletteRoles: { background: '#f7f8fa', ink: '#17202a', accent: '#2563eb', muted: '#64748b' },
};
export const terminalFirst: StyleProfile = {
  format: 'seqvio-style-profile', version: '1.0', id: 'terminal-first', label: 'Terminal First',
  typography: { headingFamily: 'JetBrains Mono', bodyFamily: 'Inter', monoFamily: 'JetBrains Mono', scale: 'compact' },
  motionDensity: 'restrained', cameraPolicy: 'evidence-follow', transitionPolicy: 'cut',
  attentionPersistence: 'timed', spacing: 'tight',
  paletteRoles: { background: '#101418', ink: '#e6edf3', accent: '#2dd4bf', muted: '#8b9aaa' },
};

const W = 1280;
const H = 720;
const FPS = 30;
const SCENE_DURATION = 84;
const TRANSITION_DURATION = 12;
const DURATION = SCENE_DURATION * 2 + TRANSITION_DURATION;
const attention: AttentionSequenceItem[] = [
  { id: 'evidence-focus', sceneId: 'evidence', targetId: 'evidence', kind: 'focus-ring', start: 16, duration: 48, handoffTo: 'verified', handoffToSceneId: 'result' },
  { id: 'result-focus', sceneId: 'result', targetId: 'verified', kind: 'spotlight', start: 12, duration: 52 },
];

export function StylePlaybookValidation({ profile }: { profile: StyleProfile }) {
  return <StyleProfileProvider profile={profile}>
    <VideoComposition id={`style-${profile.id}`} width={W} height={H} fps={FPS} duration={DURATION} backgroundColor={profile.paletteRoles.background}>
      <Scene id="evidence" duration={SCENE_DURATION}><TechnicalScene width={W} height={H}><InfographicScene id="evidence" title="Evidence becomes an explanation" width={W} height={H}
        metrics={[
          { id: 'evidence', label: 'Evidence', value: 'Recorded', detail: 'the source remains inspectable', at: 4 },
          { id: 'model', label: 'Model', value: 'Structured', detail: 'intent is renderer-independent', at: 18 },
          { id: 'plan', label: 'Direction', value: 'Reviewable', detail: 'focus and rhythm are explicit', at: 32 },
        ]} attention={attention} /></TechnicalScene></Scene>
      <Transition type="fade" duration={TRANSITION_DURATION} />
      <Scene id="result" duration={SCENE_DURATION}><TechnicalScene width={W} height={H}><InfographicScene id="result" title="One semantic plan, multiple visual profiles" width={W} height={H}
        metrics={[
          { id: 'verified', label: 'Semantic timing', value: 'Identical', detail: 'targets, beats, and evidence do not move', at: 4 },
          { id: 'visual-profile', label: 'Visual treatment', value: profile.label, detail: 'palette, type, spacing, motion, and camera', at: 20 },
        ]}
        process={[
          { id: 'compile', label: 'Compile', detail: 'same document', at: 34 },
          { id: 'style', label: 'Apply profile', detail: 'visual policy only', at: 46 },
          { id: 'qa', label: 'Verify', detail: 'same focal coverage', at: 58 },
        ]} attention={attention} /></TechnicalScene></Scene>
    </VideoComposition>
  </StyleProfileProvider>;
}

export const stylePlaybookMeta: RenderableMeta = { width: W, height: H, fps: FPS, duration: DURATION };
