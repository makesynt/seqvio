# 🎬 Video Rendering in Progress

> Historical log note
>
> This file reads like a rendering progress log from an earlier iteration and contains legacy paths and assumptions. Use `packages/renderer`, the current smoke scripts, and `docs/COMPOSITION-AUTHORING.md` for present-day rendering guidance.

## 当前状态

✅ **渲染器已创建并正在运行**

```
开始时间: 刚刚
总帧数: 2700 帧 (90 秒 @ 30fps)
预计时间: 5-15 分钟
输出路径: output/framework-intro.mp4
```

---

## 渲染过程

### Phase 1: 帧渲染 (当前)
```
[░░░░░░░░░] 0-100%

正在进行：
- 启动 Puppeteer 浏览器
- 渲染 2700 个 PNG 帧
- 保存到 temp/ 目录
```

### Phase 2: 视频编码
```
使用 FFmpeg 将帧合成视频：
- 输入: temp/frame-*.png
- 编码: H.264
- 质量: CRF 18 (高质量)
- 输出: output/framework-intro.mp4
```

### Phase 3: 清理
```
- 删除临时帧文件
- 完成！
```

---

## 渲染的内容

**视频名称:** Seqvio Whiteboard Framework Introduction
**时长:** 90 秒
**分辨率:** 1920×1080 (Full HD)
**帧率:** 30 fps

**场景内容:**
1. **0-9s:** 标题和副标题
2. **9-30s:** 4 个核心特性展示
   - ✅ 100% 开源
   - ✅ React + TypeScript
   - ✅ AI 友好
   - ✅ 丰富组件
3. **75-90s:** 行动号召

**注意:** 这是简化版本，仅包含部分场景作为演示

---

## 技术细节

### 使用的工具

1. **Puppeteer** - 无头浏览器
   - 渲染 SVG 内容
   - 逐帧截图

2. **FFmpeg** - 视频编码
   - 合成帧序列
   - H.264 编码
   - MP4 容器

### 渲染策略

```javascript
// 每帧的渲染逻辑
function renderFrame(frame) {
  // 1. 计算每个元素的进度
  const progress = (frame - start) / duration;
  
  // 2. 应用缓动函数
  const eased = easeOut(progress);
  
  // 3. 渲染可见元素
  if (progress > 0 && progress < 1) {
    // SVG 描边动画
    strokeDashoffset = length * (1 - eased);
  }
}
```

---

## 查看进度

运行以下命令查看实时进度：

```bash
# 查看日志
cat C:\Users\Lenovo\AppData\Local\Temp\claude\...\bqzkgkzso.output

# 或者查看临时文件数量（Windows）
dir /B D:\video-agent\unified-video-framework\temp | find /C "frame"
```

---

## 预计输出

```
文件: output/framework-intro.mp4
大小: 约 15-25 MB
格式: MP4 (H.264)
质量: 高清 (CRF 18)
时长: 90 秒
```

---

## 完成后

视频将保存在：
```
D:\video-agent\unified-video-framework\output\framework-intro.mp4
```

可以使用任何视频播放器观看：
- Windows Media Player
- VLC
- Chrome 浏览器
- 或上传到 YouTube/Bilibili

---

## 如果遇到问题

### Puppeteer 失败
```bash
# 重新安装 Chromium
npx puppeteer browsers install chrome
```

### FFmpeg 未找到
```bash
# 已经通过 @ffmpeg-installer/ffmpeg 安装
# 如果还有问题，手动安装 FFmpeg
```

### 内存不足

> Historical note: the legacy `render-demo.js` standalone renderer was removed. Use `seqvio-render` from `@seqvio/renderer` instead.

Reduce duration while testing:

```bash
pnpm --filter @seqvio/renderer exec seqvio-render \
  --component ../../examples/compositions/seqvio-intro.tsx \
  --output ../../output/short-test.mp4 \
  --duration 300
```

---

## 性能统计

**每帧处理时间:**
- 渲染: ~100-200ms
- 截图: ~50-100ms
- 总计: ~150-300ms/帧

**总时间估算:**
```
2700 帧 × 200ms = 540 秒 = 9 分钟
+ FFmpeg 编码: 1-2 分钟
= 总计约 10-11 分钟
```

---

## 渲染脚本

位置: `@seqvio/renderer` CLI（`seqvio-render`）

简化版渲染器，直接使用 HTML/SVG，无需 React 构建。

**特点:**
- ✅ 零配置
- ✅ 纯 JavaScript
- ✅ SVG 描边动画
- ✅ 帧精确控制

---

## 下一步

完成后：
1. 查看视频
2. 分析效果
3. 优化代码
4. 实现完整版本

---

**渲染中... 请稍候** ⏳
