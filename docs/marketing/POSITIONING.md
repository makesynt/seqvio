# Seqvio Positioning

## One sentence

Seqvio turns technical ideas and real terminal/browser evidence into narration-locked explainer videos for coding agents.

## What it is

Seqvio is an open-source, local explainer production framework. A host agent or
human author makes the creative decisions; Seqvio provides the reviewable
authoring artifacts, executable `ExplainerDocument` contract, visual scene
vocabulary, timing alignment, capture adapters, QA, and MP4 rendering.

## The product path

```text
source material or real capture
  -> EditorialPlan
  -> VisualDesignBrief
  -> ExplainerDocument
  -> ExplanationBeat timing
  -> TTS alignment and QA
  -> local MP4
```

`EditorialPlan` and `VisualDesignBrief` are human-readable planning surfaces.
`ExplainerDocument` is the formal execution IR. `ExplanationBeat` keeps a
spoken phrase, the visual action, and capture evidence in one unit.

## Current capability boundary

Public authoring and rendering support five complete scene families:
`whiteboard`, `code`, `diagram`, `terminal`, and `browser`. Terminal and browser
scenes are capture-derived and must not be invented as if they were observed.
The capture adapters are experimental even though their compiled scene paths
and QA contracts are implemented.

The six explanation patterns are optional editorial advice: `causal-diagnosis`,
`mechanism-trace`, `system-flow`, `evidence-demonstration`,
`misconception-reframe`, and `progressive-model`. They are not templates and do
not constrain the executable IR.

## What Seqvio is not

- A general-purpose nonlinear editor.
- A photorealistic or one-shot prompt-to-video generator.
- A hosted planner or LLM provider.
- A guarantee of high aesthetic quality without human editorial and visual review.

## Audience

The primary audience is developers, developer advocates, technical writers,
educators, and agents producing technical explainers inside a versioned code
repository. Product walkthroughs and broader educational videos are supported,
but the strongest differentiation is fidelity to real system activity.
