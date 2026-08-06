# Current Capabilities

This reference describes what Seqvio supports today in this repository. Treat planning docs and proposals as direction, not shipped behavior.

## Production loop

```text
content or CaptureManifest
  -> ExplainerDocument (cues + ExplanationBeats + capture evidence)
  -> TSX with logical source timing
  -> audio manifest -> TTS
  -> resolved Beats + semantic scene timeMap
  -> seqvio-qa -> seqvio-render -> MP4
```

For new technical explainers, jointly author narration cues and visual actions in
ExplainerDocument. Do not assign the final video clock independently: TTS
resolves phrase anchors to output frames, and the scene `timeMap` keeps recorded
or authored visual actions in semantic order.

The retained alternatives are narrower:

- Storyboard v1 remains a supported input for whiteboard-only work.
- Hand-authored TSX remains valid for silent output, small edits, and deliberate
  low-level control. `meta.audio.narration` alone does not provide semantic Beat
  alignment.

Seqvio does not call AI or planner APIs. The host agent creates the IR; Seqvio validates and compiles it deterministically.

## Authoring

- React/TSX composition files
- Required exports: default component + `meta`
- Timing is in frames, not seconds
- Single-scene whiteboard compositions via `@seqvio/whiteboard`
- Multi-scene compositions via `@seqvio/core`
- Technical scenes via `@seqvio/technical` (hand-authored TSX or compiled from ExplainerDocument)

## Whiteboard components

From `@seqvio/whiteboard`:

- `WhiteboardScene`
- `DrawText`
- `DrawShape`
- `DrawImage`
- `DrawIcon`
- `Hand`

`WhiteboardScene` defaults to `singlePen={true}`, so overlapping draw actions are serialized.

Frame hooks (from `@seqvio/whiteboard`, re-exported from `@seqvio/core`):

- `useCurrentFrame()` — the current frame for the calling component (scene-local inside a `<Scene>`, otherwise the global frame).
- `useFrameValue(selector, isEqual?)` — subscribe through a selector and re-render only when the selected value changes. Pass memoized `selector`/`isEqual` (e.g. via `useCallback`) to keep the subscription stable.

## Technical components

From `@seqvio/technical`:

- `TechnicalScene`
- `AnnotationProvider` / `AnnotationTarget` / `AnnotationLayer` (also exported from `@seqvio/core` for cross-style use)
- `CodeWalkthrough` — Shiki sync highlighter, stable line ids, focus / type / insert / replace / delete / annotate
- `ArchitectureDiagram` — dagre layout with reveal / connect / trace / emphasize / collapse / expand
- `InfographicScene` — metrics, comparisons, process, timeline, relationships,
  bar/line charts, series targets, axes, legends, units, and source labels
- `ManimClip` — seekable externally rendered mathematical animation with named,
  narration-reflowable markers

Shared attention includes spotlight, focus ring, callout, bracket, connector,
region shade, and guided path primitives. Simultaneous callouts use deterministic
collision-aware placement; connectors choose safe-area routes around occupied
targets. Explicit priority provides deterministic stacking, and every primitive
has random-access and reverse-seek coverage.

Semantic direction is available through versioned `DirectionPlan` and Motion
Grammar contracts. `npm run director:task` prepares host-agent generate/repair
tasks and auditable receipts; the renderer executes their validated artifacts
without a model call.

Style profiles apply typography, palette, spacing, motion density, camera,
transition, and attention persistence policies. The shipped reference profiles
are `clean-technical`, `editorial-explainer`, and `terminal-first`; semantic
timing and target identity remain invariant across them.

Whiteboard drawables and product-demo chrome accept `annotationId` / element `id` so annotations can target them under a shared `AnnotationProvider`.

## Core composition components

From `@seqvio/core`:

- `VideoComposition`
- `Scene`
- `Transition`
- ExplainerDocument schema, validate, compile, Storyboard adapter, and render-plan helpers
- ExplanationBeat cues, exact phrase anchors, visual actions, capture evidence,
  logical source timing, and post-TTS semantic time maps

Implemented transitions: `fade`, `slide`, `wipe`

Unknown transition names fall back to `fade`.

## CLI tools

From `@seqvio/renderer`:

- `seqvio-generate plan-agent` — write a host-agent task for IR generation
- `seqvio-generate validate` — Storyboard or ExplainerDocument validation
- `seqvio-generate validate --json` — agent-friendly validation diagnostics
- `seqvio-generate compile` — IR to TSX
- `seqvio-generate render-plan` — ExplainerDocument → chapter render plan JSON
- `seqvio-render` — TSX to MP4
- `seqvio-render --renderPlan --chapterDir [--ir] [--onlyChapters] [--resume]` — chapter render / resume / stitch
- `seqvio-audio extract` — narration manifest extraction
- `seqvio-audio synthesize` — TTS synthesis and resolved manifest generation
- `seqvio-qa` — visual, pacing, media, capture, and resolved timing checks
- `seqvio-doctor` — environment checks including optional local Manim discovery
- `npm run director:task -- --mode generate|repair ...` — versioned host-agent
  direction task and receipt generation

Capture adapters are available but pre-stable:

- `@seqvio/terminal-narrator` converts xterm recordings into terminal scenes,
  capture-backed ExplanationBeats, and optional synthesized narration.
- `@seqvio/browser-recorder` records browser actions and preserves exact action
  start times when compiling Browser scenes and Beats.

Their shared-dispatcher data path is implemented, legacy writers are removed,
and release smoke is tested at `1280x720`. CLI contract `1.0` provides direct
commands, JSON results, stable exit codes, monotonic progress, safe job ids, and
portable `artifacts.json` paths. Windows package and real runtime verification
passes locally; the configured Windows/Linux/macOS matrix must pass before
lifecycle promotion. Screenshot privacy work is intentionally deferred and must
not be assumed.

## Narration providers

`seqvio-audio synthesize` supports:

- ElevenLabs (default)
- OpenAI
- MiniMax
- edge-tts

Credentials come from environment variables. The CLI does not auto-load `.env`.

## Audio-aligned compositions

Supported today:

- `meta.audio.narration` cue lists
- ExplainerDocument `explanation.cues` + `explanation.beats` joint authoring
- phrase resolution from TTS chunk timing or whole-cue character fallback
- resolved `explanationBeats` and `sceneTimings[].timeMap`
- QA errors for unresolved/reversed Beats and warnings for low-confidence timing
- per-cue `sceneId`
- `lockToAudio: true`
- resolved manifest driven scene timing
- optional caption burn-in via `--burnCaptions` (off by default; see audio-workflow.md)
- Terminal and Browser direct capture CLIs support the same optional
  `--withAudio`, provider/voice, and `--burnCaptions` controls
- Terminal and Browser jobs run capture QA and publish `qa-report.json` in the
  job artifact manifest
- chapter stitch can mux narration/music after video concat

## Example compositions / IR

Preferred starting points:

| File | Use case |
| --- | --- |
| `examples/compositions/seqvio-overview-en.tsx` | Narrated English product overview |
| `examples/compositions/seqvio-overview-zh.tsx` | Narrated Chinese product overview |
| `examples/compositions/seqvio-audio-demo.tsx` | Audio and caption metadata |
| `examples/compositions/seqvio-intro.tsx` | Multi-scene framework intro |
| `examples/compositions/technical-demo.tsx` | Short technical smoke (whiteboard + code + diagram) |
| `examples/compositions/technical-explainer.tsx` | ~4.5 min technical reference composition (`lockToAudio`) |
| `examples/ir/technical-demo.explainer.json` | Short ExplainerDocument IR |
| `examples/ir/technical-explainer.explainer.json` | Full ExplainerDocument IR + chapters |
| `examples/compositions/infographic-chart-validation.tsx` | Chart/series/axis/legend reference |
| `examples/compositions/manim-end-to-end-validation.tsx` | Real graph/proof Manim playback with narration |
| `examples/compositions/style-playbook-*.tsx` | Same semantic composition under three visual profiles |
| `examples/manim/` | Equation, graph, symbolic proof, and geometric proof Python fixtures |
| `packages/whiteboard/examples/` | Single-scene whiteboard samples |

Narrated technical reference loop:

```bash
npm run audio:technical-explainer -- --smoke          # extract + TTS + short muxed clip
npm run audio:technical-explainer                     # full extract + TTS + preview render
```

Tracked README demo videos:

- `docs/assets/videos/seqvio-overview-en.mp4`
- `docs/assets/videos/seqvio-overview-zh.mp4`

Local render intermediates belong in `output/` / `.media/` and are gitignored.

## Repository layout

| Path | Purpose |
| --- | --- |
| `packages/whiteboard` | Whiteboard components |
| `packages/scatterbrain` | Scatterbrain sticky-note / cork-board style components |
| `packages/technical` | Technical explainer components |
| `packages/core` | Scene, transition, and IR runtime |
| `packages/renderer` | Bundler and CLIs |
| `packages/product-demo` | Product walkthrough components |
| `packages/manim-adapter` | Optional external Manim execution and media manifest adapter |
| `packages/capture` | Shared capture manifest and evidence contracts |
| `packages/terminal-narrator` | Pre-stable terminal capture adapter |
| `packages/browser-recorder` | Pre-stable browser capture adapter |
| `examples/compositions/` | Renderable compositions |
| `examples/ir/` | Storyboard / ExplainerDocument JSON examples |
| `skills/seqvio/` | Agent skill and references |
| `docs/` | Human-facing docs |

## Not implemented yet

Do not assume these exist just because they appear in roadmap or proposal docs:

- visual editor / studio workflow
- automatic custom SVG illustration generation per topic
- Seqvio-side AI planning or planner API calls
- Product-specific orchestration adapter inside Seqvio core
- `@seqvio/education` / full LessonPlan package
- ChatTranscript or DiffReview scene families
- automatic screenshot privacy or redaction guarantees
- formal VISION.md promise for 10-minute videos
- transitions beyond `fade`, `slide`, and `wipe`

When in doubt, verify against source code and [`docs/COMPOSITION-AUTHORING.md`](../../../docs/COMPOSITION-AUTHORING.md).
