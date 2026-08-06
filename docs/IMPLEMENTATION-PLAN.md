# Seqvio Implementation Plan

> **Status:** the task-level companion to [`ROADMAP.md`](./ROADMAP.md). ROADMAP
> states _what we are betting on and in what order_; this document states _how
> each phase breaks into concrete work against the current codebase_. For
> positioning and scope, [`VISION.md`](./VISION.md) wins.
>
> Last revised: 2026-08-05.

## Current-State Inventory (what is already there)

| Capability                    | Current state                                                                                                                                              | Disposition                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| ExplainerDocument IR          | Five complete scene families plus `ExplanationBeat` cues, phrase anchors, visual actions, capture evidence, validation, compilation, and pacing            | Canonical interchange contract                                                 |
| chapter-render                | `renderer/chapter-render.ts`: `hashRenderSettings`, `resume`, `onlyChapters`, `changedChapterIds`, `documentPath`                                          | Reuse; incremental render built                                                |
| render conformance            | Cross-platform semantic golden plus same-host PNG hash/PSNR checks for mixed Terminal/Browser frames                                                       | Three-host CI gate with environment-tagged artifacts                           |
| seqvio-qa                     | Baseline/capture profiles cover visual, pacing, audio, media, capture-manifest, resolved ExplanationBeat failures, and deterministic browser privacy masks | OCR is intentionally outside the security boundary                             |
| `@seqvio/capture`             | New: `CaptureSession` contract, `CaptureManifest` union, `compileCaptureManifestToExplainerDocument` dispatcher                                            | Built (Phase 1.1)                                                              |
| Release/capability governance | `seqvio.release-policy.json`, package lifecycle metadata, core scene registry, docs snapshot, changesets/CI drift verifier                                 | Built; release publication pending                                             |
| terminal-narrator             | `node-pty` + asciinema/xterm state; compiler emits capture-backed cues/Beats and audio scene timing                                                        | Production pipeline uses shared dispatcher -> IR -> TSX; legacy writer removed |
| browser-recorder              | Records exact action clocks; compiler emits BrowserSceneSpec plus capture-backed cues/Beats                                                                | Production pipeline uses shared dispatcher -> IR -> TSX; legacy writer removed |
| technical components          | `CodeWalkthrough{source,steps}`, `ArchitectureDiagram`, `TerminalDemo`, `ansi.ts`, `code-utils.ts`                                                         | Reuse                                                                          |
| render performance            | Four generated 1280x720 workloads, three-sample environment baseline, structured cache metrics, and scheduled reports                                      | Baseline built; optimize Browser first                                         |
| environment diagnostics       | `seqvio-doctor` checks Node, Chromium launch, FFmpeg probe, bundled fonts, `node-pty`, and writable paths                                                  | Built                                                                          |

## Architectural Decisions

1. **CaptureSession contract lives in a new `@seqvio/capture` package.** Not in
   `core` - capture is a distinct concern and `core` stays render/IR-agnostic.
   Defines a `CaptureSession` interface (`record() -> CaptureManifest`), a
   `CaptureManifest` schema (carries per-step operation semantics + captured
   state: terminal stdout, browser cursor/focus/screenshot), a
   `CaptureManifest -> ExplainerDocument` dispatcher (compilers injected by
   adapters, no import cycle), and an **AI explain** step (agent generates
   narration from the manifest's real recorded state, injected as jointly
   authored `scene.explanation.cues` and capture-backed `explanation.beats`).
   Capture is agent-driven: the agent controls the session and explains what
   actually happened, not what the plan intended.
2. **browser-recorder migrates to the IR like terminal.** Both capture sources
   go through the IR: `BrowserSceneSpec` (peer to `TerminalSceneSpec`:
   sourceVideo + cursorPoints + focusTargets + clicks + exact recorded steps +
   explanation) compiles to `RecordedBrowserDemo`.
3. **No pre-stable IR migration program.** ExplainerDocument changes may be
   explicitly breaking until a stable compatibility policy is declared.
   Storyboard v1 remains a separate whiteboard input, not a migration obligation.
4. **DirectionPlan is a derived semantic plan, not a second source of truth.**
   ExplainerDocument owns scenes, stable target ids, narration cues, and
   ExplanationBeats. DirectionPlan references those ids and adds renderer-
   agnostic purpose, focus, camera, pace, and transition intent before timing
   resolution. It remains optional during the first rollout and is inspectable
   as a generated artifact.
5. **Style Playbook is the final layer.** Style profiles are applied only after
   semantic graphics, attention, direction, external media, motion grammar,
   and QA contracts are stable. Style cannot change meaning, target ids,
   narration timing, or evidence order.

## Phase 0 - Clear the Floor and Stop Duplicating the Closed Layer

### 0.1 Three unreachable tracks - DONE (2026-07-27)

- `packages/renderer/src/shader-transitions/` - deleted: subsystem +
  `runtime.tsx` reads + `core/transitions.ts` shader types + test.
- `packages/renderer/src/audio/ducking.ts` + `volume-envelope.ts` - marked
  `@internal`: no CLI wires autoDuck; wire-up is medium cost, not needed.
- `packages/core/src/clock.ts` (`TransportClock`) - marked `@internal`:
  retained as Phase 5 preview seed.

### 0.2 Doc alignment - DONE (refreshed 2026-07-30)

README/README.zh-CN, package READMEs, agent skill references, authoring docs,
VISION/ROADMAP, and this plan are aligned with the ExplanationBeat pipeline.

### 0.3 Test baseline - DONE (2026-08-06)

Characterization coverage now exists for `chapter-render`, QA diagnostics, and
the terminal/browser adapter contracts. Adapter tests cover validation,
compilation, timing, CLI envelopes, and capture-session behavior after the
Phase 1.2/1.3 pipeline migration.

## Phase 1 - System Capture Adapters

### 1.1 `@seqvio/capture` contract package - DONE

`CaptureSession` interface, `CaptureManifest` union (terminal/browser/git),
`CaptureStep` + `CaptureState` (AI explain), `NarrationProvider`,
`compileCaptureManifestToExplainerDocument` dispatcher (compilers injected).

### 1.2 terminal-narrator - DONE (core)

`compileTerminalCapture` (manifest -> `TerminalSceneSpec` IR + audio manifest,
ports compose.ts timing logic) + `terminalCaptureSession` (CaptureSession impl)

- `toCaptureManifest`. The production pipeline compiles manifest -> IR -> TSX,
  including visual control through `TerminalSceneSpec.renderOptions`. Each captured
  step emits a cue, a phrase anchor, visual focus, and capture evidence. The
  production pipeline now uses the shared dispatcher and the legacy writer is
  removed. CLI contract `2.0` fixes JSON results, exit codes, progress, safe job
  ids, artifact layout, per-job capture QA, and independent audio/caption options.
  Windows package/CLI verification passes locally; the three-host CI matrix is
  configured and must pass before promotion.

### 1.3 browser-recorder - DONE (core)

`compileBrowserCapture` (manifest -> `BrowserSceneSpec` IR + audio manifest) +
`browserCaptureSession` + `toBrowserCaptureManifest`. The production pipeline
compiles manifest -> IR -> TSX. New recordings retain exact per-action start
times instead of evenly distributing steps; older recording manifests keep the
fallback. The production pipeline now uses the shared dispatcher and the legacy
writer is removed. CLI contract `2.0` adds direct plan execution, JSON results,
exit codes, progress, safe job ids, and artifact layout. Per-job capture QA,
audio parity, and privacy masking are implemented. Windows package/CLI verification passes
locally; the three-host CI matrix is configured and must pass before promotion.

### 1.5 Promote out of pre-stable (in progress)

README/skill/current-capability docs now describe the working IR path and its
pre-stable CLI status. Shared dispatcher routing and legacy writer removal are
complete. CLI contract `2.0`, per-job QA, audio parity, and independent caption
burn-in are also complete. Windows host verification passes locally; Linux and
macOS execution remains pending the configured CI matrix. Deterministic
selector/rectangle privacy masking is implemented; OCR remains an explicitly
deferred boundary.

## Phase 2 - Generic QA Checks

### 2.1 Generic checks - DONE

`seqvio-qa` checks: blank/empty/offscreen + text-overflow + font-size (12px) +
contrast (WCAG AA 4.5:1). Deterministic, no LLM, `exit(1)` on error. The capture
profile additionally validates manifest timing/state/media, credential-like
content, narration/caption timing, narration-track presence, audio silence and
clipping risk, and sampled visual change. Missing/corrupt/truncated browser media
has Chromium coverage. Speech-rate and per-highlight perceptual duration checks
are implemented; deterministic pre-capture screenshot masking is enforced for
Browser plans, while OCR remains intentionally deferred. Renderer QA
now retains failure artifacts, checks cue/audio duration tolerance, and supports
configurable warning promotion.
A shared core pacing policy is also used by agent authoring guidance,
ExplainerDocument timing resolution, synthesized narration retiming, and QA
speech-rate/highlight diagnostics.
TTS resolution now performs a full scene-aware timeline reflow and `seqvio-qa`
accepts `--audioManifest` so final QA evaluates the same resolved timing used
by rendering.
Reflow also preserves each authored/captured source duration and supplies a
monotonic scene-local time map. ExplanationBeats resolve exact normalized
phrases inside TTS chunks; providers without fine chunks use a lower-confidence
whole-cue character position. Chunk-order/highlight pairing remains only a
legacy fallback when semantic Beats are absent. React
frame hooks, GSAP adapters, browser media seeking, and final pacing QA consume
the same mapping. Stretch beyond the profile's 2x limit emits
`scene_time_stretch_excessive`.
`npm run smoke:release-pipeline` now exercises terminal and browser
`CaptureManifest` paths through the capture dispatcher, IR/TSX compilation,
deterministic local narration, scene reflow, capture-profile QA, MP4 rendering,
and full FFmpeg decode. The browser case also validates the captured local
video and mapped media seeking. It requires no network or TTS credentials and
removes each repository-local temporary job directory after completion. CI and
the npm release workflow run this combined gate; adapter-specific commands are
available as `smoke:release-pipeline:terminal` and
`smoke:release-pipeline:browser`. CI and release gates render at the default
1280x720 resolution. For human review, run
`node scripts/release-pipeline-smoke.mjs --outDir output/release-pipeline-preview`
to retain the 720p MP4s and QA sidecars; the smoke gate also checks decoded
video frame count, not only container validity. `--width` and `--height`
remain available for explicit diagnostic variants.
The release contract now records `explainer-v1` end to end and accepts a
versioned `--qaConfig`; suppressions require an exact code/path and documented
reason, never apply to errors, and remain auditable in `qa-report.json`.
Terminal and Browser production jobs now run this capture profile after
rendering and include `qa-report.json` in `artifacts.json`. QA errors return
pipeline exit code 3 while retaining diagnostic artifacts. Explicitly silent
jobs still run capture/visual/pacing checks without requiring an audio track;
`--withAudio` jobs must contain valid synthesized narration.

### Ground-truth verification - DROPPED

Code/diagram/terminal/diff verification against real-system ground truth was
considered and dropped: capture-produced IR is faithful (same-source as the
recording, so verification is self-consistent), and hand-written IR either has
no ground truth (whiteboard) or was dropped (code/diagram char-level checks
conflate simplification with fabrication). See git history for the reverted
work.

### 2.2 Product explainer production contract

**Status: complete for the v1 production contract.** Editorial and visual
artifacts now carry the optional planning fields, and product-explainer DOM
markers activate focused text-density, template, overlap, and focal-target QA.
The retained contract validation composition passes reference-frame review.

The first refined product video exposed recurring production risks that should
be executable rather than left as author preference:

- Add optional planning fields for `hook`, `visualRole`, `focalTarget`,
  `evidenceSource`, `onScreenTextBudget`, and `transitionIntent` to the
  editorial and visual-design artifacts.
- Add QA diagnostics for repeated full-sentence overlays, excessive concurrent
  primary text, repeated header/rail templates, target collisions,
  title-to-graphic overlap, and scenes without a declared focal target.
- Define a scene-density policy: narration carries complete sentences; screen
  text carries labels, keywords, commands, filenames, and short conclusions.
  Code, terminal, and browser evidence are explicit exceptions.
- Make reference-frame review standard: capture scene starts, midpoints,
  boundaries, and the final frame, retaining a contact sheet or frame index for
  repair loops.
- Treat real terminal/browser output and captured media as evidence-bearing
  sources. Authored diagrams may explain a model but must not imply invented
  reconstruction is recorded evidence.
- Prefer focus transfer, match-object, blur crossfade, or deliberate cut;
  reject decorative wipes, continuous rotation, and transitions that compete
  with the explanation.
- Keep voice providers behind the resolved audio manifest. CosyVoice and other
  providers may change the audio source, but the same measured voice clock,
  phrase anchors, reflow, and QA contract must drive every render.
- Make brand assets explicit and transparent-background safe. Logo presence,
  dimensions, contrast, and crop behavior belong in media QA.

Exit criteria:

- A narrated reference composition can be planned without duplicating its full
  script as on-screen text.
- QA reports text-density, focal-target, collision, and template-repetition
  diagnostics with stable source paths and frame numbers.
- A different resolved voice manifest does not change semantic beat order or
  visual evidence order.

## Phase 3 - Semantic Direction and Mathematical Animation

### 3.1 `InfographicScene` semantic graphics

**Status: complete for v1 semantic graphics.** The technical package now
exposes the shared metric, comparison, process, timeline, and relationship item
contracts with stable annotation targets and seek-safe reveal timing.
ExplainerDocument schema, capability registration, validation, and compiler
registration are wired. Bar and line charts now include addressable series,
axes, ticks, legends, units, source labels, deterministic domains, and shared
attention targets. The retained chart reference passes render QA.

Every completed implementation increment must produce a retained verification
video under `output/`, together with its source composition, manifest, and at
least one representative frame. The artifact is part of the exit evidence for
the increment, not an optional demo.

- Add `InfographicSceneSpec` to ExplainerDocument and register the capability in
  the core scene registry.
- Implement `InfographicScene` in `@seqvio/technical` with metric, comparison,
  process, timeline, chart, and relationship primitives.
- Give every datum, series, process step, and relationship a stable target id
  and semantic role.
- Add `reveal`, `compare`, `trace`, `emphasize`, and `transform` visual actions
  to the ExplanationBeat compiler and timing resolver.
- Provide deterministic layouts, number and unit formatting, axis and legend
  helpers, data-source labels, responsive safe areas, and reduced-density rules.
- Make all animation states frame-derived and stable under direct seek, repeated
  frames, reverse seek, and chapter rendering.
- Add schema, compiler, runtime, golden-frame, and end-to-end render tests.

Exit criteria:

- One IR document can compile and render metric, comparison, process, timeline,
  and chart scenes without hand-authored pixel animation.
- Phrase anchors activate the intended data targets and semantic transitions at
  the resolved audio time.
- Reference compositions pass layout, contrast, overflow, pacing, and
  deterministic-frame QA at supported aspect ratios.

### 3.2 Cross-scene attention primitives

**Status: complete for v1 attention layout and routing.** The core package now
provides `AttentionSequenceItem`, minimum-hold and handoff metadata, a
deterministic resolver, and a renderer layer that reuses stable annotation
targets. ExplanationBeat `focus`, `highlight`, and `annotate` actions now
compile into attention items with automatic handoffs and source Beat identity.
Resolved audio `outputFrame` values reflow the same sequence through the scene
time map, with source-frame fallback when phrase resolution is unavailable.
One versioned sequence can now carry scene-owned segments, cross-scene handoff
metadata, timed/until-handoff/until-clear persistence, explicit clear frames,
and validation for invalid clears or unknown destinations. Broader primitive
kinds now include focus ring, callout, bracket, region shade, and a two-target
connector with stable endpoint validation. Guided path routing, safe-area
placement, orthogonal connector corridors, deterministic label candidates, and
title-safe callout placement are now available. Multi-label placement shares a
single deterministic layout pass, while connectors and guided paths score
occlusion-aware candidate routes. Renderer QA now reports missing
targets, offscreen labels, label collisions, and target occlusion with stable
annotation ids and frame numbers. Retained 16:9, 1:1, and 9:16 references pass QA.

- Extend `AnnotationProvider` and `AnnotationLayer` with highlight, focus ring,
  spotlight, callout, arrow, bracket, connector, region shade, and guided focus
  path primitives.
- Add an `AttentionSequence` contract for activation, handoff, persistence,
  priority, and clearing.
- Reuse `AnnotationTarget` ids across whiteboard, code, diagram, terminal,
  browser, product-demo, infographic, and external-animation scene components.
- Add safe-area placement, connector routing, label collision resolution,
  target visibility checks, and a deterministic stacking policy.
- Map ExplanationBeat attention actions to the shared sequence runtime and
  expose the same contract to hand-authored TSX.
- Add QA diagnostics for unknown targets, occluded labels, offscreen geometry,
  insufficient contrast, overlapping callouts, and short attention holds.
  The first geometry diagnostics are shipped and exercised by
  `attention-routing-validation.tsx`.
- Add interaction-boundary golden frames plus random-access and reverse-seek
  tests for every primitive.

Exit criteria:

- A single attention sequence can guide focus across targets owned by different
  scene packages without scene-specific overlay code.
- Attention geometry remains readable at 16:9, 9:16, and 1:1 output sizes.
- ExplanationBeat timing, annotations, captions, and scene actions remain
  synchronized after TTS timeline reflow.

### 3.3 Minimal `DirectionPlan`

**Status: complete.**
The core package now derives a renderer-agnostic `DirectionPlan` sidecar from
scene and ExplanationBeat ids, preserves capture-step references, validates
scene, target, beat, capture, and transition references, and compiles into scene
actions, attention entries, and timing hints. Generated TSX exposes the compiled
result through `meta.direction`, and `npm run direction:generate` writes a
reviewable JSON sidecar without renderer properties.
Cross-scene transitions now pair source and destination target ids, conflicting
focus/camera intents produce stable diagnostics, and semantic plans remain
identical across duration and chapter reflow.

- Add a versioned, renderer-agnostic `DirectionPlan` schema that references
  existing scene ids, target ids, ExplanationBeats, and capture evidence.
- Support only the first useful intent vocabulary: `purpose`, `pace`, `focus`,
  `camera`, and `transition`.
- Define explicit camera intents such as `overview`, `follow-target`,
  `focus-transfer`, and `hold`; define transition intents such as `cut`,
  `crossfade`, `focus-transfer`, and `match-object`.
- Compile DirectionPlan into existing scene actions, AttentionSequence entries,
  and timing hints. Do not expose `opacity`, `scale`, `translate`, or renderer
  APIs in the contract.
- Validate unknown targets, invalid scene references, unsupported intent values,
  conflicting focus paths, and transitions without a shared target.
- Keep DirectionPlan optional for hand-authored TSX and emit it as an
  inspectable sidecar for agent-generated compositions.

Exit criteria:

- One ExplainerDocument can produce a DirectionPlan that a human can review
  without reading renderer code.
- The same plan compiles deterministically to the current TSX renderer and
  remains stable under audio reflow and chapter rendering.

### 3.4 External `@seqvio/manim-adapter`

**Status: complete for the v1 external adapter.** The
package exposes `ManimSceneSpec`, `ManimRenderManifest`, deterministic command
construction, validation, and machine-readable Python/Manim capability checks.
Execution now supports structured progress, cancellation, timeout, retained
logs, source/runtime/asset content hashes, and validated cache lookup. Actual
rendering remains environment-dependent and is reported explicitly. `ManimClip` is now
available in `@seqvio/technical` with deterministic media seeking and named
marker targets. The experimental `manim` ExplainerDocument scene is registered,
validated, and compiled into `ManimClip`. Named markers can reference a local
ExplanationBeat and reflow from authored `sourceFrame` to resolved TTS
`outputFrame`. The first real Manim equation fixture now renders through the
adapter and the ExplainerDocument pipeline, with a valid cached second run and
machine-readable media probe. Real equation, graph, and proof fixtures are
retained, `seqvio-doctor` detects the optional local environment, and QA checks
seek and named-marker alignment. A CosyVoice-narrated graph/proof composition
passes the end-to-end render and QA loop. The geometric proof fixture renders
at its declared 1280x720/30fps contract, records opaque alpha, and reuses the
same content-addressed result on a second adapter run.

- Create `@seqvio/manim-adapter` with versioned `ManimSceneSpec` and
  `ManimRenderManifest` schemas.
- Add local Python and Manim preflight checks with machine-readable version and
  capability diagnostics.
- Implement process execution with structured progress, cancellation, timeout,
  logs, and repository-local temporary artifacts.
- Content-address renders from source, scene class, assets, render settings,
  Python version, and Manim version; reuse validated cached outputs.
- Record rendered media path, duration, frame rate, dimensions, alpha mode,
  source hash, runtime versions, and named timeline markers in the manifest.
- Add `ManimClip` to `@seqvio/technical` and compile Manim-backed scenes to the
  existing media and semantic-time-map runtime.
- Resolve named Manim markers against narration phrase anchors so
  ExplanationBeats can synchronize equations, graphs, geometry, and shared
  attention primitives.
- Extend `seqvio-doctor` and `seqvio-qa` with adapter availability, media decode,
  duration, dimensions, frame-rate, alpha, marker, and seek checks.
- Ship equation-derivation, graph-transformation, and geometric-proof fixtures
  plus one narrated end-to-end composition.

Exit criteria:

- A clean supported environment with Python and Manim installed can render a
  declared scene through Seqvio and reuse the result on an identical second run.
- Named markers align with resolved narration and remain correct after direct
  seek, chapter render, and final media mux.
- Adapter failures produce stable diagnostics and retain the artifacts required
  to reproduce the failed command.

### 3.5 Motion Grammar

**Status: complete.** The
core package now supports the nine semantic actions and compiles them into
ExplanationBeat visual actions, AttentionSequence items, and DirectionPlan
segments. Target and relationship validation is deterministic; the first
question/reveal/compare/answer, compare/merge, problem/fix, and
process/verification fixtures have retained renders. `trace` preserves its full
guided path and explicit frame timing under repeated and reverse seek.

- Define a deliberately small semantic grammar over the existing visual action
  vocabulary: `question`, `pause`, `reveal`, `trace`, `compare`, `emphasize`,
  `transform`, `answer`, and `summarize`.
- Map grammar steps to ExplanationBeat visual actions, AttentionSequence
  operations, and DirectionPlan intents rather than pixel-level animation.
- Add grammar fixtures for question/answer, compare/merge, problem/fix, and
  process/verification explainers.
- Validate that every grammar step references an explainable target or a
  declared semantic relation.

Exit criteria:

- Common explainer structures can be expressed without hand-authoring motion
  primitives while preserving deterministic frame behavior.
- Grammar output remains inspectable as semantic actions and does not become a
  general-purpose animation DSL.

### 3.6 Director Skills

**Status: complete.**
`npm run director:pass` derives and validates a DirectionPlan and writes a
versioned receipt with the input hash, segment count, and diagnostics.
`npm run director:task` emits versioned generate or repair tasks for a host
agent, with stable suggestions and input/candidate/output hashes. Planning stays
outside the renderer and returned artifacts are validated locally.

- Add host-agent skills that generate or repair DirectionPlan,
  AttentionSequence, and Motion Grammar from an approved ExplainerDocument.
- Keep planning decisions outside the Seqvio renderer; skills emit versioned
  artifacts and receipts that Seqvio validates locally.
- Add transition, focus, camera, and rhythm skills only after their output
  contracts have reference fixtures and deterministic QA.

Exit criteria:

- An agent can request a director pass and receive a reviewable semantic plan,
  not opaque renderer code.
- The renderer never needs an LLM call to execute the plan.

### 3.7 Style Playbook (final phase)

**Status: complete.** A versioned profile schema and invariant checker protect
target ids, beat identity, timing, and evidence order. The runtime applies
typography, palette, spacing, motion density, camera, transition, and attention
persistence policies. `clean-technical`, `editorial-explainer`, and
`terminal-first` share one reference composition and twelve deterministic
visual-regression frames.

- Add a versioned style-profile schema only after semantic actions,
  DirectionPlan, Motion Grammar, Manim media, and QA are stable.
- Use descriptive profiles such as `clean-technical`, `editorial-explainer`,
  `chalk-process`, and `terminal-first`; do not ship brand-name imitation
  presets as the public contract.
- Let a style profile control typography hierarchy, motion density, camera
  policy, transition policy, attention persistence, spacing, and palette roles.
- Prove that changing a style profile does not change narration timing, target
  ids, evidence order, or semantic actions.
- Ship only two or three profiles backed by reference compositions and visual
  regression fixtures; style count is not a roadmap goal.

Exit criteria:

- The same ExplainerDocument renders in multiple profiles with identical
  semantic timing and QA target coverage.
- Style changes are reviewable as data and cannot silently introduce dense
  text, competing focal points, or unsafe layout.

### 3.8 Integrated authoring and QA contract

**Status: complete.** The repository
now contains a network-free IR fixture combining InfographicScene,
ExplanationBeat attention, derived DirectionPlan, a real Manim media manifest,
and a style profile. Director receipt, compiled TSX, retained MP4, and contact
sheet are generated together. Network-free release smoke replaces external
media with a local FFmpeg fixture, then compiles, runs QA, renders, and decodes
the same IR. The semantic benchmark records cache hit rate, attention and
direction diagnostics, marker confidence, text density, and focal coverage.

- Update authoring references with selection guidance for infographic,
  annotation, captured-media, DirectionPlan, Motion Grammar, and Manim-backed
  scenes.
- Add IR examples that combine an infographic scene, a cross-scene attention
  sequence, a DirectionPlan, a Manim clip, and a style profile under one
  narration manifest.
- Extend the release smoke with a network-free semantic-graphics composition and
  a fixture-backed Manim manifest playback case.
- Track render factor, cache hit rate, attention-layout diagnostics, marker
  alignment confidence, text-density diagnostics, and focal-target coverage in
  benchmark and QA reports.

Exit criteria:

- The canonical ExplainerDocument pipeline validates, compiles, renders, and
  checks all three capabilities through one ExplanationBeat timeline.
- Generated diagnostics identify the source scene, target or marker, resolved
  frame, and suggested repair.

## Phase 4 - Performance and Host Readiness

### 4.1 Reproducible render baseline - DONE (local reference)

`scripts/render-benchmark.mjs` generates network-free Code, Terminal, Browser,
and mixed ExplainerDocument workloads at 1280x720/30 fps. Three-run medians
record render factor, setup time, process-tree peak RSS, output size, renderer
throughput, and static-frame cache hit rate. The stored Windows reference is
enforced only on a matching platform/architecture/CPU; other hosts emit a
report without treating hardware differences as a regression. A weekly/manual
CI workflow retains the Linux report. The first reference identifies Browser
capture as the highest-cost path, followed by Terminal; optimize in that order.

### 4.2 Unified environment diagnostic - DONE (local verification)

`seqvio-doctor` and `npm run doctor` emit human-readable or `--json` results and
exit non-zero on blocking failures. The command probes Node >=18, loads the
`node-pty` native binding, resolves bundled technical fonts, executes an FFmpeg
media filter, launches Chromium and evaluates a page, and verifies writable
`temp/` and `output/` paths. All checks pass on the current Windows host;
Linux/macOS confirmation remains owned by the configured host CI runs.

## Dependencies

```
Phase 0 ─> 1.1 (contract) ─┬─> 1.2 (terminal) ─┐
                           └─> 1.3 (browser)   ┴─> 1.5 (promote)
Phase 2.1 (generic QA) - independent
Phase 2.1/2.2 -> 3.1 (infographic) -> 3.2 (attention) -> 3.3 (direction)
                                      \-> 3.4 (Manim) -> 3.5 (grammar)
                                      -> 3.6 (director skills) -> 3.7 (style)
                                      -> 3.8 (integration)
```

## Risks

- **Pipeline consolidation (1.2/1.3).** Complete: Terminal/browser production
  pipelines and release smoke use the shared dispatcher, canonical artifact
  tests cover both adapters, and legacy `writeComposition` exports are removed.
- **Scope.** Capture, joint ExplanationBeat authoring, post-TTS semantic timing,
  release QA, and CLI/artifact contract `2.0` are implemented. Remaining:
  CI confirmation on Linux/macOS and lifecycle promotion. Windows host package
  and CLI verification passes locally. Deterministic privacy masking is
  implemented; OCR remains explicitly deferred.
