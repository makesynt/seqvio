# Frame Specification (frame.md design system)

`FRAME.md` is the single source of truth for design tokens in a Seqvio video
project. AI agents authoring scene layouts should read this file **before**
placing any element — it defines the canvas, type scale, spacing, palette, and
font stacks for the chosen visual style.

---

## Generate a FRAME.md

```bash
# Default: whiteboard/default, 1920×1080
seqvio-generate frame-spec init

# Specific style and canvas
seqvio-generate frame-spec init --style whiteboard/studio --width 1920 --height 1080

# Write to a project sub-directory
seqvio-generate frame-spec init --style scatterbrain --out docs/FRAME.md
```

Available styles: `whiteboard/default`, `whiteboard/studio`,
`whiteboard/field-note`, `scatterbrain`.

---

## Reading FRAME.md in a composition

The FRAME.md is a **documentation and constraint file**, not a runtime import.
Agents read it to derive pixel values, then hardcode those values in TSX.

Example: if FRAME.md says `body = 32 px`, write `fontSize={32}` in DrawText.
Do not try to `import FRAME.md` — it is not a module.

---

## Token reference

### Type Scale tokens

| Token | Semantic use |
|-------|-------------|
| `display` | Hero title — at most one per scene |
| `h1` | Section heading |
| `h2` | Card / panel heading |
| `body` | Explanation text, list items |
| `caption` | Labels, marginal annotations, footer chrome |

### Spacing tokens

| Token | Use |
|-------|-----|
| `padX` | Left/right content inset from canvas edge |
| `padY` | Top/bottom content inset from canvas edge |
| `gapLg` | Between major sections |
| `gapMd` | Between related elements |
| `gapSm` | Between tightly coupled elements |

### Safe zone

Content must stay within the safe zone. Place decorative elements in the
outer margin if needed, but never critical text or callouts.

---

## Per-style summaries

| Style | Look | Package |
|-------|------|---------|
| `whiteboard/default` | Soft white bg, clean ink | `@seqvio/whiteboard` |
| `whiteboard/studio` | Dark bg, cool accent | `@seqvio/whiteboard` |
| `whiteboard/field-note` | Warm paper, natural ink | `@seqvio/whiteboard` |
| `scatterbrain` | Cork board, sticky notes | `@seqvio/scatterbrain` |

---

## Template location

The master template lives at [docs/frame-spec/FRAME.md](../../../docs/frame-spec/FRAME.md).
Per-project FRAME.md files are generated from it by `seqvio-generate frame-spec init`.
