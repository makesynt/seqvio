import React from 'react';
import type { AttentionSequenceItem, RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
import { InfographicScene, TechnicalScene } from '@seqvio/technical';

const W = 1280;
const H = 720;
const FPS = 30;
const SCENE_DURATION = 96;
const TRANSITION_DURATION = 10;
const DURATION = SCENE_DURATION * 3 + TRANSITION_DURATION * 2;

const attention: AttentionSequenceItem[] = [
  { id: 'approved-focus', sceneId: 'approved', targetId: 'approved-ir', kind: 'spotlight', start: 12, duration: 42, persistence: 'timed' },
  { id: 'task-path', sceneId: 'host-task', targetId: 'semantic-task', pathTargetIds: ['semantic-task', 'reviewable-plan', 'versioned-result'], kind: 'guided-path', start: 16, duration: 64, persistence: 'timed' },
  { id: 'receipt-link', sceneId: 'local-validation', targetId: 'artifact-hash', toTargetId: 'receipt', kind: 'connector', start: 18, duration: 56, persistence: 'timed' },
];

function Approved() {
  return <TechnicalScene width={W} height={H}><InfographicScene id="approved" title="01  Start from approved content" width={W} height={H}
    metrics={[
      { id: 'approved-ir', label: 'ExplainerDocument', value: 'Approved', detail: 'scene, target, beat, and evidence ids are fixed', color: '#38bdf8', at: 4 },
      { id: 'renderer-boundary', label: 'Renderer boundary', value: 'Deterministic', detail: 'no planning call is required at render time', color: '#34d399', at: 26 },
    ]} attention={attention} /></TechnicalScene>;
}

function HostTask() {
  return <TechnicalScene width={W} height={H}><InfographicScene id="host-task" title="02  Request semantic direction" width={W} height={H}
    process={[
      { id: 'semantic-task', label: 'Versioned task', detail: 'generate or repair', at: 4 },
      { id: 'reviewable-plan', label: 'Host Agent', detail: 'works at the intent level', at: 20 },
      { id: 'versioned-result', label: 'Director result', detail: 'plan, attention, motion grammar', at: 36 },
    ]} attention={attention} /></TechnicalScene>;
}

function LocalValidation() {
  return <TechnicalScene width={W} height={H}><InfographicScene id="local-validation" title="03  Validate and audit locally" width={W} height={H}
    metrics={[
      { id: 'artifact-hash', label: 'Artifact hash', value: 'SHA-256', detail: 'the reviewed input and output are identifiable', color: '#fbbf24', at: 4 },
      { id: 'diagnostics', label: 'Diagnostics', value: 'Stable codes', detail: 'repairs remain explainable', color: '#38bdf8', at: 24 },
      { id: 'receipt', label: 'Receipt', value: 'Complete', detail: 'local validation closes the director pass', color: '#34d399', at: 48 },
    ]} attention={attention} /></TechnicalScene>;
}

export default function DirectorSkillsValidation() {
  return <VideoComposition id="director-skills-validation" width={W} height={H} fps={FPS} duration={DURATION} backgroundColor="#0f172a">
    <Scene id="approved" duration={SCENE_DURATION}><Approved /></Scene>
    <Transition type="fade" duration={TRANSITION_DURATION} />
    <Scene id="host-task" duration={SCENE_DURATION}><HostTask /></Scene>
    <Transition type="fade" duration={TRANSITION_DURATION} />
    <Scene id="local-validation" duration={SCENE_DURATION}><LocalValidation /></Scene>
  </VideoComposition>;
}

export const meta: RenderableMeta = { fps: FPS, duration: DURATION, width: W, height: H };
