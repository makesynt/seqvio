---
"@seqvio/renderer": minor
---

**渲染性能优化：Stage A（快赢）+ Stage E（并行截帧）**

### Stage A — 性能快赢

- **`--frameFormat jpeg|png`**：截帧格式可选。`jpeg` 用于预览（速度快 2-3×）；`png` 为最终交付默认值（无损）。不影响最终 MP4 编码器或 CRF。
- **`--preset preview|standard|final|high`**：一键设置 fps / pixelRatio / quality / frameFormat 组合，降低调参成本。显式 flag 始终覆盖 preset。
  - `preview`：fps=24, pixelRatio=1, quality=low, frameFormat=jpeg（最快）
  - `standard`：fps=30, pixelRatio=1, quality=medium, frameFormat=png
  - `final`：fps=30, pixelRatio=2, quality=medium, frameFormat=png
  - `high`：fps=30, pixelRatio=2, quality=high, frameFormat=png
- **timing 可观测性**：`render()` 现返回 `RenderResult`（总耗时、各阶段 ms、rendered fps、输出字节）；CLI 末尾自动打印 timing 汇总表。
- **Help 文本**：补充说明 `--quality` 只控 CRF，`--frameFormat jpeg` 是加速截帧的推荐预览选项。

### Stage E — 单机并行（Remotion 本地模型）

- **`--workers N`**：在同一个浏览器中打开 N 个页面并行截帧，帧落盘编号，最后 **一次** FFmpeg 编码（无 concat、无接缝）。
  - 默认 `workers=1`：维持原有 image2pipe 串行路径，行为完全不变。
  - `workers>1`：多 page 截帧并行，适合多核机器的长视频渲染。
- **修正注释**：原注释将「切片+concat（N FFmpeg + concat，已拒绝）」与「多 page + 单编码（本次采用）」混淆。新注释区分两者，避免后人误解。
