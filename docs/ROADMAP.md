# Seqvio Roadmap

> **Status:** directional. This file states *what we are betting on and in what
> order*, not dated deliverables. Time-boxed work items live in GitHub issues and
> milestones. For positioning and scope, read [`VISION.md`](./VISION.md) - when
> the two disagree, `VISION.md` wins.
>
> Last revised: 2026-08-01 (implementation status aligned with the current
> ExplanationBeat and terminal/browser IR pipelines).

## What Changed in This Revision

The previous ordering bet that the validated plan contract and the QA loop were
the defensible moat, and put capture adapters in Phase 3. That bet no longer
holds as written.

As of mid-2026, HeyGen's HyperFrames has shipped the parts this roadmap was
counting on as defensible: a content-addressed plan (v2), PSNR-based regression,
CI regression sharding, ~72 lint rules, distributed cloud rendering (AWS Lambda
and GCP Cloud Run), a studio timeline editor, and `pr-to-video` /
`website-to-video` skills. The closed layer - composition in, MP4 out, plus
static linting and regression - is now occupied by a better-resourced
competitor. Continuing to invest there is spending Seqvio's effort in the region
where it has the least advantage.

The reordering moves effort to the layer HyperFrames does not have and is
architecturally poorly positioned to add: **system capture.** This is not a
change to `VISION.md` - it is `VISION.md`'s own "depth before breadth" and
coding-agent-centric positioning applied to a changed landscape. The framing
stays: *give an agent a visual output channel for things that already happened
in a real system.* What changes is which bet earns the first dollars.

## The Threat We Are Planning Against

The risk to Seqvio is not that a better renderer appears. It is that models get
good enough to emit working Remotion (or raw HTML/CSS) directly, and no framework
is needed at all. Two things that threat does not solve:

1. **A model cannot reach into your systems.** A real Claude Code session, a real
   browser walkthrough, a real CI failure - turning those into video needs
   capture, permissions, format adapters, and domain semantics that live on the
   user's machine, not in the model.
2. **The closed layer is now a commodity.** A composition-to-MP4 pipeline with
   static linting and regression is no longer a differentiator - HyperFrames has
   it, with cloud rendering and a studio on top. Seqvio cannot win there and
   should not try. The asymmetry that remains is the *opening* layer: turning
   real system activity into a composition.

The strategic move is the one `VISION.md` already names: from *"help an agent
generate a video"* to **"give an agent a visual output channel for things that
already happened in a real system."** This revision just stops pretending the
closed layer is part of the moat.

## Reordering Principles

1. **Do not compete in the closed layer.** Rendering, studio editing, generic
   lint-rule count, and cloud rendering are table stakes HyperFrames already
   covers. Maintain the minimum Seqvio needs; do not invest engineering in
   matching feature-for-feature.
2. **Invest where the opening layer lives.** Capture adapters need things
   HyperFrames does not have: local permissions, format adapters, and domain
   semantics that run on the user's side.
3. **Depth over breadth, with `technical` as the home.** `VISION.md` already
   names `@seqvio/technical` the natural home for developer-facing content and
   `@seqvio/whiteboard` the reference implementation for the timing and QA
   contracts. That holds. New investment goes to `technical` and capture;
   `whiteboard` stays as the contract reference, not a polish target.

## Phase 0 - Clear the Floor

Not a feature phase. Debt repayment, and a correctness issue in how this repo
describes itself.

Three feature tracks are implemented and tested but unreachable end to end:

| Track | Status | Resolution |
| --- | --- | --- |
| `packages/renderer/src/shader-transitions/` | Five GLSL transitions compiled, but nothing in the repo ever set `window.__seqvio_shaderTransitions`, so the four reads in `runtime.tsx` never saw a value. `compositor.ts` drew an `Image` synchronously after assigning `src` without awaiting `decode()`, yielding empty textures. | **Deleted** (closed-layer render effect, not on the differentiation path). |
| `packages/renderer/src/audio/ducking.ts` + `volume-envelope.ts` | `audio-mux.ts` honors `options.autoDuck`, but no CLI passes it. | **Marked `@internal`** (wire-up is medium cost; Phase 2 audio checks don't need it). |
| `packages/core/src/clock.ts` (`TransportClock`) | Nothing imports it outside its own test. | **Marked `@internal`** (retained as Phase 5 preview seed). |

For each: wire it up, mark it explicitly internal/unreleased, or delete it.
Shipping code that no user can reach is worse than a stale doc - it violates
"honesty in docs" from the inside.

Related: eight packages and ~27k lines of source against 30 test files is thin
coverage spread wide. **Depth before breadth** applies to the package count too.
Also: stop describing the closed layer as a moat in docs and READMEs. It is
infrastructure, not identity.

## Phase 1 - System Capture Adapters

**Highest priority, and the only line that gives Seqvio a data-access-shaped
moat.** Promoted from the previous Phase 3 because the closed-layer moat it was
sitting behind is gone.

Promote `browser-recorder` and `terminal-narrator` from pre-stable to a
single capture-adapter contract: `CaptureSession -> CaptureManifest ->
CompositionDocument`. Both production pipelines now invoke their adapter
compiler through the shared capture dispatcher before generating TSX. Canonical
artifact tests cover the IR, TSX, and audio-manifest outputs, and the legacy
`writeComposition` paths are removed. CLI contract `1.0` now fixes direct
commands, JSON results, exit codes, monotonic progress, and the job-artifact
layout. Per-job capture QA and Terminal/Browser audio-option parity are now in
the production commands. Windows package/CLI verification passes locally, and a
Windows/Linux/macOS CI matrix covers install, build, adapter tests, package
contents, and CLI contract before lifecycle promotion.
`terminal-narrator`
(~2.4k lines: `record.ts`, `cast.ts`, `timing.ts`, `redact.ts`, `validate.ts`)
maps to the existing `TerminalSceneSpec`; `browser-recorder` (~0.7k lines) uses
`BrowserSceneSpec` (peer to terminal: sourceVideo + cursor + focus + actions +
narration), compiled to `RecordedBrowserDemo`.

Capture is agent-driven, not passive recording: the agent controls the session
(runs the commands, clicks the UI) and explains it - an **AI explain** step
generates narration from the manifest's real recorded state (stdout, page
state), not from the plan. Narration and visual actions are now emitted together
as phrase-anchored ExplanationBeats. Terminal Beats preserve scheduled capture
steps; new Browser recordings preserve exact action start times rather than
distributing steps uniformly.

Then widen the sources. Each of these is something developers generate daily and
have never been able to explain clearly:

- CI runs and failures - why this test broke.
- OpenTelemetry traces - where this request spent its time.
- Profiler flame graphs.
- Test-suite runs.

The differentiator inside capture is **temporal fidelity**, not a screenshot
montage. `terminal-narrator` replays a real pty session from a cast (keystrokes
and output in their real timing); `website-to-video`-style DOM snapshots are a
different, weaker thing. Hold that line: capture is *what actually happened, in
the order it happened*, not a reconstruction.

This layer needs integrations, permissions, format adapters, redaction (the
`redact.ts` in `terminal-narrator` already proves the repo has tasted this), and
cross-platform handling - none of which a stronger model or a cloud renderer
replaces, because none of it runs on their side. It is also the one layer
HyperFrames is structurally absent from: it is a closing engine, not an opening
one.

## Phase 2 - Generic QA Checks

`seqvio-qa` checks rendered frames for blank frames, text overflow, font-size
floor, contrast (WCAG AA), and offscreen elements. Its baseline/capture profiles
also validate narration/captions, speech rate, highlight hold time, audio health,
capture media/state, semantic time maps, unresolved phrase anchors, and reversed
ExplanationBeats. These checks are deterministic, use no LLM, and ship as a
`--ci` mode that exits non-zero. Screenshot privacy masking remains explicitly
deferred.

Ground-truth verification (code vs source AST, diagram edges vs dependency graph,
terminal vs real stdout) was considered and dropped: capture-produced IR is
faithful (same-source as the real recording, so verification is self-consistent),
and hand-written IR either has no ground truth (whiteboard) or was dropped
(code/diagram char-level checks conflate simplification with fabrication).

## Deprioritized

Restating what is *not* getting first dollars, and why:

- **Multi-target IR output.** The hedge is real but opportunistic; it waits
  until capture has a reason to emit non-MP4 targets.
- **Preview / Studio** (previous Phase 5). HyperFrames has a studio. Seqvio's
  review surface stays the minimum - scene list, diagnostics, partial re-render
  - and explicitly *not* a nonlinear editor, per `VISION.md`.
- **Whiteboard polish and a fourth/fifth style.** `whiteboard` is the contract
  reference; it stays correct and maintained, not a feature target. No style
  race.
- **Generic explainer scene work** aimed at the broad faceless / general-video
  market HyperFrames already serves with `faceless-explainer` and
  `general-video` skills. That is a contested middle with no Seqvio-specific
  edge.

## Explicit Non-Goals

Restating, because roadmap pressure is where scope erodes:

- No competing with general-purpose renderers on rendering features.
- No cloud rendering, no distributed render fleet, no studio editor arms race.
  HyperFrames owns that; Seqvio renders locally and deterministically.
- No style-count race. Deepening `technical` is in; a new style is not.
- **No LLM calls inside Seqvio.** Determinism is the precondition for CI
  integration and regression testing. Hold this line.
- No one-shot prompt-to-video as the product surface. The product surface is a
  channel for real system events, not a generator from nothing.

## Long-Lived Assets

1. **Versioned contracts.** IR schema and the frame contract need explicit
   versions and explicit breaking-change notes. Pre-stable CompositionDocument
   migrations are intentionally outside the current plan.

## If Only One Thing Ships

Phase 1: capture that reaches the real system. It is the one thing a closed
engine is positioned worst to copy - none of it runs on their side. Generic QA
(Phase 2) is table stakes that ships alongside, but the moat is capture.
