<p align="center">
  <img src="./docs/assets/brand/seqvio-mark.svg" alt="Seqvio" width="96" />
</p>

<h1 align="center">Seqvio</h1>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-workspaces-red.svg)](https://docs.npmjs.com/cli/using-npm/workspaces)

[English](./README.md) | 简体中文

**让 agent 把真实工作变成有证据的讲解视频。**

Seqvio 为 agent 提供从真实系统捕获到讲解视频的完整路径。人类可读的 `EDITORIAL.md` 与 `VISUAL-DESIGN.md` 先让内容取舍和视觉方向可审阅，再由正式 `ExplainerDocument` IR 通过 `ExplanationBeat` 绑定旁白短语与视觉动作。

> **当前状态：** 仓库支持显式 React/TSX composition，以及拥有 public `whiteboard`、`code`、`diagram`、`terminal`、`browser` 编译路径和实验性 `infographic`、外部 Python `manim` 编译路径的 `ExplainerDocument`。短语锚定的 ExplanationBeat 驱动逻辑视觉时间、TTS 后语义 timeMap、语速/高亮 QA 和确定性本地渲染。Capture CLI contract `2.0` 将正式 IR 产物统一命名为 `explainer.json`。

## Demo

带旁白演示展示了从终端和浏览器证据，到可审阅方向、短语锚定时间、确定性 QA
以及多种讲解场景的完整流程。

<a href="https://www.youtube.com/watch?v=VX6tKv2mwwk"><img src="https://img.youtube.com/vi/VX6tKv2mwwk/maxresdefault.jpg" alt="Seqvio 带旁白演示预览" width="720" /></a>

点击上方预览即可在 YouTube 播放带旁白演示。从干净 checkout 开始时请使用下文列出的可移植示例。

中英文 overview composition 仍保留在
[`examples/compositions/`](./examples/compositions/)；此前发布的视频早于
当前解释契约，因此不再作为主要产品演示。

## 快速开始

Seqvio 分两部分，需要分别安装：

| 组件             | 作用                                                     | 安装方式                                 |
| ---------------- | -------------------------------------------------------- | ---------------------------------------- |
| **Agent skill**  | 教 Cursor 等 agent 如何编写 TSX composition 并走渲染流程 | `npx skills add ...`                     |
| **Renderer CLI** | 执行 `seqvio-render`、`seqvio-audio`、`seqvio-qa`        | `npm install -g @seqvio/renderer@latest` |

**只执行 `npx skills add` 不够**，还需要安装 CLI（或 clone 本仓库并 build）才能真正渲染视频。

### 1. 安装 agent skill

```bash
npx skills add makesynt/seqvio
```

这会把 Seqvio skill 安装到当前 agent。只有需要跨项目使用时才添加
`--global`。这一步**不会**安装 npm 包、clone 仓库或自动渲染 MP4。

### 2. 安装 renderer

二选一：

**方案 A — 已发布的 `0.8` CLI（多数用户推荐）**

```bash
npm install -g @seqvio/renderer@latest
seqvio-render --help
seqvio-doctor --json
```

composition 项目直接 import 可选视觉包时，应安装同一 `0.8` release line：

```bash
npm install @seqvio/product-demo@^0.8 @seqvio/scatterbrain@^0.8
```

这些依赖应安装在 TSX composition 所在项目中，而不是作为无关的全局 package。

**方案 B — 仓库 checkout（贡献者和内置示例）**

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
npm ci
npm run build
npm run doctor
node packages/renderer/dist/cli.js --help
```

内置 [`examples/compositions/`](./examples/compositions/) 和 monorepo smoke
script 请使用 workspace CLI。Public 包包括 `@seqvio/core`、`@seqvio/whiteboard`、`@seqvio/scatterbrain`、
`@seqvio/product-demo`、`@seqvio/technical`、`@seqvio/renderer`。实验性捕获包：
`@seqvio/capture`、`@seqvio/browser-recorder`、`@seqvio/terminal-narrator`。
可选的实验性 `@seqvio/manim-adapter` workspace 会调用 Python 包 `manim`，
用于在外部渲染数学动画。

### 3. 可选：旁白凭据

使用 ElevenLabs 等 TTS 前，先导出环境变量：

```bash
export ELEVENLABS_API_KEY=your_key
```

PowerShell：

```powershell
$env:ELEVENLABS_API_KEY="your_key"
```

参考 [`.env.example`](./.env.example)。CLI 从进程环境变量读取凭据，不会自动加载 `.env`。

### 4. 让 agent 生成视频

完成步骤 1 和 2 后，可尝试如下 prompt：

> 使用 `/seqvio`，先生成并审阅讲解策划与视觉设计说明，再编译成 4 场景中文 ExplainerDocument，加入短语锚定视觉 Beat，运行 QA 后渲染 MP4。

推荐路径会先审阅 `EDITORIAL.md` 和 `VISUAL-DESIGN.md`，编译
`ExplainerDocument`，解析旁白时间，运行 `seqvio-qa`，最后渲染 MP4。
需要精细视觉控制时仍可直接手写 TSX；实验性的 terminal/browser 适配器
可以向同一个 IR 提供真实观察场景，但不是创作型讲解的必需依赖。

支持 Cursor、Claude Code、Codex、Gemini CLI 等支持 skills 的 coding agent。

底层 CLI 顺序为：

```text
plan-editorial -> 审阅 EDITORIAL.md
plan-visual -> 审阅 VISUAL-DESIGN.md
plan-agent -> host agent 返回 explainer.json
validate -> compile -> audio extract/synthesize -> QA -> render
```

手动使用 IR 工作流时，按顺序生成 host-agent task，并在继续前审阅每一步产物：

```bash
seqvio-generate plan-editorial --input brief.md --write-prompt editorial-task.md
# 在 host agent 中执行 editorial-task.md，审阅后保存为 EDITORIAL.md

seqvio-generate plan-visual --input brief.md --editorial EDITORIAL.md \
  --write-prompt visual-task.md
# 执行 visual-task.md，审阅后保存为 VISUAL-DESIGN.md

seqvio-generate plan-agent --input brief.md --editorial EDITORIAL.md \
  --visual-design VISUAL-DESIGN.md --write-prompt agent-task.md
# 执行 agent-task.md，将返回的 IR 保存为 explainer.json

seqvio-generate validate --ir explainer.json --json
seqvio-generate compile --ir explainer.json \
  --out examples/compositions/generated/explainer.tsx --force
```

完整参数见 [`planning-workflow.md`](./skills/seqvio/references/planning-workflow.md)
和 [`audio-workflow.md`](./skills/seqvio/references/audio-workflow.md)。

### 不用 agent，手动渲染

```bash
seqvio-render \
  --component path/to/scene.tsx \
  --output ./output/demo.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

若在本地仓库中开发，通过 `node packages/renderer/dist/cli.js` 调用已构建的 CLI。更多细节见 [手动安装](#手动安装)。

### Browser 捕获适配器

本地 [`@seqvio/browser-recorder`](./packages/browser-recorder) workspace 会执行经过校验的 Chromium action plan，记录视频、光标/聚焦元数据和准确动作开始时间，并通过 `ExplainerDocument` 生成 Browser 场景、旁白 cue、基于捕获证据的 ExplanationBeat 与音频 manifest：

```bash
node packages/browser-recorder/dist/cli.js serve --port 4175

# 或直接执行 plan，只在 stdout 输出一个机器可读结果
node packages/browser-recorder/dist/cli.js record --plan plan.json --jobId demo --json
```

打开 `http://127.0.0.1:4175`。内置示例无需 AI provider；只有需要 AI 生成 action plan 时才配置 planner webhook。plan 契约和 stable adapter 边界见 [browser recorder README](./packages/browser-recorder/README.md)。

### Terminal 捕获适配器

[`@seqvio/terminal-narrator`](./packages/terminal-narrator) 使用 `node-pty` 与 xterm 快照保留终端状态和真实步骤时间，并把每个观察步骤编译成 Terminal 场景、旁白 cue 与基于捕获证据的 ExplanationBeat。`--withAudio` 只负责合成并混入旁白；仅当同时显式添加 `--burnCaptions` 时才烧录字幕。

### 可选的 Python Manim 适配器

[`@seqvio/manim-adapter`](./packages/manim-adapter) 是外部 Python 包 `manim`
的 TypeScript/Node.js 适配层，并不是 JavaScript 版 Manim。它把公式、图表和
几何构造渲染成经过校验的媒体与内容寻址 manifest；随后由
`@seqvio/technical` 的 `ManimClip` 将媒体作为可 seek 内容接入 Seqvio
时间线，并让命名 marker 与短语锚定的 ExplanationBeat 对齐。

只有生成这些外部媒体时才需要安装 Python Manim。Windows、macOS、Linux
安装方法、adapter 命令、缓存规则和 IR/TSX 接入方式见
[Manim 集成指南](./docs/MANIM-INTEGRATION.md)。

**环境要求：** Node.js `>=18`、Chromium（Puppeteer）和 FFmpeg。Renderer
使用内置 FFmpeg；手动执行 `ffmpeg`/`ffprobe` 诊断和媒体预处理时仍需把这些命令加入
`PATH`。本地仓库开发使用 npm workspaces 和 `package-lock.json`。可运行
`seqvio-doctor --json`，或在仓库中运行 `npm run doctor` 校验完整工具链。

## 可以做什么

- 产品和框架介绍视频
- 课程讲解、概念拆解
- 流程说明、产品 onboarding
- 多场景旁白视频与字幕烧录
- 可复用的讲解视频 composition，用于自动化内容生产

示例入口：

| 示例                                                                                         | 说明                             |
| -------------------------------------------------------------------------------------------- | -------------------------------- |
| [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx)                   | 中文旁白产品介绍                 |
| [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx)                   | 英文旁白产品介绍                 |
| [`seqvio-audio-demo.tsx`](./examples/compositions/seqvio-audio-demo.tsx)                     | 音频和字幕元数据                 |
| [`seqvio-style-manifest-demo.tsx`](./examples/compositions/seqvio-style-manifest-demo.tsx)   | 白板 style preset manifest 示例  |
| [`seqvio-product-demo-preview.tsx`](./examples/compositions/seqvio-product-demo-preview.tsx) | 产品 walkthrough 组件示例        |
| [`seqvio-scatterbrain.tsx`](./examples/compositions/seqvio-scatterbrain.tsx)                 | 便签 / workshop 风格示例         |
| [`loop-engineering-explainer.tsx`](./examples/compositions/loop-engineering-explainer.tsx)   | 长篇旁白讲解 composition         |
| [`technical-explainer.tsx`](./examples/compositions/technical-explainer.tsx)                 | 技术讲解：代码走读与架构图       |
| [`technical-demo.tsx`](./examples/compositions/technical-demo.tsx)                           | 终端演示与 ANSI 渲染展示         |
| [`manim-end-to-end-validation.tsx`](./examples/compositions/manim-end-to-end-validation.tsx) | 外部渲染图表和证明动画的旁白播放 |
| [`packages/whiteboard/examples/`](./packages/whiteboard/examples/)                           | 单场景白板示例                   |

## 工作原理

```text
内容或真实捕获
  -> EDITORIAL.md（目标、内容取舍、讲解结构）
  -> VISUAL-DESIGN.md（层级、布局、运动、分段处理）
  -> ExplainerDocument（cue + ExplanationBeat + 视觉目标）
  -> TSX + 逻辑源时间轴
  -> TTS + 短语锚点解析
  -> 语义 scene timeMap
  -> seqvio-qa
  -> seqvio-render -> MP4
```

1. 审阅人类可读的讲解策划与视觉设计说明。
2. 生成或捕获 `ExplainerDocument`，为视觉元素和捕获步骤设置稳定 ID；其中 `schemaVersion` 只是实现兼容标记，不属于产品名称。
3. 同时编写 `explanation.cues` 与 `explanation.beats`；编译器统一生成旁白、视觉时间、高亮和场景元数据。
4. 用 `seqvio-audio` 提取并合成音频；实际音频时长会解析 Beat `outputFrame` 和语义 timeMap。
5. 运行 `seqvio-qa`；无法解析或倒序的 Beat 是错误，整段字符比例对齐的低置信度会形成警告。
6. 使用 `seqvio-render --audioManifest ...` 渲染并混流旁白。

手写 TSX 仍是受支持的低层生产接口，也可以直接维护 `meta.audio.narration`。

完整 authoring contract 见 [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md)。

## Agent Skills

Skill 主文件：[`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md)，参考文档：

| 参考                                                                              | 用途                                           |
| --------------------------------------------------------------------------------- | ---------------------------------------------- |
| [`authoring-patterns.md`](./skills/seqvio/references/authoring-patterns.md)       | TSX composition 模式与 timing 规则             |
| [`audio-workflow.md`](./skills/seqvio/references/audio-workflow.md)               | 提取、合成、混流旁白                           |
| [`render-workflow.md`](./skills/seqvio/references/render-workflow.md)             | build、render、smoke test 命令                 |
| [`production-techniques.md`](./skills/seqvio/references/production-techniques.md) | voice-first timing、参考风格分析和视觉 QA 规则 |
| [`planning-workflow.md`](./skills/seqvio/references/planning-workflow.md)         | Editorial/Visual 规划和 agent handoff          |

安装 skill（见 [快速开始](#快速开始)）：

```bash
npx skills add makesynt/seqvio
```

Skill 负责教流程和命令；要输出 MP4 还需单独安装 `@seqvio/renderer`。

## 为什么是 Seqvio

Seqvio 是 agent 用来解释想法的视觉语言，而不只是一个动画工具。它不是通用视频编辑器，也不是通用 code-to-video 引擎；它的价值在渲染循环之上的讲解词汇和工作流。完整定位见 [`docs/VISION.md`](./docs/VISION.md)。

- **面向 Agent 的视觉词汇**：用具体组件决定观众接下来应该看到、听到并理解什么
- **讲解视频优先**：场景、旁白、字幕、视觉步骤放在同一 composition 中
- **白板风格内建**：手写文字、草图形状、图片、图标、style presets、画笔/手势节奏
- **专用视觉包**：`@seqvio/scatterbrain` 提供便签/workshop 场景，`@seqvio/product-demo` 提供产品 walkthrough 场景，`@seqvio/technical` 提供技术讲解场景
- **联合讲解契约**：旁白短语、视觉动作和捕获证据统一写入 ExplanationBeat
- **可执行 QA 闭环**：检查无法解析/倒序的 Beat、语速和高亮节奏、音频/媒体故障以及视觉缺陷
- **适合 AI 协作**：小 contract、显式帧时间、示例齐全
- **本地 MP4 输出**：用 Puppeteer + FFmpeg 渲染完成的讲解视频

## 当前能力

- 带 `meta` duration / fps 的 React/TSX composition
- `@seqvio/whiteboard`：`WhiteboardScene`、`DrawText`、`DrawShape`、`DrawImage`、`DrawIcon`、`Hand` 和 style presets
- `@seqvio/scatterbrain`：便签 / cork-board 风格组件
- `@seqvio/product-demo`：`ProductDemoScene`、`BrowserFrame`、`ScreenshotPlaceholder`、`CursorPath`、`Callout`、`ProductTitle`
- `@seqvio/technical`：`TechnicalScene`、`AnnotationTarget`、`CodeWalkthrough`、`ArchitectureDiagram`、`TerminalDemo`，以及 ANSI/grid 工具函数和内置代码字体
- `@seqvio/technical` 的 `ManimClip`：对外部渲染的数学动画进行确定性 seek，并让 marker 与旁白对齐
- 实验性 `@seqvio/manim-adapter`：检查 Python/Manim、确定性执行、媒体探测、内容寻址 manifest 和缓存复用
- 终端场景在 composition-document IR 中的支持（`events` / `steps` / `commands`），含校验和 TSX 编译
- Browser 场景支持录制视频、光标/聚焦/点击元数据、真实动作时钟和 time-mapped 媒体 seek
- `ExplanationBeat` cue、精确短语锚点、视觉动作、捕获证据、TTS 后 `outputFrame` 和语义 `sceneTimings[].timeMap`
- `@seqvio/core`：`VideoComposition`、`Scene`、`Transition`
- ExplainerDocument 是正式 IR；Storyboard IR 仅作为白板输入兼容路径保留
- `seqvio-render`：TSX 到 MP4
- `seqvio-audio`：manifest 提取与 TTS 合成
- `seqvio-qa`：baseline/capture profile、稳定音频/时序/媒体诊断、警告升级和关键帧视觉检查
- `seqvio-doctor`：检查 Node、Chromium、FFmpeg、内置字体、`node-pty` 和工作路径，并支持 `--json`
- TTS provider：ElevenLabs、OpenAI、MiniMax、edge-tts

## 手动安装

适用于本地仓库开发，或需要结合内置示例做带旁白渲染的场景。

### 从 npm 安装

```bash
npm install -g @seqvio/renderer@latest
seqvio-doctor --json
```

本文档对应 `0.8` release line。需要内置示例、尚未发布的源码改动或贡献者工具时，使用本地仓库 checkout。

### Clone 并 build 仓库

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
npm ci
npm run build
```

### 渲染 composition

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-intro.tsx \
  --output output/seqvio-intro.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

本地渲染输出写入 [`output/`](./output/)（已被 gitignore）。

### 带旁白渲染

```bash
node packages/renderer/dist/audio-cli.js extract \
  --component examples/compositions/seqvio-overview-zh.tsx \
  --out output/seqvio-overview-zh.manifest.json

node packages/renderer/dist/audio-cli.js synthesize \
  --provider elevenlabs \
  --manifest output/seqvio-overview-zh.manifest.json \
  --outDir output/seqvio-overview-zh-audio

node packages/renderer/dist/qa-cli.js \
  --component examples/compositions/seqvio-overview-zh.tsx \
  --outDir output/seqvio-overview-zh-qa \
  --audioManifest output/seqvio-overview-zh-audio/audio-manifest.resolved.json \
  --ci

node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-overview-zh.tsx \
  --output output/seqvio-overview-zh.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium \
  --audioManifest output/seqvio-overview-zh-audio/audio-manifest.resolved.json
```

旁白会自动从 manifest 混入音轨。**默认不要**加 `--burnCaptions`；它会把字幕硬编码进画面（长旁白会遮挡下半屏）。YouTube/B 站请单独上传 SRT。详见 [`skills/seqvio/references/audio-workflow.md`](./skills/seqvio/references/audio-workflow.md#caption-burn-in-optional)。

凭据从进程环境变量读取；CLI 不会自动加载 `.env`。参考 [`.env.example`](./.env.example)。

## Packages

| Package                                                     | 说明                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [`@seqvio/whiteboard`](./packages/whiteboard)               | 白板绘制组件和 timing helpers                                                               |
| [`@seqvio/core`](./packages/core)                           | Composition 容器、场景、转场和 timeline runtime                                             |
| [`@seqvio/scatterbrain`](./packages/scatterbrain)           | 便签 / cork-board 风格组件                                                                  |
| [`@seqvio/product-demo`](./packages/product-demo)           | 浏览器框、光标路径、截图占位、callout 和产品 walkthrough 组件                               |
| [`@seqvio/technical`](./packages/technical)                 | 技术讲解 runtime：代码走读、架构图、终端演示、标注和内置字体                                |
| [`@seqvio/terminal-narrator`](./packages/terminal-narrator) | 实验性 package，提供 stable node-pty/xterm 捕获契约 → IR/ExplanationBeat → 可选旁白 MP4     |
| [`@seqvio/browser-recorder`](./packages/browser-recorder)   | 实验性 package，提供 stable Chromium action 捕获契约，保留真实动作时间 → IR/ExplanationBeat |
| [`@seqvio/capture`](./packages/capture)                     | 实验性的共享 capture session 和 artifact 契约                                               |
| [`@seqvio/manim-adapter`](./packages/manim-adapter)         | 调用 Python Manim，并校验、缓存渲染媒体 manifest 的实验性适配层                             |
| [`@seqvio/renderer`](./packages/renderer)                   | TSX bundler，以及 `seqvio-render` / `seqvio-audio` CLI                                      |

## 文档

文档入口：[`docs/README.md`](./docs/README.md)

推荐阅读：

- [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md)
- [`docs/EXPLANATION-BEAT-TIMING.md`](./docs/EXPLANATION-BEAT-TIMING.md)
- [`docs/CAPTURE-CLI-CONTRACT.md`](./docs/CAPTURE-CLI-CONTRACT.md)
- [`docs/MANIM-INTEGRATION.md`](./docs/MANIM-INTEGRATION.md) — Python Manim 安装、adapter 渲染、manifest 与时间线接入
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md)
- [`examples/compositions/README.md`](./examples/compositions/README.md)
- [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md)
- [`skills/seqvio/references/production-techniques.md`](./skills/seqvio/references/production-techniques.md)
- [`docs/marketing/POSITIONING.md`](./docs/marketing/POSITIONING.md) — 当前产品定位和能力边界
- [`docs/marketing/FEATURE-STATUS.md`](./docs/marketing/FEATURE-STATUS.md) — public 与 experimental 的对外措辞

如果文档与代码冲突，以代码和 [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) 为准。

## Roadmap

完整的阶段划分和取舍理由见 [`docs/ROADMAP.md`](./docs/ROADMAP.md)。方向概要：

1. **统一捕获/IR 路径** -- shared dispatcher 路由与 legacy writer 移除已经完成，下一步围绕 `CaptureSession -> ExplainerDocument` 稳定适配器 CLI。
2. **ExplanationBeat 时间模型** -- 已覆盖所有稳定场景，包括捕获证据和 TTS 后短语对齐。
3. **发布 QA** -- baseline/capture profile 已覆盖视觉、节奏、音频、媒体、语义 Beat 故障和确定性的浏览器隐私遮罩；OCR 不作为安全边界。
4. **打包与晋级** -- CLI/产物 contract `2.0` 已完成；验证支持的 npm/runtime 主机后再晋级生命周期。

产品定位与范围：

- [`docs/VISION.md`](./docs/VISION.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)

历史说明：

- [`docs/archive/PRODUCT-PLAN-2026-07.md`](./docs/archive/PRODUCT-PLAN-2026-07.md)（历史快照）

## 贡献

欢迎贡献。请先阅读：

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`SUPPORT.md`](./SUPPORT.md)
- [`SECURITY.md`](./SECURITY.md)
- [`CHANGELOG.md`](./CHANGELOG.md)

## License

[MIT](./LICENSE) © Seqvio Team
