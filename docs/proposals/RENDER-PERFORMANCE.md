# Seqvio Render Performance Improvement Plan

本文记录 Seqvio 渲染性能的完整改进计划。它是 roadmap/proposal，不改变当前实现契约；当前真实渲染流程仍以 `seqvio-render`、`seqvio-audio` 和 TSX composition 为准。

## 背景

在渲染 `examples/compositions/claude-cowork-best-practices-zh.tsx` 时，最终视频参数为：

- 输出：1280x720
- 帧率：30 fps
- 总帧数：1715 frames
- 总时长：57.22s
- 渲染命令：`--quality low --audioManifest ... --burnCaptions`
- 实际耗时：约 450.7s
- 实测吞吐：约 3.8 rendered frames/s

这个耗时主要来自当前 renderer 的逐帧截图模型：

1. Puppeteer 加载 React runtime。
2. 对每个 source frame 调用 `setFrameAndWait(...)`。
3. 对每帧调用 `page.screenshot({ type: 'png' })`。
4. 把所有 PNG 写入临时目录。
5. FFmpeg 再读取 PNG 序列编码为 MP4。
6. 若有音频，再执行 mux。

关键瓶颈在 `packages/renderer/src/renderer.ts` 的 `renderFrames(...)`：每帧串行等待浏览器更新并写入 PNG。`--quality low` 只影响 FFmpeg CRF，对截图阶段帮助很小。

## 目标

- 将常见 720p 中文讲解视频的渲染速度从约 3-4 fps 提升到 8-15 fps。
- 在不牺牲当前 composition API 的前提下，提供快速预览、标准交付和高质量输出三种路径。
- 保持本地可复现：同一 composition、同一参数应得到稳定输出。
- 保持音频、字幕和多场景渲染能力。
- 让性能问题可测量、可回归测试、可逐步优化。

## 非目标

- 不在第一阶段重写 Seqvio 为完整 Remotion 替代品。
- 不改变 `@seqvio/whiteboard`、`@seqvio/core` 的公共 API。
- 不要求用户放弃 TSX composition。
- 不把 AI storyboard、Studio 或模板自动布局纳入本性能计划。

## 性能诊断

### 已确认问题

- 截图阶段是主要耗时，而不是 FFmpeg 编码阶段。
- 当前默认 `pixelRatio` 为 2，720p 输出实际以更高设备像素渲染后再缩放。
- PNG 落盘会产生大量文件系统 IO。
- 渲染循环是单 page、单 browser、单线程串行。
- `--quality` 命名容易误导：它主要控制编码质量，不控制截图成本。
- `--burnCaptions` 会让字幕进入每帧画面，无法只靠音频 mux 解决。

### 可能问题

- 白板组件每帧可能重复计算 rough path、文本路径、手绘进度和布局。
- 静止帧没有复用；即使画面不变，也会重新截图。
- 多场景 transition 和 captions 可能触发全画面重绘。
- `page.screenshot` 输出 PNG 比直接 pipe raw frame 或 JPEG 更重。

## 阶段 0：建立基准

先补齐 benchmark，而不是先盲目改 renderer。

### 任务

- 新增 `packages/renderer/scripts/benchmark-render.ts` 或等效脚本。
- 基准覆盖：
  - 单场景白板文字
  - 多场景白板视频
  - 带 captions
  - 带 audio manifest mux
  - `pixelRatio=1` 与 `pixelRatio=2`
  - `fps=24` 与 `fps=30`
- 每次记录：
  - setup time
  - frame render time
  - encode time
  - mux time
  - cleanup time
  - total frames
  - rendered fps
  - temp frame count
  - temp directory size
  - output size

### 验收标准

- 可以用一个命令输出 JSON benchmark report。
- benchmark 结果可保存在 `output/benchmarks/`，不进入 git。
- 后续优化必须能用同一套 benchmark 对比。

## 阶段 1：零风险用户级优化

这一阶段只调整推荐命令和 CLI 说明，不改变核心渲染行为。

### 任务

- 在 README、render workflow 或 troubleshooting 中说明：
  - `--quality` 控制编码质量，不显著影响截图耗时。
  - `--pixelRatio 1` 是最快的 720p/preview 选择。
  - `--fps 24` 可明显减少帧数。
  - 预览应使用短片段 `--startFrame` / `--endFrame`。
- 增加推荐命令：

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/demo.tsx \
  --output output/demo-preview.mp4 \
  --width 1280 --height 720 \
  --fps 24 \
  --pixelRatio 1 \
  --quality low
```

- 对最终交付保留：

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/demo.tsx \
  --output output/demo-final.mp4 \
  --width 1280 --height 720 \
  --fps 30 \
  --pixelRatio 2 \
  --quality medium
```

### 验收标准

- 用户知道 preview 与 final 的差别。
- 用户不会误以为 `--quality low` 会让截图阶段显著加速。

## 阶段 2：CLI preset 与默认值优化

新增明确的渲染 preset，降低用户决策成本。

### 建议新增参数

- `--preset preview`
- `--preset standard`
- `--preset final`
- `--preset high`

### 建议映射

| Preset | Width/Height | FPS | Pixel ratio | CRF | 用途 |
| --- | --- | --- | --- | --- | --- |
| preview | 1280x720 | 24 | 1 | 30 | 快速看构图和字幕 |
| standard | 1280x720 | 30 | 1 | 24 | 日常交付 |
| final | 1280x720 | 30 | 2 | 20 | 清晰白板线条 |
| high | 1920x1080 | 30 | 2 | 18 | 高质量导出 |

### 代码位置

- `packages/renderer/src/cli.ts`
- `packages/renderer/src/renderer.ts`
- `skills/seqvio/references/render-workflow.md`

### 验收标准

- CLI help 中解释 preset。
- 显式参数可覆盖 preset。
- 老命令保持兼容。

## 阶段 3：减少 PNG 与文件系统 IO

当前方案把每帧 PNG 写入磁盘，再让 FFmpeg 读取。这是稳定但偏慢的路径。

### 方案 A：保守优化

- 允许 `--frameFormat jpeg`。
- 对 preview preset 使用 JPEG frame。
- 最终输出仍默认 PNG。

优点：

- 改动小。
- 文件更小，IO 更少。
- 截图可能更快。

风险：

- 白板线条和小字可能有压缩瑕疵。
- 需要确保字幕可读。

### 方案 B：pipe 到 FFmpeg

- 不落盘 frame 文件。
- `page.screenshot()` 得到 buffer 后直接写入 FFmpeg stdin。
- FFmpeg 使用 image2pipe。

优点：

- 大幅减少磁盘 IO。
- cleanup 简化。

风险：

- 出错时调试困难。
- 需要处理 backpressure。
- `--keepFrames` 要回退到落盘模式。

### 验收标准

- preview 渲染速度至少提升 20%。
- `--keepFrames` 仍可保留 PNG 调试帧。
- 出错时能报告当前 frame index。

## 阶段 4：并行分段抓帧

当前串行渲染是最大结构性瓶颈。并行可以显著提升吞吐。

### 设计

- 新增 `--workers <n>`。
- 将 frame range 切成多个连续 chunk。
- 每个 worker 使用独立 browser page 或独立 browser。
- 每个 worker 输出自己的 frame 段。
- 最终按全局 frame index 编码。

### 推荐实现顺序

1. 单 browser，多 page。
2. 若稳定性不足，再切换到多 browser。
3. 默认 `workers=1`，preview preset 可默认 `workers=2` 或根据 CPU 自动选择。

### 注意事项

- 每个 worker 都要加载同一 render shell。
- composition 必须是 frame-deterministic。
- 文件命名必须使用全局 frame index，避免合并错序。
- progress report 需要聚合多个 worker 的完成数量。

### 风险

- CPU 和内存占用上升。
- Puppeteer 多 page 在 Windows 上可能不稳定。
- 白板字体加载和资源加载必须一致。

### 验收标准

- `--workers 2` 在 720p preview 上至少提升 40%。
- `--workers 4` 不应导致明显 frame 丢失或错序。
- 输出 duration 与单 worker 完全一致。

## 阶段 5：静止帧复用与变化检测

白板讲解视频有大量静止或近静止区间。当前每一帧都完整截图。

### 可选策略

- composition/runtime 暴露 `isFrameStatic(frame)`。
- renderer 检测相邻帧是否视觉等价。
- 对静止区间只截图首帧，编码时重复该帧。

### 实现路径

1. 先从 authored timing 推断静止区间：
   - 当前 scene 没有 active draw/text/shape/hand/caption/transition。
2. 再考虑 pixel diff 自动检测。
3. 最后考虑 component-level hint。

### 风险

- captions、hand、transition、opacity 动画可能被误判静止。
- 自动 pixel diff 本身也有成本。

### 验收标准

- 不影响字幕显示和 transition。
- 静止区间较多的视频速度提升明显。
- 提供 `--disableStaticReuse` 用于回退。

## 阶段 6：白板组件计算缓存

当前白板组件可能在每帧重复计算手绘路径、rough shape、文本路径和 bounds。

### 任务

- 审计以下模块：
  - `packages/whiteboard/src/components/DrawText.tsx`
  - `packages/whiteboard/src/components/DrawShape.tsx`
  - `packages/whiteboard/src/utils/textPath.ts`
  - `packages/whiteboard/src/utils/roughPath.ts`
  - `packages/whiteboard/src/utils/textBounds.ts`
  - `packages/whiteboard/src/utils/drawProgress.ts`
- 对纯输入结果加 memo/cache：
  - text + font + size + position
  - shape type + size + seed
  - image bounds
  - serialized draw schedule

### 设计原则

- 缓存 key 必须包含会影响视觉输出的所有参数。
- 不缓存与 current frame 直接相关的 progress 值，只缓存静态几何。
- 保证 deterministic output。

### 验收标准

- 单 worker 渲染速度提升 10-30%。
- 没有改变视觉输出。
- TypeScript build 和 whiteboard examples 通过。

## 阶段 7：音频与字幕流程优化

音频合成不是这次主要瓶颈，但完整工作流也要优化。

### 任务

- `seqvio-audio synthesize` 支持并发合成 narration cues。
- 增加 cue-level cache：
  - provider
  - voice
  - model
  - text hash
  - output format
- 相同 cue 不重复请求 TTS。
- captions 可从 resolved narration 自动分段，而不是整句长字幕。

### 验收标准

- 同一 manifest 二次合成应跳过已存在且 hash 匹配的音频。
- 并发数可配置，默认保守。
- 断点续跑不会破坏 resolved manifest。

## 阶段 8：预览与视觉 QA 工作流

用户不应每次都完整渲染 1 分钟视频才能检查排版。

### 任务

- 新增 `seqvio-render --stillFrame <n> --output frame.png`。
- 新增 `--contactSheet`，从多个时间点抽帧生成预览图。
- 新增推荐 QA 命令：
  - title frame
  - each scene midpoint
  - caption-heavy frame
  - final frame

### 验收标准

- 生成 contact sheet 的时间小于完整视频 10%。
- 可用于快速检查文字重叠、字幕遮挡、空白画面。

## 阶段 9：更长期的渲染架构选项

如果 Seqvio 要承担更高频生产任务，可以考虑更深的架构升级。

### 选项 A：Remotion 后端适配

保留 Seqvio composition API，但输出到 Remotion renderer。

优点：

- 借成熟并行渲染和浏览器 orchestration。

缺点：

- 依赖变重。
- 需要适配现有 runtime、audio manifest 和 captions。

### 选项 B：Canvas/SVG 离屏渲染

将白板图形转为可离屏绘制的 canvas/SVG pipeline，减少 Puppeteer 截图成本。

优点：

- 更可控，可能更快。

缺点：

- 实现成本高。
- React/DOM 动画灵活性下降。

### 选项 C：保留 Puppeteer，但做 production renderer

继续使用浏览器 runtime，但补齐并行、pipe、cache、benchmark、preset。

建议：

- 优先选择此路径。
- 成本最低，也最符合当前 repo 形态。

## 推荐优先级

### P0：立即做

- 文档说明 `pixelRatio`、`fps`、`quality` 的真实影响。
- 增加 benchmark 脚本。
- 增加 `--preset preview/standard/final`。
- 增加 `--stillFrame` 或 contact sheet。

### P1：一周内可做

- JPEG frame preview。
- image2pipe 实验分支。
- `--workers 2` 多 page 分段抓帧。
- 白板几何缓存初版。

### P2：后续迭代

- 静止帧复用。
- TTS cue cache。
- captions 自动分段。
- 更完整的 render benchmark dashboard。

### P3：长期

- production renderer 架构重构。
- Remotion adapter 或离屏 canvas/SVG renderer 调研。

## 建议的第一批代码变更

1. `packages/renderer/src/renderer.ts`
   - 将 render 阶段计时拆分到 progress。
   - 支持 `frameFormat`。
   - 支持 `pixelRatio` 在 preset 中默认设置。

2. `packages/renderer/src/cli.ts`
   - 新增 `--preset`。
   - 新增 `--stillFrame` 或 `--contactSheet`。
   - 更新 help 文案。

3. `packages/renderer/src/render-benchmark.ts`
   - 新增 benchmark runner。
   - 输出 JSON。

4. `skills/seqvio/references/render-workflow.md`
   - 增加 preview/final 命令。
   - 解释性能参数。

5. `docs/TROUBLESHOOTING.md`
   - 增加 "Render is slow" 小节。

## 建议的基准命令

```bash
npm run build

node packages/renderer/dist/cli.js \
  --component examples/compositions/claude-cowork-best-practices-zh.tsx \
  --output output/bench-preview.mp4 \
  --width 1280 --height 720 \
  --fps 24 \
  --pixelRatio 1 \
  --quality low

node packages/renderer/dist/cli.js \
  --component examples/compositions/claude-cowork-best-practices-zh.tsx \
  --output output/bench-final.mp4 \
  --width 1280 --height 720 \
  --fps 30 \
  --pixelRatio 2 \
  --quality medium
```

## 成功指标

| 指标 | 当前 | 目标 |
| --- | ---: | ---: |
| 720p final throughput | 3-4 fps | 8+ fps |
| 720p preview throughput | 未定义 | 12+ fps |
| 57s 视频预览渲染 | 7-8 min | 2-4 min |
| 完整视频 final 渲染 | 7-8 min | 4-6 min |
| 单帧预览 | 不支持 | < 5s |
| contact sheet | 不支持 | < 30s |

## 风险与回退

- 并行渲染可能增加内存占用：保留 `--workers 1` 默认回退。
- JPEG preview 可能影响文字清晰度：final preset 继续使用 PNG。
- pipe 到 FFmpeg 出错难排查：保留 `--keepFrames` 和落盘模式。
- 静止帧复用可能误判：默认关闭，验证后再打开。
- 缓存可能导致视觉不更新：缓存 key 必须保守，必要时提供 debug disable flag。

## 结论

Seqvio 当前慢的核心原因是逐帧、串行、浏览器截图、PNG 落盘，而不是用户 composition 写法单独导致。最划算的改进路线是：

1. 先用 preset、`pixelRatio=1`、`fps=24` 解决 preview 慢。
2. 再用 benchmark 定位 renderer 热点。
3. 然后推进 frame pipeline、并行抓帧和白板缓存。
4. 最后再考虑 Remotion adapter 或离屏渲染等更大架构改造。

这样可以在保持 Seqvio 当前 TSX authoring contract 的同时，让渲染速度逐步接近可日常生产的水平。
