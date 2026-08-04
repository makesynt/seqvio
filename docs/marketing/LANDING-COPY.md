# Landing Page Copy

## Hero

### Seqvio

### Turn real technical work into explainable video.

Seqvio gives coding agents a visual language for turning technical ideas and
real terminal/browser activity into narration-locked explainer videos.

**Primary CTA:** Watch the workflow demo
**Secondary CTA:** Install the agent skill

Open source. Local rendering. Reviewable plans. Deterministic QA.

## How it works

1. Plan the explanation in readable `EDITORIAL.md` and `VISUAL-DESIGN.md` files.
2. Compile authored content or observed capture into `ExplainerDocument`.
3. Bind spoken phrases, visual actions, and evidence with `ExplanationBeat`.
4. Resolve TTS timing, run QA, and render a local MP4.

## Why it is different

Most generated videos animate an idea from a prompt. Seqvio can preserve what
actually happened in a terminal or browser session, then explain that evidence
with the same timing contract used for authored scenes.

## Current scope

Use the public authoring path for whiteboard, code, and diagram explainers.
Terminal and browser capture are available as experimental adapters and require
their host runtimes. See the repository's feature status before adopting them
in CI.

## What you get

- Human-readable editorial and visual decisions.
- A formal, inspectable `ExplainerDocument`.
- Phrase-level narration and visual alignment.
- Deterministic local rendering and machine-readable QA.
- Reusable TSX compositions for technical content pipelines.
