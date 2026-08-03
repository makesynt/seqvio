# @seqvio/whiteboard

## 0.7.1

### Patch Changes

- Stabilize the capture-to-explanation pipeline with semantic narration timing,
  deterministic render lifecycle and conformance, capture QA, 720p release smoke,
  render benchmarks, and the environment doctor CLI.
- Updated dependencies
  - @seqvio/core@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [62f5122]
  - @seqvio/core@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [ccb7fdf]
  - @seqvio/core@0.6.0

## 0.5.0

### Minor Changes

- Add expanded CJK handwriting font support, renderer font asset bundling, and production guidance for dark blackboard explainers.

### Patch Changes

- Updated dependencies
  - @seqvio/core@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [03e537e]
  - @seqvio/core@0.4.0

## 0.3.0

### Minor Changes

- 90f519a: v0.3.0: scatterbrain style package, new whiteboard themes, storyboard validation

  ### New package: `@seqvio/scatterbrain`

  A new style package parallel to `@seqvio/whiteboard`. Same
  `VideoComposition` / `Scene` / `Transition` timing model, but div/CSS
  rendering that enables rotation, gradients, soft shadows, pins, and tape.

  Components: `ScatterScene` · `StickyNote` · `Scrawl` · `PinnedList` · `Doodle` · `Polaroid`

  Depends only on `@seqvio/core`; fonts are injected via bundled
  Virgil / Long Cang / Noto Sans SC — no Google Fonts required.

  ### `@seqvio/whiteboard`
  - Add `TypeScale` and `Spacing` interfaces to `defaultTheme`; expose
    `useTypeScale()` and `useSpacing()` hooks
  - New themes: `fieldNoteTheme`, `pinAndPaperTheme`, `studioTheme`,
    `neonLightboardTheme`

  ### `@seqvio/core`
  - Strengthen storyboard IR validation with detailed per-field error reporting
  - Refactor `compile.ts` to align with updated schema constraints

  ### `@seqvio/renderer`
  - Rewrite `generate-cli` with improved IR validation feedback
  - Add `agent-contract.ts` defining the host-agent ↔ renderer interface
  - Register `@seqvio/scatterbrain` esbuild alias (optional, silently skipped
    when not installed)

### Patch Changes

- Updated dependencies [90f519a]
  - @seqvio/core@0.3.0

## 0.2.0

### Minor Changes

- 697548a: First aligned minor release: bump all packages to 0.2.0.

  This is a coordinated 0.2.0 milestone across the Seqvio packages, published
  through the OIDC trusted-publishing pipeline with provenance and GitHub Releases.

### Patch Changes

- Updated dependencies [697548a]
  - @seqvio/core@0.2.0
