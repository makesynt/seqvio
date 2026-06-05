# TSX Compositions

Handwritten video compositions for `seqvio-render`. Each file exports a default React component and `export const meta` with `duration` and `fps`.

## Render

From `seqvio/packages/renderer` after `pnpm build`:

```bash
node dist/cli.js \
  --component ../../examples/compositions/seqvio-intro-zh.tsx \
  --output ../../output/seqvio-intro-zh.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

## Conventions

- **Single scene**: one `WhiteboardScene` with `DrawText` / `DrawShape` / `Hand` and local `start` / `duration` frames.
- **Multi scene**: `VideoComposition` + `Scene` + optional `Transition` (see `seqvio-intro.tsx`).
- **Timing**: all `start` and `duration` values are in **frames**, not seconds.
- **No templates**: layout and copy are explicit in TSX (Remotion-style).

## Examples

| File | Description |
|------|-------------|
| `seqvio-intro.tsx` | 4-scene framework intro (EN + 部分中文) |
| `seqvio-intro-zh.tsx` | 4-scene 全中文框架介绍 |
| `seqvio-intro-30-en.tsx` | 3-scene audio-aligned English intro |
| `seqvio-intro-30-zh.tsx` | 3-scene audio-aligned Chinese intro |
| `seqvio-audio-demo.tsx` | Audio and caption metadata demo |
| `seqvio-alignment-demo.tsx` | Scene-duration derivation from resolved audio |
| `seqvio-brand-intro-zh.tsx` | Brand-oriented Chinese intro composition |

More single-scene samples: `packages/whiteboard/examples/`.
