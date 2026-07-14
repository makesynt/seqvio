# Seqvio Vision

**Seqvio is an explainer-video toolchain for the agent era.**

This document states what Seqvio is, who it is for, and what it deliberately does
not do. It changes slowly. For time-boxed roadmap items and engineering tasks, use
GitHub issues and milestones. For a point-in-time competitive snapshot and earlier
planning history, see [`archive/PRODUCT-PLAN-2026-07.md`](./archive/PRODUCT-PLAN-2026-07.md).

## What Seqvio Is

Seqvio turns structured content into short, narrated explainer videos. Compositions
are authored as React/TSX files and rendered locally and deterministically to MP4
through a Puppeteer + FFmpeg pipeline. The authoring surface is designed so that a
host coding agent (Cursor, Claude Code, Codex, Gemini CLI, and similar) can do the
authoring: small explicit contracts, a validatable Storyboard IR, and a QA loop that
catches broken output before a full render.

Seqvio is deterministic infrastructure, not a creative brain. It does not call
planning or generation APIs from its own core. Creative decisions — scene breakdown,
script, visual intent — belong to the host agent or a human author. Seqvio's job is
to make the result reproducible: the same composition renders the same video, every
time, under version control.

### Core Promise

Structured content to narrated explainer video.

- Education: lessons, concept explainers, step-by-step tutorials.
- Product: feature intros, onboarding flows, release notes, workflow explainers.
- Technical: API walkthroughs, architecture explanation, process diagrams.
- Automated batches: prompt or document to TSX composition to MP4, at scale.

## Where the Value Lives

Code-to-video rendering is becoming a commodity. Remotion is the established
general-purpose React-to-video framework; HeyGen's HyperFrames is an agent-native
open-source HTML-to-video engine; Revideo and Motion Canvas occupy the open-source
alternative space. All of them can turn markup into MP4, and coding agents can emit
code for any of them. Seqvio does not compete on being a better generic renderer —
on that axis it would lose.

Seqvio's bet is that the hard part of an explainer video is not the render loop.
It is everything a general renderer refuses to have an opinion about:

- **Narration-first timing.** Audio metadata and visual timing live in the same
  composition, and scene duration follows synthesized narration ("voice is the
  clock") rather than hand-guessed padding. This is the single most common failure
  mode of naive generated videos, and Seqvio makes it a contract, not a convention.
- **Explainer-native scene vocabulary.** Hand-drawn whiteboard, sticky-note, and
  product-walkthrough primitives with built-in draw timing — not a blank canvas
  assembled from scratch per video.
- **A structured plan contract.** Storyboard IR that a host agent can generate,
  validate, repair, and recompile deterministically — so agent output is checkable
  before it becomes code.
- **A visual QA loop.** Key-frame snapshots that catch blank frames, overflowing
  text, and layout breakage before committing to a full MP4 pass.
- **One source, many variants.** Multilingual narration and captions from a single
  version-controlled composition.

The renderer is a means, not the identity. If commodity render engines keep
improving, the explainer layer above them is the part of Seqvio that must remain
worth existing — and that is where development effort concentrates.

## Who It Is For

- Developer advocates and technical writers turning docs into tutorials.
- Educators and course creators who need fast, repeatable concept videos.
- Product teams that need onboarding and feature-announcement videos.
- AI agents that need a deterministic explainer-video backend.

The common thread: users who already work in code (or delegate to an agent that
does) and want their video pipeline to live in the same repo, reviewed and versioned
like any other source.

## Visual Styles

Styles are the vocabulary of the explainer layer, not the selling point. The
renderer and the core timing, narration, and caption contracts are style-agnostic;
each visual style is a package.

- `@seqvio/whiteboard` — hand-drawn SVG whiteboard scenes. The deepest style and
  the reference implementation for the timing and QA contracts.
- `@seqvio/scatterbrain` — sticky-note / cork-board workshop scenes.
- `@seqvio/product-demo` — browser frames, screenshots, cursor paths, and callouts
  for product walkthroughs.

Depth beats breadth: whiteboard leads on polish, and a new style is only worth
adding when it serves an explainer job the existing styles cannot. Every style must
share the same timing, narration, caption, and rendering contracts — a style is a
set of components, never a fork of the pipeline.

## Scope

### In Scope

- Short-form explainer videos, roughly 15 seconds to 3 minutes.
- Hand-authored or agent-authored TSX compositions as the production surface.
- Storyboard IR as the structured input contract for host agents and future editors.
- Structured narration, caption, and timing metadata with pluggable TTS providers.
- Programmatic, deterministic, local rendering to MP4.
- Multilingual narration and caption variants from one source composition.

### Out of Scope

- Competing with general-purpose code-to-video engines on rendering features.
- General-purpose or nonlinear video editing (Premiere / DaVinci-class multi-track).
- Arbitrary motion-graphics or VFX (chroma key, color grading, general compositing).
- Cloud rendering, real-time collaboration, and asset marketplaces.
- Photorealistic or generative-model video.

Scope decisions can change, but they change here and deliberately — not by accretion.

## Design Principles

- **Opinionated about explainers, not about rendering.** Domain contracts (voice is
  the clock, IR validation, QA gates) are the product; the render loop is
  replaceable infrastructure.
- **Determinism over magic.** Same input, same output. AI lives at the edges, in the
  host agent, never hidden inside the render.
- **Code is the source of truth.** TSX is the production surface; docs describe it,
  they do not promise beyond it.
- **Depth before breadth.** One credible style and a reliable pipeline beat many
  half-finished styles.
- **Honesty in docs.** When documentation and code disagree, the code wins, and the
  docs get fixed.
