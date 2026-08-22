---
name: seqvio
description: Create, edit, validate, and render Seqvio evidence-backed explainer videos from real agent work, captured terminal/browser evidence, authored ideas, ExplainerDocument IR, or TSX. Use for editorial planning, visual design briefs, whiteboard or product-demo animation, technical explainers, storyboard compatibility, chapter render/resume, narration timing, transitions, seqvio-generate, seqvio-audio, seqvio-qa, and seqvio-render workflows in this repository.
---

# Seqvio

Seqvio turns real agent work, captured terminal/browser evidence, and authored
ideas into narrated explainer videos. Use this production loop for **new topics**:

1. create and review `EDITORIAL.md` with `seqvio-generate plan-editorial`
2. create and review `VISUAL-DESIGN.md` with `seqvio-generate plan-visual`
3. use both approved artifacts with `seqvio-generate plan-agent`, then let the
   host agent produce ExplainerDocument with narration cues and ExplanationBeats
   authored together
4. validate and compile the IR to TSX with logical source timing
5. for long explainers, optionally run `seqvio-generate render-plan` and render
   chapters with `--resume`
6. extract and synthesize with `seqvio-audio`, which resolves phrase anchors and
   semantic scene time maps
7. run `seqvio-qa` with the resolved audio manifest, then render with
   `seqvio-render`

Storyboard v1 remains supported for whiteboard-only input. It is not the default
contract for new captured or technical explainers.

Seqvio itself does not call AI or planner APIs. Creative planning happens in the host agent; Seqvio validates, compiles, and renders deterministically.

Manual TSX authoring is still valid for polish:

1. author or edit a composition in TSX
2. select `@seqvio/whiteboard`, `@seqvio/scatterbrain`,
   `@seqvio/product-demo`, and/or `@seqvio/technical` per scene
3. optionally wrap multiple scenes with `@seqvio/core`
4. extract and synthesize narration with `seqvio-audio` when needed
5. render with `seqvio-render`

When ExplainerDocument narration and visuals must align, author them together:

1. add `scene.explanation.cues` with the spoken text
2. add `scene.explanation.beats` with exact phrase anchors and visual target ids
3. give every targeted element or Code/Diagram step a stable id
4. use `evidence.captureStepId` for Terminal/Browser capture steps

Then use the **resolved-audio workflow**:

1. compile the ExplainerDocument; Seqvio emits narration, Beats, highlights, and logical source frames together
2. run `seqvio-audio extract` then `seqvio-audio synthesize`
3. verify every Beat has `outputFrame` and no `resolutionError`
4. render with `--audioManifest .../audio-manifest.resolved.json`

For hand-authored TSX, continue to declare `meta.audio.narration` directly. It
does not gain semantic Beat alignment unless `meta.audio.explanationBeats` and
scene timing metadata are also authored.

Do **not** add `--burnCaptions` by default. Voiceover is muxed from the manifest; burned captions are an optional hard-subtitle overlay. Only use `--burnCaptions` for short on-screen lines with bottom safe area — not for full narration paragraphs or YouTube/Bilibili delivery. See [references/audio-workflow.md](references/audio-workflow.md#caption-burn-in-optional).

Terminal and Browser capture CLIs follow the same rule: `--withAudio` synthesizes
and muxes narration, while `--burnCaptions` must be explicit. Every capture job
runs capture QA and writes `qa-report.json` before it is marked complete.

The resolved manifest contains actual cue timings from synthesized audio. The framework can derive scene durations from those timings automatically.

Provider configuration is environment-variable based. The repo includes `.env.example` as a variable template, but the CLI does not auto-load a `.env` file. Secrets must be present in the shell or CI environment before running `seqvio-audio synthesize`.

Do not assume roadmap features already exist just because they appear in planning docs.

## Install

Seqvio has two separate pieces:

1. **Agent skill** — workflow and authoring rules (this file)
2. **Renderer CLI** — `seqvio-render` / `seqvio-audio`

Install the skill:

```bash
npx skills add makesynt/seqvio
```

Use `--skill seqvio` to skip skill selection, `--agent <name>` to target one
agent, and `--yes` to skip prompts and auto-detect scope. These flags are
optional for an interactive install. Run inside the target project for the
default project scope; add `--global` only for a cross-project installation.

For most users, install the published `0.8` CLI and run its environment check:

```bash
npm install -g @seqvio/renderer@latest
seqvio-doctor --json
```

Use a repository checkout for bundled examples or contributor work:

```bash
git clone https://github.com/makesynt/seqvio.git
cd seqvio
npm ci
npm run build
npm run doctor
```

The skill alone does not install npm packages or render MP4 output.

## Example Prompts

- "Using `/seqvio`, create and review the editorial and visual design artifacts for a Chinese history explainer, then write the plan-agent task, validate the returned IR, and compile it."
- "Using `/seqvio`, create and review an editorial plan and visual design brief, then produce an ExplainerDocument programming explainer about HTTP caching."
- "Using `/seqvio`, create a 4-scene Chinese product overview with whiteboard visuals and ElevenLabs narration."
- "Edit `examples/compositions/technical-demo.tsx` then render with chapter resume for only the code scene."
- "Fix timing in this composition so each scene aligns with its narration cue after synthesis."
- "Render a silent whiteboard title card from a new single-scene TSX file."

## Read This First

- For overall scope and repo layout, read [references/current-capabilities.md](references/current-capabilities.md).
- For file contracts and code patterns, read [references/authoring-patterns.md](references/authoring-patterns.md).
- For build and render commands, read [references/render-workflow.md](references/render-workflow.md).
- For narration extraction, synthesis, and muxing, read [references/audio-workflow.md](references/audio-workflow.md).
- For production craft rules from real narrated explainer work, read [references/production-techniques.md](references/production-techniques.md).
- When making blackboard or whiteboard explainers, use the visual metaphor and takeaway-container guidance in [references/production-techniques.md](references/production-techniques.md) to avoid repetitive rectangle-only layouts.
- For host-agent planning (EditorialPlan, VisualDesignBrief, Storyboard, and ExplainerDocument), read [references/planning-workflow.md](references/planning-workflow.md).

### Visual styles

Pick style packages per scene — do not mix unrelated component families carelessly.

- **Whiteboard** (`@seqvio/whiteboard`) — SVG hand-drawn animation; `WhiteboardScene` / `DrawText` / `DrawShape` / `DrawImage` / `DrawIcon` / `Hand`. Themes select the look (default, pin-and-paper, studio, field-note, …). For the Pin & Paper theme, read [references/pin-and-paper-theme.md](references/pin-and-paper-theme.md).
- **Scatterbrain** (`@seqvio/scatterbrain`) — div/CSS sticky-note / cork-board look; `ScatterScene` / `StickyNote` / `Scrawl` / `PinnedList` / `Doodle` / `Polaroid`. Read [references/scatterbrain-style.md](references/scatterbrain-style.md).
- **Product demo** (`@seqvio/product-demo`) — browser frames, recorded browser playback, camera focus, cursor paths, click markers, titles, and callouts for product and workflow demonstrations.
- **Technical** (`@seqvio/technical`) — code walkthrough, architecture diagrams, semantic annotations; usually compiled from ExplainerDocument.

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
- `DrawIcon`
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
- For ExplainerDocument audio alignment, use `explanation.cues` and phrase-anchored `explanation.beats`; do not independently tune narration and visual timestamps.
- For hand-authored TSX, prefer one narration cue per scene or beat and set `sceneId` on each cue.
- For narrated videos, **voice is the clock**: do not pad scenes with silence to hit a target duration. If the video must be longer, expand the script and synthesize more narration.
- After synthesis or audio editing, check for long silent spans before handoff. Use FFmpeg `silencedetect` or an equivalent audio QA step; visual timing must adapt to the final audio, not the other way around.
- For render validation clips, **do not use `--duration` to mean "render N frames"** on narrated or captioned compositions. `meta.audio` / captions can extend the resolved duration beyond the CLI value. Use `--startFrame` and `--endFrame` for exact frame ranges, and verify the CLI log says `Rendering N frames`.
- When matching a reference style, analyze its visual language before authoring: shape vocabulary, icon density, palette, line weights, containers, arrows, labels, pacing, and scene transitions. Do not reduce a diagram-heavy reference to only rectangles and text.
- **Always set `meta.duration` and each `Scene duration` even when using `lockToAudio: true`.** Without a resolved audio manifest, narration cues carry no timing and `resolveCompositionDurationFrames` returns 0, producing a single-frame render. The fallback values are overridden automatically once `--audioManifest` points to a resolved manifest.
- Estimate each `Scene duration` from its draw timing: find the last `start + duration` across all children and add a small buffer.
- `WhiteboardScene` defaults to `singlePen={true}`: authored overlaps are serialized into one active stroke at a time.
- If a scene duration feels short, calculate against serialized draw timing, not just authored `start`.
- Only `fade`, `slide`, and `wipe` are implemented transitions. Unknown transition names fall back to `fade`.
- Use only real imports from this repo:
  - `@seqvio/whiteboard`
  - `@seqvio/scatterbrain`
  - `@seqvio/core`
  - `@seqvio/technical`
  - `@seqvio/product-demo`
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
   `examples/compositions/seqvio-product-demo-preview.tsx`,
   or `packages/whiteboard/examples/`.
   Use `examples/compositions/seqvio-product-hunt-premium.tsx` as the current
   product-level motion and pacing reference only when its local captured assets
   exist; it is not a portable clean-checkout starter.

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

| Need                                                 | Read                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| What is real today vs aspirational                   | [references/current-capabilities.md](references/current-capabilities.md)   |
| How to structure TSX files and timing                | [references/authoring-patterns.md](references/authoring-patterns.md)       |
| How to build and render                              | [references/render-workflow.md](references/render-workflow.md)             |
| How to extract, synthesize, and mux narration        | [references/audio-workflow.md](references/audio-workflow.md)               |
| Production craft rules for narrated explainers       | [references/production-techniques.md](references/production-techniques.md) |
| How to produce storyboard IR with a host agent       | [references/planning-workflow.md](references/planning-workflow.md)         |
| Whiteboard Pin & Paper theme authoring               | [references/pin-and-paper-theme.md](references/pin-and-paper-theme.md)     |
| Scatterbrain sticky-note style authoring             | [references/scatterbrain-style.md](references/scatterbrain-style.md)       |
| Drive GSAP / Lottie / Three.js from the render clock | [references/seekable-animations.md](references/seekable-animations.md)     |
| Parallel render (--workers) and preset flags         | [references/parallel-render.md](references/parallel-render.md)             |
| Design token spec for AI layout authoring            | [references/frame-spec.md](references/frame-spec.md)                       |
| Copy reusable blocks with seqvio-add                 | [references/catalog.md](references/catalog.md)                             |

## Handoff Checklist

- The composition follows current APIs from source.
- `meta.duration` covers the whole scene or composition unless audio lock derives it.
- Transition names are implemented ones.
- Render command points at an existing TSX file.
- Validation clips use `--startFrame` / `--endFrame` for exact ranges; the render log's `Rendering N frames` count matches the intended sample.
- For narrated work, resolved audio manifest path is included; omit `--burnCaptions` unless the user explicitly requests hard-coded subtitles.
- For narrated work, there are no unintentional long silent gaps, and any target-duration mismatch is resolved by script length, not silence padding.
- For reference-style work, the output uses the reference's shape language, not only its colors or background.
- For Chinese dark-blackboard videos, explicitly verify the CJK handwriting family (for Long Cang use `"Long Cang"`), text contrast inside circles/containers, arrow overlap, and dark-background readability in representative snapshots.
- Validation status is reported honestly if build or render was not run.
