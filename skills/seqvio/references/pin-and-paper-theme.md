# Pin & Paper Theme — Authoring Reference

Field-notebook editorial style for Seqvio videos. Yellow legal-pad surface,
cobalt-blue hand-drawn ink, cream card panels, single red accent.
Inspired by the Pin & Paper editorial design system.

## Quick Start

```tsx
import {
  WhiteboardScene,
  DrawText,
  DrawShape,
  Hand,
  pinAndPaperTheme,
  pinPalette,
} from "@seqvio/whiteboard";

// Always use texture="none" and background prop for the yellow paper surface
<WhiteboardScene
  width={1280}
  height={720}
  texture="none"
  background={pinPalette.paper}
  theme={pinAndPaperTheme}
>
  ...
</WhiteboardScene>;
```

## Color Palette

| Token                | Hex       | Use                               |
| -------------------- | --------- | --------------------------------- |
| `pinPalette.paper`   | `#EFE56A` | Background — every scene, always  |
| `pinPalette.cream`   | `#F8F1D6` | Card fill — use for panels/cards  |
| `pinPalette.ink`     | `#1F3A8A` | All text, borders, shapes         |
| `pinPalette.inkSoft` | `#2D4FB8` | Subdued text, secondary labels    |
| `pinPalette.red`     | `#C2342B` | Single accent — one per scene max |
| `pinPalette.olive`   | `#6B7A2E` | Positive/growth signal (optional) |
| `pinPalette.cta`     | `#D8702A` | Warm orange for CTA elements      |

**Rule:** never more than 2 accent colors per scene. Ink is the default; red is the emphasis.

## Typography Scale (DrawText `fontSize` at 1280×720)

| Scale   | Size  | Use                                |
| ------- | ----- | ---------------------------------- |
| display | 82 px | Hero title — one per scene         |
| h1      | 56 px | Section heading                    |
| h2      | 38 px | Card heading                       |
| body    | 26 px | Body / explanation text            |
| caption | 20 px | Marginal annotation, label, footer |

Always use `fontWeight="bold"` for display and h1. Cards use h2 bold + body regular.

## Spacing

```
pad-edge  :  90 px  (left/right margin)
pad-top   :  80 px  (top content zone start)
gap-lg    :  56 px  (between major sections)
gap-md    :  36 px  (between related elements)
gap-sm    :  18 px  (between tightly coupled items)
```

## Card Pattern

seqvio has no CSS box-shadows. Simulate the Pin & Paper "hard offset shadow"
with two overlapping `DrawShape` rectangles:

```tsx
// Hard offset shadow (drawn first, behind)
<DrawShape
  type="rounded-rectangle"
  position={{ x: cardX + 4, y: cardY + 5 }}
  size={{ width: cardW, height: cardH }}
  start={shadowStart}
  duration={18}
  strokeColor={pinPalette.ink}
  fillColor={pinPalette.ink}
  strokeWidth={0}
/>
// Cream card face (drawn second, on top)
<DrawShape
  type="rounded-rectangle"
  position={{ x: cardX, y: cardY }}
  size={{ width: cardW, height: cardH }}
  start={cardStart}
  duration={18}
  strokeColor={pinPalette.ink}
  fillColor={pinPalette.cream}
  strokeWidth={2}
/>
```

A local `Card` helper can wrap this pattern when a composition repeats it.

## Dark Card Variant

For an "ink slide" moment (section divider feel), draw the card then overdraw
it with a solid INK fill:

```tsx
<Card x={80} y={200} w={500} h={300} ... />
{/* Overdraw with dark fill for the ink-surface variant */}
<DrawShape
  type="rounded-rectangle"
  position={{ x: 80, y: 200 }}
  size={{ width: 500, height: 300 }}
  start={cardStart + 24}
  duration={14}
  strokeColor={pinPalette.ink}
  fillColor={pinPalette.ink}
  strokeWidth={0}
/>
{/* Text in cream on dark surface */}
<DrawText ... strokeColor={pinPalette.cream} />
```

## Divider Line

Use a thin `DrawShape line` as a section separator (replicates the hairline
rule from the original design system):

```tsx
<DrawShape
  type="line"
  from={{ x: padEdge, y: ruleY }}
  to={{ x: W - padEdge, y: ruleY }}
  start={...}
  duration={18}
  strokeColor={pinPalette.ink}
  strokeWidth={1}
/>
```

## Red Accent Rules

- Use `pinPalette.red` on at most **one element per scene**.
- Good uses: a single underline rule on the cover, a CTA badge, one card label
  that needs emphasis, a bullet marker for the most important point.
- Never use red for body text or as a background fill.

## Layout Patterns

### Cover scene

1. Display title (82 px, center, INK)
2. Red underline rule below title (single line, `strokeWidth=4`)
3. Subtitle h1 (38 px, center, INK)
4. Tagline body (26 px, center, `inkSoft`)
5. Version / date caption (20 px, bottom-right, `inkSoft`)

### Multi-card scene

1. h1 section heading + hairline rule
2. 2–4 cream cards with hard offset shadow, staggered draw timing
3. Arrow connectors between cards (DrawShape arrow)
4. Bottom-center marginal annotation (20 px, `inkSoft`)

### Two-column scene

1. h1 heading + hairline rule
2. Left column: dark ink card (headings in CREAM)
3. Right column: cream card (headings in INK)
4. Column divider: 1px vertical line is not a native shape — fake with an
   `underline` shape rotated 90°, or just rely on card spacing.

## Do / Don't

### Do

- Set `texture="none"` and `background={pinPalette.paper}` — the yellow surface is non-negotiable.
- Keep to the 5-level type scale. Pick one size per semantic level per scene.
- Use the Card helper pattern for every content panel.
- Stagger card draw timing so each card appears sequentially (gap ~50–60 frames).
- End every scene with a bottom-center or bottom-right `caption` in `inkSoft`.
- Let the Hand animate — `Hand action="write" follow={true} visible={true}`.

### Don't

- Don't use a white or grey background. The yellow paper is the identity.
- Don't use more than one red element per scene.
- Don't skip the hard offset shadow on cards — a card without shadow reads as floating, not pinned.
- Don't pack more than 4 cards per scene at 1280×720.
- Don't mix ink body text with cream body text in the same column — choose one surface per panel.

## Shipped Theme

The theme implementation lives in
[`packages/whiteboard/src/theme/pinAndPaperTheme.ts`](../../../packages/whiteboard/src/theme/pinAndPaperTheme.ts).
Compose it with a local TSX file using the whiteboard components shown above.

## Render Command

```bash
seqvio-render --component path/to/pin-and-paper.tsx --output output/pin-and-paper.mp4
```

With narration:

```bash
seqvio-audio extract --component path/to/pin-and-paper.tsx \
  --out output/pin-and-paper.manifest.json
seqvio-audio synthesize --manifest output/pin-and-paper.manifest.json \
  --outDir output/pin-and-paper-audio
seqvio-render --component path/to/pin-and-paper.tsx \
  --audioManifest output/pin-and-paper-audio/audio-manifest.resolved.json \
  --output output/pin-and-paper.mp4
```
