# Static Excalidraw Import

Seqvio converts a static `.excalidraw` JSON file into an animated composition
rendered by the official Excalidraw Canvas exporter. Seqvio controls only the
element timing and reveal mask; it does not rebuild Excalidraw geometry or
claim to recover the user's original pointer timing.

## Usage

Build the renderer, then run:

```bash
node packages/renderer/dist/excalidraw-cli.js import \
  --input path/to/diagram.excalidraw \
  --outDir output/diagram
```

The command writes:

- `diagram.tsx` — Seqvio composition using `ExcalidrawCanvasScene`
- `import.json` — normalized imported elements (not an `ExplainerDocument`)
- `import-report.json` — skipped elements and warnings

Render the generated composition with the normal renderer:

```bash
node packages/renderer/dist/cli.js \
  --component output/diagram/diagram.tsx \
  --output output/diagram/diagram.mp4 \
  --width 1280 --height 720 --fps 30 --quality medium
```

## Supported elements

The first version imports rectangles, ellipses, diamonds, lines, arrows,
freehand paths, text, and embedded image data URLs. Deleted elements are
ignored. External embeds, iframes, and unknown element types are skipped and
listed in `import-report.json`.

The generated composition keeps the original supported Excalidraw elements and
passes them through Excalidraw's official `restore()` and `exportToCanvas()`
pipeline. This preserves the official geometry, RoughJS output, arrowheads,
fills, opacity, rotations, and font metrics. Official font assets are copied
locally into the render directory so video rendering does not depend on a CDN.

Element durations are estimated from path or text length and can be tuned with
`--drawSpeed`, `--minDuration`, and `--maxDuration`. During a reveal, Seqvio
composites adjacent official Canvas snapshots with a deterministic mask. Once
an element finishes, the displayed pixels come directly from the official
Excalidraw scene export.

The importer refuses oversized input (more than 1,000 elements) and never
fetches external URLs or executes embedded content. Images must be embedded
`data:image/*` files in the Excalidraw document.

## Limitations

Static Excalidraw JSON contains the saved scene, not a pointer-event recording.
The animation is therefore a deterministic reveal of official output, not a
reconstruction of the user's real drawing speed, pauses, or pen trajectory.
