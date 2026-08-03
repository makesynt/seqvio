# Troubleshooting

This page covers the most common local setup and render issues for Seqvio.

## Build and Package Manager

### Install fails or dependencies are missing

Local repo development uses **npm workspaces** and `package-lock.json`. From the
repository root:

```bash
npm ci
npm run build
```

Use `npm ci` (not `npm install`) for a clean, lockfile-exact install.

Run the unified environment diagnostic before investigating a composition:

```bash
npm run doctor
# Installed CLI:
seqvio-doctor --json
```

It checks the supported Node version, the `node-pty` native module, bundled
technical fonts, an actual FFmpeg media probe, a real headless Chromium launch,
and write access to `temp/` and `output/`. A failing check includes a repair
hint and exits non-zero.

### Build succeeds in one package but not the repo

Run the workspace build from repo root:

```bash
npm run build
```

This catches package-to-package typing issues that are easy to miss when only
building one workspace.

## Renderer and FFmpeg

### `ffmpeg` is not found

The renderer uses `@ffmpeg-installer/ffmpeg` internally, but helper commands
such as probing audio duration may still rely on `ffmpeg` or `ffprobe` being
available in your shell.

Check:

```bash
ffmpeg -version
ffprobe -version
```

If those commands fail, install FFmpeg and make sure it is on `PATH`.

### Render is slow or times out

Full renders can take several minutes, especially at `1280x720` with the default
`pixelRatio=2` and `quality=high`.

The renderer is dominated by **per-frame browser screenshots**, not FFmpeg
encoding. `--quality low` only changes the final MP4 CRF and usually does not
make capture much faster.

Try one or more of these:

- use `--preset preview` for iteration
- lower `--pixelRatio` to `1`
- lower `--fps` to `24`
- use `--frameFormat jpeg` and `--pipeFrames` for preview renders
- use `--workers 2` when piping is disabled
- render a shorter range with `--startFrame` and `--endFrame`
- use `--stillFrame` or `--contactSheet auto` for layout QA instead of a full MP4

Fast preview example:

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-intro.tsx \
  --output output/preview.mp4 \
  --preset preview
```

Useful smoke commands:

```bash
npm run render:smoke -w @seqvio/renderer
npm run render:composition-smoke -w @seqvio/renderer
```

You can also enable `--workers auto` (parallel capture) or `--preset preview`
(fast jpeg pass) for large compositions.

For repeatable performance evidence, run `npm run benchmark:render`. The report
is written to `output/benchmarks/latest.json`; `benchmark:render:check` compares
three-sample medians only when the current platform, architecture, and CPU match
the stored reference environment.

### Video duration looks wrong

For audio-aligned compositions:

- make sure `meta.audio.lockToAudio` is `true`
- make sure each narration cue has the correct `sceneId`
- render with the generated `audio-manifest.resolved.json`, not only the source manifest

If durations still look wrong, inspect the resolved manifest and confirm:

- narration cue `startMs` / `endMs`
- caption cue `startMs` / `endMs`
- transition durations in the composition

### Visual actions drift from the spoken explanation

For ExplainerDocument, treat `scene.explanation.cues` and
`scene.explanation.beats` as one contract. Do not repair drift by independently
moving visual frames after synthesis.

Inspect `audio-manifest.resolved.json` and confirm:

- every Beat has an `outputFrame`
- no Beat has a `resolutionError`
- phrase anchors match text that actually occurs in the referenced cue
- `sceneTimings[].timeMap` is ordered by both output and source frame
- capture-backed Beats refer to the intended `captureStepId`

Run final timing QA with the resolved manifest:

```bash
seqvio-qa \
  --component examples/compositions/example.tsx \
  --outDir output/example-qa \
  --audioManifest output/example-audio/audio-manifest.resolved.json \
  --ci
```

An unresolved or reversed Beat is an error. Fix its cue reference, phrase
anchor, visual target, or source-frame order and synthesize again. A
low-confidence warning means Seqvio used a whole-cue character-position
fallback because fine-grained TTS timing was unavailable; shorten the cue or
choose a unique phrase anchor before considering a targeted QA suppression.

For Browser captures, current manifests preserve exact recorded action start
times. Older manifests may use evenly distributed fallback timing; re-record
when exact action-to-speech correspondence matters.

## Puppeteer and Browser Runtime

### Browser launch fails

The renderer launches Puppeteer in headless mode. Failures are usually caused by:

- missing browser dependencies
- antivirus or endpoint restrictions
- locked-down execution environments

First isolate the problem with a smoke render. If the smoke render fails at
browser setup, debug Puppeteer before changing composition code.

### Fonts or text look wrong

Seqvio preloads font assets for whiteboard rendering. If text still looks wrong:

- verify the relevant font files exist in the repo
- rebuild after changing font-related code
- check whether the issue is language-specific, especially for CJK text

## Audio Synthesis

### ElevenLabs key is set but synthesis still fails

`seqvio-audio synthesize` reads provider credentials from the process
environment. It does not auto-load `.env`.

Use [`.env.example`](../.env.example) as a template, then make sure the
variables are actually present in the shell running the command.

PowerShell example:

```powershell
$env:ELEVENLABS_API_KEY="..."
node dist/audio-cli.js synthesize --provider elevenlabs --manifest ..\..\output\demo.manifest.json --outDir ..\..\output\demo-audio
```

### ElevenLabs is unavailable

Switch provider explicitly instead of treating synthesis as blocked:

```bash
node dist/audio-cli.js synthesize --provider edge-tts --manifest ../../output/demo.manifest.json --outDir ../../output/demo-audio
```

Other supported providers:

- `minimax`
- `openai`

### `edge-tts` is not found

Install the `edge-tts` CLI or point the repo at it explicitly:

- add it to `PATH`
- or set `EDGE_TTS_BIN`

Optional default voice:

- `EDGE_TTS_VOICE`

### Generated narration exists, but render does not pick it up

Check that you are rendering with:

- `--audioManifest <path-to-audio-manifest.resolved.json>`

Also verify that the manifest `tracks[].src` values still point to existing MP3 files.

## Docs and Repo Hygiene

### Which doc is the source of truth?

Use this order:

1. current code and examples
2. `docs/COMPOSITION-AUTHORING.md`
3. package docs and current README files
4. proposals only as planning material

### Where should future troubleshooting notes go?

Add them here when they describe a repeated setup or operational failure mode.
Do not bury active troubleshooting guidance in archive or proposal docs.
