# Seqvio Explainer Framework Improvement Plan

> **Status:** active implementation plan.
>
> **Purpose:** turn Seqvio from a broad collection of video components into a
> reliable capture-to-explanation framework for coding agents. This document is
> an execution plan, subordinate to [`VISION.md`](./VISION.md) and
> [`ROADMAP.md`](./ROADMAP.md).
>
> **Baseline date:** 2026-08-01. Statements about current behavior were checked
> against the repository at this date; update this document when implementation
> changes invalidate them.

## 1. Outcome

Seqvio should provide one dependable path from real system activity to a short,
clear, narrated technical explanation:

```text
real system activity
  -> CaptureSession
  -> CaptureManifest
  -> CompositionDocument
  -> ExplanationBeat cues + visual actions + capture evidence
  -> TTS-resolved semantic time map
  -> supported explainer scenes
  -> deterministic render
  -> executable QA
  -> MP4 + machine-readable diagnostics
```

The framework succeeds when a coding agent can capture what actually happened,
explain it from captured evidence, render it repeatedly, and detect common video
failures without relying on manual inspection.

## 2. Current Baseline

### What is already working

- `@seqvio/capture` defines a shared `CaptureSession -> CaptureManifest`
  contract for terminal and browser sources.
- Terminal and browser production pipelines currently compile through
  `CompositionDocument v2` before generating TSX.
- `CompositionDocument v2` has complete compiler paths for `whiteboard`, `code`,
  `diagram`, `terminal`, and `browser` scenes.
- ExplanationBeat authoring joins narration cues, exact phrase anchors, visual
  actions, and capture evidence. The compiler creates logical source timing;
  post-TTS reflow resolves speech frames and semantic scene time maps.
- Terminal and Browser capture compilers generate ExplanationBeats per recorded
  step. Browser recordings now persist exact action start times.
- Baseline/capture QA covers visual layout, pacing, audio health, capture state
  and media, unresolved/reversed Beats, and semantic time-map integrity.
- A deterministic 1280x720 release smoke renders and fully decodes both capture
  families without network or provider credentials.
- Terminal rendering now has a deterministic xterm-backed state path and
  explicit visual controls in IR `renderOptions`.

### Gaps that block the product promise

- Terminal and Browser CLI/artifact contract `1.0` is implemented with explicit
  experimental package and pre-stable adapter labels. Windows verification
  passes locally; Linux/macOS matrix confirmation remains before promotion.
- Terminal and Browser production pipelines now use the shared capture
  dispatcher; duplicate `writeComposition` paths and tests have been removed.
- Stable scene types now compile to real components. The former `chat`, `diff`,
  and `infographic` types were removed: generic chat playback, generated-code
  comparison, and generic panel layouts do not belong in the current capture
  contract. A future captured agent-session contract must be designed from real
  events rather than reusing the removed `chat` shape.
- Stateful and asynchronous scene components share a framework-wide
  prepare/ready/render/dispose contract with per-stage deadlines, stable errors,
  browser-stage state, and explicit disposal. Cross-platform semantic goldens
  and same-host pixel determinism now run in the three-host CI matrix.
- Screenshot privacy masking/OCR remains intentionally deferred. Text, URL, and
  credential-like capture scanning exists but does not make raw screenshots safe.
- Root/stable-train versions, package lifecycle markers, changesets grouping,
  local dependency versions, and scene capability documentation are governed by
  a checked machine-readable release policy. Release publication remains pending.
- Browser-per-frame rendering is adequate for short videos but lacks a published
  performance baseline and regression budget.

## 3. Product Decisions

These decisions constrain all phases of this plan.

1. **Capture-to-explanation is the primary product path.** Hand-authored TSX
   remains supported, but new product investment starts from captured evidence.
2. **`CompositionDocument` is the canonical interchange contract.** Generated
   TSX is a compilation target, not a second planning model.
3. **Only complete scene types are public.** A valid document must never silently
   produce a placeholder in a release build.
4. **Voice remains the clock.** Scene duration, captions, highlights, and captured
   actions derive from one resolved timeline.
5. **Real state outranks reconstructed state.** Capture artifacts retain source
   timing and provenance; narration describes captured results rather than the
   intended plan.
6. **Determinism is a framework contract.** Every renderable component must be
   correct when rendering starts at an arbitrary frame, seeks backward, or
   renders the same frame more than once.
7. **The renderer stays replaceable infrastructure.** Work on it must improve
   correctness, diagnostics, or necessary local performance, not expand into a
   generic effects or studio feature race.
8. **No internal LLM dependency.** A host agent may provide narration or repair
   decisions through explicit provider interfaces; core execution remains local
   and deterministic.

## 4. Work Plan

### Phase 0 - Align the Contract and the Documentation

**Goal:** make the repository describe one truthful, reachable product path.

Deliverables:

- Rewrite the top-level capability map around capture, explanation, render, and
  verification; label hand-authored visual styles as supporting capabilities.
- Correct `ROADMAP.md` and `IMPLEMENTATION-PLAN.md` to reflect that terminal and
  browser pipelines already compile through IR.
- Define public, experimental, internal, deprecated, and removed lifecycle labels
  and apply them consistently to packages and exports.
- Keep terminal/browser composition generation on the shared dispatcher and
  reject reintroduction of direct string-writer paths.
- Align root/package versions and add a release check that rejects inconsistent
  versions or stale capability markers.
- Keep the implemented canonical Terminal/Browser commands and versioned
  `artifacts.json` contract covered by process-level and pipeline tests.

Implemented as of 2026-08-01: lifecycle/version policy, stable release train,
changesets alignment, five-scene capability registry, agent-authoring filtering,
machine-readable capability snapshot, and CI/release drift verification.

Exit criteria:

- Documentation contains no claim that contradicts the current production path.
- A contributor can identify the canonical data flow from `docs/README.md` in one
  navigation step.
- Every exported feature has an explicit lifecycle state.
- CI detects version and capability-documentation drift.

### Phase 1 - Make the IR Honest and Singular

**Goal:** remove ambiguous authoring paths and ensure every valid IR scene has a
complete, testable result.

Deliverables:

- Remove the generic placeholder compiler from production behavior.
- Keep `chat`, `diff`, and `infographic` outside the stable schema. A future
  captured-agent-session type requires its own evidence, timing, component, and
  QA contract before it can become public.
- Define a scene capability registry containing schema version, compiler support,
  required package, lifecycle state, and QA rules. Use it to drive validation and
  agent-facing capability descriptions.
- Make capture adapters call the shared
  `compileCaptureManifestToCompositionDocument` dispatcher rather than invoking
  adapter compilers through parallel orchestration code.
- Persist `CaptureManifest`, `CompositionDocument`, resolved timeline, generated
  TSX, and audio manifest as named artifacts for every pipeline run.
- Treat CompositionDocument changes as explicitly breaking until the first
  stable IR release; do not build migrations for temporary pre-stable documents.
- Keep Storyboard v1 as an isolated whiteboard input while it remains useful. It
  is not a CompositionDocument migration path and creates no compatibility work.

Exit criteria:

- Stable validation accepts only scene types that compile without placeholders.
- Terminal and browser use the same dispatcher and artifact layout.
- No production pipeline imports a legacy composition writer.
- Every public schema change has an explicit breaking-release note until the IR
  receives a stable compatibility policy.
- Golden IR fixtures compile deterministically to normalized TSX.

### Phase 2 - Establish Deterministic Playback Contracts

**Goal:** make stateful terminal, browser, audio, and annotation scenes reliable
under arbitrary frame access.

Progress as of 2026-08-01:

- Terminal frame-state tests cover forward, reverse, repeated, and shuffled
  requests; renderer readiness now waits for every mounted xterm instance rather
  than one global last-writer promise.
- Browser camera, cursor, and click geometry use an exported pure frame-state
  resolver with forward/reverse/repeated-order tests. Click resolution is
  timestamp-based and independent of manifest array order.
- Code insert/replace line identities are local to each frame calculation rather
  than a module-global counter, so repeated and reverse seeks preserve semantic
  targets.
- A real Chromium conformance test generates a moving video fixture, renders a
  mixed terminal/browser scene in forward, reverse, and repeated frame order,
  and enforces PSNR plus significant-pixel thresholds. Missing seekable media now
  fails with an explicit browser-runtime diagnostic.
- The core adapter contract now supports `prepare`, `ready`, deterministic
  `render({ frame, fps, timeSeconds })`, and `dispose`. Renderer initialization
  awaits preparation/readiness, and each requested frame awaits asynchronous
  rendering before capture. Legacy `seek()` adapters remain compatible.
- Lifecycle tests cover forward, backward, repeated, and shuffled frame access,
  adapter failure wrapping, stage timeouts, and disposal timeouts. Core and
  browser runtime deadlines plus diagnostic fields are documented in
  `RENDER-LIFECYCLE.md`.
- Missing, corrupt-header, and truncated mid-stream browser media fixtures are
  covered. A committed five-frame semantic golden fixes Terminal and Browser
  interaction state across operating systems; each host also enforces repeated
  and shuffled-frame pixel equivalence and uploads environment-tagged evidence.
- A second Chromium fixture covers Whiteboard, Code, and Diagram scene starts,
  narration-expanded local clocks, both sides of transitions, burned captions,
  annotations, reverse seeks, and repeated-frame pixels. Annotation measurement
  now participates in the readiness barrier and cannot reuse previous-frame DOM
  bounds.

Deliverables:

- Specify a render lifecycle with `prepare`, `ready`, `render(frame)`, and
  `dispose` semantics, including timeout and diagnostic behavior.
- Require scene state to be derived from immutable input plus the requested frame;
  caches may improve speed but may not affect output.
- Add a standard readiness barrier for fonts, images, syntax highlighting,
  browser video metadata, xterm initialization, and other asynchronous resources.
- Add conformance tests that render frames in sequential, reverse, repeated, and
  randomized order and compare pixel hashes or semantic snapshots.
- Define terminal fidelity fixtures for ANSI colors, cursor shape, wrapping,
  resizing, carriage return, backspace, alternate-screen behavior, Unicode, and
  long-output scrolling. Unsupported control sequences must emit diagnostics.
- Define browser fidelity fixtures for cursor interpolation, clicks, focus zoom,
  source-video seeking, viewport scaling, and missing/corrupt media.
- Make captions, narration cues, annotations, and scene actions consume the same
  resolved timeline representation.

Exit criteria:

- Supported scenes produce equivalent output regardless of frame request order.
- Rendering never captures a frame before declared resources are ready.
- Unsupported terminal/browser input fails clearly or emits a documented
  degradation diagnostic; it never fails silently.
- Timeline conformance tests cover scene boundaries, transitions, captions, and
  narration locks.

### Phase 3 - Turn QA and Security into Release Gates

**Goal:** detect explanation failures and sensitive-data exposure before an MP4
is accepted.

Progress as of 2026-08-01:

- `seqvio-qa` exposes `baseline` and `capture` profiles. The capture profile
  requires a manifest and fails before Chromium startup when steps, observed
  state, timestamps, viewport data, or local browser media are invalid.
- Capture security scanning reports private-key material, provider tokens,
  secret-like assignments, and sensitive URL parameters with stable source
  paths. Terminal text and browser URL coverage are tested; screenshots are not
  yet OCR-scanned or masked.
- Audio/caption diagnostics have stable codes for invalid or overlapping timing,
  missing files, missing resolved narration, cues outside the composition, mostly
  silent narration, excessive leading/trailing silence, and clipping risk.
- Browser runtime failures are classified as metadata-load or seek failures and
  are written to `qa-report.json`; Chromium fixtures cover missing, corrupt, and
  truncated media.
- Capture action density, pixel-identical sampled frames, and per-highlight
  perceptual duration emit temporal diagnostics.
- Shared pacing policy now budgets Chinese/English narration, spreads authored
  code/diagram steps to a minimum readable window, resolves synthesized cue ends
  from probed audio, and emits `speech_rate_*` / `highlight_too_short` QA codes.
  Captured terminal/browser timestamps remain immutable and are diagnosed rather
  than rewritten.
- Resolved audio manifests retain scene-local timing. After TTS, narration cues,
  track offsets, captions, scene durations, later scene starts, and global
  highlight windows are reflowed from probed audio durations. Browser media seek
  uses the reflowed scene-local frame rather than the composition-global frame.
- Scene extension no longer leaves the authored visual clock unchanged with only
  a static tail. Each scene retains its source duration and receives a monotonic
  output-to-source time map. ExplanationBeats resolve exact normalized phrases
  inside TTS chunks; whole-cue character position is the explicit lower-confidence
  fallback when fine timing is unavailable. Sequential chunk/highlight pairing
  remains only for manifests without semantic Beats. React frame hooks, GSAP
  adapters, browser media seeking, and pacing QA use this shared clock.
  `scene_time_stretch_excessive` warns when narration stretches a scene beyond
  the `explainer-v1` 2x threshold.
- QA rejects post-TTS unresolved anchors, reversed Beat timelines, unknown cue or
  scene references, and invalid source/output frames. Low-confidence cue-character
  alignment remains a promotable warning with a source repair instruction.
- `explainer-v1` is now a versioned pacing profile carried by the source IR,
  generated meta, resolved audio, and QA report. `--qaConfig` supports exact
  warning suppressions with mandatory reasons; errors cannot be suppressed and
  stale suppressions emit `unused_qa_suppression`.
- Raw artifact retention, cue/audio duration tolerance, and configurable warning
  promotion are implemented in the renderer QA CLI. Screenshot masking remains
  intentionally deferred.
- A deterministic release smoke gate now covers both terminal and browser
  capture manifests -> capture compiler -> `CompositionDocument` -> generated
  TSX -> locally generated narration -> scene reflow -> capture QA -> MP4 render
  -> full FFmpeg decode. The browser fixture additionally exercises local media
  validation and time-mapped video seeking. CI and the npm release workflow run
  `npm run smoke:release-pipeline`; it has no provider/network dependency and
  cleans each repository-local temporary job after completion. Passing
  `--outDir output/release-pipeline-preview` retains both MP4s and their QA/audio
  sidecars for human inspection.
- Terminal and Browser production commands now run capture QA after rendering.
  `qa-report.json` is a standard artifact; QA errors retain diagnostics, mark
  the job failed, and return exit code 3. Explicitly silent jobs do not require
  a narration track, while `--withAudio` jobs do.

Deliverables:

- Keep existing blank-frame, overflow, font-size, contrast, and offscreen checks,
  and publish their thresholds as a versioned QA profile.
- Add temporal checks for scenes with no meaningful visual change, highlights too
  short to perceive, excessive action density, and captions outside scene bounds.
- Add audio checks for missing expected narration, excessive leading/trailing
  silence, clipping, invalid duration, and cue/audio length mismatch.
- Add capture checks for missing steps, non-monotonic timestamps, media duration
  mismatch, invalid viewport data, and absent captured state used by narration.
- Define a common redaction policy with allow/deny patterns, environment-variable
  and credential detectors, URL/query handling, screenshot masking hooks, and a
  machine-readable redaction report.
- Treat raw capture artifacts as sensitive by default. Document retention,
  cleanup, and opt-in debug preservation behavior.
- Produce one diagnostics file with stable codes, severity, source artifact,
  scene/frame/time location, and suggested repair.
- Add `--ci` profiles: `baseline` for hand-authored compositions and `capture`
  for evidence-derived explanations. Errors exit non-zero; warnings remain
  configurable.

Exit criteria:

- Deliberately broken fixtures trigger every required QA rule.
- A capture render cannot pass the release profile when narration/media is
  missing, timestamps are invalid, or a high-confidence secret is detected.
- Diagnostics identify a repairable source location instead of only a rendered
  frame.
- Redaction behavior is tested for both terminal text and browser artifacts.

### Phase 4 - Stabilize Performance, Packaging, and Adoption

**Goal:** make the reliable path fast enough and simple enough for routine agent
use without expanding Seqvio into a general video platform.

Deliverables:

- Create representative terminal, browser, code, and mixed-scene benchmark
  compositions at supported resolutions and durations.
- Record render factor, peak memory, preparation time, cache hit rate, and output
  size in CI or scheduled benchmark runs.
- Profile before optimizing. Prioritize static-layer reuse, decoded media reuse,
  chapter caching, and avoiding redundant browser work where determinism is
  preserved.
- Define an initial performance budget for the reference environment after the
  first benchmark run; reject statistically significant regressions rather than
  selecting an unsupported target in advance.
- Validate installation and smoke rendering on supported Windows, macOS, and
  Linux environments, including Chromium, FFmpeg, fonts, and `node-pty`.
  A three-host CI matrix now performs clean install/build/tests/package checks
  and real Terminal plus Browser direct-CLI capture/QA runtime smokes. Windows
  package/CLI verification also passes locally; matrix confirmation is pending.
- Provide one diagnostic command that reports missing dependencies, incompatible
  versions, writable paths, media probes, and font availability.
- Promote terminal and browser capture out of pre-stable only after their Phase
  1-3 gates pass on every supported platform.

Exit criteria:

- Benchmark results are reproducible and stored with environment metadata.
- Performance regressions are visible before release.
- A clean supported machine can run the canonical capture-to-video workflow from
  documented prerequisites without manual source edits.
- Terminal and browser packages have stable CLI contracts and compatibility
  notes.

## 5. Cross-Cutting Test Matrix

Each phase must extend a shared matrix rather than adding isolated package tests.

| Layer | Required tests |
| --- | --- |
| Capture contract | schema validation, timestamp ordering, artifact paths, cancellation, failure propagation |
| Adapter | real or hermetic terminal/browser fixture, redaction, cross-platform behavior |
| IR | stable validation, deterministic compilation, unsupported capability rejection |
| Scene runtime | random-access frames, reverse seek, repeated frame, asynchronous readiness, missing assets |
| Timeline/audio | narration lock, captions, transitions, silence, media-duration mismatch |
| Visual output | golden frames at scene start/middle/end and interaction boundaries |
| End to end | capture -> document -> TSX -> QA -> MP4, including failure fixtures |

Unit tests are necessary but do not satisfy a phase exit criterion when the risk
is visible only in Chromium or the encoded video.

## 6. Success Metrics

Use a small set of product-level metrics rather than package activity counts.

- **Pipeline success rate:** percentage of reference capture jobs that produce a
  valid MP4 and diagnostics without manual source changes.
- **Deterministic frame rate:** percentage of sampled frames whose hashes match
  across repeated and shuffled renders on the same reference environment.
- **QA escape rate:** known invalid fixtures that pass the release QA profile.
- **Capture fidelity:** percentage of recorded steps represented at the correct
  time and with preserved observable result.
- **Sensitive-data escape rate:** seeded credentials or private URL data not
  detected or redacted by the capture profile.
- **Render factor:** render wall time divided by output duration, tracked by scene
  family and resolution.
- **Time to first successful explanation:** elapsed setup and execution time on a
  clean supported environment.

Numeric release thresholds should be set from the first reproducible baseline.
Correctness and security metrics should trend to zero escapes; performance goals
must be evidence-based rather than aspirational.

## 7. Dependencies and Order

```text
Phase 0: truthful contract and docs
    -> Phase 1: singular IR and supported capabilities
        -> Phase 2: deterministic runtime
            -> Phase 3: QA and security gates
                -> Phase 4: stable promotion and optimization
```

Performance benchmarking may begin during Phase 1, but optimization must not
precede deterministic behavior. New capture sources such as CI runs and traces
should begin only after terminal and browser satisfy the common Phase 1-3
contracts; otherwise each adapter will create another special-case pipeline.

## 8. Risks and Controls

| Risk | Control |
| --- | --- |
| Duplicate capture paths return | Canonical artifact tests and one documented shared-dispatcher path |
| IR becomes a second programming language | Keep it declarative, capability-based, and limited to explainer semantics |
| Visual tests become platform-noisy | Pin fonts/browser, record environment metadata, separate semantic and pixel assertions |
| Security checks create false confidence | Treat reports as defense in depth; sensitive raw artifacts remain protected by default |
| QA rules reject intentional designs | Versioned profiles, stable diagnostics, narrowly scoped suppressions with reasons |
| Renderer optimization changes output | Require determinism and golden-frame checks for every optimization |
| Scope expands into generic video tooling | Reject work that does not improve capture fidelity, explanation clarity, verification, or required local execution |

## 9. Explicit Non-Goals

- A nonlinear editor or studio timeline.
- Cloud or distributed rendering.
- A larger catalog of visual styles without a capture/explanation requirement.
- Arbitrary VFX, photorealistic generation, or general post-production.
- An internal planner or mandatory model provider.
- Feature parity with general-purpose code-to-video engines.
- New capture adapters before the shared terminal/browser contract is stable.
- Pre-stable CompositionDocument migrations or compatibility fixtures.

## 10. First Implementation Slice

The first slice should be small enough to review as one coherent change and
should establish the direction of later work:

1. Correct stale pipeline statements in planning documentation. **Done.**
2. Add lifecycle labels and a supported-scene capability registry/table. **Done.**
3. Make stable validation reject placeholder-only scene types. **Done.**
4. Route terminal and browser pipelines through the shared capture dispatcher. **Done.**
5. Remove legacy `writeComposition` exports and replace their tests with canonical artifact tests. **Done.**
6. Add one end-to-end terminal fixture and one browser fixture that preserve all
   intermediate artifacts and run the existing QA profile. **Done.**

Completion of this slice does not promote capture out of pre-stable. It makes
the architecture honest and provides the test spine required for that promotion.
