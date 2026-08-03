---
format: seqvio-visual-design
id: native-module-ci-visual
canvas: 1280x720
---

# Visual Design Brief: Native module causal trace

## Direction

A quiet technical editorial treatment that keeps one causal statement active at a time and uses red only for the blocked install step.

## Canvas

- Size: 1280 x 720
- Background: `#f7f8fa`
- Safe area: 48 px

## Palette

| Role | Value | Use |
|---|---|---|
| ink | `#17191f` | Primary labels and code |
| surface | `#ffffff` | Panels and diagram nodes |
| accent | `#176b87` | Normal execution path |
| failure | `#c83e4d` | Blocked script and missing artifact only |

## Typography

| Role | Family | Size | Weight | Use |
|---|---|---:|---:|---|
| title | Inter | 48px | 700 | One short claim per scene |
| body | Inter | 30px | 500 | Explanatory labels |
| code | JetBrains Mono | 25px | 500 | Configuration and verification code |

## Layout Rules

- Keep the title in the top safe area and the explanation in one central field.
- Show no more than five diagram nodes at once.
- Preserve left-to-right position across the install-path and root-cause scenes.

## Motion Rules

- Reveal one causal step per narration anchor.
- Trace normal steps in blue and hold the blocked step in red for at least 1.5 seconds.
- Use cuts within the causal sequence and a short fade before the repair.

## Section Treatments

### symptom

- Scenes: `symptom`
- Visual form: whiteboard
- Composition: Place the success message above the missing-artifact statement with a not-equal sign between them.
- Emphasis: Reveal the missing artifact only when the narration says it is still absent.

### install-path

- Scenes: `install-path`
- Visual form: diagram
- Composition: Use a left-to-right chain from package install to install script to build to pty.node.
- Emphasis: Trace the whole expected path in the normal accent color.

### root-cause

- Scenes: `root-cause`
- Visual form: diagram
- Composition: Reuse the install path and isolate the allowScripts gate between install script and build.
- Emphasis: Only the blocked gate and missing pty.node use the failure color.

### repair

- Scenes: `repair`
- Visual form: code
- Composition: Show the allowScripts configuration first, then the rebuild and import verification as a short code sequence.
- Emphasis: Finish on the import line, not the rebuild output.

## Avoid

- Fake terminal output
- Browser chrome without a real capture
- Decorative gradients
- Explaining unrelated ABI history
