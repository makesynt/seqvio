# Seqvio Docs

This folder separates **current usage** from **historical archive**. Use this index to find the right source of truth quickly.

## Start Here

If you are trying to use Seqvio today, read these first:

| File | Why it matters |
| --- | --- |
| [`../README.md`](../README.md) | Top-level overview, skill-first quick start, and current capabilities |
| [`../skills/seqvio/SKILL.md`](../skills/seqvio/SKILL.md) | Agent production loop for authoring, narration, and rendering |
| [`COMPOSITION-AUTHORING.md`](./COMPOSITION-AUTHORING.md) | Canonical TSX authoring and rendering contract |
| [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) | Common setup, render, and audio workflow failures |
| [`../examples/compositions/README.md`](../examples/compositions/README.md) | Composition examples and render command |
| [`../packages/whiteboard/README.md`](../packages/whiteboard/README.md) | Whiteboard component API and examples |
| [`../packages/product-demo/package.json`](../packages/product-demo/package.json) | Product walkthrough component package metadata |

## Current Source of Truth

These docs describe the repository as it exists today:

| File | Scope |
| --- | --- |
| [`COMPOSITION-AUTHORING.md`](./COMPOSITION-AUTHORING.md) | TSX authoring model, render contract, transitions, and timing rules |
| [`../examples/compositions/README.md`](../examples/compositions/README.md) | End-to-end examples |
| [`../packages/whiteboard/AI-USAGE.md`](../packages/whiteboard/AI-USAGE.md) | AI-assistant-oriented usage for the whiteboard package |
| [`../skills/seqvio/references/production-techniques.md`](../skills/seqvio/references/production-techniques.md) | Voice-first timing, reference-style analysis, and visual QA checklist |

## Product and Planning Docs

| File | Notes |
| --- | --- |
| [`VISION.md`](./VISION.md) | Product positioning, target users, scope, and design principles (slow-changing source of truth) |
| [`ROADMAP.md`](./ROADMAP.md) | Directional bet and phase ordering; what to build next and why. Subordinate to `VISION.md` |
| [`EXPLAINER-FRAMEWORK-IMPROVEMENT-PLAN.md`](./EXPLAINER-FRAMEWORK-IMPROVEMENT-PLAN.md) | Active execution proposal for consolidating capture, IR, deterministic playback, QA, and release readiness |

Active, time-boxed work items live in GitHub issues and milestones, not in a docs file.

## Archive Docs

Historical logs and milestone summaries now live under `docs/archive/`:

| File | Notes |
| --- | --- |
| [`archive/README.md`](./archive/README.md) | Archive index |
| [`archive/PRODUCT-PLAN-2026-07.md`](./archive/PRODUCT-PLAN-2026-07.md) | Archived July 2026 product plan snapshot; retained for competitive analysis and roadmap history (superseded by [`VISION.md`](./VISION.md)) |

## Guidance for Contributors

- Treat code, examples, and `COMPOSITION-AUTHORING.md` as the implementation truth.
- Treat planning docs as directional unless confirmed by current code.
- When adding new docs, make it clear whether the file describes:
  current behavior, active proposal, or future roadmap.
- Use [../CONTRIBUTING.md](../CONTRIBUTING.md) for contribution workflow and
  [../SECURITY.md](../SECURITY.md) for vulnerability reporting.
- Use [../CHANGELOG.md](../CHANGELOG.md) for release-facing user-visible changes.
