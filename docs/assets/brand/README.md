# Seqvio Brand Assets

The Seqvio mark is a **stack of play swooshes** — a distinctive organic play glyph
(not a plain triangle) as a solid, dimensional front layer, with two past "scenes"
trailing **up and to the left** behind it along an implied timeline (playback points
right; older frames sit back-left). It reads two ways at once: a **play** symbol, and
a **sequence of scenes resolving into one playback** — the product in one glyph
(sequence + video). The front swoosh carries subtle volume (gradient, soft drop
shadow, a light sheen) over a bright neighbouring-blue palette on a dark app tile.

All variants share **one swoosh path** (256-space), scaled or recolored — never
redraw it by hand. The trailing frames are **sheared** (offset grows toward the
bottom, zero near the top where the mask hides it) so they unfurl smoothly from
behind the front layer rather than looking like a hard duplicate, and only their
**lower half** shows (upper half masked) so the stack never muddies into a smudge.
The primary icon uses two trailing frames; `seqvio-icon-small.svg` keeps just one so
it stays crisp down to 16px.

## Files

| File | Use |
| --- | --- |
| [`seqvio-icon.svg`](./seqvio-icon.svg) | Primary icon, 256×256 rounded app tile. Default mark for app stores, social avatars, GitHub org. |
| [`seqvio-icon-small.svg`](./seqvio-icon-small.svg) | Favicon / small sizes (≤64px). One solid back layer instead of two so it stays legible down to 16px. |
| [`seqvio-icon-mono.svg`](./seqvio-icon-mono.svg) | Single-color mark on transparent background. Inherits `currentColor` — set `color` in CSS (inline the SVG; `currentColor` does not cross an `<img>` boundary). For watermarks, stamps, print, and light/dark inversion. |
| [`seqvio-wordmark.svg`](./seqvio-wordmark.svg) | Horizontal lockup (icon + "Seqvio"). README headers and doc banners. Text color auto-adapts to light/dark via `prefers-color-scheme`, so it stays readable in both GitHub themes even as an `<img>`. |
| [`preview.html`](./preview.html) | Open in a browser to see every variant on light and dark backgrounds. |

## Colors

The icon uses a dedicated **bright neighbouring-blue** palette (not one of the
product whiteboard themes). Layers are distinguished by hue and lightness within
the blue family, so the depth stays readable even at small sizes.

| Token | Hex | Role |
| --- | --- | --- |
| Front start | `#5EE7FF` | Front triangle gradient start (bright cyan-blue) |
| Front mid | `#38B6FF` | Front triangle gradient middle (sky blue) |
| Front end | `#4C7DFF` | Front triangle gradient end (indigo-blue — gives volume) |
| Back layer 1 | `#4FC3FF` | Nearest back layer (bright blue) |
| Back layer 2 | `#6E7BFF` | Furthest back layer (periwinkle) |
| Tile dark | `#1B2440` | App-tile background (deep navy) |

Keep layers within the blue family (bright front, cooler/lighter back) when
regenerating assets — the hue+lightness step is what separates the stack.

## Usage notes

- Keep clear space around the mark equal to one triangle's width.
- Do not recolor the palette or add extra glow / sparkle to the mark.
- Below ~64px, use `seqvio-icon-small.svg` (one back layer, no shadow/sheen).
- On busy or colored backgrounds, use `seqvio-icon-mono.svg` in a single brand color.
- The wordmark uses Inter 700; substitute the closest available grotesque if Inter
  is unavailable, keeping the tight (-1.4) letter-spacing.
