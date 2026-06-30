# Render Workflow

Use this reference when building the workspace, rendering MP4 output, or validating a composition change.

## Prerequisites

- Node.js `>=18`
- Chromium (installed via Puppeteer) and FFmpeg (bundled in `@seqvio/renderer`)
- Repository root checkout

Local repo development uses **npm workspaces** and `package-lock.json`.

## Build

From the repository root:

```bash
npm ci
npm run build
```

## Silent render

Render a composition without narration. From the repository root, invoke the
built CLI directly:

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-intro.tsx \
  --output output/seqvio-intro.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

Local renders should write to `output/` at the repository root. That directory is gitignored.

## Flags

Output and quality:

- `--component <path>` — TSX/TS scene component (required)
- `--output <path>` — destination MP4 path (required)
- `--preset <preview|standard|final|high>` — one flag to set fps / pixelRatio /
  quality / frameFormat together. Explicit flags always override the preset.
  - `preview`: fps 24, pixelRatio 1, quality low, frameFormat jpeg, jpegQuality 80 (fastest)
  - `standard`: fps 30, pixelRatio 1, quality medium, frameFormat png
  - `final`: fps 30, pixelRatio 2, quality medium, frameFormat png
  - `high`: fps 30, pixelRatio 2, quality high, frameFormat png
- `--width` / `--height` — output dimensions
- `--fps` — should match `meta.fps`
- `--quality <low|medium|high|4k>` — encoder CRF (low=28, medium=20, high=18, 4k=15)
- `--pixelRatio <1|2>` — screenshot scale factor (default 2, sharper strokes)

Capture format and speed:

- `--frameFormat <png|jpeg>` — per-frame screenshot format (default png). jpeg is
  faster for preview passes; png is lossless for final delivery.
- `--jpegQuality <n>` — JPEG screenshot quality 30–100 when `--frameFormat jpeg` (default 90)
- `--workers <n|auto>` — parallel capture workers (default 1). `n>1` streams
  parallel browsers into one FFmpeg pass; `auto` samples the composition and
  picks a conservative count. See [parallel-render.md](parallel-render.md).
- `--staticFrameDedup` — reuse adjacent identical screenshots (single-worker path only)
- `--whiteboardOptimize <none|react-static|bitmap-layer|frame-dedup>` —
  experimental whiteboard render optimizations (numeric aliases `1`/`2`/`3`)

Frame range:

- `--startFrame <n>` / `--endFrame <n>` — render a sub-range of source frames
- `--duration <n>` — override total source duration in frames
- `--keepFrames` — keep captured frames on disk (otherwise streamed only)

Important: `--duration` is not a reliable way to say "render N frames" for
narrated or captioned compositions. Seqvio resolves final duration as the max of
the base duration, `meta.audio` narration cue ends, resolved audio manifest
timings, and captions. If `meta.audio` ends at frame 10296, then
`--duration 90` can still render 10296 frames.

For exact validation clips, always use an explicit inclusive frame range:

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/coding-agent-controllers.tsx \
  --output output/coding-agent-controllers-frames-0-89.mp4 \
  --startFrame 0 --endFrame 89 \
  --preset preview --workers 2
```

Before treating timing or performance numbers as meaningful, read the CLI log
and confirm it says the intended count, for example `Rendering 90 frames`.
If it says thousands of frames, stop and fix the frame range instead of waiting.

Audio and captions:

- `--audioManifest <path>` — resolved audio manifest for narrated renders
- `--audioTrack <path>` — single narration track at offset 0
- `--mixMusic <path>` — background music bed
- `--captions <path>` — caption JSON file
- `--burnCaptions` — optional hard-coded subtitle overlay (off by default; see [audio-workflow.md](audio-workflow.md#caption-burn-in-optional))

Fastest possible preview:

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-intro.tsx \
  --output output/preview.mp4 \
  --preset preview
```

## Narrated render

For narration-aligned compositions, synthesize audio first, then render with the resolved manifest:

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

Do **not** add `--burnCaptions` unless you intentionally want hard-coded subtitles in the frames.

See [audio-workflow.md](audio-workflow.md) for provider selection and manifest details.

## Smoke scripts

Useful built-in checks, run from inside the renderer package:

```bash
npm run render:smoke -w @seqvio/renderer
npm run render:composition-smoke -w @seqvio/renderer
npm run render:multiscene-smoke -w @seqvio/renderer
npm run render:caption-smoke -w @seqvio/renderer
```

## Validation checklist

1. `npm run build` succeeds
2. Target TSX file exports default component and `meta`
3. Render command uses an existing composition path
4. For validation clips, use `--startFrame` / `--endFrame` and confirm the
   `Rendering N frames` log matches the intended sample size
5. For narrated work, `audio-manifest.resolved.json` exists before render
6. Output MP4 path is under `output/` unless intentionally refreshing tracked demo assets in `docs/assets/videos/`

## Troubleshooting

See [`docs/TROUBLESHOOTING.md`](../../../docs/TROUBLESHOOTING.md) for renderer, Puppeteer, FFmpeg, and environment issues.
