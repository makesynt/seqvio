# Product Hunt Video Plan

**Status:** This plan describes the shipped Product Hunt video. The implementation
is [`seqvio-product-hunt-premium.tsx`](../../examples/compositions/seqvio-product-hunt-premium.tsx);
the public narration outline is maintained in [`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md).

## Objective

Show that Seqvio turns real agent work and authored ideas into evidence-backed
explainer videos whose evidence, narration, visual order, and rendered output stay connected. The
opening three seconds must establish a living technical context rather than a
feature grid or a static product mockup.

## Product Claims

- Seqvio creates evidence-backed explainer videos for agents.
- An agent task can lead to terminal and browser evidence, then to a reviewable
  explanation and a rendered video.
- `EDITORIAL.md`, `VISUAL-DESIGN.md`, `ExplainerDocument`,
  `ExplanationBeat`, and deterministic QA are real workflow surfaces.
- PR review, tool comparison, tutorial verification, concept explanation,
  product review, and skill evaluation are applications of the same workflow.

Do not claim that Seqvio is a general-purpose editor, a one-shot prompt-to-video
generator, a hosted agent runtime, or a universal one-click capture workflow.

## Visual Direction

- Canvas: 16:9, 1920x1080, 30 fps, approximately 72 seconds.
- Palette: deep blue-black for the technical/evidence sections and quiet
  gray-white for authored review surfaces. Avoid decorative gradients, ghost
  traces, or background ornaments.
- Typography: Inter for product copy and Cascadia Mono for terminal/code.
- Containers: use Apple-like rounded rectangles for real application surfaces;
  do not put every scene inside the same terminal frame.
- Movement: every scene has continuous, meaningful motion. Important end states
  remain on screen for one to two seconds before the next transition.
- Text: value statements are concise, centre-aligned, and appear as words build
  into a centred line. No cursor, punctuation, caption box, persistent tiny
  labels, or unrelated rules.

## Narrative Timeline

| Time   | Scene               | What the viewer sees                                                                                              | Claim                                          |
| ------ | ------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 0-4s   | Opening             | Four moving evidence dimensions resolve into the Seqvio icon and wordmark                                         | Evidence-backed explainer videos for agents   |
| 4-13s  | Skill evaluation    | An agent session requests an `html-anything` landing page; terminal output and its generated page become evidence | A real skill evaluation from task to evidence  |
| 13-20s | Story review        | Editorial and visual decisions are reviewed as an authored story, not two arbitrary black file panes              | Review the story before it becomes video       |
| 21-32s | System explanation  | A rich, abstracted architecture diagram connects task, evidence, narration, visual actions, and output            | Explain the system                             |
| 32-39s | Timing              | Measured speech and visual order lock phrases to evidence and actions                                             | Align narration and visuals                    |
| 40-59s | QA and applications | Deterministic checks pass, then six application examples form a dynamic montage                                   | Verify before rendering / Use cases for Seqvio |
| 59-64s | Closing             | The Seqvio icon and wordmark hold while the narration completes the product promise                               | Evidence-backed explainers for agents         |

## Evidence Treatment

The skill evaluation is the only linear example. It uses the real
`nexu-io/html-anything` workflow: an agent task produces HTML, a terminal shows
the command/result, and a browser shows the generated page. The later
application montage must not pretend to be six additional full recordings.

Terminal and browser activity must look observed: characters type one by one,
cursor and click focus expand before settling, and shown output is specific
rather than placeholder prose. The video does not need an on-screen
"experimental" label, but it must never fabricate capture-derived evidence.

## Transitions

- Technical evidence transforms into authored planning rather than cutting to a
  repeated frame: terminal content shrinks into a review card; code/browser
  surfaces expand into the diagram.
- Diagram nodes and trace paths move into the timing view; paths are drawn over
  time and disappear before the Seqvio mark settles.
- Application examples use a fast, legible montage with distinct visual carriers,
  not six copies of one card.
- The closing logo expands to roughly five times its settled scale, then resolves
  to the brand lockup. The trajectory disappears before the final mark holds.

## Acceptance Checks

- The MP4 contains no blank or pure-white frames, text/graphic overlaps, or
  static holds longer than their intentional closing pauses.
- Each product claim maps to an implemented capability documented in
  `FEATURE-STATUS.md`.
- The skill example shows task, terminal, and browser evidence in one ordered
  chain.
- The diagram contains varied nodes, labels, values, and directional arrows;
  arrows and paths animate correctly.
- Text appears in the intended order, remains centred as it grows, and clears
  before the next visual carrier enters.
- Narration covers the complete timeline without unintended silent spans.
