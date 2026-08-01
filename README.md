
# Seqvio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-workspaces-red.svg)](https://docs.npmjs.com/cli/using-npm/workspaces)

English | [简体中文](./README.zh-CN.md)

**A visual language for coding agents to explain ideas.**

Seqvio gives coding agents a capture-to-explanation path for turning real terminal/browser activity and technical ideas into clear narrated videos. `CompositionDocument v2` can author spoken cues and visual actions together as `ExplanationBeat`s, then resolve them against measured TTS timing before local QA and MP4 rendering.

> **Current status:** The repository supports explicit React/TSX compositions and `CompositionDocument v2` with complete `whiteboard`, `code`, `diagram`, `terminal`, and `browser` compiler paths. Phrase-anchored ExplanationBeats drive logical visual timing, post-TTS semantic time maps, speech/highlight QA, and deterministic local rendering. Terminal and browser production pipelines use the shared capture dispatcher, compile real recorded steps through the IR, run capture QA for every job, and pass a 1280x720 release smoke gate. Capture CLI contract `1.0` fixes commands, JSON results, exit codes, progress, audio/caption options, and artifact layout; a Windows/Linux/macOS host matrix is configured before lifecycle promotion.

## Demo

Pre-rendered overview videos with CosyVoice narration, covering all three visual style packages (`@seqvio/whiteboard`, `@seqvio/scatterbrain`, `@seqvio/product-demo`). Source compositions live in [`examples/compositions/`](./examples/compositions/).

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

Published packages: `@seqvio/core`, `@seqvio/whiteboard`, `@seqvio/scatterbrain`, `@seqvio/product-demo`, `@seqvio/technical`, and `@seqvio/renderer`.

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

> Using `/seqvio`, create a 4-scene Chinese technical explainer as CompositionDocument v2. Jointly author narration cues and phrase-anchored visual Beats, synthesize with ElevenLabs, run QA, and render the final MP4.

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

### Browser capture adapter

The local [`@seqvio/browser-recorder`](./packages/browser-recorder) workspace executes a validated Chromium action plan and records video, cursor/focus metadata, and exact action start times. Its compiler emits a Browser scene, narration cues, capture-backed ExplanationBeats, and an audio manifest through `CompositionDocument v2`:

```bash
node packages/browser-recorder/dist/cli.js serve --port 4175

# Or execute a plan directly with one machine-readable result
node packages/browser-recorder/dist/cli.js record --plan plan.json --jobId demo --json
```

Open `http://127.0.0.1:4175`. The built-in sample runs without an AI provider; configure a planner webhook only when AI-generated action plans are required. See the [browser recorder README](./packages/browser-recorder/README.md) for the plan contract and pre-stable CLI boundaries.

**Requirements:** Node.js `>=18`, Chromium (via Puppeteer), FFmpeg (bundled in `@seqvio/renderer`). Local repo development uses npm workspaces and `package-lock.json`.

### Terminal capture adapter

[`@seqvio/terminal-narrator`](./packages/terminal-narrator) uses `node-pty` and xterm-backed snapshots to preserve terminal state and recorded step timing. It compiles each observed step into a Terminal scene plus jointly-authored narration cues and capture-backed ExplanationBeats. `--withAudio` synthesizes and muxes narration; hard captions are added only when `--burnCaptions` is also explicit.

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
| [`technical-explainer-v2.tsx`](./examples/compositions/technical-explainer-v2.tsx) | Technical explainer with code walkthrough and architecture diagram |
| [`technical-demo-v2.tsx`](./examples/compositions/technical-demo-v2.tsx) | Terminal demo and ANSI rendering showcase |
| [`packages/whiteboard/examples/`](./packages/whiteboard/examples/) | Single-scene whiteboard samples |

## How It Works

```text
content or real capture
  -> CompositionDocument v2 (cues + ExplanationBeats + visual targets)
  -> TSX + logical source timeline
  -> TTS synthesis + phrase-anchor resolution
  -> semantic scene timeMap
  -> seqvio-qa
  -> seqvio-render -> MP4
```

1. Produce or capture a `CompositionDocument v2` scene using stable visual and capture-step ids.
2. Author `explanation.cues` and `explanation.beats` together; the compiler emits narration, visual timing, highlights, and scene metadata.
3. Extract and synthesize audio with `seqvio-audio`. Measured audio resolves Beat `outputFrame`s and semantic scene time maps.
4. Run `seqvio-qa`; unresolved/reversed Beats are errors, while low-confidence whole-cue alignment is reported as a warning.
5. Render frames and mux narration with `seqvio-render --audioManifest ...`.

Hand-authored TSX remains supported as the lower-level production surface and may declare `meta.audio.narration` directly.

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

Seqvio is the visual language for coding agents that need to explain, not merely animate. It is not trying to be a general-purpose video editor or generic code-to-video engine; its value is the explainer vocabulary and workflow above the render loop. See [`docs/VISION.md`](./docs/VISION.md) for the full positioning.

- **Agent-facing visual vocabulary** — concrete primitives for deciding what viewers should see, hear, and understand next
- **Explainer-first workflow** — scenes, narration, captions, and visual steps in one composition
- **Whiteboard-native primitives** — handwritten-style text, shapes, images, icons, style presets, and pen/hand timing
- **Specialized visual packages** — sticky-note workshop scenes with `@seqvio/scatterbrain`, product walkthrough scenes with `@seqvio/product-demo`, and technical explainer scenes with `@seqvio/technical`
- **Joint explanation contract** — narration phrases, visual actions, and capture evidence are authored as one ExplanationBeat structure
- **Executable QA loop** — catches unresolved/reversed Beats, speech-rate and highlight pacing, audio/media failures, and visual defects
- **Agent-friendly authoring surface** — small contracts, explicit frame timing, curated examples
- **Local MP4 output** — render the finished explanation with Puppeteer + FFmpeg

## Current Capabilities

- React/TSX composition files with `meta` duration and fps
- `@seqvio/whiteboard` components: `WhiteboardScene`, `DrawText`, `DrawShape`, `DrawImage`, `DrawIcon`, `Hand`, and style presets
- `@seqvio/scatterbrain` sticky-note / cork-board components
- `@seqvio/product-demo` components: `ProductDemoScene`, `BrowserFrame`, `ScreenshotPlaceholder`, `CursorPath`, `Callout`, `ProductTitle`
- `@seqvio/technical` components: `TechnicalScene`, `AnnotationTarget`, `CodeWalkthrough`, `ArchitectureDiagram`, `TerminalDemo`, plus ANSI/grid utilities and bundled code fonts
- Terminal scene support in the composition-document IR (`events` / `steps` / `commands`) with validation and TSX compilation
- Browser scene support with recorded video, cursor/focus/click metadata, exact action clocks, and time-mapped media seeking
- `ExplanationBeat` cues, exact phrase anchors, visual actions, capture evidence, post-TTS `outputFrame`s, and semantic `sceneTimings[].timeMap`
- `@seqvio/core` scene and transition primitives: `VideoComposition`, `Scene`, `Transition`
- CompositionDocument v2 and retained Storyboard IR schema, validation, pacing,
  and TSX compilation helpers
- `seqvio-render` CLI for TSX-to-MP4 rendering
- `seqvio-audio` CLI for audio/caption manifest extraction and TTS synthesis
- `seqvio-qa` CLI with baseline/capture profiles, stable audio/temporal/media diagnostics, configurable warning promotion, and key-frame visual checks
- ElevenLabs, OpenAI, MiniMax, and edge-tts narration providers

## Manual setup

Use this section when working from a local repository checkout or when you need narrated renders with bundled examples.

### Install from npm

```bash
npm install -g @seqvio/renderer
```

This installs `seqvio-render`, `seqvio-audio`, `seqvio-generate`, `seqvio-preview`, `seqvio-add`, and `seqvio-qa` globally. Dependencies `@seqvio/core` and `@seqvio/whiteboard` are pulled in automatically. Install `@seqvio/product-demo`, `@seqvio/scatterbrain`, or `@seqvio/technical` separately when your composition imports those packages outside the monorepo.

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
--audioManifest output/seqvio-overview-en-audio/audio-manifest.resolved.json
```

Voiceover is muxed automatically from the manifest. **Do not** add `--burnCaptions` unless you intentionally want hard-coded subtitles in the frames (short lines + bottom safe area). For YouTube/Bilibili, upload SRT separately instead. See [`skills/seqvio/references/audio-workflow.md`](./skills/seqvio/references/audio-workflow.md#caption-burn-in-optional).

## Packages

| Package | Description |
| --- | --- |
| [`@seqvio/whiteboard`](./packages/whiteboard) | Whiteboard drawing components and timing helpers |
| [`@seqvio/core`](./packages/core) | Composition container, scenes, transitions, and timeline runtime |
| [`@seqvio/scatterbrain`](./packages/scatterbrain) | Sticky-note / cork-board style components |
| [`@seqvio/product-demo`](./packages/product-demo) | Browser frames, cursor paths, screenshot placeholders, callouts, and product walkthrough components |
| [`@seqvio/technical`](./packages/technical) | Technical explainer runtime: code walkthroughs, architecture diagrams, terminal demos, annotations, and bundled fonts |
| [`@seqvio/terminal-narrator`](./packages/terminal-narrator) | Pre-stable node-pty/xterm capture → IR/ExplanationBeat → optional narrated MP4 |
| [`@seqvio/browser-recorder`](./packages/browser-recorder) | Pre-stable Chromium action capture with exact action timing → IR/ExplanationBeat |
| [`@seqvio/renderer`](./packages/renderer) | TSX bundler plus `seqvio-render` and `seqvio-audio` CLIs |

## Documentation

Start at the docs hub: [`docs/README.md`](./docs/README.md)

Recommended reading:

- [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) — authoring contract and API rules
- [`docs/EXPLANATION-BEAT-TIMING.md`](./docs/EXPLANATION-BEAT-TIMING.md) — joint narration/visual timing and post-TTS alignment
- [`docs/CAPTURE-CLI-CONTRACT.md`](./docs/CAPTURE-CLI-CONTRACT.md) — capture commands, JSON output, exit codes, and artifacts
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — renderer, audio, and environment issues
- [`examples/compositions/README.md`](./examples/compositions/README.md) — example catalog and conventions
- [`skills/seqvio/SKILL.md`](./skills/seqvio/SKILL.md) — agent production loop
- [`skills/seqvio/references/production-techniques.md`](./skills/seqvio/references/production-techniques.md) — narrated explainer production rules and QA checklist

If documentation conflicts with code, treat the code and [`docs/COMPOSITION-AUTHORING.md`](./docs/COMPOSITION-AUTHORING.md) as the source of truth.

## Roadmap

Full phase ordering and the reasoning behind it: [`docs/ROADMAP.md`](./docs/ROADMAP.md). In short:

1. **Singular capture/IR path** - shared dispatcher routing and legacy writer removal are complete; stabilize adapter CLIs around `CaptureSession -> CompositionDocument`.
2. **ExplanationBeat timing** - now implemented across all stable scenes, including capture evidence and post-TTS phrase alignment.
3. **Release QA** - baseline/capture profiles now cover visual, pacing, audio, media, and semantic Beat failures; screenshot privacy masking remains deferred.
4. **Packaging and promotion** - CLI/artifact contract `1.0` is implemented; verify supported npm/runtime hosts before lifecycle promotion. Screenshot privacy remains deferred.

Product positioning and scope:

- [`docs/VISION.md`](./docs/VISION.md)
- [`docs/ROADMAP.md`](./docs/ROADMAP.md)

Historical notes:

- [`docs/archive/PRODUCT-PLAN-2026-07.md`](./docs/archive/PRODUCT-PLAN-2026-07.md) (archived snapshot)

## Contributing

Contributions are welcome. Please read:

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
- [`SUPPORT.md`](./SUPPORT.md)
- [`SECURITY.md`](./SECURITY.md)
- [`CHANGELOG.md`](./CHANGELOG.md)

## License

[MIT](./LICENSE) © Seqvio Team
