# Parallel Render & Preset Flags

## Render presets (`--preset`)

One flag to set the right fps / pixelRatio / quality / frameFormat combination.
Explicit flags always win over preset defaults.

| preset | fps | pixelRatio | quality | frameFormat | Use for |
|--------|-----|------------|---------|-------------|---------|
| `preview` | 24 | 1 | low | jpeg | Fastest possible; composition check |
| `standard` | 30 | 1 | medium | png | Draft review |
| `final` | 30 | 2 | medium | png | Normal delivery |
| `high` | 30 | 2 | high | png | High-quality delivery |

```bash
# Fast preview pass (4× faster than default):
seqvio-render --component my.tsx --output out.mp4 --preset preview

# Override just fps while keeping other preset defaults:
seqvio-render --component my.tsx --output out.mp4 --preset final --fps 60
```

## Frame format (`--frameFormat`)

Controls the per-frame screenshot format, **not** the final MP4 codec.

- `png` (default): lossless, slower. Best for final delivery.
- `jpeg`: much faster screenshot encode/transfer — ideal for previews.
  Combined with `--pixelRatio 1` this is the fastest possible local render.

```bash
seqvio-render --component my.tsx --output preview.mp4 \
  --frameFormat jpeg --pixelRatio 1 --quality low
```

## Parallel workers (`--workers`)

Opens **N pages** in **one browser**, captures frames in parallel to numbered
files, then runs a single FFmpeg pass to encode. No concat, no seams.

```bash
# 4 parallel capture workers on a multi-core machine:
seqvio-render --component my.tsx --output out.mp4 --workers 4
```

### When to use

- `--workers 1` (default): serial image2pipe path. Zero disk IO; rendering and
  encoding overlap. Best for fast machines or short compositions.
- `--workers N > 1`: parallel capture to disk, single encode. Useful for long
  compositions on machines with ≥4 cores where screenshot is the bottleneck.
  Each extra page adds ~30–50 MB RAM; stay under available memory.

### What is NOT supported

- `--workers N` across multiple machines (cross-machine slice+concat). This
  is an orchestration-layer concern and requires an external job scheduler.
- `--workers N` combined with `image2pipe` streaming — multi-page capture must
  write numbered frame files because order cannot be guaranteed across pages.

## Timing summary

After every render, the CLI prints a timing table:

```
─────────────────────────────
  Render complete
  Output:   output/my.mp4
  Frames:   450 @ 2× (png)
  Workers:  1
  Total:    42.3s  (10.64 rendered fps)
  Setup:    8.1s
  Render:   38.2s
  Cleanup:  0.4s
  Size:     12.40 MB
─────────────────────────────
```

The `render()` API also returns a `RenderResult` with these timings for
programmatic use.
