# Local sound registry example

`registry.json` is a template for the local-only SFX provider. Put owned audio
files at the paths declared by the registry (or edit those paths), then run:

```bash
seqvio-audio plan-sfx \
  --manifest output/audio-manifest.resolved.json \
  --out output/SOUND-DESIGN.md

seqvio-audio validate-sfx --registry examples/sounds/registry.json
seqvio-audio resolve-sfx \
  --manifest output/audio-manifest.resolved.json \
  --registry examples/sounds/registry.json \
  --outManifest output/audio-manifest.sfx.resolved.json
```

`plan-sfx` does not change the manifest. Review its suggested rows, add only the
approved semantic cues to `ExplanationBeat.sounds`, and then resolve them.

The repository does not bundle third-party sound files. This keeps licensing
and asset ownership explicit while allowing fully offline, deterministic renders.
