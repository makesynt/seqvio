# Catalog Blocks (`seqvio-add`)

The `catalog/` directory contains reusable composition blocks — TSX snippets
you can copy into your project with one command.

## List available blocks

```bash
seqvio-add --list
```

Output:
```
  cover-card           Whiteboard title card with animated display heading + subtitle
                       Style: whiteboard/default  Requires: @seqvio/whiteboard, @seqvio/core

  scatter-list         Scatterbrain pinned sticky-note list for bullet points
                       Style: scatterbrain  Requires: @seqvio/scatterbrain, @seqvio/core

  stat-card            Whiteboard metric highlight card
                       Style: whiteboard/default  Requires: @seqvio/whiteboard, @seqvio/core

  caption-bar          Bottom caption bar overlay component
                       Style: whiteboard/default  Requires: @seqvio/core
```

## Copy a block into your project

```bash
# Copies to examples/compositions/ (or cwd if that dir doesn't exist)
seqvio-add cover-card

# Custom destination
seqvio-add scatter-list --dest ./src/scenes/

# Overwrite an existing file
seqvio-add stat-card --force
```

## Current blocks

| Name | Style | Description |
|------|-------|-------------|
| `cover-card` | whiteboard/default | Animated title + subtitle heading scene |
| `scatter-list` | scatterbrain | 2×2 sticky-note bullet list scene |
| `stat-card` | whiteboard/default | Large metric value with underline and label |
| `caption-bar` | any | Reusable bottom caption bar component |

## Adding a new block to the catalog

1. Create `catalog/<name>/` with a `block.json` and one TSX file.
2. `block.json` schema:
   ```json
   {
     "name": "my-block",
     "description": "One-line description",
     "style": "whiteboard/default",
     "packages": ["@seqvio/whiteboard"],
     "file": "my-block.tsx",
     "destName": "scene-my-block.tsx"
   }
   ```
3. The TSX file should be self-contained and importable without build steps.
4. Test with `seqvio-add my-block` from the repo root.
