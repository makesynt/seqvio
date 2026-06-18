# @seqvio/core

## 0.4.0

### Minor Changes

- 03e537e: **Stage B — Seekable Animation Adapter（HyperFrames #1 借鉴）**

  `@seqvio/core` 新增 seekable 动画开放接口，让作者把外部动画库（GSAP、Lottie、Three.js 等）的 paused timeline 注册为 `SeekableAdapter`，渲染器每帧自动 seek，使外部动画与 Seqvio 时间轴严格对齐。
  - `SeekableAdapter` 接口：`id`、`seek(timeSeconds, frame)`、可选 `requiresRaf`
  - `registerSeekable(adapter)` / `unregisterSeekable(id)`
  - `useSeekable(adapter)` React hook（mount 注册、unmount 注销）
  - `gsapSeekable(gsapTimeline, id)` GSAP 便捷包装（GSAP 为可选 peer，不硬依赖）
  - `flushSeekables(frame, fps)` — 由 renderer runtime 在每帧调用；返回是否需要额外 rAF
  - renderer `applyFrame()` 现在在 `timeline.seekToFrame()` + `setGlobalFrame()` 之后调用 `flushSeekables()`，保证截图前所有 adapter 已 seek
  - 示例：`examples/compositions/seqvio-gsap-demo.tsx`

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

## 0.2.0

### Minor Changes

- 697548a: First aligned minor release: bump all packages to 0.2.0.

  This is a coordinated 0.2.0 milestone across the Seqvio packages, published
  through the OIDC trusted-publishing pipeline with provenance and GitHub Releases.
