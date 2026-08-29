# Audio Workflow

Use this reference when a composition needs narration, caption metadata, or audio-aligned scene timing.

## When to use it

Use the audio workflow when:

- the video needs voiceover
- scene duration should follow synthesized narration

Silent whiteboard renders can skip this flow entirely.

Hard-coded subtitle burn-in (`--burnCaptions`) is **not** part of the default narrated workflow. See [Caption burn-in (optional)](#caption-burn-in-optional) below.

## Authoring contract

For ExplainerDocument, author voice and visuals together in each scene:

1. declare spoken text in `explanation.cues`
2. anchor `explanation.beats` to exact phrases in those cues
3. point each Beat at stable visual target ids
4. compile the document so Seqvio emits narration and logical visual timing together

For hand-authored TSX, use the lower-level contract below.

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
node packages/renderer/dist/audio-cli.js extract \
  --component examples/compositions/seqvio-overview-en.tsx \
  --out output/seqvio-overview-en.manifest.json
```

This reads narration metadata from the composition and writes a manifest JSON file.

## Step 2 — Synthesize audio

Credentials are read from process environment variables. The CLI does not auto-load `.env`.

```bash
# macOS / Linux
export ELEVENLABS_API_KEY=your_key

# Windows (PowerShell)
# $env:ELEVENLABS_API_KEY="your_key"

node packages/renderer/dist/audio-cli.js synthesize \
  --provider elevenlabs \
  --manifest output/seqvio-overview-en.manifest.json \
  --outDir output/seqvio-overview-en-audio
```

The output directory contains:

- synthesized audio files
- `audio-manifest.resolved.json` with actual cue timings

## Provider selection

Default provider: `elevenlabs`

Supported providers:

| Provider     | When to use                            |
| ------------ | -------------------------------------- |
| `elevenlabs` | Default; requires `ELEVENLABS_API_KEY` |
| `openai`     | Requires `OPENAI_API_KEY`              |
| `minimax`    | Requires authenticated `mmx` CLI       |
| `edge-tts`   | Local CLI-based fallback               |

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
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-overview-en.tsx \
  --output output/seqvio-overview-en.mp4 \
  --width 1280 \
  --height 720 \
  --fps 30 \
  --quality medium \
--audioManifest output/seqvio-overview-en-audio/audio-manifest.resolved.json
```

Important flags:

- `--audioManifest` — path to `audio-manifest.resolved.json` (required for narrated renders)

Do **not** add `--burnCaptions` unless you explicitly want hard-coded subtitles in the video frames. Voiceover is already muxed from the manifest; burned captions are a separate visual overlay.

## Caption burn-in (optional)

`--burnCaptions` bakes caption cues into every frame as a bottom overlay (black bar + white text). It is **optional** and often the wrong default.

**Use `--burnCaptions` only when all of these apply:**

- You need silent autoplay with on-screen text (e.g. some social clips)
- Captions are **short lines**, not full narration paragraphs per scene
- The composition reserves bottom safe area (roughly the lower 140px)

**Do not use `--burnCaptions` when:**

- Publishing to YouTube, Bilibili, or similar — upload SRT/VTT separately instead
- Each scene cue is the full voiceover script (overlay will cover much of the frame)
- Whiteboard content extends into the lower third

Example (only when burn-in is intentional):

```bash
pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-audio-demo.tsx \
  --output ../../output/caption-demo.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium \
  --audioManifest ../../output/seqvio-audio-demo-audio/audio-manifest.resolved.json \
  --burnCaptions
```

## Audio-aligned timing rules

- Prefer one narration cue per scene or coherent spoken passage.
- Set `sceneId` on each cue in multi-scene compositions.
- After changing narration text, re-run extract and synthesize before rendering.
- ExplainerDocument `ExplanationBeat` timing is resolved automatically after
  synthesis. Inspect `explanationBeats`, `sceneTimings[].timeMap`, and QA rather
  than manually redistributing element frames.
- Every resolved Beat must have `outputFrame`; `resolutionError` means the anchor
  text or occurrence must be repaired and narration synthesized again.
- `low_confidence_explanation_beat` means whole-cue character timing was used.
  Split the cue, use a more specific phrase, or choose a provider with finer
  timing chunks when tighter alignment is required.
- Hand-authored TSX without ExplanationBeat metadata still requires manual visual
  timing against the resolved cue windows.

## Refreshing README demo videos

Tracked demo assets live in `docs/assets/videos/`, not `output/`.

After regenerating a narrated overview:

1. render to a temporary path under `output/`
2. copy the final MP4 into `docs/assets/videos/`
3. keep the source composition in `examples/compositions/`

## Local SoundCues

Sound effects are declared semantically on `ExplanationBeat.sounds` and resolved
from a project-local registry. The registry maps cue names such as `ui.click`,
`ui.pop`, `whoosh.soft`, and `typing` to local files. Run `seqvio-audio
validate-sfx` before `resolve-sfx`; the resolver never downloads assets and never
depends on HyperFrames or an online provider. Resolved SFX become ordinary
`kind: "sfx"` tracks with beat metadata, so the renderer can align and duck them
under narration deterministically.

Generate the reviewable plan before editing the manifest:

```bash
seqvio-audio plan-sfx \
  --manifest output/audio-manifest.resolved.json \
  --out output/SOUND-DESIGN.md
```

The plan contains authored cues plus conservative suggestions derived from
visual actions. Suggestions are never applied automatically. Use
`--authoredOnly` when the review should list only existing `sounds` entries.

Then validate the local registry and resolve approved cues:

```bash
seqvio-audio validate-sfx \
  --registry sounds/registry.json \
  --manifest output/audio-manifest.resolved.json

seqvio-audio resolve-sfx \
  --manifest output/audio-manifest.resolved.json \
  --registry sounds/registry.json \
  --outManifest output/audio-manifest.sfx.resolved.json

seqvio-audio validate \
  --manifest output/audio-manifest.sfx.resolved.json
```

The final validation catches SFX that start before zero, extend beyond the
composition, reference unknown beats, repeat too often, cluster too densely, or
overlap narration at prominent levels without ducking.

## Troubleshooting

- Missing provider credentials: switch provider or export the required env vars
- Scene feels too short: check serialized whiteboard draw timing, not just authored `start`
- Voiceover missing: confirm `--audioManifest` points to `audio-manifest.resolved.json`
- Burned captions missing: only relevant if you intentionally passed `--burnCaptions`; otherwise upload subtitles on the target platform
- Bottom of frame obscured: you likely used `--burnCaptions` with long per-scene caption text — re-render without it

See [`docs/TROUBLESHOOTING.md`](../../../docs/TROUBLESHOOTING.md) for more detail.
