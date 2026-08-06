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
  hookTop: 'Your coding agent did the work.',
  hookBottom: 'Now let it explain what actually happened.',
  hookRail: 'Seqvio turns technical work into a clear, verifiable video.',
  promiseTitle: 'A visual language for technical explanation.',
  promiseRail: 'Built around intent, evidence, and understanding.',
  vocabulary: ['INTENT', 'EVIDENCE', 'CLARITY'],
  promptLabel: 'A TECHNICAL TASK, DOCUMENT, OR WORKFLOW',
  promptText: 'Using /seqvio, explain how this technical workflow works and what viewers need to understand.',
  promptRail: 'The agent decides what viewers need to learn. Seqvio makes the explanation executable and checkable.',
  files: ['EDITORIAL.md', 'explainer.json', 'qa-report.json'],
  ragTitle: 'How technical work becomes an explanation',
  ragSteps: ['QUESTION', 'MODEL', 'EVIDENCE', 'VERIFIED'],
  ragRail: 'Each spoken point stays connected to a meaningful visual action.',
  stylesTitle: 'Use the right visual for each idea.',
  stylesRail: 'Explain ideas with authored scenes. Show real activity with terminal and browser capture.',
  styleLabels: ['AUTHORED MODEL', 'EXPLANATION PLAN', 'CAPTURE EVIDENCE'],
  styleNotes: ['concept', 'intent', 'evidence', 'result'],
  proofTitle: 'Aligned, checked, and rendered locally.',
  proofRail: 'Timing, layout, media, and evidence are checked before delivery.',
  checks: ['timing', 'layout', 'media', 'evidence'],
  closeKicker: 'OPEN SOURCE / AGENT-NATIVE EXPLAINERS',
  closeTitle: 'Turn work into explanation.',
  closeRail: "Turn your agent's work into an explanation people can follow.",
  cta: 'github.com/makesynt/seqvio',
  hookTeaser: 'MADE BY AN AGENT',
  outputBadge: 'RENDERED BY SEQVIO · VERIFIED',
  playerFile: 'technical-explainer.mp4',
  ctaInstall: 'npm install -g @seqvio/renderer',
  ctaStar: 'Star on GitHub',
  proofOutputs: [
    'intent reviewed · learning goal preserved',
    'beats resolved · voice is the clock',
    'QA passed · layout and evidence checked',
    'local MP4 · reproducible render artifacts',
  ],
};

const narration = [
  {
    id: 'hook',
    sceneId: 'hook',
    text: 'Your coding agent did the work. Now let it explain what actually happened. Seqvio turns technical work into a clear, verifiable video.',
  },
  {
    id: 'promise',
    sceneId: 'promise',
    text: 'Seqvio gives agents a visual language built around intent, evidence, and understanding.',
  },
  {
    id: 'prompt',
    sceneId: 'prompt',
    text: 'Start with a task, document, or workflow. The agent decides what viewers need to learn.',
  },
  {
    id: 'explanation',
    sceneId: 'explanation',
    text: 'The plan becomes an ExplainerDocument. ExplanationBeats connect spoken phrases to visual actions and captured evidence.',
  },
  {
    id: 'styles',
    sceneId: 'styles',
    text: 'Use code and diagrams for ideas. Use terminal and browser sessions to show what actually happened.',
  },
  {
    id: 'proof',
    sceneId: 'proof',
    text: 'Seqvio aligns scenes to the final voice, checks timing, layout, media, and evidence, then renders locally.',
  },
  {
    id: 'closing',
    sceneId: 'closing',
    text: "No disconnected motion. No timeline guesswork. Turn your agent's work into an explanation people can follow.",
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
