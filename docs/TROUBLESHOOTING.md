# Troubleshooting

This page covers the most common local setup and render issues for Seqvio.

## Build and Package Manager

### `pnpm` is missing

Seqvio documents `pnpm >=8` as the canonical package manager.

Install it first, then run:

```bash
pnpm install
pnpm build
```

If you use `npm` successfully for local experiments, treat that as best-effort
compatibility, not the primary supported path.

### Build succeeds in one package but not the repo

Run the workspace build from repo root:

```bash
pnpm build
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

Full renders can take several minutes, especially at `1280x720` or higher.

Try one or more of these:

- use a smoke command first
- lower `--quality`
- lower `--pixelRatio` to `1`
- render a shorter range with `--startFrame` and `--endFrame`

Useful smoke commands:

```bash
pnpm --filter @seqvio/renderer run render:smoke
pnpm --filter @seqvio/renderer run render:composition-smoke
```

### Video duration looks wrong

For audio-aligned compositions:

- make sure `meta.audio.lockToAudio` is `true`
- make sure each narration cue has the correct `sceneId`
- render with the generated `audio-manifest.resolved.json`, not only the source manifest

If durations still look wrong, inspect the resolved manifest and confirm:

- narration cue `startMs` / `endMs`
- caption cue `startMs` / `endMs`
- transition durations in the composition

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
