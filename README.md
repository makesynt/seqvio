
# Seqvio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-workspaces-red.svg)](https://docs.npmjs.com/cli/using-npm/workspaces)

English | [简体中文](./README.zh-CN.md)

**Structured content to narrated explainer videos.**

Seqvio is a focused workflow for turning lessons, product walkthroughs, and technical concepts into short explainer videos. It combines scene composition, whiteboard-style visuals, product-demo primitives, narration metadata, captions, visual QA, and local MP4 rendering into one source-controlled pipeline.

> **Current status:** Seqvio `0.4.0` publishes `@seqvio/core`, `@seqvio/whiteboard`, `@seqvio/scatterbrain`, `@seqvio/product-demo`, and `@seqvio/renderer`. The repository supports explicit React/TSX compositions, storyboard IR validation/compilation, style presets, product walkthrough scenes, audio/caption metadata, visual QA snapshots, and local MP4 rendering. Higher-level AI authoring and studio workflows are tracked in the [Roadmap](#roadmap).

## Demo

Pre-rendered overview videos with ElevenLabs narration and burned-in captions. Source compositions live in [`examples/compositions/`](./examples/compositions/).

**English overview** — [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx)

https://github.com/user-attachments/assets/83687d9c-63f0-4544-a67a-8f6eacc19928

**中文介绍** — [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx)

https://github.com/user-attachments/assets/3ce605bc-7ad1-449b-a67c-5d8368f5398b

## Quick Start

Seqvio has two separate pieces:

| Piece | What it is | Install with |
| --- | --- | --- |
| **Agent skill** | Teaches Cursor and other agents how to author TSX compositions and run the render workflow | `npx skills add ...` |
| **Renderer CLI** | Runs `seqvio-render`, `seqvio-audio`, and `seqvio-qa` | `npm install @seqvio/renderer` or a local repo build |

Installing the skill alone is **not** enough to render videos. You also need the CLI (or a local checkout of this repository).

### 1. Install the agent skill

```bash
npx skills add makesynt/seqvio --skill seqvio -a cursor -y
```

Replace `cursor` with your agent if needed (`claude-code`, `codex`, etc.). To preview available skills first:

```bash
npx skills add makesynt/seqvio --list
```

This step copies the Seqvio skill into your agent. It does **not** install npm packages, clone this repo, or render MP4 output by itself.

### 2. Install the renderer

Pick one path:

**Option A — npm package (simplest for most users)**

```bash
npm install -g @seqvio/renderer
seqvio-render --help
```

Published packages: `@seqvio/core`, `@seqvio/whiteboard`, `@seqvio/scatterbrain`, `@seqvio/product-demo`, and `@seqvio/renderer`.

Install optional style/component packages when a composition imports them directly:

```bash
npm install @seqvio/product-demo @seqvio/scatterbrain
```

**Option B — local repository (best for contributors and example compositions)**

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
npm ci
npm run build
node packages/renderer/dist/cli.js --help
```

Use the workspace CLI when you want the bundled [`examples/compositions/`](./examples/compositions/) and monorepo smoke scripts.

### 3. Optional: narration credentials

For ElevenLabs or other TTS providers, export credentials before synthesis:

```bash
export ELEVENLABS_API_KEY=your_key
```

See [`.env.example`](./.env.example). The CLI reads process environment variables and does not auto-load `.env`.

### 4. Ask your agent to create a video

After steps 1 and 2, try a prompt like:

> Using `/seqvio`, create a 4-scene Chinese product overview with whiteboard visuals, ElevenLabs narration, and burned-in captions. Render the final MP4.

The skill guides the agent through: pick an example composition, edit TSX, extract narration metadata, synthesize audio, and run `seqvio-render`.

Supported agents include Cursor, Claude Code, Codex, Gemini CLI, and other coding agents that support skills.

### Render manually without an agent

```bash
seqvio-render \
  --component path/to/scene.tsx \
  --output ./output/demo.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

When using a local repo checkout, run the built CLI with `node packages/renderer/dist/cli.js`. More detail: [Manual setup](#manual-setup).

**Requirements:** Node.js `>=18`, Chromium (via Puppeteer), FFmpeg (bundled in `@seqvio/renderer`). Local repo development uses npm workspaces and `package-lock.json`.

## What You Can Build

- Product and framework intro videos
- Lesson explainers and concept breakdowns
- Process diagrams and onboarding walkthroughs
- Multi-scene narrated videos with captions
- Reusable explainer compositions for automated content pipelines

Start from examples:

| Example | Description |
| --- | --- |
| [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx) | Narrated English product overview |
| [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx) | Narrated Chinese product overview |
| [`seqvio-audio-demo.tsx`](./examples/compositions/seqvio-audio-demo.tsx) | Audio and caption metadata |
| [`seqvio-style-manifest-demo.tsx`](./examples/compositions/seqvio-style-manifest-demo.tsx) | Whiteboard style preset manifest demo |
| [`seqvio-product-demo-preview.tsx`](./examples/compositions/seqvio-product-demo-preview.tsx) | Product walkthrough components demo |
| [`seqvio-scatterbrain.tsx`](./examples/compositions/seqvio-scatterbrain.tsx) | Sticky-note / workshop style demo |
| [`loop-engineering-explainer.tsx`](./examples/compositions/loop-engineering-explainer.tsx) | Long-form narrated explainer composition |
| [`packages/whiteboard/examples/`](./packages/whiteboard/examples/) | Single-scene whiteboard samples |

## How It Works

```text
TSX composition -> audio manifest -> TTS synthesis -> seqvio-render -> MP4
```

1. Author a composition in TSX with `@seqvio/core` plus visual packages such as `@seqvio/whiteboard`, `@seqvio/scatterbrain`, or `@seqvio/product-demo`.
2. Declare narration in `meta.audio.narration` when the video needs voiceover.
3. Extract and synthesize audio with `seqvio-audio`.
4. Check key frames with `seqvio-qa` when layout or visual fidelity matters.
5. Render frames and mux narration with `seqvio-render`.

See [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) for the authoring contract.

## Agent Skills

The skill lives in [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md) with supporting references:

| Reference | Purpose |
| --- | --- |
| [`authoring-patterns.md`](./skills/seqvio/references/authoring-patterns.md) | TSX composition patterns and timing rules |
| [`audio-workflow.md`](./skills/seqvio/references/audio-workflow.md) | Extract, synthesize, and mux narration |
| [`render-workflow.md`](./skills/seqvio/references/render-workflow.md) | Build, render, and smoke-test commands |
| [`production-techniques.md`](./skills/seqvio/references/production-techniques.md) | Voice-first timing, reference-style analysis, and visual QA rules |
| [`planning-workflow.md`](./skills/seqvio/references/planning-workflow.md) | Storyboard IR planning and agent handoff |

Install the skill (see [Quick Start](#quick-start)):

```bash
npx skills add makesynt/seqvio --skill seqvio -a cursor -y
```

The skill teaches workflow and commands. Install `@seqvio/renderer` separately when you need to render MP4 output.

## Why Seqvio

Seqvio is not trying to be a general-purpose video editor or a generic HTML-to-video engine. It focuses on structured explainer videos.

- **Explainer-first workflow** — scenes, narration, captions, and visual steps in one composition
- **Whiteboard-native primitives** — handwritten-style text, shapes, images, icons, style presets, and pen/hand timing
- **Specialized visual packages** — sticky-note workshop scenes with `@seqvio/scatterbrain` and product walkthrough scenes with `@seqvio/product-demo`
- **Structured narration contract** — visual timing and audio metadata stay close together
- **Visual QA loop** — snapshot key frames and catch blank renders before final MP4 work
- **Agent-friendly authoring surface** — small contracts, explicit frame timing, curated examples
- **Local, deterministic rendering** — Puppeteer + FFmpeg from source-controlled compositions

## Current Capabilities

- React/TSX composition files with `meta` duration and fps
- `@seqvio/whiteboard` components: `WhiteboardScene`, `DrawText`, `DrawShape`, `DrawImage`, `DrawIcon`, `Hand`, and style presets
- `@seqvio/scatterbrain` sticky-note / cork-board components
- `@seqvio/product-demo` components: `ProductDemoScene`, `BrowserFrame`, `ScreenshotPlaceholder`, `CursorPath`, `Callout`, `ProductTitle`
- `@seqvio/core` scene and transition primitives: `VideoComposition`, `Scene`, `Transition`
- Storyboard IR schema, layout registry, validation, and TSX compilation helpers
- `seqvio-render` CLI for TSX-to-MP4 rendering
- `seqvio-audio` CLI for audio/caption manifest extraction and TTS synthesis
- `seqvio-qa` CLI for key-frame visual snapshots and lightweight render checks
- ElevenLabs, OpenAI, MiniMax, and edge-tts narration providers

## Manual setup

Use this section when working from a local repository checkout or when you need narrated renders with bundled examples.

### Install from npm

```bash
npm install -g @seqvio/renderer
```

This installs `seqvio-render`, `seqvio-audio`, `seqvio-generate`, `seqvio-preview`, `seqvio-add`, and `seqvio-qa` globally. Dependencies `@seqvio/core` and `@seqvio/whiteboard` are pulled in automatically. Install `@seqvio/product-demo` or `@seqvio/scatterbrain` separately when your composition imports those packages outside the monorepo.

### Clone and build the repository

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
npm ci
npm run build
```

### Render a composition

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-intro.tsx \
  --output output/seqvio-intro.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

Local renders write to [`output/`](./output/) (gitignored).

### Narrated render

```bash
node packages/renderer/dist/audio-cli.js extract \
  --component examples/compositions/seqvio-overview-en.tsx \
  --out output/seqvio-overview-en.manifest.json

node packages/renderer/dist/audio-cli.js synthesize \
  --provider elevenlabs \
  --manifest output/seqvio-overview-en.manifest.json \
  --outDir output/seqvio-overview-en-audio

node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-overview-en.tsx \
  --output output/seqvio-overview-en.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium \
  --audioManifest output/seqvio-overview-en-audio/audio-manifest.resolved.json \
  --burnCaptions
```

Credentials are read from process environment variables. The CLI does not auto-load `.env`. See [`.env.example`](./.env.example).

## Packages

| Package | Description |
| --- | --- |
| [`@seqvio/whiteboard`](./packages/whiteboard) | Whiteboard drawing components and timing helpers |
| [`@seqvio/core`](./packages/core) | Composition container, scenes, transitions, and timeline runtime |
| [`@seqvio/scatterbrain`](./packages/scatterbrain) | Sticky-note / cork-board style components |
| [`@seqvio/product-demo`](./packages/product-demo) | Browser frames, cursor paths, screenshot placeholders, callouts, and product walkthrough components |
| [`@seqvio/renderer`](./packages/renderer) | TSX bundler plus `seqvio-render` and `seqvio-audio` CLIs |

## Documentation

Start at the docs hub: [`docs/README.md`](./docs/README.md)

Recommended reading:

- [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) — authoring contract and API rules
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — renderer, audio, and environment issues
- [`examples/compositions/README.md`](./examples/compositions/README.md) — example catalog and conventions
- [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md) — agent production loop
- [`skills/seqvio/references/production-techniques.md`](./skills/seqvio/references/production-techniques.md) — narrated explainer production rules and QA checklist

If documentation conflicts with code, treat the code and [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) as the source of truth.

## Roadmap

Planned or in-progress work includes:

- AI-assisted scene generation CLI
- Richer script-to-voice authoring beyond the current TTS workflow
- Visual editor / studio workflow
- Storyboard JSON and template auto-layout expansion beyond the current validation/layout registry
- Expanded transition catalog (today: `fade`, `slide`, and `wipe`)

Design proposals and historical notes:

- [`docs/proposals/`](./docs/proposals/)
- [`docs/PRODUCT-PLAN.md`](./docs/PRODUCT-PLAN.md)

## Contributing

Contributions are welcome. Please read:

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`SUPPORT.md`](./SUPPORT.md)
- [`SECURITY.md`](./SECURITY.md)
- [`CHANGELOG.md`](./CHANGELOG.md)

## License

[MIT](./LICENSE) © Seqvio Team
