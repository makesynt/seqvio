# Style Playbook

Seqvio style profiles are versioned visual policy data. They control visual
treatment while preserving scene ids, target ids, ExplanationBeats, capture
evidence, narration timing, and semantic action order.

## Profiles

The reference profiles are:

| Profile | Treatment |
| --- | --- |
| `clean-technical` | Restrained dark technical presentation with semantic focus transfers |
| `editorial-explainer` | Light editorial typography, airy spacing, and crossfades |
| `terminal-first` | Compact dark presentation, restrained motion, and evidence-follow camera |

Profile JSON files live in `examples/styles/`. Each profile specifies
typography, motion density, camera policy, transition policy, attention
persistence, spacing, and the background/ink/accent/muted palette roles.

## ExplainerDocument

Attach a validated profile to `styleProfile`:

```json
{
  "format": "seqvio-explainer",
  "schemaVersion": "1.0",
  "id": "styled-explainer",
  "styleProfile": {
    "format": "seqvio-style-profile",
    "version": "1.0",
    "id": "clean-technical",
    "label": "Clean Technical",
    "typography": {
      "headingFamily": "Inter",
      "bodyFamily": "Inter",
      "monoFamily": "JetBrains Mono",
      "scale": "editorial"
    },
    "motionDensity": "restrained",
    "cameraPolicy": "semantic-focus",
    "transitionPolicy": "focus-transfer",
    "attentionPersistence": "until-handoff",
    "spacing": "comfortable",
    "paletteRoles": {
      "background": "#0f172a",
      "ink": "#f8fafc",
      "accent": "#38bdf8",
      "muted": "#94a3b8"
    }
  },
  "scenes": []
}
```

`compileExplainerDocumentToTsx` emits a `StyleProfileProvider` automatically.
For hand-authored TSX, wrap the composition with the same provider.

## Verification

The three retained reference compositions are
`examples/compositions/style-playbook-*.tsx`. Their videos live under
`output/style-playbook-*-v1.mp4`, and their committed golden frames live under
`tests/visual-snapshots/baseline/`.

Run the focused regression check with:

```bash
node scripts/visual-regression.mjs --case style-clean-technical,style-editorial-explainer,style-terminal-first
```
