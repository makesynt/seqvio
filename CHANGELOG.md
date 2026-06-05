# Changelog

All notable changes to this repository should be documented in this file.

This project follows a simple keep-a-changelog style:

- add user-visible changes under `Unreleased`
- move them into a versioned section when cutting a release
- prefer concise, behavior-focused entries over commit-level noise

## Unreleased

### Documentation

- Added standard repository governance files: `LICENSE`,
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md`.
- Added `.env.example` and documented environment-variable-based provider
  configuration for audio synthesis workflows.
- Standardized repo docs on `pnpm` as the canonical package manager.
- Corrected stale support and contribution links in package-level docs.
- Added troubleshooting guidance for renderer, audio, and environment setup.

## 0.1.0

Initial public MVP baseline.

### Added

- TSX-first scene authoring with `@seqvio/whiteboard`
- Multi-scene composition with `@seqvio/core`
- MP4 rendering with `@seqvio/renderer`
- Audio manifest extraction, synthesis, and caption burn-in support
- Composition and package examples under `examples/` and `packages/`
