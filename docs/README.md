# Seqvio Docs

This folder now separates **current usage**, **proposals**, and **historical archive**. Use this index to find the right source of truth quickly.

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

## Current Source of Truth

These docs describe the repository as it exists today:

| File | Scope |
| --- | --- |
| [`COMPOSITION-AUTHORING.md`](./COMPOSITION-AUTHORING.md) | TSX authoring model, render contract, transitions, and timing rules |
| [`../examples/compositions/README.md`](../examples/compositions/README.md) | End-to-end examples |
| [`../packages/whiteboard/AI-USAGE.md`](../packages/whiteboard/AI-USAGE.md) | AI-assistant-oriented usage for the whiteboard package |

## Product and Planning Docs

These are valuable for direction and terminology, but they include roadmap ideas that are not fully implemented:

| File | Notes |
| --- | --- |
| [`PRODUCT-PLAN.md`](./PRODUCT-PLAN.md) | Best statement of product positioning and current-vs-future scope |
| [`proposals/WHY-UNIFIED-MODE.md`](./proposals/WHY-UNIFIED-MODE.md) | Design rationale for the broader framework direction |
| [`proposals/STORYBOARD-SPEC.md`](./proposals/STORYBOARD-SPEC.md) | Historical/spec exploration, not the active authoring path |
| [`proposals/README.md`](./proposals/README.md) | Index of proposal and design-direction docs |

## Proposal Reference Docs

These files were moved under `docs/proposals/` so they are clearly separated from current usage docs:

| File | Read it for |
| --- | --- |
| [`proposals/ARCHITECTURE.md`](./proposals/ARCHITECTURE.md) | Long-range architecture ideas |
| [`proposals/PROJECT-STRUCTURE.md`](./proposals/PROJECT-STRUCTURE.md) | Intended monorepo shape |
| [`proposals/WHITEBOARD-MVP.md`](./proposals/WHITEBOARD-MVP.md) | Whiteboard package intent and MVP framing |
| [`proposals/COMPARISON.md`](./proposals/COMPARISON.md) | Conceptual comparison against other frameworks |

## Archive Docs

Historical logs and milestone summaries now live under `docs/archive/`:

| File | Notes |
| --- | --- |
| [`archive/README.md`](./archive/README.md) | Archive index |
| [`archive/RENDERING.md`](./archive/RENDERING.md) | Historical rendering notes and progress log |
| [`archive/FINAL-SUMMARY.md`](./archive/FINAL-SUMMARY.md) | Earlier summary of product direction |
| [`archive/AI-INTEGRATION-COMPLETE.md`](./archive/AI-INTEGRATION-COMPLETE.md) | Historical AI integration milestone note |

## Guidance for Contributors

- Treat code, examples, and `COMPOSITION-AUTHORING.md` as the implementation truth.
- Treat planning docs as directional unless confirmed by current code.
- When adding new docs, make it clear whether the file describes:
  current behavior, active proposal, or future roadmap.
- Use [../CONTRIBUTING.md](../CONTRIBUTING.md) for contribution workflow and
  [../SECURITY.md](../SECURITY.md) for vulnerability reporting.
- Use [../CHANGELOG.md](../CHANGELOG.md) for release-facing user-visible changes.
