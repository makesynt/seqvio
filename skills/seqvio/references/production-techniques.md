# Production Techniques

Use this reference when the task is to produce a polished narrated explainer, especially when the user provides a reference video or asks for a specific style.

## Voice-first timing

For narrated videos, the voice track is the master clock.

- Do not create long empty audio spans just to make scenes reach a target duration.
- If the user asks for a longer final video, expand the script and synthesize more narration. Do not pad with silence.
- After TTS synthesis, derive each scene or beat duration from the actual audio file duration or resolved audio manifest.
- Keep visual animations scene-local, but scale their start/duration values so the important drawing finishes before the narration beat ends.
- If a TTS provider inserts long pauses, either regenerate the narration or remove/compress only the long pauses while preserving natural short phrasing.

Useful QA command:

```bash
ffmpeg -i output/final.mp4 -af silencedetect=noise=-35dB:d=0.7 -f null -
```

Treat reported spans longer than about 0.7 seconds as suspicious unless they are intentional dramatic beats. Chapter-boundary silence is usually a defect in explainer videos.

## Audio-driven scene rebuild

When audio changes after the first render:

1. Measure final audio cue durations with `ffprobe`, the resolved audio manifest, or the renderer's audio tooling.
2. Convert each cue duration to frames with `Math.round(seconds * fps)`.
3. Update each `<Scene duration>` and total `meta.duration`.
4. Re-scale animation timing helpers against the new scene duration.
5. Re-render snapshots across every scene boundary and several mid-scene frames.
6. Re-render the full video or scene segments, then mux with the final audio.

For long videos, render scene segments with `--startFrame` and `--endFrame`, concatenate video-only segments, then mux once with the final continuous audio. This makes iteration cheaper and keeps audio/video boundaries explicit.

## Reference-video analysis

Before copying a reference style, extract several frames and identify the visual language:

- background and contrast
- palette and semantic color roles
- stroke width and line roughness
- icon density and icon vocabulary
- use of containers, dashed boxes, arrows, loops, branches, badges, labels, callouts, and emphasis marks
- proportion of text to drawings
- pacing: what appears first, what is revealed later, and how crowded the final frame becomes

Do not imitate only the background color or font. If the reference uses icons, symbols, arrows, and varied shapes, the Seqvio composition should also use a varied shape vocabulary.

## Product explainer production contract

Product-video reviews exposed several failure modes that should be prevented by
the authoring contract rather than fixed by taste at the end:

- Start from the real task and its visible result. Do not spend the opening on
  an intro slide, a generic product label, or a full script on screen.
- Let narration be the master clock. Keep full sentences in the voice track;
  on-screen text is limited to labels, keywords, commands, filenames, and
  short conclusions. Code, terminal, and browser evidence may retain the text
  needed to inspect the action.
- Declare one `focalTarget` per scene and make every reveal, emphasis, and
  camera move serve that target. A scene without a clear target is a planning
  error, not a style problem.
- Mark whether a visual is evidence-bearing capture or an authored conceptual
  explanation. A diagram may clarify a model, but must not imply that it is a
  recording of a system event.
- Vary scene composition and takeaway treatment. Repeating a header, title,
  card grid, and bottom rail makes a technical video read like a slide deck;
  use the scene's metaphor to determine its layout and conclusion.
- Use transitions to transfer attention: deliberate cuts, focus transfers,
  match-object links, and restrained blur crossfades. Avoid horizontal wipes,
  continuous rotation, and motion that has no explanatory role.
- Review reference frames at scene starts, midpoints, boundaries, and the final
  frame. Record a contact sheet or frame index and check text overflow,
  title-to-graphic collisions, focal-target coverage, and brand-asset
  transparency.
- Keep voice providers behind the resolved audio manifest. CosyVoice and other
  providers must produce the same phrase anchors, narration clock, and QA
  behavior; provider choice must not alter semantic scene order.

Implementation hooks are the planning fields `hook`, `visualRole`,
`focalTarget`, `evidenceSource`, `onScreenTextBudget`, and
`transitionIntent`; the QA layer should report their violations with a scene
id and frame number. This turns production experience into repeatable Seqvio
behavior instead of a one-off editing checklist.

## Diagram richness

Avoid explaining an entire video with only rounded rectangles plus text. Prefer semantic visual primitives:

- person/user: head-and-shoulders or simple avatar
- agent/bot: robot face or antenna symbol
- prompt/document/state: sheet, file, note, or stack
- code/tool/API: monitor, terminal, brackets, or wrench
- verification: check mark, stamp, shield, or test tube
- memory/database: cylinder, archive box, or ledger
- automation/time: calendar, clock, pulse, or metronome
- worktrees/parallel tasks: branch graph
- events/messages: inbox, queue, webhook, speech bubble
- score/control: gauge, slider, dial, or budget meter
- iteration: circular arrows, hill-climb path, or candidate cluster

Use labels as support, not as the primary visual payload.

## Takeaway containers

Avoid using the same long bottom rounded rectangle on every scene. A repeated bottom bar makes the video feel like a slide template and trains viewers to ignore the final line.

Choose a takeaway form that belongs to the scene's visual logic:

- underlined chalk statement: for a direct conclusion
- circled keyword or phrase: for concept clarification
- sticky note, taped note, or margin note: for a human aside
- stamp, seal, or badge: for principles, rules, and approval
- speech bubble or question bubble: for dialogue, Socratic prompts, and doubts
- gauge marker, warning sign, or red line: for risk and trust boundaries
- bracket, brace, or callout arrow attached to a diagram node: for synthesis

Do not treat takeaways as subtitles. Integrate them into the drawing: attach them to a node, place them where the diagram resolves, or let them transform from a crossed-out misconception into the final phrase.

## Scene-level visual metaphors

For multi-scene explainers, avoid reusing the same "header + center boxes + bottom takeaway" composition across the whole video. Assign each scene one visual metaphor, then pick shapes and motion from that metaphor.

Useful patterns:

- hiring or team setup: recruiting board, name tags, org chart, desk layout
- debugging concepts: diagnostic report, magnifier, bug trail, crossed-out terms
- principles or constitutions: scroll, clause list, stamp, seal, courthouse steps
- Socratic reasoning: chain of question bubbles, forked path, ladder of questions
- personality or manipulation: mask, trust meter, distance line, steering wheel
- consciousness or future risk: timeline, horizon mark, telescope, question cloud
- infrastructure: city map, network graph, pipes, roads, institutional layers
- closing synthesis: system loop, constellation, equation with circled terms

Vary scene composition deliberately: use left/right contrast, radial loops, timelines, maps, stacked layers, ladders, and flow diagrams. Rectangles are fine as one element, but they should not be the entire visual language.

## Expressive blackboard motion

Prefer motion that explains the idea, not only "box appears, text appears, arrow appears".

Use:

- draw the wrong wording first, cross it out, then write the clearer phrase
- start with a vague cloud and sharpen it into named concepts
- circle or underline the word currently being explained
- move arrows from one problem to the next as narration advances
- erase a false assumption before revealing the better model
- let one scene's final mark become the first mark in the next scene when possible

For dark blackboard work, keep the final frame readable: no dense overlapping chalk marks, no long centered sentence over a diagram, and no bottom text clipped by its container.

## Dark blackboard readability

For serious, risk, warning, or institutional themes, prefer a near-charcoal blackboard over a saturated green/teal board. Good starting backgrounds are `#111210` or `#141a17`; adjust by snapshot, not by taste alone. Avoid strong repeating horizontal line textures on dark boards because they make the frame look dirty and reduce chalk-text contrast. A very subtle dust or vignette layer is fine, but it must not create visible stripes.

When using circles or containers as concept groupings:

- prefer hollow outline circles when the circle is just a category or habitat metaphor
- do not set a filled circle to the same or similar color as the text inside it
- do not add a label plaque/border inside a circle unless the scene deliberately needs a UI-card look
- keep the label high contrast against the background; on a dark board, white or very light chalk text is usually safest
- verify the actual rendered frame, because rough fills, hachure marks, and texture overlays can make text unreadable even when the colors look fine in code

Keep arrows out of text. Arrows should start near the source node edge and end near the target node edge; they should not run through labels, icon centers, faces, or final takeaway text. Closing scenes need extra inspection because they often combine the most important words, arrows, and summary marks in one frame.

For Chinese blackboard videos that specify Long Cang, use the actual family name `"Long Cang"` (not `"LongCang"`) in CSS/TSX text stacks and set the theme's `cjkHandwritingFamily` explicitly. Check both `DrawText` text and any HTML/CSS overlay text, since they can use different font paths.

## Palette and hierarchy

Use semantic color, not random decoration:

- one neutral ink color for headers and low-priority labels
- one muted color for dividers and secondary notes
- 4-7 accent colors for repeated concept types
- consistent color roles across scenes, such as blue for input/tooling, amber for agent/action, green for verification/success, violet for system boundary, rose for risk/manual effort

Colored line drawings on a dark background usually need more than one accent color to avoid becoming flat.

## Visual QA loop

Before final handoff:

1. Build the workspace.
2. Run renderer QA snapshots across scene starts, midpoints, and final frames.
3. Manually inspect representative snapshots for:
   - nonblank frames
   - no text overlap
   - enough visual shape variety
   - labels fitting their containers or icon captions
   - reference-style fidelity
4. Render the full video or final segments.
5. Check media info with `ffmpeg -i`.
6. Run `silencedetect` on the final MP4.
7. Report the actual duration, resolution, fps, audio status, and any skipped validation.

## Duration honesty

If a user asks for a target duration and the available narration is much shorter, say so. The correct fix is one of:

- expand the script and synthesize more audio
- add real examples or sections
- accept a shorter, tighter video

Do not silently satisfy a duration target by adding empty audio or frozen visuals.
