# Changelog

All notable changes to this repository should be documented in this file.

This project follows a simple keep-a-changelog style:

- add user-visible changes under `Unreleased`
- move them into a versioned section when cutting a release
- prefer concise, behavior-focused entries over commit-level noise

## Unreleased

### Added

- Added complete documentation for the experimental Python Manim adapter,
  including cross-platform setup, deterministic external rendering, manifests,
  cache behavior, `ManimClip`, ExplanationBeat markers, and troubleshooting.
- Added the CompositionDocument `ExplanationBeat` contract for jointly authored
  narration cues, exact phrase anchors, visual actions, and capture evidence.
- Added post-TTS phrase resolution and semantic scene-local time maps. Fine TTS
  chunks use chunk-character alignment; whole-cue character timing is retained
  as an explicit lower-confidence fallback.
- Added ExplanationBeat integration for Whiteboard, Code, Diagram, Terminal,
  and Browser scenes. Terminal/Browser adapters emit one capture-backed Beat per
  recorded step, and new Browser recordings persist exact action start times.
- Added stable QA diagnostics for unresolved/reversed Beats, invalid references
  and frames, and low-confidence alignment.
- Added capture CLI contract `1.0` with structured JSON results, stable exit
  codes, portable artifact manifests, safe job ids, and overwrite protection.
- Added direct `seqvio-browser record --plan` execution alongside the Browser UI server.
- Added per-job capture QA for Terminal and Browser commands, including a
  standard `qa-report.json` artifact and pipeline failure on QA errors.
- Added a deterministic render lifecycle with prepare/readiness, arbitrary-frame
  rendering, awaited disposal, and legacy seek compatibility. Per-stage Core and
  browser deadlines now report stable adapter, stage, frame, and timeout details.
- Added Windows/Linux/macOS package and real capture-runtime CI verification.
- Added a scene capability registry that drives stable scene validation and
  agent-authorable capability descriptions.
- Added lifecycle/release-train metadata plus CI verification for versions,
  local dependencies, changesets grouping, and capability-document drift.
- Added a cross-platform Terminal/Browser semantic golden, same-host shuffled
  frame pixel checks, and environment-tagged Windows/Linux/macOS CI artifacts.
- Added authored Whiteboard/Code/Diagram timeline conformance across narration
  expansion, transitions, captions, annotations, and reverse frame access.
- Added reproducible 1280x720 Code, Terminal, Browser, and mixed-scene render
  benchmarks with three-sample baselines, environment metadata, scheduled CI
  artifacts, and compatible-host regression budgets.
- Added `seqvio-doctor` with human and JSON output for Node, Chromium, FFmpeg,
  bundled fonts, `node-pty`, and writable render paths.

### Changed

- Routed Terminal and Browser production pipelines through the shared capture
  dispatcher and removed the duplicate legacy `writeComposition` writers.
- Added kind-safe capture compiler dispatch and canonical artifact tests for
  both adapters.
- Standardized Terminal/Browser progress as monotonic whole-job percentages and
  persisted `capture-manifest.json`, `composition-document.json`, and
  `artifacts.json` for completed jobs.
- Updated the technical host-agent prompt and Seqvio skill to design narration
  and visual actions together instead of independently tuning timestamps.
- Updated the 1280x720 Terminal/Browser release smoke to validate resolved Beats,
  semantic time maps, capture-profile QA, rendered MP4s, and full frame decode.
- Unified Terminal and Browser narration options. `--withAudio` now controls
  synthesis/muxing, while `--burnCaptions` is an independent explicit option.
- Made generated compositions resolve dependencies from the installed Seqvio
  package graph even when job output is outside the caller project.
- Made both capture CLIs terminate with their documented exit code after all
  artifacts have been flushed.
- Made Annotation overlays measure after the requested frame commits and join
  the browser readiness barrier, preventing stale bounds after reverse seeks.
- Exposed static screenshot reuse and cache-hit rate in structured render
  results so performance reports do not parse progress text.

### Documentation

- Added standard repository governance files: `LICENSE`,
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md`.
- Added `.env.example` and documented environment-variable-based provider
  configuration for audio synthesis workflows.
- Standardized repo docs on npm workspaces and `package-lock.json` for local
  repository development.
- Corrected stale support and contribution links in package-level docs.
- Added troubleshooting guidance for renderer, audio, and environment setup.
- Updated README and docs indexes for the 0.4.0 package set, product-demo
  components, scatterbrain styles, storyboard validation, and visual QA.
- Updated top-level, package, authoring, audio, planning, roadmap, and capability
  documentation to describe the current capture-to-ExplanationBeat pipeline and
  its remaining pre-stable/privacy boundaries.

## 0.1.0

Initial public MVP baseline.

### Added

- TSX-first scene authoring with `@seqvio/whiteboard`
- Multi-scene composition with `@seqvio/core`
- MP4 rendering with `@seqvio/renderer`
- Audio manifest extraction, synthesis, and caption burn-in support
- Composition and package examples under `examples/` and `packages/`
