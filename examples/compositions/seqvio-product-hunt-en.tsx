import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import {
  OVERVIEW_FPS,
  SeqvioOverview,
  type OverviewCopy,
} from './seqvio-overview-shared';

const SCENES = [62, 123, 178, 268, 196, 190, 223] as const;

const copy: OverviewCopy = {
  lang: 'en',
  hookTop: 'A video can move',
  hookBottom: 'and still explain nothing.',
  hookRail: 'Motion is not the same as explanation.',
  promiseTitle: 'A visual language for AI agents.',
  promiseRail: 'Seqvio gives agents scenes, narration, and timed visual steps.',
  vocabulary: ['SCENES', 'VOICE', 'VISUAL STEPS'],
  promptLabel: 'A REAL TASK, INSIDE A CODING AGENT',
  promptText: 'Using /seqvio, explain how RAG turns a question into an answer.',
  promptRail: 'The host agent plans. Seqvio supplies the explainer vocabulary.',
  files: ['storyboard.json', 'rag-explainer.tsx', 'narration manifest'],
  ragTitle: 'How RAG turns a question into an answer',
  ragSteps: ['QUESTION', 'EMBEDDING', 'CONTEXT', 'ANSWER'],
  ragRail: 'The idea becomes a sequence people can follow.',
  stylesTitle: 'One explanation. Three visual languages.',
  stylesRail: 'Choose the visual grammar that fits the idea.',
  styleLabels: ['WHITEBOARD LESSON', 'STICKY-NOTE WORKSHOP', 'PRODUCT WALKTHROUGH'],
  styleNotes: ['step by step', 'question', 'context', 'answer'],
  proofTitle: 'Real workflow. Real output.',
  proofRail: 'Author, validate, align, check, and render with the tools that ship today.',
  checks: ['structure', 'voice timing', 'key frame', 'final render'],
  closeKicker: 'OPEN SOURCE / AGENT-NATIVE EXPLAINERS',
  closeTitle: 'Teach your agent to explain.',
  closeRail: 'Not just generated motion. A clear visual explanation.',
  cta: 'github.com/makesynt/seqvio',
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
    text: 'The agent maps the idea into scenes, narration, and timed visual steps. The question becomes an embedding. The embedding finds context. The context shapes the answer.',
  },
  {
    id: 'styles',
    sceneId: 'styles',
    text: 'One explanation. Three visual languages: a whiteboard lesson, a sticky-note workshop, or a product walkthrough.',
  },
  {
    id: 'proof',
    sceneId: 'proof',
    text: 'The agent authors. Seqvio validates the structure, aligns the voice, checks key frames, and renders locally.',
  },
  {
    id: 'closing',
    sceneId: 'closing',
    text: 'Not just generated motion. A clear explanation. Teach your agent to explain with Seqvio. Open source on GitHub.',
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
    />
  );
}

export const meta: RenderableMeta = {
  duration: SCENES.reduce((sum, value) => sum + value, 0),
  fps: OVERVIEW_FPS,
  width: 1280,
  height: 720,
  audio: {
    fps: OVERVIEW_FPS,
    lockToAudio: true,
    narration,
  },
};
