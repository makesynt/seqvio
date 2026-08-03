# Seqvio Implementation Plan

> **Status:** the task-level companion to [`ROADMAP.md`](./ROADMAP.md). ROADMAP
> states *what we are betting on and in what order*; this document states *how
> each phase breaks into concrete work against the current codebase*. For
> positioning and scope, [`VISION.md`](./VISION.md) wins.
>
> Last revised: 2026-08-01.

## Current-State Inventory (what is already there)

| Capability | Current state | Disposition |
| --- | --- | --- |
| ExplainerDocument IR | Five complete scene families plus `ExplanationBeat` cues, phrase anchors, visual actions, capture evidence, validation, compilation, and pacing | Canonical interchange contract |
| chapter-render | `renderer/chapter-render.ts`: `hashRenderSettings`, `resume`, `onlyChapters`, `changedChapterIds`, `documentPath` | Reuse; incremental render built |
| render conformance | Cross-platform semantic golden plus same-host PNG hash/PSNR checks for mixed Terminal/Browser frames | Three-host CI gate with environment-tagged artifacts |
| seqvio-qa | Baseline/capture profiles cover visual, pacing, audio, media, capture-manifest, and resolved ExplanationBeat failures | Screenshot privacy masking intentionally deferred |
| `@seqvio/capture` | New: `CaptureSession` contract, `CaptureManifest` union, `compileCaptureManifestToExplainerDocument` dispatcher | Built (Phase 1.1) |
| Release/capability governance | `seqvio.release-policy.json`, package lifecycle metadata, core scene registry, docs snapshot, changesets/CI drift verifier | Built; release publication pending |
| terminal-narrator | `node-pty` + asciinema/xterm state; compiler emits capture-backed cues/Beats and audio scene timing | Production pipeline uses shared dispatcher -> IR -> TSX; legacy writer removed |
| browser-recorder | Records exact action clocks; compiler emits BrowserSceneSpec plus capture-backed cues/Beats | Production pipeline uses shared dispatcher -> IR -> TSX; legacy writer removed |
| technical components | `CodeWalkthrough{source,steps}`, `ArchitectureDiagram`, `TerminalDemo`, `ansi.ts`, `code-utils.ts` | Reuse |
| render performance | Four generated 1280x720 workloads, three-sample environment baseline, structured cache metrics, and scheduled reports | Baseline built; optimize Browser first |
| environment diagnostics | `seqvio-doctor` checks Node, Chromium launch, FFmpeg probe, bundled fonts, `node-pty`, and writable paths | Built |

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

### 0.3 Test baseline - DEFERRED

Characterization tests for `chapter-render`/`qa-cli`/`terminal-narrator` to be
added when those are refactored (Phase 1.2/1.3 pipeline migration).

## Phase 1 - System Capture Adapters

### 1.1 `@seqvio/capture` contract package - DONE

`CaptureSession` interface, `CaptureManifest` union (terminal/browser/git),
`CaptureStep` + `CaptureState` (AI explain), `NarrationProvider`,
`compileCaptureManifestToExplainerDocument` dispatcher (compilers injected).

### 1.2 terminal-narrator - DONE (core)

`compileTerminalCapture` (manifest -> `TerminalSceneSpec` IR + audio manifest,
ports compose.ts timing logic) + `terminalCaptureSession` (CaptureSession impl)
+ `toCaptureManifest`. The production pipeline compiles manifest -> IR -> TSX,
including visual control through `TerminalSceneSpec.renderOptions`. Each captured
step emits a cue, a phrase anchor, visual focus, and capture evidence. The
production pipeline now uses the shared dispatcher and the legacy writer is
removed. CLI contract `1.0` fixes JSON results, exit codes, progress, safe job
ids, artifact layout, per-job capture QA, and independent audio/caption options.
Windows package/CLI verification passes locally; the three-host CI matrix is
configured and must pass before promotion.

### 1.3 browser-recorder - DONE (core)

`compileBrowserCapture` (manifest -> `BrowserSceneSpec` IR + audio manifest) +
`browserCaptureSession` + `toBrowserCaptureManifest`. The production pipeline
compiles manifest -> IR -> TSX. New recordings retain exact per-action start
times instead of evenly distributing steps; older recording manifests keep the
fallback. The production pipeline now uses the shared dispatcher and the legacy
writer is removed. CLI contract `1.0` adds direct plan execution, JSON results,
exit codes, progress, safe job ids, and artifact layout. Remaining:
per-job capture QA and audio parity. Windows package/CLI verification passes
locally; the three-host CI matrix is configured and must pass before promotion.

### 1.5 Promote out of pre-stable (in progress)

README/skill/current-capability docs now describe the working IR path and its
pre-stable CLI status. Shared dispatcher routing and legacy writer removal are
complete. CLI contract `1.0`, per-job QA, audio parity, and independent caption
burn-in are also complete. Windows host verification passes locally; Linux and
macOS execution remains pending the configured CI matrix. Screenshot privacy
remains an explicitly deferred boundary.

## Phase 2 - Generic QA Checks

### 2.1 Generic checks - DONE (partial)

`seqvio-qa` checks: blank/empty/offscreen + text-overflow + font-size (12px) +
contrast (WCAG AA 4.5:1). Deterministic, no LLM, `exit(1)` on error. The capture
profile additionally validates manifest timing/state/media, credential-like
content, narration/caption timing, narration-track presence, audio silence and
clipping risk, and sampled visual change. Missing/corrupt/truncated browser media
  has Chromium coverage. Speech-rate and per-highlight perceptual duration checks
  are implemented; screenshot masking/OCR is intentionally deferred. Renderer QA
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
```

## Risks

- **Pipeline consolidation (1.2/1.3).** Complete: Terminal/browser production
  pipelines and release smoke use the shared dispatcher, canonical artifact
  tests cover both adapters, and legacy `writeComposition` exports are removed.
- **Scope.** Capture, joint ExplanationBeat authoring, post-TTS semantic timing,
  release QA, and CLI/artifact contract `1.0` are implemented. Remaining:
  CI confirmation on Linux/macOS and lifecycle promotion. Windows host package
  and CLI verification passes locally. Screenshot privacy remains explicitly
  deferred.
