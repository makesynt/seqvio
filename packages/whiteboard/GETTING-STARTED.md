# Getting Started with `@seqvio/whiteboard`

This package gives you whiteboard-style scene primitives for Seqvio's current TSX workflow.

If you are working inside this monorepo, the fastest path is:

1. write a TSX scene
2. build the repo
3. render it through `@seqvio/renderer`

## Minimal Scene

Create a file like `hello-scene.tsx`:

```tsx
import { WhiteboardScene, DrawText, Hand } from '@seqvio/whiteboard';

export default function HelloScene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Hello, Whiteboard!"
        fontSize={64}
        fontWeight="bold"
        position={{ x: 640, y: 300 }}
        align="center"
        start={0}
        duration={36}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export const meta = {
  duration: 120,
  fps: 30,
};
```

## Understanding the Basics

### `WhiteboardScene`

The container for one whiteboard-style scene.

```tsx
<WhiteboardScene
  width={1280}
  height={720}
  texture="paper"
  singlePen={true}
>
```

### `DrawText`

```tsx
<DrawText
  text="Hello"
  fontSize={64}
  position={{ x: 640, y: 300 }}
  align="center"
  start={0}
  duration={36}
/>
```

### `Hand`

```tsx
<Hand action="write" follow={true} visible={true} />
```

## Timing

Seqvio uses **frames**, not seconds.

At 30 FPS:

- `30` frames = 1 second
- `60` frames = 2 seconds
- `90` frames = 3 seconds

### Important default: single pen

`WhiteboardScene` defaults to `singlePen={true}`, so drawable strokes are serialized.

If you author:

```tsx
<DrawText start={0} duration={60} />
<DrawShape start={15} duration={45} />
```

the second stroke will wait for the first one unless you set:

```tsx
<WhiteboardScene singlePen={false}>...</WhiteboardScene>
```

## Common Shapes

```tsx
<DrawShape type="circle" position={{ x: 240, y: 400 }} size={100} start={0} duration={24} />
<DrawShape type="rectangle" position={{ x: 420, y: 340 }} size={{ width: 220, height: 120 }} start={0} duration={24} />
<DrawShape type="rounded-rectangle" position={{ x: 700, y: 340 }} size={{ width: 220, height: 120 }} start={0} duration={24} />
<DrawShape type="arrow" from={{ x: 260, y: 400 }} to={{ x: 420, y: 400 }} start={0} duration={18} />
```

## Render Inside This Repo

From repo root:

```bash
npm install
npm run build
```

Then from `packages/renderer`:

```bash
node dist/cli.js \
  --component ../whiteboard/examples/01-hello-world.tsx \
  --output ../../output/whiteboard-hello.mp4 \
  --width 640 \
  --height 360 \
  --fps 30 \
  --quality low \
  --duration 60 \
  --pixelRatio 1
```

## Good Next Files

- [`README.md`](./README.md)
- [`AI-USAGE.md`](./AI-USAGE.md)
- [`../../docs/COMPOSITION-AUTHORING.md`](../../docs/COMPOSITION-AUTHORING.md)
- [`../../examples/compositions/README.md`](../../examples/compositions/README.md)
- [`../../docs/proposals/WHITEBOARD-MVP.md`](../../docs/proposals/WHITEBOARD-MVP.md)
