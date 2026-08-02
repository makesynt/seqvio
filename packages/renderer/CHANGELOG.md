# @seqvio/renderer

## 0.7.1

### Patch Changes

- Stabilize the capture-to-explanation pipeline with semantic narration timing,
  deterministic render lifecycle and conformance, capture QA, 720p release smoke,
  render benchmarks, and the environment doctor CLI.
- Updated dependencies
  - @seqvio/core@0.7.1
  - @seqvio/whiteboard@0.7.1
  - @seqvio/technical@0.7.1
  - @seqvio/capture@0.2.1

## 0.7.0

### Minor Changes

- 62f5122: Add `@seqvio/capture` contract package; migrate terminal/browser pipelines to IR (record -> CaptureManifest -> CompositionDocument IR -> compileCompositionDocumentToTsx -> tsx -> render) with visual control via renderOptions; seqvio-qa adds text-overflow/font-size/contrast checks + narration/visual agreement + `--ci` + repair hints; BrowserSceneSpec + TerminalRenderOptions in the IR. terminal-narrator/browser-recorder promoted out of private (publishable).

### Patch Changes

- Updated dependencies [62f5122]
  - @seqvio/core@0.7.0
  - @seqvio/technical@0.6.1
  - @seqvio/whiteboard@0.7.0

## 0.6.0

### Minor Changes

- ccb7fdf: Add `@seqvio/terminal-narrator` and a terminal scene type to the composition-document IR.
  - `@seqvio/terminal-narrator` (new, private): captures terminal sessions with `node-pty` into a recording manifest, composes a `TerminalDemo` composition, and renders a narrated `final.mp4` with step captions. Includes asciinema cast export, secret redaction, and step/caption timing refinement.
  - `@seqvio/technical`: new `TerminalDemo` renderer, ANSI/grid utilities (`ansi.ts`), and Cascadia Mono font bundling.
  - `@seqvio/core`: `TerminalSceneSpec` now supports `events`/`steps`/`commands` with validation, TSX compilation, and timeline duration derivation from event/step timestamps.
  - `@seqvio/renderer`: bundles Cascadia Mono font assets alongside JetBrains Mono.

### Patch Changes

- Updated dependencies [ccb7fdf]
  - @seqvio/core@0.6.0
  - @seqvio/technical@0.6.0
  - @seqvio/whiteboard@0.6.0

## 0.5.0

### Minor Changes

- Add expanded CJK handwriting font support, renderer font asset bundling, and production guidance for dark blackboard explainers.

### Patch Changes

- Updated dependencies
  - @seqvio/core@0.5.0
  - @seqvio/whiteboard@0.5.0

## 0.4.0

### Minor Changes

- ee33b6b: **Stage D — Catalog 可复用 block + `seqvio-add`（HyperFrames #4 借鉴）**

  新 `seqvio-add` CLI bin，从仓库内 `catalog/` 目录一键复制可复用的 TSX 场景片段到项目中。

  首批 4 个 block：
  - `cover-card` — 白板标题卡（animated display + subtitle）
  - `scatter-list` — Scatterbrain 便签列表（2×2 sticky-note 布局）
  - `stat-card` — 白板指标卡（大数字 + 下划线 + 标签）
  - `caption-bar` — 底部字幕条组件（可复用于任何场景）

  用法：

  ```bash
  seqvio-add --list                  # 列出所有可用 block
  seqvio-add cover-card              # 复制到 examples/compositions/
  seqvio-add scatter-list --dest ./  # 复制到自定义目录
  ```

  - 自动检测 `examples/compositions/` 目录作为默认目标
  - 校验所需包是否在 package.json 中（missing 时 warn 但不阻塞）
  - `--force` 覆盖已有文件
  - 文档：`skills/seqvio/references/catalog.md`

- 8bb6062: **Stage C — frame.md 设计系统（HyperFrames #3 借鉴）**

  `seqvio-generate frame-spec init` 新子命令，将当前主题的设计 token 导出为一份面向镜头的 `FRAME.md` 规范文件，供 AI agent 排版时作为设计约束参考。
  - 支持 4 种风格：`whiteboard/default`、`whiteboard/studio`、`whiteboard/field-note`、`scatterbrain`
  - 导出内容：画布尺寸/安全区、type scale、spacing tokens、色板、字体栈、各风格注意事项
  - `--style`、`--width`、`--height`、`--out`、`--force` 选项
  - 默认输出到 `./FRAME.md`；可指定 `--out` 到任意路径
  - 仓库级模板位于 `docs/frame-spec/FRAME.md`（1920×1080 whiteboard/default）
  - 文档：`skills/seqvio/references/frame-spec.md`

- 5defafc: **渲染性能优化：Stage A（快赢）+ Stage E（并行截帧）**

  ### Stage A — 性能快赢
  - **`--frameFormat jpeg|png`**：截帧格式可选。`jpeg` 用于预览（速度快 2-3×）；`png` 为最终交付默认值（无损）。不影响最终 MP4 编码器或 CRF。
  - **`--preset preview|standard|final|high`**：一键设置 fps / pixelRatio / quality / frameFormat 组合，降低调参成本。显式 flag 始终覆盖 preset。
    - `preview`：fps=24, pixelRatio=1, quality=low, frameFormat=jpeg（最快）
    - `standard`：fps=30, pixelRatio=1, quality=medium, frameFormat=png
    - `final`：fps=30, pixelRatio=2, quality=medium, frameFormat=png
    - `high`：fps=30, pixelRatio=2, quality=high, frameFormat=png
  - **timing 可观测性**：`render()` 现返回 `RenderResult`（总耗时、各阶段 ms、rendered fps、输出字节）；CLI 末尾自动打印 timing 汇总表。
  - **Help 文本**：补充说明 `--quality` 只控 CRF，`--frameFormat jpeg` 是加速截帧的推荐预览选项。

  ### Stage E — 单机并行（Remotion 本地模型）
  - **`--workers N`**：在同一个浏览器中打开 N 个页面并行截帧，帧落盘编号，最后 **一次** FFmpeg 编码（无 concat、无接缝）。
    - 默认 `workers=1`：维持原有 image2pipe 串行路径，行为完全不变。
    - `workers>1`：多 page 截帧并行，适合多核机器的长视频渲染。
  - **修正注释**：原注释将「切片+concat（N FFmpeg + concat，已拒绝）」与「多 page + 单编码（本次采用）」混淆。新注释区分两者，避免后人误解。

### Patch Changes

- 03e537e: **Stage B — Seekable Animation Adapter（HyperFrames #1 借鉴）**

  `@seqvio/core` 新增 seekable 动画开放接口，让作者把外部动画库（GSAP、Lottie、Three.js 等）的 paused timeline 注册为 `SeekableAdapter`，渲染器每帧自动 seek，使外部动画与 Seqvio 时间轴严格对齐。
  - `SeekableAdapter` 接口：`id`、`seek(timeSeconds, frame)`、可选 `requiresRaf`
  - `registerSeekable(adapter)` / `unregisterSeekable(id)`
  - `useSeekable(adapter)` React hook（mount 注册、unmount 注销）
  - `gsapSeekable(gsapTimeline, id)` GSAP 便捷包装（GSAP 为可选 peer，不硬依赖）
  - `flushSeekables(frame, fps)` — 由 renderer runtime 在每帧调用；返回是否需要额外 rAF
  - renderer `applyFrame()` 现在在 `timeline.seekToFrame()` + `setGlobalFrame()` 之后调用 `flushSeekables()`，保证截图前所有 adapter 已 seek
  - 示例：`examples/compositions/seqvio-gsap-demo.tsx`

- Updated dependencies [03e537e]
  - @seqvio/core@0.4.0
  - @seqvio/whiteboard@0.4.0

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
  - @seqvio/whiteboard@0.3.0

## 0.2.0

### Minor Changes

- 697548a: First aligned minor release: bump all packages to 0.2.0.

  This is a coordinated 0.2.0 milestone across the Seqvio packages, published
  through the OIDC trusted-publishing pipeline with provenance and GitHub Releases.

### Patch Changes

- Updated dependencies [697548a]
  - @seqvio/core@0.2.0
  - @seqvio/whiteboard@0.2.0
