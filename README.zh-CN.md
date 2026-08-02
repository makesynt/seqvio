# Seqvio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-workspaces-red.svg)](https://docs.npmjs.com/cli/using-npm/workspaces)

[English](./README.md) | 简体中文

**让 coding agent 拥有解释想法的视觉语言。**

Seqvio 为 coding agent 提供从真实系统捕获到讲解视频的完整路径。`CompositionDocument v2` 可以用 `ExplanationBeat` 同时设计旁白短语和视觉动作，再依据实际 TTS 时长完成语义对齐、QA 和本地 MP4 渲染。

> **当前状态：** 仓库支持显式 React/TSX composition，以及拥有完整 `whiteboard`、`code`、`diagram`、`terminal`、`browser` 编译路径的 `CompositionDocument v2`。短语锚定的 ExplanationBeat 会驱动逻辑视觉时间、TTS 后语义 timeMap、语速/高亮 QA 和确定性本地渲染。Terminal 与 Browser 生产管线已经统一经过 shared capture dispatcher，把真实步骤经 IR 编译，每个作业都会运行 capture QA，并通过 1280x720 release smoke。Capture CLI contract `1.0` 已固定命令、JSON 结果、退出码、音频/字幕选项、进度和产物布局；生命周期晋级前由 Windows/Linux/macOS 主机矩阵验证。

## Demo

预渲染产品介绍视频，使用 CosyVoice 旁白，覆盖三个视觉风格包（`@seqvio/whiteboard`、`@seqvio/scatterbrain`、`@seqvio/product-demo`）。源 composition 位于 [`examples/compositions/`](./examples/compositions/)。

**英文介绍** — [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx)

https://github.com/user-attachments/assets/83687d9c-63f0-4544-a67a-8f6eacc19928

**中文介绍** — [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx)

https://github.com/user-attachments/assets/3ce605bc-7ad1-449b-a67c-5d8368f5398b

## 快速开始

Seqvio 分两部分，需要分别安装：

| 组件 | 作用 | 安装方式 |
| --- | --- | --- |
| **Agent skill** | 教 Cursor 等 agent 如何编写 TSX composition 并走渲染流程 | `npx skills add ...` |
| **Renderer CLI** | 执行 `seqvio-render`、`seqvio-audio`、`seqvio-qa` | `npm install @seqvio/renderer` 或本地仓库 build |

**只执行 `npx skills add` 不够**，还需要安装 CLI（或 clone 本仓库并 build）才能真正渲染视频。

### 1. 安装 agent skill

```bash
npx skills add makesynt/seqvio --skill seqvio -a cursor -y
```

如使用其他 agent，把 `cursor` 换成对应名称（如 `claude-code`、`codex`）。可先查看 skill 列表：

```bash
npx skills add makesynt/seqvio --list
```

这一步只会把 Seqvio skill 安装到 agent，**不会**安装 npm 包、不会 clone 仓库、也不会自动渲染 MP4。

### 2. 安装 renderer

二选一：

**方案 A — npm 包（大多数用户推荐）**

```bash
npm install -g @seqvio/renderer
seqvio-render --help
```

已发布包：`@seqvio/core`、`@seqvio/whiteboard`、`@seqvio/scatterbrain`、`@seqvio/product-demo`、`@seqvio/technical`、`@seqvio/renderer`。

当 composition 直接 import 可选视觉包时，可额外安装：

```bash
npm install @seqvio/product-demo @seqvio/scatterbrain
```

**方案 B — 本地仓库（贡献者与示例开发推荐）**

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
npm ci
npm run build
node packages/renderer/dist/cli.js --help
```

需要直接使用 [`examples/compositions/`](./examples/compositions/) 或 monorepo smoke 脚本时，选此方案。

### 3. 可选：旁白凭据

使用 ElevenLabs 等 TTS 前，先导出环境变量：

```bash
export ELEVENLABS_API_KEY=your_key
```

参考 [`.env.example`](./.env.example)。CLI 从进程环境变量读取凭据，不会自动加载 `.env`。

### 4. 让 agent 生成视频

完成步骤 1 和 2 后，可尝试如下 prompt：

> 使用 `/seqvio`，用 CompositionDocument v2 制作 4 场景中文技术讲解，同时设计旁白 cue 和短语锚定的视觉 Beat，使用 ElevenLabs 合成，运行 QA 后渲染 MP4。

Skill 会引导 agent：选示例 composition、改 TSX、提取旁白元数据、合成音频、运行 `seqvio-render`。

支持 Cursor、Claude Code、Codex、Gemini CLI 等支持 skills 的 coding agent。

### 不用 agent，手动渲染

```bash
seqvio-render \
  --component path/to/scene.tsx \
  --output ./output/demo.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

若在本地仓库中开发，通过 `node packages/renderer/dist/cli.js` 调用已构建的 CLI。更多细节见 [手动安装](#手动安装)。

### Browser 捕获适配器

本地 [`@seqvio/browser-recorder`](./packages/browser-recorder) workspace 会执行经过校验的 Chromium action plan，记录视频、光标/聚焦元数据和准确动作开始时间，并通过 `CompositionDocument v2` 生成 Browser 场景、旁白 cue、基于捕获证据的 ExplanationBeat 与音频 manifest：

```bash
node packages/browser-recorder/dist/cli.js serve --port 4175

# 或直接执行 plan，只在 stdout 输出一个机器可读结果
node packages/browser-recorder/dist/cli.js record --plan plan.json --jobId demo --json
```

打开 `http://127.0.0.1:4175`。内置示例无需 AI provider；只有需要 AI 生成 action plan 时才配置 planner webhook。plan 契约和 pre-stable CLI 边界见 [browser recorder README](./packages/browser-recorder/README.md)。

### Terminal 捕获适配器

[`@seqvio/terminal-narrator`](./packages/terminal-narrator) 使用 `node-pty` 与 xterm 快照保留终端状态和真实步骤时间，并把每个观察步骤编译成 Terminal 场景、旁白 cue 与基于捕获证据的 ExplanationBeat。`--withAudio` 只负责合成并混入旁白；仅当同时显式添加 `--burnCaptions` 时才烧录字幕。

**环境要求：** Node.js `>=18`、Chromium（Puppeteer）、FFmpeg（`@seqvio/renderer` 已内置）。本地仓库开发使用 npm workspaces 和 `package-lock.json`。可运行 `seqvio-doctor`，或在仓库中运行 `npm run doctor`，一次校验完整本地工具链。

## 可以做什么

- 产品和框架介绍视频
- 课程讲解、概念拆解
- 流程说明、产品 onboarding
- 多场景旁白视频与字幕烧录
- 可复用的讲解视频 composition，用于自动化内容生产

示例入口：

| 示例 | 说明 |
| --- | --- |
| [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx) | 中文旁白产品介绍 |
| [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx) | 英文旁白产品介绍 |
| [`seqvio-audio-demo.tsx`](./examples/compositions/seqvio-audio-demo.tsx) | 音频和字幕元数据 |
| [`seqvio-style-manifest-demo.tsx`](./examples/compositions/seqvio-style-manifest-demo.tsx) | 白板 style preset manifest 示例 |
| [`seqvio-product-demo-preview.tsx`](./examples/compositions/seqvio-product-demo-preview.tsx) | 产品 walkthrough 组件示例 |
| [`seqvio-scatterbrain.tsx`](./examples/compositions/seqvio-scatterbrain.tsx) | 便签 / workshop 风格示例 |
| [`loop-engineering-explainer.tsx`](./examples/compositions/loop-engineering-explainer.tsx) | 长篇旁白讲解 composition |
| [`technical-explainer-v2.tsx`](./examples/compositions/technical-explainer-v2.tsx) | 技术讲解：代码走读与架构图 |
| [`technical-demo-v2.tsx`](./examples/compositions/technical-demo-v2.tsx) | 终端演示与 ANSI 渲染展示 |
| [`packages/whiteboard/examples/`](./packages/whiteboard/examples/) | 单场景白板示例 |

## 工作原理

```text
内容或真实捕获
  -> CompositionDocument v2（cue + ExplanationBeat + 视觉目标）
  -> TSX + 逻辑源时间轴
  -> TTS + 短语锚点解析
  -> 语义 scene timeMap
  -> seqvio-qa
  -> seqvio-render -> MP4
```

1. 生成或捕获 `CompositionDocument v2`，为视觉元素和捕获步骤设置稳定 ID。
2. 同时编写 `explanation.cues` 与 `explanation.beats`；编译器统一生成旁白、视觉时间、高亮和场景元数据。
3. 用 `seqvio-audio` 提取并合成音频；实际音频时长会解析 Beat `outputFrame` 和语义 timeMap。
4. 运行 `seqvio-qa`；无法解析或倒序的 Beat 是错误，整段字符比例对齐的低置信度会形成警告。
5. 使用 `seqvio-render --audioManifest ...` 渲染并混流旁白。

手写 TSX 仍是受支持的低层生产接口，也可以直接维护 `meta.audio.narration`。

完整 authoring contract 见 [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md)。

## Agent Skills

Skill 主文件：[`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md)，参考文档：

| 参考 | 用途 |
| --- | --- |
| [`authoring-patterns.md`](./skills/seqvio/references/authoring-patterns.md) | TSX composition 模式与 timing 规则 |
| [`audio-workflow.md`](./skills/seqvio/references/audio-workflow.md) | 提取、合成、混流旁白 |
| [`render-workflow.md`](./skills/seqvio/references/render-workflow.md) | build、render、smoke test 命令 |
| [`production-techniques.md`](./skills/seqvio/references/production-techniques.md) | voice-first timing、参考风格分析和视觉 QA 规则 |
| [`planning-workflow.md`](./skills/seqvio/references/planning-workflow.md) | storyboard IR planning 和 agent handoff |

安装 skill（见 [快速开始](#快速开始)）：

```bash
npx skills add makesynt/seqvio --skill seqvio -a cursor -y
```

Skill 负责教流程和命令；要输出 MP4 还需单独安装 `@seqvio/renderer`。

## 为什么是 Seqvio

Seqvio 是 coding agent 用来解释想法的视觉语言，而不只是一个动画工具。它不是通用视频编辑器，也不是通用 code-to-video 引擎；它的价值在渲染循环之上的讲解词汇和工作流。完整定位见 [`docs/VISION.md`](./docs/VISION.md)。

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
- 终端场景在 composition-document IR 中的支持（`events` / `steps` / `commands`），含校验和 TSX 编译
- Browser 场景支持录制视频、光标/聚焦/点击元数据、真实动作时钟和 time-mapped 媒体 seek
- `ExplanationBeat` cue、精确短语锚点、视觉动作、捕获证据、TTS 后 `outputFrame` 和语义 `sceneTimings[].timeMap`
- `@seqvio/core`：`VideoComposition`、`Scene`、`Transition`
- CompositionDocument v2 与保留的 Storyboard IR schema、validation、pacing 和 TSX compile helpers
- `seqvio-render`：TSX 到 MP4
- `seqvio-audio`：manifest 提取与 TTS 合成
- `seqvio-qa`：baseline/capture profile、稳定音频/时序/媒体诊断、警告升级和关键帧视觉检查
- `seqvio-doctor`：检查 Node、Chromium、FFmpeg、内置字体、`node-pty` 和工作路径，并支持 `--json`
- TTS provider：ElevenLabs、OpenAI、MiniMax、edge-tts

## 手动安装

适用于本地仓库开发，或需要结合内置示例做带旁白渲染的场景。

### 从 npm 安装

```bash
npm install -g @seqvio/renderer
```

会全局安装 `seqvio-render`、`seqvio-audio`、`seqvio-generate`、`seqvio-preview`、`seqvio-add`、`seqvio-qa` 和 `seqvio-doctor`，并自动拉取 `@seqvio/core`、`@seqvio/whiteboard`。如果 composition 在 monorepo 外直接 import `@seqvio/product-demo`、`@seqvio/scatterbrain` 或 `@seqvio/technical`，需要额外安装对应包。

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

node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-overview-zh.tsx \
  --output output/seqvio-overview-zh.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium \
--audioManifest output/seqvio-overview-zh-audio/audio-manifest.resolved.json
```

旁白会自动从 manifest 混入音轨。**默认不要**加 `--burnCaptions`；它会把字幕硬编码进画面（长旁白会遮挡下半屏）。YouTube/B 站请单独上传 SRT。详见 [`skills/seqvio/references/audio-workflow.md`](./skills/seqvio/references/audio-workflow.md#caption-burn-in-optional)。

凭据从进程环境变量读取；CLI 不会自动加载 `.env`。参考 [`.env.example`](./.env.example)。

## Packages

| Package | 说明 |
| --- | --- |
| [`@seqvio/whiteboard`](./packages/whiteboard) | 白板绘制组件和 timing helpers |
| [`@seqvio/core`](./packages/core) | Composition 容器、场景、转场和 timeline runtime |
| [`@seqvio/scatterbrain`](./packages/scatterbrain) | 便签 / cork-board 风格组件 |
| [`@seqvio/product-demo`](./packages/product-demo) | 浏览器框、光标路径、截图占位、callout 和产品 walkthrough 组件 |
| [`@seqvio/technical`](./packages/technical) | 技术讲解 runtime：代码走读、架构图、终端演示、标注和内置字体 |
| [`@seqvio/terminal-narrator`](./packages/terminal-narrator) | Pre-stable node-pty/xterm 捕获 → IR/ExplanationBeat → 可选旁白 MP4 |
| [`@seqvio/browser-recorder`](./packages/browser-recorder) | Pre-stable Chromium action 捕获，保留真实动作时间 → IR/ExplanationBeat |
| [`@seqvio/renderer`](./packages/renderer) | TSX bundler，以及 `seqvio-render` / `seqvio-audio` CLI |

## 文档

文档入口：[`docs/README.md`](./docs/README.md)

推荐阅读：

- [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md)
- [`docs/EXPLANATION-BEAT-TIMING.md`](./docs/EXPLANATION-BEAT-TIMING.md)
- [`docs/CAPTURE-CLI-CONTRACT.md`](./docs/CAPTURE-CLI-CONTRACT.md)
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md)
- [`examples/compositions/README.md`](./examples/compositions/README.md)
- [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md)
- [`skills/seqvio/references/production-techniques.md`](./skills/seqvio/references/production-techniques.md)

如果文档与代码冲突，以代码和 [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) 为准。

## Roadmap

完整的阶段划分和取舍理由见 [`docs/ROADMAP.md`](./docs/ROADMAP.md)。方向概要：

1. **统一捕获/IR 路径** -- shared dispatcher 路由与 legacy writer 移除已经完成，下一步围绕 `CaptureSession -> CompositionDocument` 稳定适配器 CLI。
2. **ExplanationBeat 时间模型** -- 已覆盖所有稳定场景，包括捕获证据和 TTS 后短语对齐。
3. **发布 QA** -- baseline/capture profile 已覆盖视觉、节奏、音频、媒体和语义 Beat 故障；截图隐私 masking 暂缓。
4. **打包与晋级** -- CLI/产物 contract `1.0` 已完成；验证支持的 npm/runtime 主机后再晋级生命周期。截图隐私仍暂缓。

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
