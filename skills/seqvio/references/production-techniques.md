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
