# Audio Workflow

Use this reference when a composition needs narration, caption metadata, or audio-aligned scene timing.

## When to use it

Use the audio workflow when:

- the video needs voiceover
- scene duration should follow synthesized narration
- captions should be burned into the final MP4

Silent whiteboard renders can skip this flow entirely.

## Authoring contract

In the composition TSX file:

1. declare narration cues in `meta.audio.narration`
2. set `sceneId` on each cue for multi-scene work
3. set `lockToAudio: true` when total duration should follow resolved audio

Example starting points:

- `examples/compositions/seqvio-overview-en.tsx`
- `examples/compositions/seqvio-overview-zh.tsx`
- `examples/compositions/seqvio-audio-demo.tsx`

## Step 1 — Extract manifest

```bash
pnpm --filter @seqvio/renderer exec seqvio-audio extract \
  --component ../../examples/compositions/seqvio-overview-en.tsx \
  --out ../../output/seqvio-overview-en.manifest.json
```

This reads narration metadata from the composition and writes a manifest JSON file.

## Step 2 — Synthesize audio

Credentials are read from process environment variables. The CLI does not auto-load `.env`.

```bash
# macOS / Linux
export ELEVENLABS_API_KEY=your_key

# Windows (PowerShell)
# $env:ELEVENLABS_API_KEY="your_key"

pnpm --filter @seqvio/renderer exec seqvio-audio synthesize \
  --provider elevenlabs \
  --manifest ../../output/seqvio-overview-en.manifest.json \
  --outDir ../../output/seqvio-overview-en-audio
```

The output directory contains:

- synthesized audio files
- `audio-manifest.resolved.json` with actual cue timings

## Provider selection

Default provider: `elevenlabs`

Supported providers:

| Provider | When to use |
| --- | --- |
| `elevenlabs` | Default; requires `ELEVENLABS_API_KEY` |
| `openai` | Requires `OPENAI_API_KEY` |
| `minimax` | Requires authenticated `mmx` CLI |
| `edge-tts` | Local CLI-based fallback |

If the preferred provider is unavailable, switch explicitly with `--provider` instead of stopping.

Common environment variables:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `OPENAI_API_KEY`
- `EDGE_TTS_VOICE`
- `EDGE_TTS_BIN`
- `SEQVIO_TTS_PROVIDER`

See [`.env.example`](../../../.env.example) for the full template.

## Step 3 — Render with resolved audio

```bash
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

Important flags:

- `--audioManifest` — path to `audio-manifest.resolved.json`
- `--burnCaptions` — embed captions in the rendered MP4

## Audio-aligned timing rules

- Prefer one narration cue per scene or beat.
- Set `sceneId` on each cue in multi-scene compositions.
- Scene and composition durations may be omitted when `lockToAudio: true` and resolved audio should drive timing.
- After changing narration text, re-run extract and synthesize before rendering.

## Refreshing README demo videos

Tracked demo assets live in `docs/assets/videos/`, not `output/`.

After regenerating a narrated overview:

1. render to a temporary path under `output/`
2. copy the final MP4 into `docs/assets/videos/`
3. keep the source composition in `examples/compositions/`

## Troubleshooting

- Missing provider credentials: switch provider or export the required env vars
- Scene feels too short: check serialized whiteboard draw timing, not just authored `start`
- Captions missing: confirm `--burnCaptions` and that narration metadata exists in the composition

See [`docs/TROUBLESHOOTING.md`](../../../docs/TROUBLESHOOTING.md) for more detail.
