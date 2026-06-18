# Seqvio Product Plan

## 1. Product Positioning

Seqvio should be positioned as an AI-friendly explainer video generation framework for education and product communication.

It is not primarily a general-purpose video editor or a full Remotion replacement. The current product should stay focused on a deterministic whiteboard explainer workflow.

### Core Promise

Turn structured content into short, clear, reusable videos:

- Education videos: lessons, concept explainers, step-by-step tutorials.
- Product videos: feature introductions, onboarding flows, release notes, workflow explainers.
- Technical videos: API walkthroughs, architecture explanation, process diagrams.
- AI-generated batches: prompt or document to TSX compositions and MP4.

### Recommended Product Tagline

Structured content to explainer video.

### Target Users

- Educators and course creators who need fast concept videos.
- Product teams that need onboarding and feature announcement videos.
- Developer advocates and technical writers who turn docs into tutorials.
- AI agents that need a deterministic video generation backend.

### Differentiation

- Uses TSX as the production surface, so advanced users can customize everything.
- Uses handwritten TSX compositions as the production and AI surface (Remotion-style).
- Keeps the first visual surface narrow: whiteboard scenes compiled from a validated IR.
- Produces real video files through a programmatic render pipeline.

## 2. Current System Assessment

### What Works Now

- `@seqvio/whiteboard` provides MVP components: scene, text, shapes, image, hand, frame hook, and animation helpers.
- `@seqvio/renderer` has a minimal TSX-to-MP4 render loop.
- CLI rendering works for a basic whiteboard scene.
- Example videos can be rendered from TSX scene files.

### What Is Still Prototype-Level

- Whiteboard text drawing is character reveal, not real path handwriting.
- The hand component does not automatically follow drawing paths.
- Renderer frame synchronization currently knows about whiteboard through a best-effort module lookup.
- `core` timeline/composition APIs are not yet integrated into the renderer.
- Template auto-layout has been removed. TSX is the editable production source, while Storyboard IR is a deterministic input contract for host agents and future editors.
- There is no theme system or AI codegen CLI yet.
- Documentation promises a broader framework than the current implementation supports.

### Strategic Interpretation

The project has a useful rendering foundation, but the product value should not be defined by the renderer. The value should live in the content pipeline:

```text
content/script -> handwritten TSX compositions -> MP4
```

The renderer is infrastructure. The product is fast, repeatable explainer video generation.

## 3. Product Scope

### In Scope

- Short-form explainer videos from 15 seconds to 3 minutes.
- Structured scene generation from handwritten TypeScript/TSX compositions.
- Whiteboard explainers with structured narration, timing, and drawable elements.
- Programmatic rendering to MP4.
- AI-assisted scene generation, style selection, and narration planning.
- Reusable TSX composition patterns (examples, not server-side templates).

### Out of Scope for Early Versions

- Full nonlinear video editing UI.
- Complex multi-track editing comparable to Premiere or DaVinci Resolve.
- Cloud rendering, collaboration, and asset marketplaces.
- Advanced VFX, chroma key, color grading, or general media editing.
- Arbitrary animation-library compatibility before the core workflow is stable.

## 4. Visual Style Strategy

Whiteboard is the product style for the current framework.

The whiteboard package should focus on handwriting, rough shapes, arrows,
images, icons, emphasis marks, captions, and audio-aligned timing. Future style
packages can be explored later, but they should not be part of the current
Storyboard IR or default generation workflow.

## 5. Proposed Architecture

### Layer 1: TSX Composition Model

Defines what the video shows via React components (`VideoComposition`, `Scene`, whiteboard drawables).

Core entities:

- `VideoComposition`: width, height, fps, duration, scenes, transitions.
- `WhiteboardScene`: drawable children with frame-local `start` / `duration`.
- `DrawText` / `DrawShape` / `DrawImage` / `Hand`: explicit layout and timing.

### Layer 2: Example Compositions (not server templates)

Reference TSX files agents and users copy from:

- `examples/compositions/seqvio-intro.tsx`
- `packages/whiteboard/examples/*`
- `packages/core/examples/multi-scene-demo.tsx`
- `step-by-step`
- `before-after`
- `workflow-demo`
- `comparison`
- `cta-summary`

### Layer 3: Style Packages

Each package owns its visual components and scene renderers.

Current package:

- `packages/whiteboard`

### Layer 4: Core Runtime

Provides shared frame, timing, layout, scene, theme, asset, and composition APIs.

### Layer 5: Renderer

Takes generated TSX and outputs frames/video.

Renderer should stay style-agnostic. It should not know about whiteboard-specific APIs.

## 6. Recommended Repository Direction

Target structure:

```text
packages/
  core/
    src/
      timing/
      composition/
      themes/
  renderer/
  whiteboard/
  product-demo/
  cli/
examples/
  compositions/
  education/
  product-intro/
docs/
  PRODUCT-PLAN.md
  COMPOSITION-AUTHORING.md
```

## 7. Commercial Tool Gap Priorities

Commercial tools such as Golpo AI have moved beyond raw rendering into an end-to-end product loop: prompt or document input, automatic scene planning, editable generated videos, style presets, multilingual narration, and product/demo-specific assets. Seqvio should not copy every no-code SaaS feature directly. Its stronger position is an open, local, deterministic explainer video compiler that agents and developers can inspect, customize, and version-control.

These priorities capture the most important gaps to close while preserving Seqvio's code-first advantage.

### 1. Host-Agent Prompt or Document to Video Flow

Goal: make the default user path start from content, not from a blank TSX file.

Proposed workflow:

```text
prompt/document -> host agent -> Storyboard IR -> TSX composition -> audio manifest -> MP4
```

Deliverables:

- Add `seqvio-generate plan-agent` to write a host-agent task for prompt, Markdown, plain text, and later PDF/PPT/webpage inputs.
- Let the host agent generate a scene breakdown, narration, visual plan, and Storyboard IR JSON.
- Let users choose target style, language, duration, orientation, and audience.
- Preserve generated TSX as the editable production source.
- Add structured validation diagnostics so host agents can repair IR before rendering.

### 2. Internal Scene Plan IR

Goal: keep TSX as the public production surface while giving AI generation, validation, and future Studio editing a stable intermediate contract.

The IR should be a structured agent/editor contract, not a replacement for hand-authored TSX as the production workflow. It should describe:

- Video metadata: title, audience, language, aspect ratio, target duration, style.
- Scene metadata: `id`, narration, duration, visual intent, layout type, assets, and transitions.
- Caption and audio cues: text, timing intent, speaker, and localization keys.
- Style hints: whiteboard theme, texture, handwriting mode, and visual density.

Use this IR to compile to TSX, validate host-agent output, regenerate individual scenes, and support multilingual or style variants from the same content plan.

### 3. High-Quality Whiteboard Output

Goal: make the first visual style credible enough to compare with polished commercial whiteboard generators.

Deliverables:

- Convert text to SVG paths for real handwriting animation.
- Implement automatic hand path following for text and shapes.
- Add eraser, highlight, focus box, emphasis mark, arrow callout, and underline components.
- Make rough shape generation deterministic through seeded randomness.
- Add style presets such as clean whiteboard, marker sketch, chalkboard, technical diagram, and light infographic.
- Add visual regression snapshots for representative handwriting, shape, and caption frames.

### 4. Lightweight Studio and Preview Workflow

Goal: give non-engineers and reviewers a way to inspect and adjust generated videos without becoming TSX authors.

This should be a focused preview/edit surface rather than a full nonlinear editor. Prioritize:

- Scene list with duration, narration, and render status.
- Frame-accurate preview with scrubber and current frame display.
- Editable text, narration, timing, colors, style preset, and selected assets.
- Re-render selected scene or frame range instead of the full video every time.
- Layout diagnostics for overflowing text, overlapping elements, missing assets, and caption timing issues.
- Export the final edits back to TSX and any internal scene plan file.

### 5. Multilingual Narration and Caption Workflow

Goal: make one source video reusable across languages and voice providers.

Deliverables:

- Support language variants from a shared scene plan, for example `en`, `zh`, and `ja`.
- Separate on-screen text language from narration language when needed.
- Add automatic caption segmentation and timing alignment.
- Support uploaded narration tracks in addition to generated TTS.
- Add background music mixing with narration ducking.
- Preserve provider-neutral audio metadata so ElevenLabs, OpenAI, MiniMax, edge-tts, and future providers share the same contract.

### 6. Product Demo and Screencast Style Package

Goal: differentiate Seqvio from whiteboard-only tools by making technical product communication a first-class use case.

Deliverables:

- Add or expand `@seqvio/product-demo` for screenshots, device frames, browser frames, UI callouts, cursor paths, and zoom highlights.
- Support recorded UI clips with annotation layers, captions, and narration.
- Add before/after, step-by-step walkthrough, release note, API walkthrough, and onboarding examples.
- Provide asset helpers for screenshots, logos, watermarks, product images, and short video clips.
- Ensure any future product-demo scenes share the same timing, narration, caption, and rendering contracts as whiteboard scenes.

## 8. Roadmap

### Phase 0: Stabilize the Current MVP

Goal: make the current whiteboard render path reliable and honest.

Deliverables:

- Fix root workspace build so `npm run build` is reliable.
- Make renderer use `meta.fps` consistently for encoding.
- Add CLI options for `--duration`, `--startFrame`, and `--endFrame`.
- Add a smoke test that renders a short TSX scene.
- Update README to distinguish current capabilities from roadmap.
- Remove or mark unsupported claims such as full AI integration, 200+ components, and broad adapter support.

### Phase 1: TSX Composition Workflow (done for MVP)

Goal: support content-driven video generation via handwritten TSX.

Deliverables:

- [x] `COMPOSITION-AUTHORING.md` and example compositions.
- [x] `VideoComposition` + multi-scene renderer integration.
- [x] `seqvio-render --component` CLI.
- [ ] More complete examples: lesson explainer, product intro, technical process.

### Phase 2: High-Quality Whiteboard Style

Goal: make the first style package visually credible.

Deliverables:

- Convert text to SVG paths for real handwriting animation.
- Implement automatic hand path following.
- Add eraser and highlight components.
- Make rough shape generation deterministic with seeded randomness.
- Add layout helpers for common education scenes.
- Add visual regression screenshots for key frames.

### Phase 3: Whiteboard Product Quality

Goal: make whiteboard explainers polished enough for real education and product communication.

Deliverables:

- Add stronger whiteboard layout helpers for title, process, comparison, and summary scenes.
- Add screenshots/images with callouts for lightweight product explainers inside the whiteboard style.
- Improve hand path following, highlights, focus boxes, and caption timing.
- Add product onboarding example video using whiteboard primitives.

### Phase 4: AI-Assisted Generation

Goal: make AI useful through structured intermediate data.

Deliverables:

- Add prompt templates for script-to-TSX composition.
- Add TSX structure validation for agent output.
- Add style recommendation based on video type and audience.
- Add narration text and caption timing fields.
- Add examples showing AI-generated composition files.

### Phase 5: Production Readiness

Goal: make the framework usable in real projects.

Deliverables:

- Package-level tests and integration smoke tests.
- Asset management for images, fonts, screenshots, and audio.
- Audio muxing and caption rendering.
- Better renderer performance and frame cache.
- Documentation for plugin/style package authors.
- Versioned public API.

## 9. Todo List

### P0: Immediate Engineering Tasks

- [ ] Fix root `npm run build` / workspace build reliability.
- [ ] Fix renderer package `types` path or add a real `dist/index.d.ts`.
- [ ] Make renderer honor scene `meta.fps`.
- [ ] Add `startFrame`, `endFrame`, and `duration` render options.
- [ ] Add a deterministic smoke render script.
- [ ] Move whiteboard-specific frame sync behind a generic runtime API.
- [ ] Update README to describe current MVP accurately.

### P1: Product Foundation

- [x] TSX production authoring guide (`docs/COMPOSITION-AUTHORING.md`).
- [x] `seqvio-render` CLI for TSX compositions.
- [x] Multi-scene `VideoComposition` + transitions in renderer.
- [ ] Add more handwritten composition examples (education, product intro, technical).
- [x] Storyboard IR validate + compile path for host-agent output.
- [ ] ~~Template auto-layout engine~~ (removed; superseded by deterministic IR -> TSX compile).

### P2: Visual Quality

- [ ] Implement text-to-path handwriting.
- [ ] Implement hand path following.
- [ ] Implement deterministic rough paths with seeds.
- [ ] Add callouts, highlights, eraser, and focus box components.
- [ ] Add theme tokens for educational and product styles.
- [ ] Add visual QA snapshots for representative frames.

### P3: Whiteboard Expansion

- [ ] Add reusable whiteboard layout primitives.
- [ ] Add screenshot callouts inside whiteboard scenes.
- [ ] Add shared transition primitives.
- [ ] Add polished education and product onboarding examples.

### P4: AI Workflow

- [ ] Define script-to-TSX composition prompt format.
- [ ] Add TypeScript/TSX lint or structure checks for agent output.
- [ ] Add style recommendation rules.
- [ ] Add narration and caption fields.
- [ ] Add examples of agent-generated composition files.

## 10. Success Metrics

### MVP Success

- A user can render a 30-second education or product explainer from a TSX composition file.
- The output video matches the explicit layout in TSX.
- The CLI workflow works on a fresh install.
- The docs match what the system can actually do.

### Product Success

- One source composition structure can be restyled with different component packages.
- AI can generate valid TSX compositions with high consistency.
- Users can customize style without rewriting scene code.
- Rendering is deterministic enough for repeatable builds.

## 11. Recommended Next Step

Expand handwritten composition examples and agent authoring guides.

The renderer proves TSX can become MP4 with multi-scene support. The production surface is **TSX**, while Storyboard IR is the structured input contract for host agents. Agents should generate IR first; Seqvio validates and compiles it deterministically.

The next concrete milestone:

```text
script -> host-agent Storyboard IR -> TSX composition -> MP4
```
