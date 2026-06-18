---
name: seqvio
description: Create or edit Seqvio whiteboard explainer video compositions in TSX and render them to MP4 with optional narration and captions. Use when working in this repository on whiteboard animations, explainer videos, multi-scene compositions, storyboard IR planning, seqvio-generate plan-agent, scene timing, transitions, seqvio-render, or seqvio-audio workflows. Covers @seqvio/whiteboard, @seqvio/core, examples/compositions, and the current deterministic authoring/rendering contract.
---

# Seqvio

Seqvio turns structured content into narrated explainer videos. Preferred production loop for **new topics**:

1. write a host-agent task with `seqvio-generate plan-agent`
2. let the host agent produce one storyboard IR JSON
3. validate + compile IR to TSX with `seqvio-generate`
4. render with `seqvio-render`
5. optionally extract/synthesize narration with `seqvio-audio`

Seqvio itself does not call AI or planner APIs. Creative planning happens in the host agent; Seqvio validates, compiles, and renders deterministically.

Manual TSX authoring is still valid for polish:

1. author or edit a composition in TSX
2. use `@seqvio/whiteboard`
3. optionally wrap multiple scenes with `@seqvio/core`
4. extract and synthesize narration with `seqvio-audio` when needed
5. render with `seqvio-render`

When narration and visuals must align, use the **resolved-audio workflow**:

1. author `meta.audio.narration` with one cue per scene or beat
2. set `sceneId` on each cue
3. set `lockToAudio: true` when final composition length should follow resolved narration
4. run `seqvio-audio extract` then `seqvio-audio synthesize`
5. render with `--audioManifest .../audio-manifest.resolved.json` and optional `--burnCaptions`

The resolved manifest contains actual cue timings from synthesized audio. The framework can derive scene durations from those timings automatically.

Provider configuration is environment-variable based. The repo includes `.env.example` as a variable template, but the CLI does not auto-load a `.env` file. Secrets must be present in the shell or CI environment before running `seqvio-audio synthesize`.

Do not assume roadmap features already exist just because they appear in planning docs.

## Install

Seqvio has two separate pieces:

1. **Agent skill** — workflow and authoring rules (this file)
2. **Renderer CLI** — `seqvio-render` / `seqvio-audio`

Install the skill:

```bash
npx skills add makesynt/seqvio --skill seqvio -a cursor -y
```

Install the renderer separately. Either:

```bash
npm install -g @seqvio/renderer
```

Or work from a local repository checkout:

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio && pnpm install && pnpm build
```

The skill alone does not install npm packages or render MP4 output.

## Example Prompts

- "Using `/seqvio`, write a plan-agent task for a Chinese history explainer, then validate and compile the returned IR."
- "Using `/seqvio`, create a 4-scene Chinese product overview with whiteboard visuals, ElevenLabs narration, and burned-in captions."
- "Edit `examples/compositions/seqvio-overview-en.tsx` to add a new scene explaining the audio workflow, then render the final MP4."
- "Fix timing in this composition so each scene aligns with its narration cue after synthesis."
- "Render a silent whiteboard title card from a new single-scene TSX file."

## Read This First

- For overall scope and repo layout, read [references/current-capabilities.md](references/current-capabilities.md).
- For file contracts and code patterns, read [references/authoring-patterns.md](references/authoring-patterns.md).
- For build and render commands, read [references/render-workflow.md](references/render-workflow.md).
- For narration extraction, synthesis, and muxing, read [references/audio-workflow.md](references/audio-workflow.md).
- For host-agent storyboard IR planning, read [references/planning-workflow.md](references/planning-workflow.md).

### Visual styles

Two parallel, style-agnostic ways to render a composition. Pick one per `<Scene>` — do not mix their components.

- **Whiteboard** (`@seqvio/whiteboard`) — SVG hand-drawn animation; `WhiteboardScene` / `DrawText` / `DrawShape` / `Hand`. Themes select the look (default, pin-and-paper, studio, field-note, …). For the Pin & Paper theme, read [references/pin-and-paper-theme.md](references/pin-and-paper-theme.md).
- **Scatterbrain** (`@seqvio/scatterbrain`) — div/CSS sticky-note / cork-board look (rotation, gradients, soft shadows, pins, tape, doodles); `ScatterScene` / `StickyNote` / `Scrawl` / `PinnedList` / `Doodle` / `Polaroid`. A separate style package, parallel to whiteboard, depending only on `@seqvio/core`. Read [references/scatterbrain-style.md](references/scatterbrain-style.md).

## Working Model

### Provider selection

`seqvio-audio synthesize` defaults to `elevenlabs`.

If ElevenLabs credentials are unavailable, explicitly switch provider instead of stopping at the missing key:

- `--provider edge-tts` for local CLI-based speech synthesis
- `--provider minimax` when the `mmx` CLI is already authenticated
- `--provider openai` when `OPENAI_API_KEY` is available

Common environment variables:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `EDGE_TTS_VOICE`
- `EDGE_TTS_BIN`
- `OPENAI_API_KEY`
- `SEQVIO_TTS_PROVIDER`

### Single-scene work

Use a `WhiteboardScene` with drawable children:

- `DrawText`
- `DrawShape`
- `DrawImage`
- `Hand`

This is the simplest path for title cards, diagrams, tutorials, and whiteboard explainers.

### Multi-scene work

Use `VideoComposition`, `Scene`, and `Transition` from `@seqvio/core` when the video has multiple beats or sections.

Each scene usually wraps its own `WhiteboardScene`. Scene-local draw timings stay local to that scene.

## Hard Rules

- Every renderable TSX file must export:
  - a default React component
  - `meta` with at least `duration` and `fps`
- All timing is in **frames**, not seconds.
- For audio-aligned work, prefer one narration cue per scene or beat and set `sceneId` on each cue.
- **Always set `meta.duration` and each `Scene duration` even when using `lockToAudio: true`.** Without a resolved audio manifest, narration cues carry no timing and `resolveCompositionDurationFrames` returns 0, producing a single-frame render. The fallback values are overridden automatically once `--audioManifest` points to a resolved manifest.
- Estimate each `Scene duration` from its draw timing: find the last `start + duration` across all children and add a small buffer.
- `WhiteboardScene` defaults to `singlePen={true}`: authored overlaps are serialized into one active stroke at a time.
- If a scene duration feels short, calculate against serialized draw timing, not just authored `start`.
- Only `fade`, `slide`, and `wipe` are implemented transitions. Unknown transition names fall back to `fade`.
- Use only real imports from this repo:
  - `@seqvio/whiteboard`
  - `@seqvio/scatterbrain`
  - `@seqvio/core`
- Do not reintroduce removed or imaginary workflows such as:
  - Seqvio-side AI planning
  - template auto-layout
  - AI CLI commands not present in source

## Recommended Workflow

1. Pick the right shape.
   Use single-scene whiteboard for one idea.
   Use `VideoComposition` only when the story truly has multiple scenes.

2. Start from a nearby example.
   Prefer `examples/compositions/seqvio-overview-en.tsx`,
   `examples/compositions/seqvio-overview-zh.tsx`,
   `examples/compositions/seqvio-audio-demo.tsx`,
   or `packages/whiteboard/examples/`.

3. Implement with local accuracy.
   Match actual prop names and supported transition values from source.

4. Validate before handoff.
   Build the workspace and, when relevant, run a renderer smoke command.
   For aligned narration work, validate with:
   - `seqvio-audio extract`
   - `seqvio-audio synthesize`
   - `seqvio-render --audioManifest ...`
   If a provider-specific credential is missing, switch to an available provider such as `edge-tts` instead of assuming synthesis is blocked.

## Reference Map

| Need | Read |
| --- | --- |
| What is real today vs aspirational | [references/current-capabilities.md](references/current-capabilities.md) |
| How to structure TSX files and timing | [references/authoring-patterns.md](references/authoring-patterns.md) |
| How to build and render | [references/render-workflow.md](references/render-workflow.md) |
| How to extract, synthesize, and mux narration | [references/audio-workflow.md](references/audio-workflow.md) |
| How to produce storyboard IR with a host agent | [references/planning-workflow.md](references/planning-workflow.md) |
| Whiteboard Pin & Paper theme authoring | [references/pin-and-paper-theme.md](references/pin-and-paper-theme.md) |
| Scatterbrain sticky-note style authoring | [references/scatterbrain-style.md](references/scatterbrain-style.md) |

## Handoff Checklist

- The composition follows current APIs from source.
- `meta.duration` covers the whole scene or composition unless audio lock derives it.
- Transition names are implemented ones.
- Render command points at an existing TSX file.
- For narrated work, resolved audio manifest path and caption flags are included.
- Validation status is reported honestly if build or render was not run.
