# @seqvio/terminal-narrator

## 0.4.1

### Patch Changes

- 8dd96cf: Add fail-closed selector and rectangle privacy masks for browser capture plans,
  retain non-sensitive mask evidence in recording manifests, and keep the `serve`
  CLI process alive until it is terminated. Promote the versioned Terminal and
  Browser CLI/artifact contract to stable after the Windows/Linux/macOS runtime
  matrix passed.
- Updated dependencies [8dd96cf]
  - @seqvio/capture@0.3.1
  - @seqvio/renderer@0.8.1
  - @seqvio/core@0.8.1
  - @seqvio/technical@0.8.1

## 0.4.0

### Minor Changes

- 0a40341: Add human-readable editorial and visual-design authoring artifacts, and rename
  the executable CompositionDocument v2 contract to ExplainerDocument. The IR now
  uses `format: "seqvio-explainer"` with an implementation-only `schemaVersion`,
  agent planning requires approved authoring artifacts, and capture jobs emit
  `explainer.json` under capture CLI contract 2.0.

### Patch Changes

- Updated dependencies [0a40341]
  - @seqvio/core@0.8.0
  - @seqvio/renderer@0.8.0
  - @seqvio/capture@0.3.0
  - @seqvio/technical@0.8.0

## 0.3.1

### Patch Changes

- Stabilize the capture-to-explanation pipeline with semantic narration timing,
  deterministic render lifecycle and conformance, capture QA, 720p release smoke,
  render benchmarks, and the environment doctor CLI.
- Updated dependencies
  - @seqvio/core@0.7.1
  - @seqvio/renderer@0.7.1
  - @seqvio/technical@0.7.1
  - @seqvio/capture@0.2.1

## 0.3.0

### Minor Changes

- 62f5122: Add `@seqvio/capture` contract package; migrate terminal/browser pipelines to IR (record -> CaptureManifest -> CompositionDocument IR -> compileCompositionDocumentToTsx -> tsx -> render) with visual control via renderOptions; seqvio-qa adds text-overflow/font-size/contrast checks + narration/visual agreement + `--ci` + repair hints; BrowserSceneSpec + TerminalRenderOptions in the IR. terminal-narrator/browser-recorder promoted out of private (publishable).

### Patch Changes

- Updated dependencies [62f5122]
  - @seqvio/core@0.7.0
  - @seqvio/renderer@0.7.0
  - @seqvio/capture@0.2.0
  - @seqvio/technical@0.6.1

## 0.2.0

### Minor Changes

- ccb7fdf: Add `@seqvio/terminal-narrator` and a terminal scene type to the composition-document IR.
  - `@seqvio/terminal-narrator` (new, private): captures terminal sessions with `node-pty` into a recording manifest, composes a `TerminalDemo` composition, and renders a narrated `final.mp4` with step captions. Includes asciinema cast export, secret redaction, and step/caption timing refinement.
  - `@seqvio/technical`: new `TerminalDemo` renderer, ANSI/grid utilities (`ansi.ts`), and Cascadia Mono font bundling.
  - `@seqvio/core`: `TerminalSceneSpec` now supports `events`/`steps`/`commands` with validation, TSX compilation, and timeline duration derivation from event/step timestamps.
  - `@seqvio/renderer`: bundles Cascadia Mono font assets alongside JetBrains Mono.

### Patch Changes

- Updated dependencies [ccb7fdf]
  - @seqvio/renderer@0.6.0
  - @seqvio/technical@0.6.0
