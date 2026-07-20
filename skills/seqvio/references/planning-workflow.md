# Host-Agent IR Planning Workflow

Use this workflow when content should become IR before TSX is authored.
Seqvio itself does not call AI, OpenAI, or illustration APIs.

## Pipeline

```text
article / prompt / notes
  -> seqvio-generate plan-agent writes a host-agent task
  -> host agent returns IR JSON
  -> seqvio-generate validate --json
  -> host agent repairs IR if needed
  -> seqvio-generate compile
  -> optional: seqvio-generate render-plan   # CompositionDocument v2 only
  -> seqvio-render [--renderPlan --chapterDir --resume]
```

## Choose IR format

| Domain | Default IR |
| --- | --- |
| `history` / `science` / `auto` | Storyboard v1 (whiteboard) |
| `programming` / `ai` / `devops` | CompositionDocument v2 |

Force a format with `--ir-format storyboard-v1|composition-v2|auto`.

## Commands

### Whiteboard storyboard (v1)

```bash
seqvio-generate plan-agent \
  --input article.txt \
  --write-prompt task.md \
  --language auto \
  --domain history \
  --max-scenes 5
```

### Technical composition (v2)

```bash
seqvio-generate plan-agent \
  --input brief.txt \
  --write-prompt task.md \
  --language en \
  --domain programming \
  --ir-format composition-v2 \
  --max-scenes 7
```

Validate the returned IR (auto-detects v1 vs v2):

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
  --ir examples/ir/technical-explainer-v2.json \
  --out examples/ir/technical-explainer-v2.render-plan.json \
  --force
```

Render with chapter resume:

```bash
seqvio-render \
  --component examples/compositions/technical-explainer-v2.tsx \
  --output output/technical-explainer.mp4 \
  --renderPlan examples/ir/technical-explainer-v2.render-plan.json \
  --chapterDir output/chapters/technical-explainer \
  --ir examples/ir/technical-explainer-v2.json \
  --preset preview \
  --resume
```

Render only one chapter while iterating:

```bash
seqvio-render \
  --component examples/compositions/technical-explainer-v2.tsx \
  --output output/recap-only.mp4 \
  --renderPlan examples/ir/technical-explainer-v2.render-plan.json \
  --chapterDir output/chapters/technical-explainer \
  --ir examples/ir/technical-explainer-v2.json \
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

Common CompositionDocument v2 codes:

- `unknown_annotation_target`
- `duplicate_addressable_id`
- `unknown_chapter_scene`
- `unsupported_scene_type`

Repair the IR in place, then run `seqvio-generate validate --json` again.

## IR Expectations

### Storyboard v1

- `style: "whiteboard"` or omit `style`.
- `scenes[].narration` contains full spoken sentences.
- `scenes[].duration` is in frames.
- `scenes[].elements` contains `text`, `shape`, `image`, and `icon` drawables.
- Use explicit `position`, `from`, and `to` coordinates inside the target frame.

### CompositionDocument v2

- `"version": "2.0"`.
- Scene types: `whiteboard`, `code`, `diagram` (plus placeholders for later families).
- Unique ids for scenes, diagram nodes/edges, and annotation targets.
- Prefer semantic code/diagram steps over hand-authored pixel coordinates.
- Optional `chapters[].sceneIds` for long-form render planning.

Keep final TSX as the editable production source after compile.

## Do Not

- Use `plan-auto`; Seqvio no longer ships a heuristic planner.
- Ask Seqvio CLI to call model APIs.
- Generate placeholder art in Seqvio core.
- Put OpenMontage schemas into Seqvio core.
- Split scene planning and illustration into hidden CLI passes.
