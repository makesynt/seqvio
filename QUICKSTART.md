# Seqvio Quick Start

This file describes the **current repo workflow**.

For the broader overview, see [README.md](./README.md). For the TSX contract, see [docs/COMPOSITION-AUTHORING.md](./docs/COMPOSITION-AUTHORING.md).

## 1. Install

```bash
pnpm install
```

## 2. Build

```bash
pnpm build
```

## 3. Render a working example

```bash
cd packages/renderer
node dist/cli.js \
  --component ../../examples/compositions/seqvio-intro.tsx \
  --output ../../output/seqvio-intro.mp4 \
  --width 1280 \
  --height 720 \
  --fps 30 \
  --quality medium
```

## 4. Or run a smoke test

From repo root:

```bash
pnpm --filter @seqvio/renderer run render:smoke
```

## What Seqvio Supports Today

- handwritten TSX scene authoring
- whiteboard-style scene primitives
- multi-scene composition with simple transitions
- TSX-to-MP4 rendering

## What This Quick Start Does Not Cover

These ideas appear elsewhere in older docs, but they are not the active workflow here:

- `seqvio ai ...` commands
- HTML authoring mode
- JSON storyboard mode
- `seqvio init`, `seqvio dev`, or marketplace-style component install flows

## Best Next Reads

- [docs/COMPOSITION-AUTHORING.md](./docs/COMPOSITION-AUTHORING.md)
- [examples/compositions/README.md](./examples/compositions/README.md)
- [packages/whiteboard/README.md](./packages/whiteboard/README.md)
