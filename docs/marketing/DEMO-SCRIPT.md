# Current Product Demo Script

Target length: 64 seconds. Render 1920x1080 for Product Hunt; derive a 1280x720
README variant only when needed. Keep terminal and browser text readable at
normal playback.

## 1. Product premise, 0-5s

Introduce Seqvio as an explainer video toolkit for agents. Start with moving,
recognizable technical artifacts rather than a static feature list.

## 2. A real skill evaluation, 4-13s

Follow an `html-anything` skill evaluation from an agent task through a real
terminal command and the generated page in a browser. The point is one coherent
chain from task to observable evidence, not a generic terminal or browser demo.

## 3. Review the story, 13-20s

Show editorial and visual design artifacts as reviewable decisions before
execution. Emphasize the selection and order of evidence, rather than treating
the files as decorative documentation.

## 4. Explain the system, 21-32s

Turn the observed task, evidence, and intended explanation into a structured
visual model. Use real characters and data alongside the diagram so the scene
reads as an explanation of the work rather than an abstract dashboard.

## 5. Align narration and visuals, 32-39s

Connect spoken phrases to the visual actions and evidence they introduce. Let
the timing relationship animate continuously; avoid static labels or a separate
caption treatment.

## 6. Verify before rendering and use cases, 40-59s

Show QA checking the rendered explanation, then a fast but legible montage of
pull-request review, tool comparison, tutorial verification, concept
explanation, product review, and skill evaluation. These are applications of
the same evidence-led workflow, not separate product modes.

## 7. Close, 59-64s

Show `Agent work, explained with Seqvio` beside the Seqvio icon and wordmark.
The closing narration is `Seqvio turns agent work into explainer videos people
can follow`. Do not repeat a terminal command, publish claim, or
experimental-status label in the closing frame.

The source of truth is
[`seqvio-product-hunt-premium.tsx`](../../examples/compositions/seqvio-product-hunt-premium.tsx).
The tracked narrated asset is
[`seqvio-product-hunt-en.mp4`](../assets/videos/seqvio-product-hunt-en.mp4).
