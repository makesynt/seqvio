---
"@seqvio/core": minor
"@seqvio/renderer": patch
---

**Stage B — Seekable Animation Adapter（HyperFrames #1 借鉴）**

`@seqvio/core` 新增 seekable 动画开放接口，让作者把外部动画库（GSAP、Lottie、Three.js 等）的 paused timeline 注册为 `SeekableAdapter`，渲染器每帧自动 seek，使外部动画与 Seqvio 时间轴严格对齐。

- `SeekableAdapter` 接口：`id`、`seek(timeSeconds, frame)`、可选 `requiresRaf`
- `registerSeekable(adapter)` / `unregisterSeekable(id)`
- `useSeekable(adapter)` React hook（mount 注册、unmount 注销）
- `gsapSeekable(gsapTimeline, id)` GSAP 便捷包装（GSAP 为可选 peer，不硬依赖）
- `flushSeekables(frame, fps)` — 由 renderer runtime 在每帧调用；返回是否需要额外 rAF
- renderer `applyFrame()` 现在在 `timeline.seekToFrame()` + `setGlobalFrame()` 之后调用 `flushSeekables()`，保证截图前所有 adapter 已 seek
- 示例：`examples/compositions/seqvio-gsap-demo.tsx`
