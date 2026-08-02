# Render Conformance Baselines

> **Status:** current release-gate contract for deterministic Terminal and
> Browser rendering on Windows, Linux, and macOS.

Seqvio separates cross-platform semantic correctness from pixel determinism.
This avoids treating operating-system rasterization differences as product
behavior while still detecting unstable output on each host.

## Golden Layers

The Chromium conformance fixtures use two complementary layers:

1. `frame-conformance.golden.json` is the committed cross-platform semantic
   golden. At five interaction frames it fixes terminal time, typed input and
   cursor position, plus browser media time, camera transform, cursor position,
   and click visibility. These values must match exactly on every host.
2. Each test run captures an initial PNG for those same frames, then requests
   frames in reverse and repeated order. Exact hashes are preferred; otherwise
   PSNR must be at least 48 dB and no more than 0.1% of pixels may differ by more
   than eight channel values. This comparison stays within one host run and is
   therefore sensitive to state leakage without depending on another OS's font
   rasterization.

The fixture also verifies narration reflow, source-video seeking, missing media,
corrupt headers, and media truncated after metadata was loaded.

An authored-scene fixture covers Whiteboard, Code, and Diagram scenes across two
transitions. It verifies narration-expanded scene-local clocks, outgoing and
incoming transition roles, burned captions, annotation readiness, reverse seeks,
and repeated-frame pixels. This fixture exposed and now guards against stale
Annotation bounds being captured from the previously requested frame.

## CI Artifacts

The Windows, Linux, and macOS CI jobs run `npm run test:conformance`. Each job
uploads:

- five full-frame PNGs;
- `conformance-report.json` containing semantic samples and pixel hashes;
- platform, architecture, Node, Chromium, viewport, and resolved font metadata.

Artifacts are retained for 14 days. They are diagnostic evidence, not alternate
platform-specific golden files.

## Updating The Golden

Change the semantic golden only when an intentional component contract change
alters one of its recorded values. The code change and JSON update must be
reviewed together. Do not update the golden to accommodate a single operating
system or an unexplained rendering difference.

Run locally after building:

```bash
npm run build
npm run test:conformance
```

Set `SEQVIO_CONFORMANCE_ARTIFACT_DIR` to retain the report and PNGs locally.
