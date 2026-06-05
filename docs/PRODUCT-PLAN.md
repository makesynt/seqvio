# Seqvio Product Plan

## 1. Product Positioning

Seqvio should be positioned as an AI-friendly explainer video generation framework for education and product communication.

It is not primarily a general-purpose video editor, a full Remotion replacement, or a whiteboard-only animation library. Whiteboard is one visual style package inside a broader framework.

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
- Supports multiple visual styles instead of locking every video into whiteboard.
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
- Storyboard JSON and template auto-layout have been removed; TSX-only authoring is required.
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
- Whiteboard, slide, product-demo, motion-graphics, screencast, and hybrid styles.
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

Whiteboard should become the first style package, not the identity of the whole system.

Recommended style packages:

- `whiteboard`: handwriting, shapes, arrows, erasing, emphasis marks.
- `presentation`: slide-based lecture and keynote-style explainers.
- `product-demo`: UI screenshots, device frames, callouts, cursor path, zooms.
- `motion`: cards, icons, charts, counters, process lines, kinetic typography.
- `screencast`: recorded UI clips plus annotations and captions.
- `hybrid`: combines whiteboard, slides, and product UI in one video.

The common contract is TSX-based. Different style packages can share composition structure with different visual components.

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

Examples:

- `packages/whiteboard`
- `packages/presentation`
- `packages/product-demo`
- `packages/motion`

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
  presentation/
  product-demo/
  motion/
  cli/
examples/
  compositions/
  education/
  product-intro/
docs/
  PRODUCT-PLAN.md
  COMPOSITION-AUTHORING.md
```

## 7. Roadmap

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

### Phase 3: Presentation and Product Demo Styles

Goal: prove the framework is not whiteboard-only.

Deliverables:

- Add `packages/presentation` with slide layouts, title cards, bullet reveals, charts, and transitions.
- Add `packages/product-demo` with screenshots, device frames, cursor paths, zoom callouts, and feature highlights.
- Allow the same TSX composition structure to render in `whiteboard`, `presentation`, or `product-demo`.
- Add product onboarding example video.

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

## 8. Todo List

### P0: Immediate Engineering Tasks

- [ ] Fix root `npm run build` / workspace build reliability.
- [ ] Fix renderer package `types` path or add a real `dist/index.d.ts`.
- [ ] Make renderer honor scene `meta.fps`.
- [ ] Add `startFrame`, `endFrame`, and `duration` render options.
- [ ] Add a deterministic smoke render script.
- [ ] Move whiteboard-specific frame sync behind a generic runtime API.
- [ ] Update README to describe current MVP accurately.

### P1: Product Foundation

- [x] TSX-only authoring guide (`docs/COMPOSITION-AUTHORING.md`).
- [x] `seqvio-render` CLI for TSX compositions.
- [x] Multi-scene `VideoComposition` + transitions in renderer.
- [ ] Add more handwritten composition examples (education, product intro, technical).
- [ ] ~~Storyboard JSON + template engine~~ (removed; superseded by TSX-only).

### P2: Visual Quality

- [ ] Implement text-to-path handwriting.
- [ ] Implement hand path following.
- [ ] Implement deterministic rough paths with seeds.
- [ ] Add callouts, highlights, eraser, and focus box components.
- [ ] Add theme tokens for educational and product styles.
- [ ] Add visual QA snapshots for representative frames.

### P3: Multi-Style Expansion

- [ ] Add `presentation` package.
- [ ] Add `product-demo` package.
- [ ] Add `motion` package.
- [ ] Add shared layout primitives.
- [ ] Add shared transition primitives.
- [ ] Render one TSX composition through at least two style packages.

### P4: AI Workflow

- [ ] Define script-to-TSX composition prompt format.
- [ ] Add TypeScript/TSX lint or structure checks for agent output.
- [ ] Add style recommendation rules.
- [ ] Add narration and caption fields.
- [ ] Add examples of agent-generated composition files.

## 9. Success Metrics

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

## 10. Recommended Next Step

Expand handwritten composition examples and agent authoring guides.

The renderer proves TSX can become MP4 with multi-scene support. The product surface is **TSX-only** (no JSON template layer). Agents should generate full compositions with explicit coordinates and frame timing.

The next concrete milestone:

```text
script -> TSX composition (agent-authored) -> MP4
```
