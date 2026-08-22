# Seqvio Vision

**Seqvio is a visual language for agents to explain ideas.**

This document states what Seqvio is, who it is for, and what it deliberately does
not do. It changes slowly. For the ordered bet on what to build next, see
[`ROADMAP.md`](./ROADMAP.md); for time-boxed engineering tasks, use GitHub issues
and milestones. For a point-in-time competitive snapshot and earlier planning
history, see [`archive/PRODUCT-PLAN-2026-07.md`](./archive/PRODUCT-PLAN-2026-07.md).

## What Seqvio Is

Seqvio gives a host coding agent (Cursor, Claude Code, Codex, Gemini CLI, and similar)
an explainer-native visual vocabulary: scenes, narration, whiteboards, sticky-note
workshops, product walkthroughs, and a QA loop. The agent uses those primitives to
decide what the viewer should see, hear, and understand next instead of filling a
generic motion template.

`ExplainerDocument` is the canonical interchange contract for captured and
agent-authored explainers; it compiles to editable React/TSX, which is rendered
locally to MP4 through Puppeteer + FFmpeg. Seqvio does not make planning or
generation API calls from its core; creative decisions belong to the host agent
or human author, while Seqvio supplies the visual contracts and production
workflow.

### Core Promise

A visual language for agents to explain ideas.

- Education: lessons, concept explainers, step-by-step tutorials.
- Product: feature intros, onboarding flows, release notes, workflow explainers.
- Technical: API walkthroughs, architecture explanation, process diagrams.
- Automated batches: real system events or documents to TSX compositions to MP4,
  at scale — driven by capture, not prompt-to-video from nothing.

## Where the Value Lives

Code-to-video rendering is a commodity, and as of mid-2026 the closed layer
around it — composition in, MP4 out, plus a structured plan, static linting, and
frame regression — is no longer a frontier either. Remotion is the established
general-purpose React-to-video framework; HeyGen's HyperFrames is an agent-native
open-source HTML-to-video engine that already ships a content-addressed plan,
~72 lint rules, PSNR regression, distributed cloud rendering, and a studio;
Revideo and Motion Canvas occupy the open-source alternative space. Coding agents
can emit code for any of them. Seqvio does not compete on being a better generic
renderer or a better closed loop — on that axis it has already lost.

The hard part of an explainer is not the render loop, and increasingly not the
closed loop around it. It is everything a closed engine is structurally
positioned worst to do: reach a real system. The bets below are where value
lives; the table-stakes ones still ship, they just no longer defend the company:

- **Joint explanation timing.** Narration cues, exact spoken phrase anchors,
  visual actions, and capture evidence live in one ExplanationBeat structure.
  Synthesized voice resolves the output clock while semantic time maps preserve
  authored or recorded visual order. This replaces hand-guessed padding with an
  executable contract.
- **Explainer-native scene vocabulary.** Hand-drawn whiteboard, sticky-note, and
  product-walkthrough primitives with built-in draw timing — not a blank canvas
  assembled from scratch per video.
- **A structured execution contract.** ExplainerDocument (and retained whiteboard
  Storyboard input) that a host agent can generate, validate, repair, and inspect,
  so agent output is checkable before it becomes code.
- **A verification loop.** Deterministic checks on rendered frames — blank frames,
  overflowing text, unreadable pacing, narration that disagrees with what is on
  screen — so a host agent can iterate to correct output instead of handing a human
  a video to eyeball.

Not all four are equally defensible, and in 2026 the asymmetry has shifted
further than this document used to claim.

The first two — joint explanation timing and explainer-native scene vocabulary —
are domain knowledge. They are correct, and a competitor could copy both in a
few hundred lines. The plan contract and the generic verification loop, which
this document once called the durable pair, have stopped being durable: a
better-resourced competitor already ships both, with cloud rendering and a
studio on top. All four are now table stakes. They still ship — they are why
Seqvio produces a better explainer than a blank canvas — but they no longer
defend it.

The durable value lives in one thing that needs physical contact with the
user's machine:

- **AI-driven capture with temporal fidelity.** A real terminal session replayed
  from a cast, a real browser walkthrough, a real CI failure
  - turned into a composition as _what actually happened, in the order it
    happened_, not a reconstruction from a prompt. Capture is not passive
    recording: an agent controls the session (it runs the commands, clicks the UI)
    and explains it (it generates narration from what it actually did and saw).
    This needs permissions, format adapters, redaction, and domain semantics that
    run on the user's side. A stronger model and a cloud renderer both stop at the
    composition boundary; capture starts there. This is the moat - the one thing a
    closed engine is positioned worst to copy, because none of it runs on their
    side.

The renderer is a means, not the identity. If commodity render engines keep
improving, capture is the part of Seqvio that must remain worth existing - and
that is where development effort concentrates.

### The Threat, Stated Plainly

The risk is not that a better renderer appears. It is that models get good enough
to emit working Remotion or raw HTML directly, and no framework is needed — and,
compounding that, that the closed layer a framework would defend has already been
commoditized by a better-resourced competitor.

What that does not solve, and where Seqvio stands: **models cannot reach into
your systems.** A real terminal session, a real browser walkthrough, a real CI
failure - turning those into video requires capture, permissions, format
adapters, and domain semantics that live on the user's machine.
`@seqvio/terminal-narrator` and `@seqvio/browser-recorder` are not early
experiments on a side front - they are the front. The framing they point at is
Seqvio's identity: not "draw an explainer from nothing," but **turn what already
happened in a real system into something a person can follow.**

[`ROADMAP.md`](./ROADMAP.md) orders the work accordingly.

## Who It Is For

- Developer advocates and technical writers turning docs into tutorials.
- Educators and course creators who need fast, repeatable concept videos.
- Product teams that need onboarding and feature-announcement videos.
- Coding agents that need a vocabulary for clear visual explanations.

The common thread: users who already work in code (or delegate to an agent that
does) and want their video pipeline to live in the same repo, reviewed and versioned
like any other source. The primary audience is the first two — developers and the
people who write for them. The product is built around technical-vertical depth;
general explainer use is welcome but is not where the moat is.

## Visual Styles

Styles are the visible vocabulary of the explainer layer and a core part of the product. The
renderer and the core timing, narration, and caption contracts are style-agnostic;
each visual style is a package.

- `@seqvio/whiteboard` — hand-drawn SVG whiteboard scenes. The reference
  implementation for the timing and QA contracts: it stays correct and maintained
  as the contract baseline, not a polish target.
- `@seqvio/scatterbrain` — sticky-note / cork-board workshop scenes.
- `@seqvio/product-demo` — browser frames, screenshots, cursor paths, and callouts
  for product walkthroughs.
- `@seqvio/technical` — code walkthroughs (Shiki-highlighted), architecture
  diagrams (dagre), terminal demos with ANSI rendering, and semantic annotation
  targets. The primary compilation target for ExplainerDocument and the
  natural home for developer-facing technical content; where new investment goes.

Depth beats breadth. `whiteboard` is the contract reference; `technical` is the
home for developer-facing content and the investment priority. A new style is only
worth adding when it serves an explainer job the existing styles cannot. Every
style must share the same timing, narration, caption, and rendering contracts — a
style is a set of components, never a fork of the pipeline.

## Scope

### In Scope

- Short-form explainer videos, roughly 15 seconds to 3 minutes.
- ExplainerDocument as the canonical structured input for captured and
  agent-authored explainers, compiled to editable TSX.
- Retained Storyboard IR input for whiteboard-only work and hand-authored TSX for
  deliberate low-level control.
- Structured narration, caption, and timing metadata with pluggable TTS providers.
- Programmatic, deterministic, local rendering to MP4.
- Multilingual narration and caption variants from one source composition.
- Deterministic verification of rendered output - layout, legibility, pacing, and
  narration/visual agreement - as machine-readable diagnostics an agent can act on.
- Capture adapters that turn real system activity (terminal sessions, browser runs,
  CI, traces, and similar) into compositions, with temporal fidelity.

### Out of Scope

- Competing with general-purpose code-to-video engines on rendering features —
  including the closed-layer arms race of cloud rendering fleets, studio editors,
  and lint-rule count.
- General-purpose or nonlinear video editing (Premiere / DaVinci-class multi-track).
- Arbitrary motion-graphics or VFX (chroma key, color grading, general compositing).
- Cloud rendering, real-time collaboration, and asset marketplaces.
- Photorealistic or generative-model video.
- LLM or planner API calls from inside Seqvio. Determinism is the precondition for
  CI integration and regression testing; creative decisions stay in the host agent.
- A style-count race. Deepening an existing style is in scope; adding styles for
  breadth is not.
- One-shot prompt-to-video as the product surface. The product surface is a
  channel for real system events, not a generator from nothing.

Scope decisions can change, but they change here and deliberately — not by accretion.

## Design Principles

- **Opinionated about explainers, not about rendering.** Domain contracts (voice is
  the clock, IR validation, QA gates) are the product; the render loop is
  replaceable infrastructure.
- **Verifiable beats impressive.** Prefer a capability that can be checked
  automatically over one that only looks good in a demo. A quality rule belongs in
  an executable check, not in a documented convention.
- **Fidelity to the real system beats reconstruction.** A composition drawn from
  what actually happened - in its real timing - is worth more than a prettier one
  invented from a prompt. Capture from the real system; do not fabricate it.
- **Reachable or absent.** Code that ships but no user can invoke is worse than a
  stale doc. Wire it up, mark it internal, or delete it.
- **Clarity over generic motion.** Every primitive should help the agent communicate
  an idea, not merely add movement.
- **Code is the source of truth.** TSX is the production surface; docs describe it,
  they do not promise beyond it.
- **Depth before breadth.** One credible style and a reliable pipeline beat many
  half-finished styles.
- **Honesty in docs.** When documentation and code disagree, the code wins, and the
  docs get fixed.
