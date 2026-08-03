# @seqvio/browser-recorder

## 0.2.1

### Patch Changes

- Stabilize the capture-to-explanation pipeline with semantic narration timing,
  deterministic render lifecycle and conformance, capture QA, 720p release smoke,
  render benchmarks, and the environment doctor CLI.
- Updated dependencies
  - @seqvio/core@0.7.1
  - @seqvio/renderer@0.7.1
  - @seqvio/product-demo@0.7.1
  - @seqvio/capture@0.2.1

## 0.2.0

### Minor Changes

- 62f5122: Add `@seqvio/capture` contract package; migrate terminal/browser pipelines to IR (record -> CaptureManifest -> CompositionDocument IR -> compileCompositionDocumentToTsx -> tsx -> render) with visual control via renderOptions; seqvio-qa adds text-overflow/font-size/contrast checks + narration/visual agreement + `--ci` + repair hints; BrowserSceneSpec + TerminalRenderOptions in the IR. terminal-narrator/browser-recorder promoted out of private (publishable).

### Patch Changes

- Updated dependencies [62f5122]
  - @seqvio/core@0.7.0
  - @seqvio/renderer@0.7.0
  - @seqvio/capture@0.2.0
  - @seqvio/product-demo@0.7.0

## 0.1.1

### Patch Changes

- Updated dependencies [ccb7fdf]
  - @seqvio/renderer@0.6.0
  - @seqvio/product-demo@0.6.0
