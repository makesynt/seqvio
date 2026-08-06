# @seqvio/capture

## 0.3.1

### Patch Changes

- 8dd96cf: Add fail-closed selector and rectangle privacy masks for browser capture plans,
  retain non-sensitive mask evidence in recording manifests, and keep the `serve`
  CLI process alive until it is terminated. Promote the versioned Terminal and
  Browser CLI/artifact contract to stable after the Windows/Linux/macOS runtime
  matrix passed.
  - @seqvio/core@0.8.1

## 0.3.0

### Minor Changes

- 0a40341: Add human-readable editorial and visual-design authoring artifacts, and rename
  the executable CompositionDocument v2 contract to ExplainerDocument. The IR now
  uses `format: "seqvio-explainer"` with an implementation-only `schemaVersion`,
  agent planning requires approved authoring artifacts, and capture jobs emit
  `explainer.json` under capture CLI contract 2.0.

### Patch Changes

- Updated dependencies [0a40341]
  - @seqvio/core@0.8.0

## 0.2.1

### Patch Changes

- Stabilize the capture-to-explanation pipeline with semantic narration timing,
  deterministic render lifecycle and conformance, capture QA, 720p release smoke,
  render benchmarks, and the environment doctor CLI.
- Updated dependencies
  - @seqvio/core@0.7.1

## 0.2.0

### Minor Changes

- 62f5122: Add `@seqvio/capture` contract package; migrate terminal/browser pipelines to IR (record -> CaptureManifest -> CompositionDocument IR -> compileCompositionDocumentToTsx -> tsx -> render) with visual control via renderOptions; seqvio-qa adds text-overflow/font-size/contrast checks + narration/visual agreement + `--ci` + repair hints; BrowserSceneSpec + TerminalRenderOptions in the IR. terminal-narrator/browser-recorder promoted out of private (publishable).

### Patch Changes

- Updated dependencies [62f5122]
  - @seqvio/core@0.7.0
