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
| CompositionDocument v2 IR | `core/composition-document/` (schema/migrate/validate/compile/timeline), with `ChapterSpec` + `ChapterRenderPlanEntry` | Reuse as-is; the spine of Phases 2-3 |
| chapter-render | `renderer/chapter-render.ts`: `hashRenderSettings`, `resume`, `onlyChapters`, `changedChapterIds`, `documentPath` | Reuse; Phase 3 incremental render is ~80% built |
| visual-regression.mjs | `scripts/visual-regression.mjs`: FFmpeg PSNR vs baseline, `--update`, non-zero exit | Extend from repo-wide fixed cases to PR/chapter scope |
| seqvio-qa | `renderer/qa-cli.ts`: puppeteer frame snapshots, DOM checks, `exit(1)` on error; checks only `mostly_blank_frame` / `empty_dom` / `offscreen_elements` | Extend; framework stays, checks and ground-truth comparison are new |
| terminal-narrator | `node-pty` + `writeAsciinemaCast`, ~2.4k lines, composition-based, has `redact.ts` | Refactor onto the capture contract; temporal-fidelity core preserved |
| browser-recorder | ~0.7k lines, already composition-based (`writeComposition` emits tsx using `RecordedBrowserDemo` with cursor/focus overlay + maxZoom) | Migrate to IR: add `BrowserSceneSpec`, compile to `RecordedBrowserDemo` (Decision 2) |
| technical components | `CodeWalkthrough{source,steps}`, `ArchitectureDiagram`, `TerminalDemo`, `ansi.ts`, `code-utils.ts` | Reuse; the targets of Phase 2 domain verification |
| groundTruth references | Do not exist | Build new; the spine shared by Phases 2 and 3 |

## Architectural Decisions

1. **CaptureSession contract lives in a new `@seqvio/capture` package.** Not in
   `core` - capture is a distinct concern and `core` stays render/IR-agnostic.
   Defines a `CaptureSession` interface (`record() -> CaptureManifest`), a
   `CaptureManifest` schema (carries per-step operation semantics + captured
   state: terminal stdout, browser cursor/focus/screenshot), a
   `CaptureManifest -> CompositionDocument` compiler, and an **AI explain** step
   (agent generates narration from the manifest's real recorded state, injected
   into `scene.narration`). terminal-narrator, browser-recorder, git, CI, and
   trace all implement this interface. Capture is agent-driven: the agent
   controls the session (runs commands, clicks the UI) and explains it
   (generates narration from what actually happened, not from the plan).
2. **browser-recorder migrates to the IR like terminal.** It already produces a
   composition (`writeComposition` emits tsx using `RecordedBrowserDemo` with
   cursor/focus overlay + maxZoom) - it just bypasses the IR by hand-stringing
   tsx. Under X, both capture sources go through the IR: add a `BrowserSceneSpec`
   to `SceneSpec` (peer to `TerminalSceneSpec`: sourceVideo + cursorPoints +
   focusTargets + actions + narration + groundTruth), and a `compileBrowserScene`
   in `compile.ts` that emits `RecordedBrowserDemo`. The video-asset adapter idea
   is dropped - browser needs the IR to get narration (AI explain) and groundTruth,
   same as terminal.
3. **groundTruth is a first-class CompositionDocument field.** The IR gains a
   `groundTruth` field: each chapter/scene declares the real data it references
   (`sourcePath`+`commit`, `graphSource`, `castPath`, `stdoutRef`). qa reads it
   to verify against the real system. This makes ground truth versionable,
   CI-usable, and benchmark-referenceable. It is the shared spine of Phases 2
   and 3.

## Phase 0 - Clear the Floor and Stop Duplicating the Closed Layer

### 0.1 Three unreachable tracks

Per ROADMAP Phase 0. For each, decide wire-up / mark internal / delete, defaulting
to "delete or mark internal" (no engineering into the closed layer):

- `packages/renderer/src/shader-transitions/` - five GLSL transitions compile but
  nothing sets `window.__seqvio_shaderTransitions`; `compositor.ts` draws an
  `Image` synchronously after `src=` without awaiting `decode()` (empty textures).
  → **Done (2026-07-27):** deleted the subsystem + `runtime.tsx` reads + `core/transitions.ts` shader types + `shader-transitions.test.mjs`.
- `packages/renderer/src/audio/ducking.ts` + `volume-envelope.ts` - `audio-mux.ts`
  honors `options.autoDuck` but no CLI passes it. Wire only if Phase 2 audio
  checks need it; otherwise mark internal.
  → **Done (2026-07-27):** marked `@internal` (wire-up is medium cost - needs narrationCues extraction from audioManifest; Phase 2 audio checks don't need it).
- `packages/core/src/clock.ts` (`TransportClock`) - imported only by its own
  test. Mark internal or delete.
  → **Done (2026-07-27):** marked `@internal` (retained as Phase 5 preview seed).

### 0.2 Doc alignment

Scan `docs/` and per-package READMEs for residual "closed layer is a moat"
wording. VISION/ROADMAP are updated; live docs may lag. Leave
`docs/archive/PRODUCT-PLAN-2026-07.md` alone (it is a point-in-time snapshot).

### 0.3 Test baseline

Add characterization tests for the three high-risk areas about to change:
`chapter-render`, `qa-cli`, `terminal-narrator` pipeline. Lock current behavior
before editing. The 30-tests / 27k-lines ratio is too thin to refactor against.

## Phase 1 - System Capture Adapters

### 1.1 `@seqvio/capture` contract package

- `CaptureSession` interface: `{ kind, record(plan, ctx): Promise<CaptureManifest>, buildComposition(manifest): CompositionDocumentSeed }`.
- `CaptureManifest` schema: unified fields (kind, events/timing, assets,
  redaction flags, groundTruthRefs).
- `CaptureManifest -> CompositionDocument` compiler.
- Versioning, wired into `composition-document/migrate.ts`.

### 1.2 terminal-narrator onto the contract

Preserve the node-pty + asciinema-cast temporal core. Split `runPipeline` into
`record() -> CaptureManifest` + `buildComposition()`. This is the reference
implementation (already composition-based).

### 1.3 browser-recorder alignment

Refactor to a video-asset `CaptureSession`: `CaptureManifest` carries a video
asset that feeds a composition `<Video>`.

### 1.4 git capture adapter (priority)

- Record git history/diff as temporal events (commit sequence, hunk changes).
- Emit `CaptureManifest` feeding the technical package's diff-animation
  components.
- Directly feeds Phase 2's "diff animation == real git hunks" check.

### 1.5 Promote out of experimental

Drop experimental markers from `package.json`; stabilize CLI; update
README/skill docs.

CI / trace / profiler adapters are follow-on sub-items of Phase 1; they do not
block Phase 2 - git + terminal are enough to validate ground-truth verification.

## Phase 2 - Technical-Correctness Verification

### 2.1 Generic table-stakes checks (on the qa-cli framework, deterministic, no LLM)

- Text overflow, element overlap, contrast (WCAG AA from resolved colors), font
  size floor, title/action-safe.
- Pacing: minimum on-screen frames from character count; inverse defect
  (narration ends, frame static for 3s).
- Narration/visual agreement: cue text vs scene DOM visible-text keyword
  coverage.
- Audio: post-render `volumedetect` / `silencedetect` (closes the
  silent-narration gap, cf. HyperFrames #2775).

### 2.2 groundTruth field into the IR (Decision 3)

CompositionDocument schema gains `groundTruth`. Technical components declare the
real data they reference at render time. qa reads the field from the
composition. Ship early - it is a breaking IR change needing a migrate path.

### 2.3 Domain verifiers (Phase 2 frontier, using 2.2's groundTruth)

- Code on screen vs real source AST at commit.
- Architecture diagram edges vs real dependency graph.
- Terminal replay output vs real run stdout.
- Diff animation vs real git hunks (feeds off 1.4).

### 2.4 Machine-readable diagnostics + repair hints

Each qa-report issue carries a `repair` hint so a host agent can self-iterate.
Explicit `--ci` flag (exit(1) already exists; add flag + warning/error grading).

## Phase 3 - Video as a CI Guardian (depends on 1 + 2)

### 3.1 Frame-level visual diff extension

`scripts/visual-regression.mjs` consumes chapter-render's `changedChapterIds`;
diff only changed chapters' frames (currently repo-wide fixed cases). PSNR
comparison retained.

### 3.2 PR -> affected-videos mapping

The composition's `groundTruth` field already declares the repo paths it depends
on. The Action computes PR diff paths -> which videos' groundTruth references
those paths -> trigger re-render + verify. This is the inversion from "generate"
to "guard."

### 3.3 GitHub Action

`pr-affected-videos.yml`: re-render affected chapters (`onlyChapters`/`resume`)
+ run `seqvio-qa --ci`, block PR on failure. MIT licensing enters CI without
procurement friction.

### 3.4 Incremental render wiring

chapter-render's `onlyChapters`/`resume` is already built; wire to 3.3.

## Phase 4 - Public Technical-Video Benchmark (rolling)

### 4.1 Eval-set format

`benchmark/cases/<id>/{composition, expected-diagnostics.json}` - each case is a
deliberately defective technical composition + expected qa diagnostics.

### 4.2 Seeding

Collect from real failures encountered in Phases 1-3. Do not invent.

### 4.3 Scoring

`seqvio-qa --benchmark` reports pass rate as qa's own quality regression (a qa
change must not lower the pass rate).

## Dependencies and First Sprint

```
Phase 0 ─┬─> 1.1 (contract) ─> 1.2 (terminal) ─> 1.4 (git) ─┐
         │                                                     ├─> Phase 3
         └─> 2.1 (generic checks) ─> 2.2 (groundTruth IR) ─> 2.3 (domain) ─┘
                                                                          │
                                                                          └─> Phase 4 (seed)
```

**First sprint (immediately on approval):** Phase 0 in full + Phase 1.1
(contract package skeleton) + Phase 2.2 (groundTruth IR field). Rationale:
Phase 0 unlocks safe changes; 1.1 and 2.2 are the spines everything else hangs
on (contract + ground truth). Establish the columns first, then hang
terminal-narrator / git adapter / domain verification / CI guardianship on them.

## Risks

- **browser-recorder alignment (Decision 2) may be harder than expected.** The
  contract for a screen recording as a composition media element needs care. If
  it stalls, hold terminal-narrator + git as the two live lines and leave
  browser-recorder at status quo.
- **groundTruth in the IR is a breaking change.** Needs a `migrate.ts` version
  path; existing compositions must still load. This is why 2.2 ships early.
- **Domain verifiers (2.3) need real-system snapshots.** AST / dependency-graph
  / stdout comparison needs the composition to reach a real system snapshot;
  cross-platform and permissions pitfalls are likely (terminal-narrator's
  `redact.ts` already proves this class of problem).
- **Scope.** Full Phases 0-4 is an 8-12 week order. To shrink to a near-term
  deliverable, cut to Milestone 1: Phase 0 + 1.1 + 1.2 + 2.1 + 2.2 (~3-4 weeks),
  producing a demonstrable "real terminal session -> verified video."
