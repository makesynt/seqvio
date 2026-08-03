# Native Module CI Authoring Example

This example keeps the reviewable authoring decisions separate from executable
video data:

```text
source.md
  -> authoring-data.json
  -> EDITORIAL.md
  -> VISUAL-DESIGN.md
  -> native-module-ci.explainer.json
  -> generated TSX
```

Files:

- `source.md` is the supplied material and scope.
- `authoring-data.json` contains the typed authoring data used by deterministic
  validation and Markdown formatting in this fixture.
- `EDITORIAL.md` is the normal human review surface for content selection and
  explanation structure.
- `VISUAL-DESIGN.md` is the normal human review surface for hierarchy, layout,
  motion, and section treatments.
- `native-module-ci.explainer.json` is the executable `ExplainerDocument` IR.

The example intentionally has no terminal or browser scene because it has no
capture assets. The design brief selects authored whiteboard, diagram, and code
forms instead of fabricating a recording.

Run the complete deterministic check:

```bash
npm run build -w @seqvio/core
npm run smoke:authoring-workflow
```

The smoke test validates both authoring artifacts, confirms the checked-in
Markdown is generated from the structured authoring data, traces every editorial
section through a visual treatment to a scene of the correct type, validates the
formal IR, and compiles a temporary TSX composition.
