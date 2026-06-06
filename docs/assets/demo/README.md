# Demo Assets

README demo videos now live in [`../videos/`](../videos/):

- `seqvio-overview-en.mp4` + `seqvio-overview-en.preview.gif`
- `seqvio-overview-zh.mp4` + `seqvio-overview-zh.preview.gif`

GitHub README cannot inline-play repo-hosted MP4 with `<video>`; README uses the GIF previews (click through to MP4 for narration).

To regenerate GIF previews after updating an MP4:

```bash
ffmpeg -y -i docs/assets/videos/seqvio-overview-en.mp4 -ss 0 -t 12 -vf "fps=8,scale=640:-1:flags=lanczos" -an docs/assets/videos/seqvio-overview-en.preview.gif
ffmpeg -y -i docs/assets/videos/seqvio-overview-zh.mp4 -ss 0 -t 12 -vf "fps=8,scale=640:-1:flags=lanczos" -an docs/assets/videos/seqvio-overview-zh.preview.gif
```

Source compositions:

- `examples/compositions/seqvio-overview-en.tsx`
- `examples/compositions/seqvio-overview-zh.tsx`

Local CLI renders and audio intermediates should write to `output/` at the repository root (gitignored).

To refresh tracked README videos after `pnpm build`, follow the narrated render flow in [`skills/seqvio/references/audio-workflow.md`](../../../skills/seqvio/references/audio-workflow.md), then copy the final MP4 into `docs/assets/videos/`.
