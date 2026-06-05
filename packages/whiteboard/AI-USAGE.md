# AI Usage Guide for `@seqvio/whiteboard`

This guide is for AI coding assistants working with the **current** whiteboard package in this repo.

For the broader repo workflow, also read:

- [`../../skills/seqvio/SKILL.md`](../../skills/seqvio/SKILL.md)
- [`../../docs/COMPOSITION-AUTHORING.md`](../../docs/COMPOSITION-AUTHORING.md)

## What This Package Is Good For

Use `@seqvio/whiteboard` when the task is to build:

- whiteboard explainers
- diagram scenes
- step-by-step tutorial scenes
- title cards with hand-drawn treatment
- single-scene visuals inside a larger Seqvio composition

## Imports

```tsx
import {
  WhiteboardScene,
  DrawText,
  DrawShape,
  DrawImage,
  Hand,
  getSerializedSceneEnd,
} from '@seqvio/whiteboard';
```

## File Contract

Every renderable TSX file should export:

```tsx
export default function MyScene() {
  return <WhiteboardScene>...</WhiteboardScene>;
}

export const meta = {
  duration: 180,
  fps: 30,
};
```

## Timing Model

All timings are in **frames**.

At 30 FPS:

- `30` frames = 1 second
- `60` frames = 2 seconds
- `90` frames = 3 seconds

### Important: `singlePen` is on by default

`WhiteboardScene` defaults to `singlePen={true}`.

That means only one stroke animates at a time. If two `DrawText` or `DrawShape` elements overlap in authored time, the later one waits until the earlier one finishes.

So this:

```tsx
<DrawText start={0} duration={60} />
<DrawShape start={20} duration={40} />
```

does **not** produce overlapping stroke animation unless you set:

```tsx
<WhiteboardScene singlePen={false}>...</WhiteboardScene>
```

When you need to estimate the true end frame of a scene under single-pen mode, use:

```tsx
const end = getSerializedSceneEnd(
  [
    { id: 'a', start: 0, duration: 60, order: 0 },
    { id: 'b', start: 20, duration: 40, order: 1 },
  ],
  true
);
```

## Core Components

### `WhiteboardScene`

```tsx
<WhiteboardScene
  width={1280}
  height={720}
  texture="paper"
  singlePen={true}
>
```

Notes:

- `texture` supports `paper`, `whiteboard`, `chalkboard`, `none`
- `singlePen` defaults to `true`
- theme overrides are supported through the `theme` prop

### `DrawText`

```tsx
<DrawText
  text="Hello Seqvio"
  fontSize={56}
  fontWeight="bold"
  position={{ x: 640, y: 220 }}
  align="center"
  start={0}
  duration={36}
  strokeColor="#2c3e50"
/>
```

### `DrawShape`

Supported shape types in current source:

- `circle`
- `rectangle`
- `rounded-rectangle`
- `arrow`
- `line`
- `underline`
- `star`

```tsx
<DrawShape
  type="rounded-rectangle"
  position={{ x: 360, y: 280 }}
  size={{ width: 560, height: 180 }}
  start={0}
  duration={28}
  strokeColor="#3498db"
  fillColor="rgba(52,152,219,0.10)"
/>
```

### `DrawImage`

```tsx
<DrawImage
  src="/diagram.png"
  position={{ x: 440, y: 260 }}
  size={{ width: 400, height: 240 }}
  start={90}
  duration={45}
  traceMode="outline"
/>
```

### `Hand`

```tsx
<Hand action="write" follow={true} visible={true} />
```

Supported actions:

- `write`
- `draw`
- `point`
- `erase`
- `idle`

## Recommended Patterns

### Pattern 1: Title Scene

```tsx
import { WhiteboardScene, DrawText, Hand } from '@seqvio/whiteboard';

export default function TitleScene() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Main Title"
        fontSize={64}
        fontWeight="bold"
        position={{ x: 640, y: 220 }}
        align="center"
        start={0}
        duration={36}
      />
      <DrawText
        text="Short subtitle"
        fontSize={28}
        position={{ x: 640, y: 300 }}
        align="center"
        start={0}
        duration={24}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export const meta = { duration: 120, fps: 30 };
```

### Pattern 2: Step Flow

```tsx
import React from 'react';
import { WhiteboardScene, DrawText, DrawShape, Hand } from '@seqvio/whiteboard';

export default function StepFlow() {
  const steps = [
    { label: 'Plan', x: 280 },
    { label: 'Build', x: 640 },
    { label: 'Ship', x: 1000 },
  ];

  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="3 Steps"
        fontSize={56}
        position={{ x: 640, y: 180 }}
        align="center"
        start={0}
        duration={30}
      />

      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <DrawShape
            type="circle"
            position={{ x: step.x, y: 400 }}
            size={88}
            start={0}
            duration={24}
          />
          <DrawText
            text={String(i + 1)}
            fontSize={32}
            fontWeight="bold"
            position={{ x: step.x, y: 410 }}
            align="center"
            start={0}
            duration={12}
          />
          <DrawText
            text={step.label}
            fontSize={26}
            position={{ x: step.x, y: 510 }}
            align="center"
            start={0}
            duration={18}
          />
        </React.Fragment>
      ))}

      <Hand action="draw" follow={true} visible={true} />
    </WhiteboardScene>
  );
}
```

## Best Practices

- Prefer short, readable scenes over one giant crowded scene.
- Compute duration from the last visible action, not from guesswork.
- Use `rounded-rectangle` for cards and callouts when you want softer framing.
- Keep positions inside the authored canvas size.
- If the user wants multiple sections, move up to `@seqvio/core` and wrap scenes with `VideoComposition`.

## Avoid These Mistakes

- Do not assume a wall-clock animation system; timing is frame-based.
- Do not assume overlapping strokes unless `singlePen={false}` is explicit.
- Do not import from `@unified-video/*` or `unified-video`.
- Do not invent AI commands or runtime features that are not in this repo.

## Validation

For repo-local work:

1. build the workspace with `npm run build`
2. run a renderer smoke command when relevant

The simplest smoke render is documented in:

- [`../../skills/seqvio/references/render-workflow.md`](../../skills/seqvio/references/render-workflow.md)
