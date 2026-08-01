# ExplanationBeat Timing Contract

> **Status:** implemented current behavior.

Seqvio authors narration and visual explanation as one semantic structure. The
framework then resolves that structure twice: first into a deterministic logical
timeline, and again after TTS into the measured speech timeline.

## Authoring Contract

A narrated scene uses `explanation`, not a separate `narration` field:

```json
{
  "type": "code",
  "id": "request",
  "language": "ts",
  "source": "return api.get('/users');",
  "steps": [
    {
      "id": "request-line",
      "at": 0,
      "action": "focus",
      "range": { "startLine": 1, "endLine": 1 }
    }
  ],
  "explanation": {
    "cues": [
      { "id": "voice", "text": "Now the client sends the request." }
    ],
    "beats": [
      {
        "id": "send-request",
        "cueId": "voice",
        "anchor": { "text": "sends the request" },
        "visuals": [
          { "targetId": "request-line", "action": "focus", "minHoldMs": 900 }
        ]
      }
    ]
  }
}
```

`anchor.text` is an exact phrase after Unicode normalization, language-tag
removal, and whitespace removal. If the phrase repeats, `anchor.occurrence` is a
one-based match number. Beat ids, cue ids, visual target ids, and capture step
ids are validated before compilation.

## Resolution Pipeline

```text
ExplanationBeat
  -> logical sourceFrame and visual action timing
  -> TTS synthesis and measured cue/chunk duration
  -> phrase anchor resolution to outputFrame
  -> semantic scene timeMap
  -> deterministic render and QA
```

The logical timeline gives visuals a stable order before audio exists. After
TTS, phrase position is resolved inside measured chunks when available. For
providers that only return whole-cue duration, Seqvio uses normalized character
position within that cue and records lower confidence.

The generated `timeMap` maps speech-local `outputFrame` values to visual-local
`sourceFrame` values. This preserves captured terminal/browser activity and
authored Code/Diagram/Whiteboard timing while letting the measured voice remain
the output clock.

## Scene Behavior

| Scene | Beat target | Logical timing source |
| --- | --- | --- |
| Whiteboard | element or annotation id | Beat order and hold duration |
| Code | code step id | Beat order and hold duration |
| Diagram | step, node, edge, or annotation id | Beat order and hold duration |
| Terminal | recorded step id | scheduled capture timestamp |
| Browser | recorded step/focus id | exact recorded action timestamp |

Terminal and Browser adapters generate cues and beats together from each
captured step. Browser recordings persist exact action start times; evenly
spaced timing is only a fallback when reading an older recording manifest.

## QA And Repair

Stable errors reject unknown references, missing or ambiguous phrases,
non-monotonic authored anchors, post-TTS unresolved anchors, and Beat timelines
that reverse source or speech time. Character-ratio fallback emits
`low_confidence_explanation_beat` so a release profile may promote it when
fine-grained alignment is required.

Repairs should change the source explanation, then synthesize again:

- Missing anchor: use a phrase that occurs in the referenced cue.
- Ambiguous anchor: choose a longer phrase or set `occurrence`.
- Reversed Beat: reorder beats or choose anchors in spoken order.
- Low confidence: split the cue near the visual change, use a more specific
  phrase, or use a TTS timing provider with finer chunks.
- Excessive stretch: shorten/split narration or add another visual Beat.

The contract intentionally has no migration requirement for earlier temporary
generated code. New authoring should emit `explanation` directly.
