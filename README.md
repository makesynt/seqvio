# Seqvio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8-orange.svg)](https://pnpm.io/)

English | [简体中文](./README.zh-CN.md)

**Structured content to narrated explainer videos.**

Seqvio is a focused workflow for turning lessons, product walkthroughs, and technical concepts into short explainer videos. It combines scene composition, whiteboard-style visuals, narration metadata, captions, and local MP4 rendering into one source-controlled pipeline.

> **Current status:** Seqvio supports explicit React/TSX compositions, whiteboard-style scenes, audio/caption metadata, and local MP4 rendering. Higher-level AI authoring and studio workflows are tracked in the [Roadmap](#roadmap).

## Quick Start

### With an AI coding agent

Install the Seqvio skill, then describe the video you want:

```bash
npx skills add makesynt/seqvio
```

Try a prompt like:

> Using `/seqvio`, create a 4-scene Chinese product overview with whiteboard visuals, ElevenLabs narration, and burned-in captions. Render the final MP4.

The skill teaches agents the Seqvio production loop: pick an example composition, author or edit TSX scenes, extract narration metadata, synthesize audio, and render MP4 output.

Supported agents include Cursor, Claude Code, Codex, Gemini CLI, and other coding agents that support skills.

Rendering currently requires a local checkout of this repository. See [Manual setup](#manual-setup) below.

### Manually with the CLI

For contributors or advanced users who want to run the renderer directly:

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
pnpm install
pnpm build
pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-overview-en.tsx \
  --output ../../output/seqvio-overview-en.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

**Requirements:** Node.js `>=18`, pnpm `>=8`, Chromium (via Puppeteer), FFmpeg (bundled for the renderer CLI)

## Demo

Pre-rendered overview videos from [`examples/compositions/`](./examples/compositions/):

**English overview** — [`seqvio-overview-en.tsx`](./examples/compositions/seqvio-overview-en.tsx)

<video src="./docs/assets/videos/seqvio-overview-en.mp4" width="720" controls>
  <a href="./docs/assets/videos/seqvio-overview-en.mp4">Download English overview (MP4)</a>
</video>

**中文介绍** — [`seqvio-overview-zh.tsx`](./examples/compositions/seqvio-overview-zh.tsx)

<video src="./docs/assets/videos/seqvio-overview-zh.mp4" width="720" controls>
  <a href="./docs/assets/videos/seqvio-overview-zh.mp4">下载中文介绍视频 (MP4)</a>
</video>

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
| [`packages/whiteboard/examples/`](./packages/whiteboard/examples/) | Single-scene whiteboard samples |

## How It Works

```text
TSX composition -> audio manifest -> TTS synthesis -> seqvio-render -> MP4
```

1. Author a composition in TSX with `@seqvio/whiteboard` and optional `@seqvio/core` scenes.
2. Declare narration in `meta.audio.narration` when the video needs voiceover.
3. Extract and synthesize audio with `seqvio-audio`.
4. Render frames and mux narration with `seqvio-render`.

See [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) for the authoring contract.

## Agent Skills

Seqvio ships repo-local skills for coding agents:

| Skill | Purpose |
| --- | --- |
| [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md) | Main production loop for authoring, narration, and rendering |
| [`skills/seqvio/references/authoring-patterns.md`](./skills/seqvio/references/authoring-patterns.md) | TSX composition patterns and timing rules |
| [`skills/seqvio/references/audio-workflow.md`](./skills/seqvio/references/audio-workflow.md) | Extract, synthesize, and mux narration |
| [`skills/seqvio/references/render-workflow.md`](./skills/seqvio/references/render-workflow.md) | Build, render, and smoke-test commands |

Install with:

```bash
npx skills add makesynt/seqvio
```

## Why Seqvio

Seqvio is not trying to be a full Remotion replacement or a generic HTML-to-video engine. It focuses on structured explainer videos.

- **Explainer-first workflow** — scenes, narration, captions, and visual steps in one composition
- **Whiteboard-native primitives** — handwritten-style text, shapes, images, and pen/hand timing
- **Structured narration contract** — visual timing and audio metadata stay close together
- **Agent-friendly authoring surface** — small contracts, explicit frame timing, curated examples
- **Local, deterministic rendering** — Puppeteer + FFmpeg from source-controlled compositions

## Current Capabilities

- React/TSX composition files with `meta` duration and fps
- `@seqvio/whiteboard` components: `WhiteboardScene`, `DrawText`, `DrawShape`, `DrawImage`, `Hand`
- `@seqvio/core` scene and transition primitives: `VideoComposition`, `Scene`, `Transition`
- `seqvio-render` CLI for TSX-to-MP4 rendering
- `seqvio-audio` CLI for audio/caption manifest extraction and TTS synthesis
- ElevenLabs, OpenAI, MiniMax, and edge-tts narration providers

## Manual setup

Clone the repository and build the workspace:

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
pnpm install
pnpm build
```

### Render a composition

```bash
pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-intro.tsx \
  --output ../../output/seqvio-intro.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

Local renders write to [`output/`](./output/) (gitignored).

### Narrated render

```bash
pnpm --filter @seqvio/renderer exec seqvio-audio extract \
  --component ../../examples/compositions/seqvio-overview-en.tsx \
  --out ../../output/seqvio-overview-en.manifest.json

pnpm --filter @seqvio/renderer exec seqvio-audio synthesize \
  --provider elevenlabs \
  --manifest ../../output/seqvio-overview-en.manifest.json \
  --outDir ../../output/seqvio-overview-en-audio

pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-overview-en.tsx \
  --output ../../output/seqvio-overview-en.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium \
  --audioManifest ../../output/seqvio-overview-en-audio/audio-manifest.resolved.json \
  --burnCaptions
```

Credentials are read from process environment variables. The CLI does not auto-load `.env`. See [`.env.example`](./.env.example).

## Packages

| Package | Description |
| --- | --- |
| [`@seqvio/whiteboard`](./packages/whiteboard) | Whiteboard drawing components and timing helpers |
| [`@seqvio/core`](./packages/core) | Composition container, scenes, transitions, and timeline runtime |
| [`@seqvio/renderer`](./packages/renderer) | TSX bundler plus `seqvio-render` and `seqvio-audio` CLIs |

## Documentation

Start at the docs hub: [`docs/README.md`](./docs/README.md)

Recommended reading:

- [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) — authoring contract and API rules
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — renderer, audio, and environment issues
- [`examples/compositions/README.md`](./examples/compositions/README.md) — example catalog and conventions
- [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md) — agent production loop

If documentation conflicts with code, treat the code and [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) as the source of truth.

## Roadmap

Planned or in-progress work includes:

- AI-assisted scene generation CLI
- Richer script-to-voice authoring beyond the current TTS workflow
- Visual editor / studio workflow
- Storyboard JSON or template auto-layout
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
