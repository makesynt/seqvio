# Demo Assets

README demo videos now live in [`../videos/`](../videos/):

- `seqvio-overview-en.mp4` + `seqvio-overview-en.preview.gif`
- `seqvio-overview-zh.mp4` + `seqvio-overview-zh.preview.gif`
- `seqvio-product-hunt-en.mp4` (current 72-second Product Hunt demo)

GitHub README cannot inline-play repo-hosted MP4 with `<video>`; README uses the GIF previews (click through to MP4 for narration).

To regenerate GIF previews after updating an MP4:

```bash
ffmpeg -y -i docs/assets/videos/seqvio-overview-en.mp4 -ss 0 -t 12 -vf "fps=8,scale=640:-1:flags=lanczos" -an docs/assets/videos/seqvio-overview-en.preview.gif
ffmpeg -y -i docs/assets/videos/seqvio-overview-zh.mp4 -ss 0 -t 12 -vf "fps=8,scale=640:-1:flags=lanczos" -an docs/assets/videos/seqvio-overview-zh.preview.gif
```

Source compositions:

- `examples/compositions/seqvio-overview-en.tsx`
- `examples/compositions/seqvio-overview-zh.tsx`
- `examples/compositions/seqvio-product-hunt-premium.tsx`

The overview and Product Hunt sources must follow the current product path in
[`../../marketing/POSITIONING.md`](../../marketing/POSITIONING.md). Do not use
the retained Storyboard compatibility input as the primary workflow.

For tracked demo video, render at 1280x720 or 1920x1080 with the repository's
medium-or-higher quality profile. Bitrate varies substantially for flat motion
graphics, so inspect text-heavy key frames and the encoded output instead of
using file size or average bitrate as the only acceptance criterion.

Local CLI renders and audio intermediates should write to `output/` at the repository root (gitignored).

To refresh tracked README videos after `npm run build`, follow the narrated render flow in [`skills/seqvio/references/audio-workflow.md`](../../../skills/seqvio/references/audio-workflow.md), then copy the final MP4 into `docs/assets/videos/`.
