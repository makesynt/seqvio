# Feature Status For Public Materials

| Area                                          | Status                              | Public wording                                                                             |
| --------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------ |
| Public `ExplainerDocument` scene compilers    | Public                              | Complete authoring and rendering path for whiteboard, code, diagram, terminal, and browser |
| EditorialPlan / VisualDesignBrief             | Public                              | Reviewable planning artifacts before executable IR                                         |
| ExplanationBeat timing and post-TTS alignment | Public                              | Narration, visual action, and evidence share one timing contract                           |
| `seqvio-qa`                                   | Public                              | Deterministic audio, pacing, media, semantic, and key-frame checks                         |
| `@seqvio/terminal-narrator`                   | Experimental                        | Real terminal capture with platform-specific prerequisites                                 |
| `@seqvio/browser-recorder`                    | Experimental                        | Chromium action capture with recorded evidence and timing                                  |
| `@seqvio/capture`                             | Experimental                        | Shared capture contracts and artifacts                                                     |
| `InfographicScene` / `infographic` compiler   | Experimental                        | Explanatory metrics, comparison, process, timeline, relationship, and chart scenes         |
| `@seqvio/manim-adapter` / `manim` compiler    | Experimental                        | Optional external Python Manim rendering with validated media and timeline markers         |
| Screenshot privacy masking                    | Available for browser capture plans | Requires explicit selector/rectangle declarations; OCR is not a security boundary          |

Marketing demos must identify whether a scene is authored or capture-derived.
Do not describe experimental adapters as a universal one-click workflow.
When mentioning Manim, state that Seqvio invokes an independently installed
Python `manim` runtime and consumes the pre-rendered media through `ManimClip`.
