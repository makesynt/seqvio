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

Captures frames in parallel and streams them into a **single** FFmpeg process
via `image2pipe` (FFmpeg stdin). Frames never touch disk (unless `--keepFrames`
is set); a small in-memory reorder buffer serializes writes so the encoder still
receives frames in order. No concat, no seams.

Each worker beyond worker 0 runs in its **own separate browser instance** (not
an extra page in the shared browser). An earlier multi-page design could place
those `file://` pages in the same Chrome renderer process, where concurrent
seek/screenshot work starves CDP and `page.evaluate` eventually times out on
heavy SVG compositions. Separate browsers isolate renderer processes and keep
long parallel renders stable — at the cost of more RAM per worker.

```bash
# 4 parallel streaming workers on a multi-core machine:
seqvio-render --component my.tsx --output out.mp4 --workers 4

# Let seqvio pick a conservative worker count by sampling the composition:
seqvio-render --component my.tsx --output out.mp4 --workers auto
```

### When to use

- `--workers 1` (default): single-worker image2pipe path. Zero disk IO;
  rendering and encoding overlap. Best for fast machines or short compositions.
  Only this path supports `--staticFrameDedup`.
- `--workers N > 1`: N parallel browsers stream into one encoder. Useful for
  long compositions on machines with ≥4 cores where screenshot is the
  bottleneck. Each worker is a full browser instance, so budget RAM accordingly.
- `--workers auto`: samples ~5 representative frames, measures p95 capture time,
  and picks a conservative count capped at `min(8, cpuCount, floor(frames/30))`.
  Short renders (<120 frames) always resolve to 1 worker.

### What is NOT supported

- `--workers N` across multiple machines (cross-machine slice+concat). This
  is an orchestration-layer concern and requires an external job scheduler.
- `--staticFrameDedup` with `--workers N > 1`. Static-frame deduplication is
  applied only on the single-worker path; with multiple workers it is skipped
  and a notice is logged.

## Static frame dedup (`--staticFrameDedup`)

On the single-worker path, hashes the rendered DOM per frame and reuses the
previous screenshot buffer when consecutive frames are byte-identical (skipping
the screenshot entirely). Automatically disabled when the scene contains
`<canvas>`/`<video>` or any active CSS animation/transition.

## JPEG screenshot quality (`--jpegQuality`)

When `--frameFormat jpeg`, sets the screenshot JPEG quality (30–100, default 90;
the `preview` preset lowers it to 80). Ignored for `png`.

## Whiteboard optimization (`--whiteboardOptimize`)

Experimental whiteboard render optimizations for benchmarking. Accepts
`none | react-static | bitmap-layer | frame-dedup` (or numeric aliases
`1`=react-static, `2`=bitmap-layer, `3`=frame-dedup). `frame-dedup` also turns
on single-worker static frame dedup.

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
