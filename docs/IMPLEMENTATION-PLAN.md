# Seqvio Implementation Plan

> **Status:** the task-level companion to [`ROADMAP.md`](./ROADMAP.md). ROADMAP
> states *what we are betting on and in what order*; this document states *how
> each phase breaks into concrete work against the current codebase*. For
> positioning and scope, [`VISION.md`](./VISION.md) wins.
>
> Last revised: 2026-07-27.

## Current-State Inventory (what is already there)

| Capability | Current state | Disposition |
| --- | --- | --- |
| CompositionDocument v2 IR | `core/composition-document/` (schema/migrate/validate/compile/timeline), with `ChapterSpec` + `ChapterRenderPlanEntry` + `BrowserSceneSpec` | Reuse as-is; the spine |
| chapter-render | `renderer/chapter-render.ts`: `hashRenderSettings`, `resume`, `onlyChapters`, `changedChapterIds`, `documentPath` | Reuse; incremental render built |
| visual-regression.mjs | `scripts/visual-regression.mjs`: FFmpeg PSNR vs baseline, `--update`, non-zero exit | Repo-wide fixed cases; extend if needed |
| seqvio-qa | `renderer/qa-cli.ts`: puppeteer frame snapshots, DOM checks, `exit(1)` on error; checks blank/empty/offscreen + text-overflow/font-size/contrast | Extend with pacing/narration-agreement/audio if needed |
| `@seqvio/capture` | New: `CaptureSession` contract, `CaptureManifest` union, `compileCaptureManifestToCompositionDocument` dispatcher | Built (Phase 1.1) |
| terminal-narrator | `node-pty` + asciinema cast; `compileTerminalCapture` + `terminalCaptureSession` | Built (Phase 1.2); pipeline still uses `writeComposition` (hand-stringed tsx) - IR migration is follow-up |
| browser-recorder | `compileBrowserCapture` + `browserCaptureSession`; `BrowserSceneSpec` in IR | Built (Phase 1.3); pipeline still uses `writeComposition` - IR migration is follow-up |
| technical components | `CodeWalkthrough{source,steps}`, `ArchitectureDiagram`, `TerminalDemo`, `ansi.ts`, `code-utils.ts` | Reuse |

## Architectural Decisions

1. **CaptureSession contract lives in a new `@seqvio/capture` package.** Not in
   `core` - capture is a distinct concern and `core` stays render/IR-agnostic.
   Defines a `CaptureSession` interface (`record() -> CaptureManifest`), a
   `CaptureManifest` schema (carries per-step operation semantics + captured
   state: terminal stdout, browser cursor/focus/screenshot), a
   `CaptureManifest -> CompositionDocument` dispatcher (compilers injected by
   adapters, no import cycle), and an **AI explain** step (agent generates
   narration from the manifest's real recorded state, injected into
   `scene.narration`). Capture is agent-driven: the agent controls the session
   and explains it (narration from what actually happened, not from the plan).
2. **browser-recorder migrates to the IR like terminal.** Both capture sources
   go through the IR: `BrowserSceneSpec` (peer to `TerminalSceneSpec`:
   sourceVideo + cursorPoints + focusTargets + clicks + narration) compiles to
   `RecordedBrowserDemo`.

## Phase 0 - Clear the Floor and Stop Duplicating the Closed Layer

### 0.1 Three unreachable tracks - DONE (2026-07-27)

- `packages/renderer/src/shader-transitions/` - deleted: subsystem +
  `runtime.tsx` reads + `core/transitions.ts` shader types + test.
- `packages/renderer/src/audio/ducking.ts` + `volume-envelope.ts` - marked
  `@internal`: no CLI wires autoDuck; wire-up is medium cost, not needed.
- `packages/core/src/clock.ts` (`TransportClock`) - marked `@internal`:
  retained as Phase 5 preview seed.

### 0.2 Doc alignment - DONE

README/README.zh-CN Roadmap summary aligned to the new phases; VISION/ROADMAP/
this doc updated.

### 0.3 Test baseline - DEFERRED

Characterization tests for `chapter-render`/`qa-cli`/`terminal-narrator` to be
added when those are refactored (Phase 1.2/1.3 pipeline migration).

## Phase 1 - System Capture Adapters

### 1.1 `@seqvio/capture` contract package - DONE

`CaptureSession` interface, `CaptureManifest` union (terminal/browser/git),
`CaptureStep` + `CaptureState` (AI explain), `NarrationProvider`,
`compileCaptureManifestToCompositionDocument` dispatcher (compilers injected).

### 1.2 terminal-narrator - DONE (core)

`compileTerminalCapture` (manifest -> `TerminalSceneSpec` IR + audio manifest,
ports compose.ts timing logic) + `terminalCaptureSession` (CaptureSession impl)
+ `toCaptureManifest`. Smoke tests pass. Pipeline still uses `writeComposition`
(hand-stringed tsx); migrating to IR needs `TerminalSceneSpec` to carry visual
control (maxZoom/zoomOnInput/presentation/typingCps) - follow-up.

### 1.3 browser-recorder - DONE (core)

`compileBrowserCapture` (manifest -> `BrowserSceneSpec` IR + audio manifest) +
`browserCaptureSession` + `toBrowserCaptureManifest`. Smoke tests pass. Pipeline
migration to IR is follow-up.

### 1.5 Promote out of experimental (not started)

Drop experimental markers; stabilize CLI; update README/skill docs.

## Phase 2 - Generic QA Checks

### 2.1 Generic checks - DONE (partial)

`seqvio-qa` checks: blank/empty/offscreen + text-overflow + font-size (12px) +
contrast (WCAG AA 4.5:1). Deterministic, no LLM, `exit(1)` on error. Remaining
(opportunistic): pacing (min on-screen frames), narration/visual agreement,
audio silence/speech-rate.

### Ground-truth verification - DROPPED

Code/diagram/terminal/diff verification against real-system ground truth was
considered and dropped: capture-produced IR is faithful (same-source as the
recording, so verification is self-consistent), and hand-written IR either has
no ground truth (whiteboard) or was dropped (code/diagram char-level checks
conflate simplification with fabrication). See git history for the reverted
work.

## Dependencies

```
Phase 0 ─> 1.1 (contract) ─┬─> 1.2 (terminal) ─┐
                           └─> 1.3 (browser)   ┴─> 1.5 (promote)
Phase 2.1 (generic QA) - independent
```

## Risks

- **Pipeline migration (1.2/1.3).** terminal/browser `compileXxxCapture`
  produce IR, but the pipelines still use `writeComposition` (hand-stringed
  tsx). Migrating needs `TerminalSceneSpec` to carry visual control
  (maxZoom/zoomOnInput/etc.).
- **Scope.** Phase 1 core (capture contract + terminal/browser compile +
  session) is done. Remaining: promote (1.5), pipeline
  migration, optional generic-QA extensions.
