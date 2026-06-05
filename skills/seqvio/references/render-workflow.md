# Render Workflow

Use this reference when building the workspace, rendering MP4 output, or validating a composition change.

## Prerequisites

- Node.js `>=18`
- pnpm `>=8`
- Repository root checkout

## Build

From the repository root:

```bash
pnpm install
pnpm build
```

## Silent render

Render a composition without narration:

```bash
pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-intro.tsx \
  --output ../../output/seqvio-intro.mp4 \
  --width 1280 \
  --height 720 \
  --fps 30 \
  --quality medium
```

Common flags:

- `--width` / `--height` — output dimensions
- `--fps` — should match `meta.fps`
- `--quality` — renderer quality preset
- `--output` — destination MP4 path

Local renders should write to `output/` at the repository root. That directory is gitignored.

## Narrated render

For narration-aligned compositions, synthesize audio first, then render with the resolved manifest:

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
  --width 1280 \
  --height 720 \
  --fps 30 \
  --quality medium \
  --audioManifest ../../output/seqvio-overview-en-audio/audio-manifest.resolved.json \
  --burnCaptions
```

See [audio-workflow.md](audio-workflow.md) for provider selection and manifest details.

## Smoke scripts

Useful built-in checks from `@seqvio/renderer`:

```bash
pnpm --filter @seqvio/renderer run render:smoke
pnpm --filter @seqvio/renderer run render:composition-smoke
pnpm --filter @seqvio/renderer run render:multiscene-smoke
pnpm --filter @seqvio/renderer run render:caption-smoke
```

## Windows fallback

If `pnpm` is unavailable in PATH, run the built CLI directly:

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-intro.tsx \
  --output output/seqvio-intro.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

Adjust paths relative to the repository root.

## Validation checklist

1. `pnpm build` succeeds
2. Target TSX file exports default component and `meta`
3. Render command uses an existing composition path
4. For narrated work, `audio-manifest.resolved.json` exists before render
5. Output MP4 path is under `output/` unless intentionally refreshing tracked demo assets in `docs/assets/videos/`

## Troubleshooting

See [`docs/TROUBLESHOOTING.md`](../../../docs/TROUBLESHOOTING.md) for renderer, Puppeteer, FFmpeg, and environment issues.
