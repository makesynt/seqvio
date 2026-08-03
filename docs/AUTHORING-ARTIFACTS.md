# Human-Readable Authoring Artifacts

Seqvio separates reviewable creative decisions from executable video data:

```text
source material
  -> EDITORIAL.md
  -> VISUAL-DESIGN.md
  -> ExplainerDocument JSON
  -> generated TSX
  -> audio alignment, QA, render
```

`EDITORIAL.md` and `VISUAL-DESIGN.md` are authoring artifacts. They are meant
for people and host agents to read and revise. `ExplainerDocument` is the only
formal execution IR consumed by Seqvio's validator, compiler, render planning,
capture adapters, and QA pipeline.

## Editorial plan

`EDITORIAL.md` records the explanation's objective, audience, thesis, explicit
content decisions, and ordered explanation structure. Each concept has a stable
id, an include/omit decision, a reason, prerequisites, and an optional time
estimate. Each section names the concepts it advances and the audience outcome
it must achieve.

The core package exports `EditorialPlan`, `validateEditorialPlan()`, and
`formatEditorialPlanMarkdown()` for tools that need structured authoring data.
The Markdown artifact remains the normal review surface.

## Visual design brief

`VISUAL-DESIGN.md` records concrete visual decisions: canvas, palette,
typography, layout rules, motion rules, section-level visual forms, emphasis,
and things to avoid. A section treatment references an editorial section id so
the design cannot silently drift away from the explanation structure.

The core package exports `VisualDesignBrief`, `validateVisualDesignBrief()`,
and `formatVisualDesignBriefMarkdown()`.

## Generate the three stages

Seqvio does not call a model. These commands write tasks for the host agent:

```bash
seqvio-generate plan-editorial \
  --input source.md \
  --write-prompt editorial-task.md \
  --domain programming \
  --language en

seqvio-generate plan-visual \
  --input source.md \
  --editorial EDITORIAL.md \
  --write-prompt visual-task.md

seqvio-generate plan-agent \
  --input source.md \
  --editorial EDITORIAL.md \
  --visual-design VISUAL-DESIGN.md \
  --write-prompt ir-task.md \
  --ir-format explainer
```

Review the two Markdown artifacts before generating the IR. The final task
instructs the host agent to preserve approved omissions and visual direction,
rather than reopening creative planning while writing scene data.

## Formal IR name

The canonical JSON IR is named `ExplainerDocument`. It uses:

```json
{
  "format": "seqvio-explainer",
  "schemaVersion": "1.0",
  "id": "example",
  "scenes": []
}
```

`schemaVersion` is a compatibility marker for validators and compilers. It is
not appended to the product-facing name. Users author an `ExplainerDocument`,
not an "ExplainerDocument v1".
