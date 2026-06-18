---
canvas:
  width: 1920
  height: 1080
  safeZone:
    top: 60
    right: 80
    bottom: 60
    left: 80
style: whiteboard/default
---

# Seqvio Frame Specification

This file defines the design tokens for a Seqvio video composition. It is the
single source of truth for AI agents authoring scene layouts: use these values
when placing `DrawText`, `DrawShape`, `StickyNote`, or any other element.

Do **not** invent sizes or colors outside this token set without a clear reason.
Consistent token usage is what makes a multi-scene composition feel coherent.

---

## Canvas

| Property | Value |
|----------|-------|
| Width | 1920 px |
| Height | 1080 px |
| Safe zone (top/bottom) | 60 px |
| Safe zone (left/right) | 80 px |
| Background | `#f8f9fb` (whiteboard/default) |

**Safe zone**: keep all text and key graphics inside the safe area. The outer
margin may be cropped on some displays and should contain only decorative
elements or intentional bleed.

---

## Type Scale

All sizes are in CSS pixels at the scene's native 1920 × 1080 resolution.
Use semantic names, not raw numbers — this lets theme changes propagate
automatically.

| Token | Size (1920×1080) | Use |
|-------|-----------------|-----|
| `display` | 96 px | Hero title, one per scene |
| `h1` | 64 px | Section heading |
| `h2` | 46 px | Card / panel heading |
| `body` | 32 px | Explanation text, list items |
| `caption` | 24 px | Labels, annotations, footer chrome |

> **1280 × 720 variant** (scale by 0.75): display=72, h1=48, h2=34, body=24, caption=18

---

## Spacing

| Token | Value | Use |
|-------|-------|-----|
| `padX` | 80 px | Left/right content inset |
| `padY` | 60 px | Top/bottom content inset |
| `gapLg` | 64 px | Between major sections |
| `gapMd` | 36 px | Between related elements |
| `gapSm` | 18 px | Between tightly coupled elements |

---

## Color Palette

### Whiteboard Default

| Role | Token | Value |
|------|-------|-------|
| Primary ink | `ink` | `#2c3e50` |
| Accent blue | `accent` | `#3498db` |
| Accent green | `accent2` | `#27ae60` |
| Muted text | `muted` | `#7f8c8d` |
| Surface / fill | `surface` | `#ffffff` |
| CTA / warning | `cta` | `#e74c3c` |
| Background | `background` | `#f8f9fb` |

### Whiteboard Studio (dark)

| Role | Token | Value |
|------|-------|-------|
| ink | — | `#e8eaed` |
| accent | — | `#4fc3f7` |
| accent2 | — | `#81c784` |
| background | — | `#1a1a2e` |

### Scatterbrain

| Role | Value |
|------|-------|
| Background | cork `#c8a96e` or linen `#f2e8d5` |
| Sticky yellow | `#fef08a` |
| Sticky blue | `#bfdbfe` |
| Sticky pink | `#fecdd3` |
| Sticky green | `#bbf7d0` |
| Scrawl ink | `#1e293b` |

---

## Font Stacks

| Style | Stack |
|-------|-------|
| Whiteboard (CJK+Latin) | `"Microsoft YaHei UI", "PingFang SC", "Noto Sans SC", system-ui, sans-serif` |
| Whiteboard hand-drawn Latin | `Virgil` (bundled woff2) |
| Whiteboard hand-drawn CJK | `Long Cang` (bundled ttf) |
| Scatterbrain scrawl | `"Segoe Print", "Comic Sans MS", cursive` |

---

## Per-Style Notes

### Whiteboard Default / Studio / Field Note

- DrawText defaults to `textRender="fill"` (clean, no stroke halo).
- DrawShape defaults to `shapeFillDefault="wash"` (rect/rounded-rect get a
  subtle fill; circles/lines do not).
- Hand-drawn mode: set on the theme via `<Whiteboard theme="excalidraw">` or
  a custom `WhiteboardTheme` with `handDrawn: true`.

### Pin & Paper

- Soft paper background (`#faf8f3`), ink `#2c1810`.
- `strokeWidth: 2.5`, `strokeWidthBold: 4`.
- Use `textRender="stroke-wash"` for a natural ink feel.

### Scatterbrain

- All elements are CSS divs (not SVG), so `position: absolute` coordinates are
  in pixels from the top-left of the 1920×1080 frame.
- Rotation is typically ±2°–±5° for natural cork-board feel.
- Stack order is controlled by `zIndex`.

---

## Authoring Checklist for AI Agents

1. Read this file **before** placing any element in a scene.
2. Pick element positions from the spacing grid: `padX`, `padY`, `gapLg/Md/Sm`.
3. Pick font sizes from the type scale — never invent ad-hoc sizes.
4. Pick colors from the palette — never invent ad-hoc hex values.
5. Verify all text stays within the safe zone.
6. Use `display` only once per scene; h1 for the main heading; body for copy.
