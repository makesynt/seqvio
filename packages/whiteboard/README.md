# @seqvio/whiteboard

Whiteboard animation primitives for Seqvio and other TSX-based video workflows.

This package provides the low-level scene components used by the Seqvio
examples and renderer pipeline:

- `WhiteboardScene`
- `DrawText`
- `DrawShape`
- `DrawImage`
- `Hand`

If you are new to the repo, start with [../../README.md](../../README.md) for
project scope and [../../docs/COMPOSITION-AUTHORING.md](../../docs/COMPOSITION-AUTHORING.md)
for the current authoring contract.

## Installation

```bash
npm install @seqvio/whiteboard
```

Peer dependencies:

- `react`
- `react-dom`

## Quick Start

```tsx
import { WhiteboardScene, DrawText, Hand } from '@seqvio/whiteboard';

export default function HelloWorld() {
  return (
    <WhiteboardScene width={1280} height={720} texture="paper">
      <DrawText
        text="Hello, World!"
        fontSize={72}
        position={{ x: 640, y: 260 }}
        align="center"
        start={0}
        duration={90}
      />
      <Hand action="write" follow={true} visible={true} />
    </WhiteboardScene>
  );
}

export const meta = { duration: 120, fps: 30 };
```

## Component Model

### `WhiteboardScene`

Scene container for whiteboard-style visuals.

```tsx
<WhiteboardScene
  width={1280}
  height={720}
  texture="paper"
  strokeColor="#2c3e50"
>
  {/* scene contents */}
</WhiteboardScene>
```

Common options:

- `width`
- `height`
- `texture`
- `strokeColor`

### `DrawText`

Animated text stroke rendering.

```tsx
<DrawText
  text="Welcome"
  fontSize={48}
  position={{ x: 100, y: 100 }}
  start={0}
  duration={90}
  strokeColor="#2c3e50"
/>
```

Common options:

- `text`
- `fontSize`
- `position`
- `align`
- `start`
- `duration`
- `strokeColor`
- `fillColor`

### `DrawShape`

Animated geometric and connector primitives.

```tsx
<DrawShape
  type="circle"
  position={{ x: 300, y: 300 }}
  size={150}
  start={60}
  duration={60}
  strokeColor="#e74c3c"
/>
```

Supported shape types include:

- `circle`
- `rectangle`
- `rounded-rectangle`
- `arrow`
- `line`
- `underline`
- `star`

### `DrawImage`

Animated image placement with tracing-style reveal.

```tsx
<DrawImage
  src="/diagram.png"
  position={{ x: 500, y: 400 }}
  size={{ width: 400, height: 300 }}
  start={120}
  duration={90}
/>
```

### `Hand`

Optional hand overlay that follows drawing actions.

```tsx
<Hand action="write" follow={true} visible={true} />
```

## Timing Rules

All timing is frame-based.

- `start` means the local scene frame where an element begins
- `duration` means how many frames that element remains active
- `meta.duration` should cover the entire scene

Important behavior:

- `WhiteboardScene` defaults to `singlePen={true}`
- overlapping authored strokes may still serialize into one active drawing path

## Examples

Repo examples:

- [../../packages/whiteboard/examples/01-hello-world.tsx](../../packages/whiteboard/examples/01-hello-world.tsx)
- [../../examples/compositions/seqvio-overview-en.tsx](../../examples/compositions/seqvio-overview-en.tsx)
- [../../examples/compositions/seqvio-overview-zh.tsx](../../examples/compositions/seqvio-overview-zh.tsx)
- [../../examples/compositions/seqvio-intro.tsx](../../examples/compositions/seqvio-intro.tsx)

## AI Assistant Usage

See [AI-USAGE.md](./AI-USAGE.md) for assistant-oriented usage guidance.

## Contributing

See [../../CONTRIBUTING.md](../../CONTRIBUTING.md).

When changing this package:

- keep examples in sync with actual props
- update docs when public behavior changes
- validate from repo root with `pnpm build`

## Support

- Project overview: [../../README.md](../../README.md)
- Docs index: [../../docs/README.md](../../docs/README.md)
- Troubleshooting: [../../docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md)
- Security reporting: [../../SECURITY.md](../../SECURITY.md)

## License

MIT. See [../../LICENSE](../../LICENSE).
