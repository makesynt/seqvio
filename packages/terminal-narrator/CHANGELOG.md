# @seqvio/terminal-narrator

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
