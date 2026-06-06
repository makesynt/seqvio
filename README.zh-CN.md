# Seqvio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8-orange.svg)](https://pnpm.io/)

[English](./README.md) | 简体中文

**将结构化内容变成带旁白的讲解视频。**

Seqvio 是一个面向讲解视频的结构化工作流，适合把课程、产品 walkthrough 和技术概念说明变成短视频。它把场景编排、白板风格视觉元素、旁白元数据、字幕和本地 MP4 渲染放在同一套可版本管理的流程中。

> **当前状态：** Seqvio 支持显式 React/TSX composition、白板风格场景、音频/字幕元数据以及本地 MP4 渲染。更高层的 AI 创作和 Studio 工作流记录在 [Roadmap](#roadmap) 中。

## Demo

预渲染产品介绍视频，使用 ElevenLabs 旁白并烧录字幕。源 composition 位于 [`examples/compositions/`](./examples/compositions/)。

**英文介绍** — [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx)

https://github.com/user-attachments/assets/83687d9c-63f0-4544-a67a-8f6eacc19928

**中文介绍** — [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx)

https://github.com/user-attachments/assets/3ce605bc-7ad1-449b-a67c-5d8368f5398b

## 快速开始

Seqvio 分两部分，需要分别安装：

| 组件 | 作用 | 安装方式 |
| --- | --- | --- |
| **Agent skill** | 教 Cursor 等 agent 如何编写 TSX composition 并走渲染流程 | `npx skills add ...` |
| **Renderer CLI** | 执行 `seqvio-render`、`seqvio-audio`，输出 MP4 | `npm install @seqvio/renderer` 或本地仓库 build |

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

已发布包：`@seqvio/renderer`、`@seqvio/core`、`@seqvio/whiteboard`。

**方案 B — 本地仓库（贡献者与示例开发推荐）**

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
pnpm install
pnpm build
pnpm --filter @seqvio/renderer exec seqvio-render --help
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

> 使用 `/seqvio`，做一个 4 场景的中文产品介绍视频，采用白板风格，使用 ElevenLabs 旁白并烧录字幕，最后渲染成 MP4。

Skill 会引导 agent：选示例 composition、改 TSX、提取旁白元数据、合成音频、运行 `seqvio-render`。

支持 Cursor、Claude Code、Codex、Gemini CLI 等支持 skills 的 coding agent。

### 不用 agent，手动渲染

```bash
seqvio-render \
  --component path/to/scene.tsx \
  --output ./output/demo.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

若在本地仓库中开发，通过 `pnpm --filter @seqvio/renderer exec` 调用同一命令。更多细节见 [手动安装](#手动安装)。

**环境要求：** Node.js `>=18`、Chromium（Puppeteer）、FFmpeg（`@seqvio/renderer` 已内置）。本地仓库开发还需 pnpm `>=8`。

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
| [`packages/whiteboard/examples/`](./packages/whiteboard/examples/) | 单场景白板示例 |

## 工作原理

```text
TSX composition -> audio manifest -> TTS synthesis -> seqvio-render -> MP4
```

1. 用 `@seqvio/whiteboard` 和可选的 `@seqvio/core` 编写 TSX composition。
2. 需要旁白时，在 `meta.audio.narration` 中声明 narration。
3. 用 `seqvio-audio` 提取并合成音频。
4. 用 `seqvio-render` 渲染画面并混流旁白。

完整 authoring contract 见 [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md)。

## Agent Skills

Skill 主文件：[`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md)，参考文档：

| 参考 | 用途 |
| --- | --- |
| [`authoring-patterns.md`](./skills/seqvio/references/authoring-patterns.md) | TSX composition 模式与 timing 规则 |
| [`audio-workflow.md`](./skills/seqvio/references/audio-workflow.md) | 提取、合成、混流旁白 |
| [`render-workflow.md`](./skills/seqvio/references/render-workflow.md) | build、render、smoke test 命令 |

安装 skill（见 [快速开始](#快速开始)）：

```bash
npx skills add makesynt/seqvio --skill seqvio -a cursor -y
```

Skill 负责教流程和命令；要输出 MP4 还需单独安装 `@seqvio/renderer`。

## 为什么是 Seqvio

Seqvio 不是完整替代 Remotion，也不是通用 HTML-to-video 引擎。它更聚焦结构化讲解视频。

- **讲解视频优先**：场景、旁白、字幕、视觉步骤放在同一 composition 中
- **白板风格内建**：手写文字、草图形状、图片、画笔/手势节奏
- **结构化旁白契约**：视觉 timing 与音频元数据靠近维护
- **适合 AI 协作**：小 contract、显式帧时间、示例齐全
- **本地可复现渲染**：Puppeteer + FFmpeg，从源码 composition 输出 MP4

## 当前能力

- 带 `meta` duration / fps 的 React/TSX composition
- `@seqvio/whiteboard`：`WhiteboardScene`、`DrawText`、`DrawShape`、`DrawImage`、`Hand`
- `@seqvio/core`：`VideoComposition`、`Scene`、`Transition`
- `seqvio-render`：TSX 到 MP4
- `seqvio-audio`：manifest 提取与 TTS 合成
- TTS provider：ElevenLabs、OpenAI、MiniMax、edge-tts

## 手动安装

适用于本地仓库开发，或需要结合内置示例做带旁白渲染的场景。

### 从 npm 安装

```bash
npm install -g @seqvio/renderer
```

会全局安装 `seqvio-render` 和 `seqvio-audio`，并自动拉取 `@seqvio/core`、`@seqvio/whiteboard`。

### Clone 并 build 仓库

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
pnpm install
pnpm build
```

### 渲染 composition

```bash
pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-intro.tsx \
  --output ../../output/seqvio-intro.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

本地渲染输出写入 [`output/`](./output/)（已被 gitignore）。

### 带旁白渲染

```bash
pnpm --filter @seqvio/renderer exec seqvio-audio extract \
  --component ../../examples/compositions/seqvio-overview-zh.tsx \
  --out ../../output/seqvio-overview-zh.manifest.json

pnpm --filter @seqvio/renderer exec seqvio-audio synthesize \
  --provider elevenlabs \
  --manifest ../../output/seqvio-overview-zh.manifest.json \
  --outDir ../../output/seqvio-overview-zh-audio

pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-overview-zh.tsx \
  --output ../../output/seqvio-overview-zh.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium \
  --audioManifest ../../output/seqvio-overview-zh-audio/audio-manifest.resolved.json \
  --burnCaptions
```

凭据从进程环境变量读取；CLI 不会自动加载 `.env`。参考 [`.env.example`](./.env.example)。

## Packages

| Package | 说明 |
| --- | --- |
| [`@seqvio/whiteboard`](./packages/whiteboard) | 白板绘制组件和 timing helpers |
| [`@seqvio/core`](./packages/core) | Composition 容器、场景、转场和 timeline runtime |
| [`@seqvio/renderer`](./packages/renderer) | TSX bundler，以及 `seqvio-render` / `seqvio-audio` CLI |

## 文档

文档入口：[`docs/README.md`](./docs/README.md)

推荐阅读：

- [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md)
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md)
- [`examples/compositions/README.md`](./examples/compositions/README.md)
- [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md)

如果文档与代码冲突，以代码和 [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) 为准。

## Roadmap

计划或进行中的工作包括：

- AI-assisted scene generation CLI
- 更完整的 script-to-voice authoring
- Visual editor / studio workflow
- Storyboard JSON 或 template auto-layout
- 更丰富的 transition catalog（当前：`fade`、`slide`、`wipe`）

设计提案和历史说明：

- [`docs/proposals/`](./docs/proposals/)
- [`docs/PRODUCT-PLAN.md`](./docs/PRODUCT-PLAN.md)

## 贡献

欢迎贡献。请先阅读：

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`SUPPORT.md`](./SUPPORT.md)
- [`SECURITY.md`](./SECURITY.md)
- [`CHANGELOG.md`](./CHANGELOG.md)

## License

[MIT](./LICENSE) © Seqvio Team
