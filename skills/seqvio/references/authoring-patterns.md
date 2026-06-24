# Authoring Patterns

## File Contract

Every renderable TSX composition should export:

```tsx
export default function MyVideo() {
  return <WhiteboardScene>...</WhiteboardScene>;
}

export const meta = {
  duration: 180,
  fps: 30,
};
```

`meta.duration` is in frames.

## Single-Scene Pattern

Use this when one scene is enough:

```tsx
import { WhiteboardScene, DrawText, DrawShape, DrawImage, DrawIcon, Hand } from '@seqvio/whiteboard';

export default function Scene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Hello"
        fontSize={56}
        position={{ x: 640, y: 200 }}
        align="center"
        start={0}
        duration={36}
      />
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 360, y: 280 }}
        size={{ width: 560, height: 180 }}
        start={0}
        duration={28}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}
```

## Visual Style: Theme Selection

The look of text and shapes is controlled by the scene **theme**, not by colors
alone. This is easy to miss and produces the wrong style silently.

- **Default theme (no `theme` prop)**: text renders in a clean sans-serif system
  font and shapes are crisp geometric lines (straight edges, perfect circles).
  Good for diagrams that should look precise.
- **`excalidrawTheme`**: sets `handDrawn: true`, so text renders in the **Virgil
  handwriting font** and shapes get **roughjs hand-drawn jitter** (wobbly
  strokes, sketch-like corners). This is what produces the "handwritten
  whiteboard / lightboard" feel.
- **`neonLightboardTheme`**: a dark-stage variant of the hand-drawn look —
  glowing neon strokes on a **black** background, as if drawn with a luminous
  marker on glass. Same handwriting + jitter as `excalidrawTheme`, but ink
  defaults to neon and the surface/background default to black. Pair it with the
  bundled glow filter for the bloom (see "Neon glow recipe" below). Use it for
  briefs asking for a "glowing / neon / dark lightboard / luminous marker" look.

```tsx
import { WhiteboardScene, excalidrawTheme } from '@seqvio/whiteboard';

<WhiteboardScene theme={excalidrawTheme} ...>
```

Rules and gotchas:

- If the brief says "whiteboard", "handwritten", "sketch", "lightboard", or
  references a marker/handwriting style, you almost certainly want
  `theme={excalidrawTheme}`. Forgetting it is the most common reason output looks
  "too clean / not handwritten". If the brief adds "neon", "glowing", "dark", or
  "luminous", reach for `neonLightboardTheme` instead.
- Per-element `strokeColor` and the scene `background` still win over the theme's
  own colors, so you can use `excalidrawTheme` purely for its handwriting +
  jitter while keeping a custom palette (e.g. neon strokes on a black background).
- Under `excalidrawTheme`, `DrawShape` `circle`/`rectangle` may get a faint
  roughjs **hachure fill** even with `fillColor="none"`. On small/dense shapes
  this can read as "filled". If you need a guaranteed hollow outline, draw it as
  a stroke-only `<path>` instead of a themed `DrawShape`.
- Custom inline `<path>` / `<svg>` art you author yourself does **not** inherit
  the theme — it bypasses roughjs entirely and stays smooth. To make hand-drawn
  custom art, run each path `d` through roughjs `generator().path(d, { seed })`
  with a **fixed per-stroke seed** (a random seed re-jitters every frame and
  flickers in the rendered video).

### Neon glow recipe

`neonLightboardTheme` gives you neon strokes on black, but the **bloom** comes
from an SVG filter applied to the whole stage, not from the theme. The
`neonPalette`, `NEON_GLOW_FILTER_ID`, and `neonGlowFilterMarkup` exports give you
the pieces:

```tsx
import {
  WhiteboardScene,
  neonLightboardTheme,
  neonPalette,
  NEON_GLOW_FILTER_ID,
} from '@seqvio/whiteboard';

// 1. Define the filter once (a zero-size inline <svg> with three blur passes
//    merged under the crisp source — see neonGlowFilterMarkup for the params).
// 2. Apply it to the stage via style, and use neonPalette for per-element color.
<WhiteboardScene
  theme={neonLightboardTheme}
  background="#000000"
  style={{ filter: `url(#${NEON_GLOW_FILTER_ID})` }}
>
  {/* ...neon strokes... */}
</WhiteboardScene>
```

Define the glow filter inline (e.g. a `NeonGlowDefs` `<filter>`) and reference it
via `style={{ filter: \`url(#...)\` }}` on the `WhiteboardScene`.

This is a **generic visual style** — use it freely, but don't recreate a specific
existing video's content, layout, or narration structure (that's the part
copyright protects, not the glow technique itself).

## Multi-Scene Pattern

Use this when the composition has multiple sections:

```tsx
import { VideoComposition, Scene, Transition } from '@seqvio/core';

export default function Video() {
  return (
    <VideoComposition
      id="demo"
      width={1280}
      height={720}
      fps={30}
      duration={210}
      backgroundColor="#ffffff"
    >
      <Scene id="intro" duration={72}>
        <IntroScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="details" duration={126}>
        <DetailsScene />
      </Scene>
    </VideoComposition>
  );
}
```

## Audio-Aligned Multi-Scene Pattern

Use this when narration timing should drive scene timing:

```tsx
import { VideoComposition, Scene, Transition } from '@seqvio/core';

export default function Video() {
  return (
    <VideoComposition
      id="demo-aligned"
      width={1280}
      height={720}
      fps={30}
      backgroundColor="#ffffff"
      audio={meta.audio}
    >
      <Scene id="hook" duration={180}>
        <HookScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="details" duration={180}>
        <DetailsScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta = {
  duration: 372,
  fps: 30,
  audio: {
    lockToAudio: true,
    narration: [
      { id: 'hook-voice', sceneId: 'hook', text: '...' },
      { id: 'details-voice', sceneId: 'details', text: '...' },
    ],
  },
};
```

Authoring rule:

- one `narration` cue should map to one scene or one beat
- set `sceneId` on each cue
- set `lockToAudio: true` when total composition length should follow the
  resolved narration
- **always set `meta.duration` and each `Scene duration` as fallback values**,
  even with `lockToAudio: true`. Without a resolved audio manifest, duration
  resolution returns 0 and the render produces a single-frame video.
- once `seqvio-audio synthesize` produces a resolved manifest, passing
  `--audioManifest` to `seqvio-render` overrides scene durations with real
  TTS timings — the fallback values are then ignored
- run `seqvio-audio synthesize` first, then render with the generated
  `audio-manifest.resolved.json`

The resolved manifest contains actual synthesized cue timings. The framework can
derive scene durations from those cue timings during render.

## Timing Rules

- All timings are frame-based.
- Child timings inside a `Scene` are local to that scene.
- `WhiteboardScene` uses `singlePen={true}` by default.
  That means one stroke at a time, even when authored `start` values overlap.
- If you need simultaneous animations, opt out explicitly with `singlePen={false}`.
- In audio-aligned mode, scene-local timing still stays local to the scene,
  but the scene's global duration can be derived from the resolved narration cue
  that shares its `sceneId`.

When estimating the real end frame for a single-pen scene, use:

```tsx
import { getSerializedSceneEnd } from '@seqvio/whiteboard';
```

## Supported Transition Values

Current source supports:

- `fade`
- `slide`
- `wipe`

Other transition names are not implemented and fall back to `fade`.

## Imports to Prefer

- `@seqvio/whiteboard`
- `@seqvio/core`

Avoid deep internal imports unless the task is explicitly about library internals.
