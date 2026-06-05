# Seqvio Whiteboard MVP Notes

This file is a **historical implementation snapshot**, not the full product spec.

Use it to understand the intent behind the whiteboard package, but prefer these files for current behavior:

- [packages/whiteboard/README.md](./packages/whiteboard/README.md)
- [packages/whiteboard/AI-USAGE.md](./packages/whiteboard/AI-USAGE.md)
- [docs/COMPOSITION-AUTHORING.md](./docs/COMPOSITION-AUTHORING.md)

## What the Whiteboard MVP Means in Practice

The current MVP delivers:

- a working `WhiteboardScene`
- drawable primitives for text, shapes, and images
- a hand cursor component
- frame-based timing
- rendering through the Seqvio renderer pipeline

## What to Treat Carefully

Some earlier whiteboard notes overstate or simplify behavior. In particular:

- hand following is still limited compared with a full path-follow system
- text drawing is not a literal universal handwriting engine for every font/script
- AI generation workflows around whiteboard scenes are guidance patterns, not a shipped command suite

## Stable Surface Area

If you are building on the MVP today, rely on:

- `WhiteboardScene`
- `DrawText`
- `DrawShape`
- `DrawImage`
- `Hand`
- `getSerializedSceneEnd`

## Current Constraints

- `singlePen` defaults to `true`
- scene timing is frame-based
- multi-scene orchestration belongs to `@seqvio/core`, not the whiteboard package alone
- TSX is the active authoring path

## Recommendation

If you are updating docs or code, phrase whiteboard claims as:

- "works today" when backed by source and examples
- "planned" or "future" when it only exists in roadmap notes
