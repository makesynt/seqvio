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
import { WhiteboardScene, DrawText, DrawShape, Hand } from '@seqvio/whiteboard';

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
      <Scene id="hook">
        <HookScene />
      </Scene>
      <Transition type="fade" duration={12} />
      <Scene id="details">
        <DetailsScene />
      </Scene>
    </VideoComposition>
  );
}

export const meta = {
  duration: 360,
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
- omit `Scene duration` when the scene should follow real narration duration
- omit `VideoComposition duration` when the whole composition should follow
  resolved narration duration plus transitions
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
