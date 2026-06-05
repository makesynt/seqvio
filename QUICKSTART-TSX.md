# Seqvio Quick Start (TSX)

Seqvio currently uses a **TSX-first** authoring model.

If you only read one implementation doc, read:

- [docs/COMPOSITION-AUTHORING.md](./docs/COMPOSITION-AUTHORING.md)

This page is a short practical version.

## Single Scene

Create a TSX file:

```tsx
import { WhiteboardScene, DrawText, Hand } from '@seqvio/whiteboard';

export default function IntroScene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Hello Seqvio"
        fontSize={56}
        position={{ x: 640, y: 240 }}
        align="center"
        start={0}
        duration={36}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export const meta = { duration: 120, fps: 30 };
```

## Multi Scene

Wrap multiple whiteboard scenes with `@seqvio/core`:

```tsx
import { VideoComposition, Scene, Transition } from '@seqvio/core';

export default function IntroVideo() {
  return (
    <VideoComposition
      id="intro-video"
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

export const meta = { duration: 210, fps: 30 };
```

## Timing Notes

- all values are frame-based
- child timings are local to each scene
- `WhiteboardScene` defaults to `singlePen={true}`
- implemented transitions are `fade`, `slide`, and `wipe`

## Render

From repo root:

```bash
pnpm build
```

Then from `packages/renderer`:

```bash
node dist/cli.js \
  --component ../../examples/compositions/seqvio-intro.tsx \
  --output ../../output/seqvio-intro.mp4 \
  --width 1280 \
  --height 720 \
  --fps 30 \
  --quality medium
```

## Examples

- [examples/compositions/seqvio-intro.tsx](./examples/compositions/seqvio-intro.tsx)
- [examples/compositions/seqvio-intro-zh.tsx](./examples/compositions/seqvio-intro-zh.tsx)
- [examples/compositions/seqvio-intro-30-en.tsx](./examples/compositions/seqvio-intro-30-en.tsx)
- [examples/compositions/seqvio-intro-30-zh.tsx](./examples/compositions/seqvio-intro-30-zh.tsx)
- [examples/compositions/seqvio-alignment-demo.tsx](./examples/compositions/seqvio-alignment-demo.tsx)
- [packages/core/examples/multi-scene-demo.tsx](./packages/core/examples/multi-scene-demo.tsx)
- [packages/whiteboard/examples/01-hello-world.tsx](./packages/whiteboard/examples/01-hello-world.tsx)
