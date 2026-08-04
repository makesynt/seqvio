# Current Product Demo Script

Target length: 60-75 seconds. Use 1920x1080 for Product Hunt and 1280x720
for the README variant. Keep code and terminal text readable at normal playback.

## 1. Failure, 0-8s

Show the observed native-module CI error. State the question: why did a rebuild
report success while the module still failed to load?

## 2. Editorial decision, 8-18s

Show `EDITORIAL.md`. Select `causal-diagnosis` as the primary soft pattern and
`evidence-demonstration` as supporting advice. Highlight the explicit omission
of unrelated release details.

## 3. Visual direction, 18-27s

Show `VISUAL-DESIGN.md`: terminal for observed output, diagram for the load path,
and code only for the configuration that caused install scripts to be blocked.

## 4. Executable explanation, 27-40s

Show `explainer.json`. Connect one narrated claim to an `ExplanationBeat` with a
phrase anchor, visual target, and captured step id. Clearly distinguish authored
diagram content from capture-derived terminal evidence.

## 5. Timing and QA, 40-55s

Resolve the spoken phrase after TTS. Show the resulting output frame and a short
QA report covering timing, evidence, media, and key-frame checks.

## 6. Result, 55-68s

Play the finished explanation: symptom, expected load path, blocked install
script, corrected configuration, and verified module load.

## 7. Close, 68-75s

End on: "Turn real technical work into explainable video." Show the GitHub URL
and `npm install -g @seqvio/renderer`. Label terminal/browser capture as
experimental in supporting copy, not in the spoken close.
