# TSX Compositions

Handwritten video compositions for `seqvio-render`. Each file exports a default React component and `export const meta` with `duration` and `fps`.

## Render

From the repository root after `npm run build`:

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-overview-en.tsx \
  --output output/seqvio-overview-en.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

## Conventions

- **Single scene**: one `WhiteboardScene` with `DrawText` / `DrawShape` / `Hand` and local `start` / `duration` frames.
- **Multi scene**: `VideoComposition` + `Scene` + optional `Transition` (see `seqvio-intro.tsx`).
- **Style demos**: use `getSeqvioStylePreset` / `listSeqvioStylePresets` from `@seqvio/whiteboard`.
- **Product demos**: use `@seqvio/product-demo` for browser frames, screenshot slots, cursor paths, titles, and callouts.
- **Timing**: all `start` and `duration` values are in **frames**, not seconds.
- **No templates**: layout and copy are explicit in TSX (Remotion-style).

## Examples

| File | Description |
|------|-------------|
| `seqvio-overview-en.tsx` | Narrated English product overview |
| `seqvio-overview-zh.tsx` | Narrated Chinese product overview |
| `seqvio-intro.tsx` | 4-scene framework intro (EN + partial Chinese) |
| `seqvio-intro-zh.tsx` | 4-scene all-Chinese framework intro |
| `seqvio-audio-demo.tsx` | Audio and caption metadata demo |
| `seqvio-alignment-demo.tsx` | Scene-duration derivation from resolved audio |
| `seqvio-style-manifest-demo.tsx` | Whiteboard style preset manifest demo |
| `seqvio-product-demo-preview.tsx` | Product walkthrough component demo |
| `seqvio-product-demo-validation.tsx` | Short product-demo renderer validation composition |
| `seqvio-scatterbrain.tsx` | Sticky-note / workshop style demo |
| `loop-engineering-explainer.tsx` | Long-form narrated explainer composition |
| `generated/style-layout-demo.tsx` | Storyboard IR compiled TSX demo |

More single-scene samples: `packages/whiteboard/examples/`.
