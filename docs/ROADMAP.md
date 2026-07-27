# Seqvio Roadmap

> **Status:** directional. This file states *what we are betting on and in what
> order*, not dated deliverables. Time-boxed work items live in GitHub issues and
> milestones. For positioning and scope, read [`VISION.md`](./VISION.md) - when
> the two disagree, `VISION.md` wins.
>
> Last revised: 2026-07-27 (reordered against HyperFrames' closed-layer coverage;
> see below).

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
architecturally poorly positioned to add: **system capture, technical-correctness
verification with real ground truth, and CI guardianship of existing video
libraries.** This is not a change to `VISION.md` - it is `VISION.md`'s own
"depth before breadth" and coding-agent-centric positioning applied to a changed
landscape. The framing stays: *give an agent a verifiable visual output channel
for things that already happened in a real system.* What changes is which bet
earns the first dollars.

## The Threat We Are Planning Against

The risk to Seqvio is not that a better renderer appears. It is that models get
good enough to emit working Remotion (or raw HTML/CSS) directly, and no framework
is needed at all. Three things that threat does not solve:

1. **A model cannot reliably verify its own visual output.** Generating an
   animation is easy. Deciding whether text overflowed, whether a line stayed on
   screen long enough to read, or whether the picture actually shows what the
   narration claims requires an external, deterministic checker. Generation
   commoditizes; verification does not.
2. **A model cannot reach into your systems.** A real Claude Code session, a real
   browser walkthrough, a real CI failure - turning those into video needs
   capture, permissions, format adapters, and domain semantics that live on the
   user's machine, not in the model.
3. **The closed layer is now a commodity.** A composition-to-MP4 pipeline with
   static linting and regression is no longer a differentiator - HyperFrames has
   it, with cloud rendering and a studio on top. Seqvio cannot win there and
   should not try. The asymmetry that remains is the *opening* layer: turning
   real system activity into a composition, and verifying the result against that
   activity.

The strategic move is the one `VISION.md` already names: from *"help an agent
generate a video"* to **"give an agent a verifiable visual output channel for
things that already happened in a real system."** This revision just stops
pretending the closed layer is part of the moat.

## Reordering Principles

1. **Do not compete in the closed layer.** Rendering, studio editing, generic
   lint-rule count, and cloud rendering are table stakes HyperFrames already
   covers. Maintain the minimum Seqvio needs; do not invest engineering in
   matching feature-for-feature.
2. **Invest where the opening layer and ground truth compound.** Capture
   adapters, technical-correctness verification, and CI guardianship each need
   things HyperFrames does not have: local permissions, format adapters, domain
   semantics, and a source of truth to verify against. They reinforce each other.
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

Promote `browser-recorder` and `terminal-narrator` from "experimental" to a
single capture-adapter contract: `CaptureSession -> CaptureManifest ->
CompositionDocument`. Both already produce compositions (they hand-string tsx
via `writeComposition`); the work is routing them through the IR instead, so
they pick up narration, groundTruth, and CI-diffability. `terminal-narrator`
(~2.4k lines: `record.ts`, `cast.ts`, `timing.ts`, `redact.ts`, `validate.ts`)
maps to the existing `TerminalSceneSpec`; `browser-recorder` (~0.7k lines) needs
a new `BrowserSceneSpec` (peer to terminal: sourceVideo + cursor + focus +
actions + narration + groundTruth), compiled to `RecordedBrowserDemo`.

Capture is agent-driven, not passive recording: the agent controls the session
(runs the commands, clicks the UI) and explains it - an **AI explain** step
generates narration from the manifest's real recorded state (stdout, page
state), not from the plan. Narration follows what actually happened.

Then widen the sources. Each of these is something developers generate daily and
have never been able to explain clearly:

- git history and PR diffs - how a refactor actually evolved.
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

## Phase 2 - Technical-Correctness Verification

The previous Phase 1 made `seqvio-qa` a general content-correctness verifier.
General verification is now a closing-layer concern HyperFrames is actively
filling (its lint suite grows every release). Seqvio's verifier still matters,
but its edge is not "more generic checks." It is **checks that need a ground
truth only capture provides.**

Keep the generic checks (overflow, contrast, pacing, narration/visual keyword
agreement, audio silence/speech-rate) as table stakes - they are correct and
cheap, and a `--ci` mode that exits non-zero still ships. But the frontier is
domain verification against the captured source of truth:

- The code on screen matches the real source AST at that commit.
- The architecture diagram's edges match the real dependency graph.
- The terminal replay's output matches the real run's stdout.
- The diff animation matches the real git hunks.

This is a compound moat with Phase 1: the verifier is only as strong as the
ground truth it can reach, and only capture reaches it. No LLM required - these
are deterministic comparisons. `VISION.md`'s "no LLM calls inside Seqvio" holds.

The instinct is already in the repo: `gsap-serialize.ts` encodes
"frame-reproducible animations" as a forbidden-pattern list. Phase 2 is that
instinct applied to *fidelity to the real system*, not just to animation input.

## Phase 3 - Video as a CI Guardian

The previous Phase 2 made video a reviewable code artifact (hashing, frame diff,
PR-scoped re-render). HyperFrames now ships content-addressed plans and PSNR
regression, so "reviewable artifact" alone is no longer distinctive. The
distinctive move is to **invert the direction**: from *generate a video from a
PR* to *guard the video library a PR endangers.*

- `pr-to-video` (HyperFrames' shape) turns a PR into a new video. One-shot.
- Seqvio turns a PR into a regression check on *existing* technical videos:
  "this PR touched `auth/`, and these three architecture / code-walkthrough
  videos reference it - re-render the affected chapters and verify against the
  new ground truth."

Guardianship is stickier than generation. It runs on every commit, lives in CI,
and accrues a library of protected videos that gets more valuable to keep as it
grows. This is also where plain MIT licensing beats Remotion's company tiers in
practice - it enters a company's CI without a procurement conversation, and
stays without a per-render meter running.

Building blocks: deterministic hashing (`chapter-render.ts` already has content
hashing and resume), frame-level visual diff (extend
`scripts/visual-regression.mjs`), a GitHub Action that re-renders only affected
chapters, and a `--ci` verifier exit from Phase 2. Incremental render here is
not a convenience - on a frame-screenshot pipeline where full renders scale
linearly-or-worse with duration, it is the difference between a CI check that
fits in a pipeline and one that does not.

## Phase 4 - Public Technical-Video Benchmark

Promoted from a "long-lived asset" note to a phase, because it is the one asset
that compounds without engineering and that forking cannot copy.

A set of deliberately defective technical compositions paired with expected
diagnostics: code on screen that disagrees with the source, architecture
diagrams with invented edges, terminal replays whose output drifts from the real
run, narration that names things the frame never shows. Someone can fork the
code; they cannot fork the eval set and the judgment encoded in it.

The benchmark is what makes Phase 2's verifier credible and Seqvio's quality bar
legible to outsiders. Seed it from real failures encountered during Phases 1-3,
not from invented examples.

## Deprioritized

Restating what is *not* getting first dollars, and why:

- **Multi-target IR output** (previous Phase 4). The hedge is real but
  opportunistic; it waits until capture and verification have a reason to emit
  non-MP4 targets.
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
  verifiable channel for real system events, not a generator from nothing.

## Long-Lived Assets

1. **Versioned contracts.** IR schema and the frame contract need explicit
   versions and migration paths. `composition-document/migrate.ts` is the seed.
2. **The benchmark** (Phase 4) - the asset that compounds and cannot be forked.

## If Only One Thing Ships

Phases 1 and 2 together: capture that reaches the real system, and a verifier
that checks the result against it. Either alone is now copyable - capture
without verification is a recorder, verification without ground truth is generic
lint. The compound is the moat, and it is the one thing HyperFrames is
structurally positioned worst to copy.
