import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import {
  OVERVIEW_FPS,
  SeqvioOverview,
  type OverviewCopy,
} from './seqvio-overview-shared';

// Scene 4 carries a 45-frame tail after the narration-locked drawing:
// the whiteboard pulls back into a player chrome with the "unedited" badge.
const SCENES = [62, 123, 178, 313, 196, 190, 223] as const;

const copy: OverviewCopy = {
  lang: 'en',
  hookTop: 'A video can move',
  hookBottom: 'and still explain nothing.',
  hookRail: 'Motion is not the same as explanation.',
  promiseTitle: 'Explain what really happened.',
  promiseRail: 'Seqvio turns technical ideas and system evidence into narrated video.',
  vocabulary: ['PLAN', 'EVIDENCE', 'BEATS'],
  promptLabel: 'A REAL TECHNICAL TASK, INSIDE A CODING AGENT',
  promptText: 'Using /seqvio, explain why a native module failed in CI and how the repair was verified.',
  promptRail: 'The host agent makes the editorial decisions. Seqvio makes them executable and checkable.',
  files: ['EDITORIAL.md', 'explainer.json', 'qa-report.json'],
  ragTitle: 'Why the native module failed in CI',
  ragSteps: ['SYMPTOM', 'LOAD PATH', 'ROOT CAUSE', 'VERIFIED'],
  ragRail: 'The claim stays connected to the observed evidence.',
  stylesTitle: 'The right evidence for each claim.',
  stylesRail: 'Use authored scenes for models and capture-derived scenes for what actually happened.',
  styleLabels: ['AUTHORED MODEL', 'REVIEWABLE PLAN', 'CAPTURE EVIDENCE'],
  styleNotes: ['expected path', 'claim', 'evidence', 'repair'],
  proofTitle: 'Real workflow. Real output.',
  proofRail: 'Author, validate, align, check, and render with the tools that ship today.',
  checks: ['structure', 'voice timing', 'key frame', 'final render'],
  closeKicker: 'OPEN SOURCE / AGENT-NATIVE EXPLAINERS',
  closeTitle: 'Teach your agent to explain.',
  closeRail: 'Not just generated motion. A reviewable explanation grounded in evidence.',
  cta: 'github.com/makesynt/seqvio',
  hookTeaser: 'MADE BY AN AGENT',
  outputBadge: 'RENDERED BY SEQVIO · UNEDITED',
  playerFile: 'native-module-ci.mp4',
  ctaInstall: 'npm install -g @seqvio/renderer',
  ctaStar: 'Star on GitHub',
  proofOutputs: [
    'plan reviewed · omissions preserved',
    'beats resolved · voice is the clock',
    'QA passed · evidence and highlights checked',
    'local MP4 · reproducible render artifacts',
  ],
};

const narration = [
  {
    id: 'hook',
    sceneId: 'hook',
    text: 'A video can move, and still explain nothing.',
  },
  {
    id: 'promise',
    sceneId: 'promise',
    text: 'Seqvio gives coding agents a visual language for explaining ideas.',
  },
  {
    id: 'prompt',
    sceneId: 'prompt',
    text: 'Give your agent a real topic: explain how retrieval augmented generation turns a question into an answer.',
  },
  {
    id: 'explanation',
    sceneId: 'explanation',
    text: 'The agent reviews the explanation plan and visual direction. Seqvio compiles them into an ExplainerDocument, then binds each spoken phrase to a visual action and observed evidence.',
  },
  {
    id: 'styles',
    sceneId: 'styles',
    text: 'Use whiteboard, code, and diagram scenes for authored models. Use terminal or browser capture when the explanation depends on what actually happened.',
  },
  {
    id: 'proof',
    sceneId: 'proof',
    text: 'Seqvio resolves post-TTS timing, checks semantic beats and key frames, reports capture problems, and renders the final video locally.',
  },
  {
    id: 'closing',
    sceneId: 'closing',
    text: 'Not just generated motion. A reviewable explanation grounded in evidence. Teach your agent to explain with Seqvio. Open source on GitHub.',
  },
];

export default function SeqvioProductHuntEn() {
  return (
    <SeqvioOverview
      id="seqvio-product-hunt-en"
      copy={copy}
      sceneDurations={SCENES}
      duration={meta.duration}
      audio={meta.audio!}
      stageWidth={meta.width}
      stageHeight={meta.height}
    />
  );
}

export const meta: RenderableMeta = {
  duration: SCENES.reduce((sum, value) => sum + value, 0),
  fps: OVERVIEW_FPS,
  width: 1920,
  height: 1080,
  audio: {
    fps: OVERVIEW_FPS,
    lockToAudio: true,
    narration,
  },
};
