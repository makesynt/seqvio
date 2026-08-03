# Host-Agent IR Planning Workflow

Use this workflow when content should become IR before TSX is authored.
Seqvio itself does not call AI, OpenAI, or illustration APIs.

## Pipeline

```text
article / prompt / notes
  -> plan-editorial -> reviewed EDITORIAL.md
  -> plan-visual -> reviewed VISUAL-DESIGN.md
  -> plan-agent -> host agent returns IR JSON
  -> seqvio-generate validate --json
  -> host agent repairs IR if needed
  -> seqvio-generate compile
  -> optional: seqvio-generate render-plan   # ExplainerDocument only
  -> seqvio-render [--renderPlan --chapterDir --resume]
```

## Choose IR format

| Domain | Default IR |
| --- | --- |
| `history` / `science` / `auto` | Storyboard (whiteboard) |
| `programming` / `ai` / `devops` | ExplainerDocument |

Force a format with `--ir-format storyboard|explainer|auto`.

## Commands

### Human-readable authoring stages

```bash
seqvio-generate plan-editorial \
  --input article.txt \
  --write-prompt editorial-task.md \
  --language auto \
  --domain history \
  --max-scenes 5

seqvio-generate plan-visual \
  --input article.txt \
  --editorial EDITORIAL.md \
  --write-prompt visual-task.md
```

Review both Markdown artifacts, then generate the executable IR task:

```bash
seqvio-generate plan-agent \
  --input brief.txt \
  --write-prompt task.md \
  --editorial EDITORIAL.md \
  --visual-design VISUAL-DESIGN.md \
  --language en \
  --domain programming \
  --ir-format explainer \
  --max-scenes 7
```

Validate the returned IR (auto-detects Storyboard vs ExplainerDocument):

```bash
seqvio-generate validate --ir storyboard.json --json
```

Compile valid IR to TSX:

```bash
seqvio-generate compile \
  --ir storyboard.json \
  --out examples/compositions/generated/storyboard.tsx \
  --force
```

For long technical videos, build a chapter render plan:

```bash
seqvio-generate render-plan \
  --ir examples/ir/technical-explainer.explainer.json \
  --out examples/ir/technical-explainer.render-plan.json \
  --force
```

Render with chapter resume:

```bash
seqvio-render \
  --component examples/compositions/technical-explainer.tsx \
  --output output/technical-explainer.mp4 \
  --renderPlan examples/ir/technical-explainer.render-plan.json \
  --chapterDir output/chapters/technical-explainer \
  --ir examples/ir/technical-explainer.explainer.json \
  --preset preview \
  --resume
```

Render only one chapter while iterating:

```bash
seqvio-render \
  --component examples/compositions/technical-explainer.tsx \
  --output output/recap-only.mp4 \
  --renderPlan examples/ir/technical-explainer.render-plan.json \
  --chapterDir output/chapters/technical-explainer \
  --ir examples/ir/technical-explainer.explainer.json \
  --onlyChapters recap \
  --preset preview \
  --resume
```

## Agent Repair Loop

When validation fails, use the JSON diagnostics directly:

- `path` points to the broken field.
- `code` identifies the issue type.
- `suggestion` gives the repair intent.
- `expected` and `received` help preserve nearby valid fields.

Common ExplainerDocument codes:

- `unknown_annotation_target`
- `duplicate_addressable_id`
- `unknown_chapter_scene`
- `unsupported_scene_type`
- `unknown_explanation_cue`
- `missing_beat_anchor`
- `ambiguous_beat_anchor`
- `unknown_beat_visual_target`

Repair the IR in place, then run `seqvio-generate validate --json` again.

## IR Expectations

### Storyboard

- `style: "whiteboard"` or omit `style`.
- `scenes[].narration` contains full spoken sentences.
- `scenes[].duration` is in frames.
- `scenes[].elements` contains `text`, `shape`, `image`, and `icon` drawables.
- Use explicit `position`, `from`, and `to` coordinates inside the target frame.

### ExplainerDocument

- `"format": "seqvio-explainer"` and `"schemaVersion": "1.0"`.
- Scene types: `whiteboard`, `code`, `diagram`, `terminal`, and `browser`.
- Unique ids for scenes, visual elements, Code/Diagram steps, diagram nodes/edges, and annotation targets.
- Prefer semantic code/diagram steps over hand-authored pixel coordinates.
- For narrated scenes, use `explanation.cues` plus `explanation.beats`; do not also set the legacy `narration` field.
- Each Beat references an exact phrase in its cue and at least one stable visual target id. Set `anchor.occurrence` when a phrase repeats.
- Terminal/Browser capture Beats reference the matching recorded step through `evidence.captureStepId`.
- Optional `chapters[].sceneIds` for long-form render planning.

Keep final TSX as the editable production source after compile.

## Do Not

- Use `plan-auto`; Seqvio no longer ships a heuristic planner.
- Ask Seqvio CLI to call model APIs.
- Generate placeholder art in Seqvio core.
- Put OpenMontage schemas into Seqvio core.
- Split scene planning and illustration into hidden CLI passes.
