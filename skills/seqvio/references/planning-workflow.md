# Host-Agent Storyboard Planning Workflow

Use this workflow when content should become a storyboard IR before TSX is authored.
Seqvio itself does not call AI, OpenAI, or illustration APIs.

## Pipeline

```text
article / prompt / notes
  -> seqvio-generate plan-agent writes a host-agent task
  -> host agent returns storyboard IR JSON
  -> seqvio-generate validate --json
  -> host agent repairs IR if needed
  -> seqvio-generate compile
  -> seqvio-render
```

## Commands

Write the planning task:

```bash
seqvio-generate plan-agent \
  --input article.txt \
  --write-prompt task.md \
  --language auto \
  --domain auto \
  --max-scenes 5
```

Validate the returned IR:

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

Render the generated composition:

```bash
seqvio-render \
  --component examples/compositions/generated/storyboard.tsx \
  --output output/storyboard.mp4
```

## Agent Repair Loop

When validation fails, use the JSON diagnostics directly:

- `path` points to the broken field.
- `code` identifies the issue type.
- `suggestion` gives the repair intent.
- `expected` and `received` help preserve nearby valid fields.

Repair the IR in place, then run `seqvio-generate validate --json` again.

## IR Expectations

- `style: "whiteboard"` or omit `style`.
- `scenes[].narration` contains full spoken sentences.
- `scenes[].duration` is in frames.
- `scenes[].elements` contains `text`, `shape`, `image`, and `icon` drawables.
- Use explicit `position`, `from`, and `to` coordinates inside the target frame.
- Keep final TSX as the editable production source after compile.

## Do Not

- Use `plan-auto`; Seqvio no longer ships a heuristic planner.
- Ask Seqvio CLI to call model APIs.
- Generate placeholder art in Seqvio core.
- Split scene planning and illustration into hidden CLI passes.
