# Seqvio vs 现有框架对比

> Historical comparison note
>
> This document discusses product direction and conceptual comparisons. Some API examples use older naming such as `unified-video` and should not be read as the current Seqvio implementation surface.

全面对比 Seqvio 与 Remotion、Hyperframes、Garden Skills 的优劣势。

---

## 一句话总结

| 框架 | 核心定位 |
|------|---------|
| **Remotion** | React 组件化视频框架，需要程序化编写所有内容 |
| **Hyperframes** | HTML 原生视频框架，提供 87 个预制组件 |
| **Garden Skills** | 网页演示 + 屏幕录制工作流，侧重讲解类视频 |
| **Seqvio** | **统一框架，融合三者优势 + AI 原生** |

---

## 详细对比表

### 输入方式

| 特性 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| React 组件 | ✅ 唯一方式 | ⚠️ 需打包 | ✅ 标准支持 | ✅ 原生支持 |
| HTML 模板 | ❌ | ✅ 原生 | ⚠️ 通过 JSX | ✅ 原生支持 |
| JSON 配置 | ❌ | ❌ | ❌ | ✅ 支持 |
| Markdown 脚本 | ❌ | ❌ | ⚠️ 需转换 | ✅ AI 解析 |
| 可视化编辑器 | ⚠️ 第三方 | ⚠️ Studio | ❌ | ✅ 内置（可选）|

**总结：** Seqvio 支持 4 种输入模式，适配不同用户和场景。

---

### 组件生态

| 指标 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **官方预制组件** | ~0 | 87 | 3 | **200+** |
| **数据可视化** | ❌ 需自己写 | 9 种 | ❌ | **50+** |
| **Shader 转场** | ❌ | 14 种 | ❌ | **60+** |
| **社交媒体** | ❌ | 4 种 | ❌ | **30+** |
| **UI 组件** | ❌ | 11 种 | 8 基础 | **40+** |
| **3D 组件** | ⚠️ 基础 | ⚠️ 有限 | ❌ | ✅ 完整 |
| **AI 驱动组件** | ❌ | ❌ | ❌ | **20+** |
| **组件商店** | ❌ | ✅ Registry | ❌ | ✅ 完整生态 |

**优势：**
- Remotion: 可以使用 React 生态（需适配）
- Hyperframes: 87 个生产就绪组件
- Garden Skills: 23 个主题模板
- **Seqvio: 200+ 组件 + 完整分类系统**

---

### React 生态兼容性

| 库类型 | Remotion | Hyperframes | Garden Skills | Seqvio |
|--------|----------|-------------|---------------|--------------|
| **MUI** | ⚠️ 静态可用 | ⚠️ 需打包 | ✅ 完整 | ✅ 完整 |
| **Framer Motion** | ❌ 需手动转换 | ❌ | ✅ 原生 | ✅ 自动适配 |
| **GSAP** | ⚠️ 墙上时钟 | ✅ 帧精确 | ✅ 原生 | ✅ 自动适配 |
| **Three.js** | ✅ R3F | ✅ 原生 | ✅ 可用 | ✅ 自动适配 |
| **Lottie** | ⚠️ 需适配 | ✅ 原生 | ✅ 可用 | ✅ 自动适配 |
| **Recharts** | ✅ 静态可用 | ⚠️ 需打包 | ✅ 完整 | ✅ 完整 |

**关键差异：**
- **Remotion**: CSS/库动画必须转换为 `useCurrentFrame()`
- **Hyperframes**: 主要不用 React
- **Garden Skills**: 标准 React，但输出是网页
- **Seqvio**: 自动适配所有库，统一为帧精确

---

### 渲染方式

| 维度 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **渲染模式** | 程序化 | 程序化 | 屏幕录制 | **程序化 + 录屏双模式** |
| **输出格式** | MP4 | MP4 | 网页 + 录屏 | MP4/WebM/GIF/Web |
| **并发渲染** | ✅ | ✅ | ❌ | ✅ 智能分片 |
| **增量渲染** | ⚠️ 有限 | ❌ | ✅ 热重载 | ✅ 完整支持 |
| **WebCodecs** | ❌ | ❌ | ❌ | ✅ 硬件加速 |
| **云端渲染** | ✅ Lambda | ⚠️ 实验性 | ❌ | ✅ 内置支持 |

**Seqvio 独特优势：**
- 双渲染模式：开发时用实时预览，生产用程序化渲染
- 自动选择最快路径

---

### 动画系统

| 特性 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **时间轴引擎** | 内置 | GSAP | React | **统一时间轴** |
| **帧精确度** | ✅ | ✅ | ⚠️ 浏览器依赖 | ✅ |
| **插值函数** | ✅ | ✅ | ⚠️ 手动 | ✅ 丰富 |
| **物理动画** | ✅ Spring | ⚠️ 有限 | ⚠️ 手动 | ✅ Spring |
| **关键帧** | ✅ | ✅ | ⚠️ 手动 | ✅ 声明式 |
| **缓动函数** | ✅ | ✅ | ⚠️ CSS | ✅ 丰富库 |
| **音频同步** | ⚠️ 手动 | ⚠️ 手动 | ✅ 自动 | ✅ 自动 + 反应式 |

---

### 工作流完整度

| 阶段 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **1. 内容准备** | 手动 | 手动 | ✅ 从文章生成 | ✅ AI 解析 |
| **2. 脚本编写** | 手动 | 手动 | ✅ 自动生成 | ✅ AI 生成 |
| **3. 代码开发** | 手动 | 手动/HTML | ✅ 逐章生成 | ✅ AI 生成 |
| **4. 音频合成** | 手动 | 手动 | ✅ TTS 集成 | ✅ 多 TTS 提供商 |
| **5. 预览调试** | ✅ | ✅ | ✅ | ✅ 热重载 |
| **6. 渲染输出** | ✅ | ✅ | ⚠️ 录屏 | ✅ 自动化 |
| **7. 后期处理** | 手动 | 手动 | 手动 | ✅ AI 剪辑 |

**Garden Skills 优势：** 完整的讲解视频工作流  
**Seqvio 优势：** 端到端 + AI 自动化

---

### AI 集成

| 功能 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **AI 代码生成** | ❌ | ❌ | ❌ | ✅ |
| **内容分析** | ❌ | ❌ | ❌ | ✅ |
| **风格建议** | ❌ | ❌ | ❌ | ✅ |
| **自动配音** | ❌ | ❌ | ⚠️ TTS | ✅ 多引擎 |
| **智能剪辑** | ❌ | ❌ | ❌ | ✅ |
| **脚本优化** | ❌ | ❌ | ❌ | ✅ |

---

### 主题系统

| 指标 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **预设主题** | ❌ | ❌ | 23 | **50+** |
| **设计 Token** | ❌ | ❌ | ✅ | ✅ 完整 |
| **自定义主题** | 手动 CSS | 手动 CSS | ✅ 脚手架 | ✅ 可视化编辑器 |
| **主题切换** | ❌ | ❌ | ⚠️ 需重新脚手架 | ✅ 即时切换 |
| **组件级覆盖** | ❌ | ❌ | ⚠️ 有限 | ✅ 完整支持 |

**Garden Skills 优势：** 首创主题系统  
**Seqvio 优势：** 50+ 主题 + 运行时切换

---

### 性能

| 指标 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **渲染速度** | 快 | 快 | 取决录屏 | **最快（并行+缓存）** |
| **内存占用** | 中 | 低 | 低 | 优化 |
| **启动时间** | 快 | 快 | 快 | 快 |
| **热重载** | ✅ | ✅ | ✅ | ✅ 智能缓存 |
| **增量渲染** | ⚠️ | ❌ | ✅ | ✅ |

---

### 开发体验

| 维度 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **学习曲线** | 陡峭（React+特殊API）| 平缓（HTML）| 中等（工作流）| **最平缓** |
| **TypeScript** | ✅ 完整 | ⚠️ 基础 | ✅ 完整 | ✅ 完整 |
| **类型推导** | ✅ | ⚠️ 有限 | ✅ | ✅ 智能 |
| **错误提示** | ✅ | ⚠️ 基础 | ✅ | ✅ 详细 |
| **文档质量** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **示例丰富度** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

### 授权和成本

| 项目 | Remotion | Hyperframes | Garden Skills | Seqvio |
|------|----------|-------------|---------------|--------------|
| **许可证** | 自定义（需付费）| Apache 2.0 | MIT | **MIT** |
| **商业使用** | 需购买许可 | ✅ 免费 | ✅ 免费 | ✅ 免费 |
| **公司规模限制** | 有（需检查）| ❌ 无 | ❌ 无 | ❌ 无 |
| **渲染次数限制** | 可能有 | ❌ 无 | ❌ 无 | ❌ 无 |
| **开源程度** | 源码可见 | 完全开源 | 完全开源 | **完全开源** |

---

## 具体场景推荐

### 场景 1: 企业产品视频

**推荐：** Seqvio > Remotion > Hyperframes

**理由：**
- Seqvio: 200+ 组件开箱即用，AI 快速生成
- Remotion: 高度定制化，但需要大量开发
- Hyperframes: 87 个组件够用，但缺乏 AI

### 场景 2: 教学讲解视频

**推荐：** Seqvio ≈ Garden Skills > Remotion > Hyperframes

**理由：**
- Seqvio: 继承 Garden Skills 工作流 + AI 加持
- Garden Skills: 专为此场景设计
- Remotion/Hyperframes: 需要手动开发所有内容

### 场景 3: 数据可视化报告

**推荐：** Seqvio > Hyperframes > Remotion > Garden Skills

**理由：**
- Seqvio: 50+ 数据可视化组件
- Hyperframes: 9 种图表 + 地图
- Remotion: 需要集成 Recharts 等
- Garden Skills: 不专注数据可视化

### 场景 4: 社交媒体短视频

**推荐：** Seqvio > Hyperframes > Garden Skills > Remotion

**理由：**
- Seqvio: 30+ 社交媒体组件 + 竖屏模板
- Hyperframes: 4 种社交叠加
- Garden Skills: 可用但非重点
- Remotion: 需要全部自己开发

### 场景 5: 高度定制的品牌视频

**推荐：** Seqvio ≈ Remotion > Hyperframes > Garden Skills

**理由：**
- Seqvio: 灵活性 + 组件库
- Remotion: 最大控制权
- Hyperframes: 预制组件可能限制创意
- Garden Skills: 工作流不适合

### 场景 6: AI 驱动的自动化视频生成

**推荐：** Seqvio >> 其他

**理由：**
- 唯一原生支持 AI 的框架
- 其他框架都需要自己集成 AI

---

## 迁移指南

### 从 Remotion 迁移

**90% 兼容** - 大部分代码可以直接复用

```tsx
// Remotion 代码
import { useCurrentFrame, interpolate } from 'remotion';

const MyComp = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return <div style={{ opacity }}>Hello</div>;
};

// Seqvio - 几乎相同
import { useFrame, interpolate } from 'unified-video';

const MyComp = () => {
  const frame = useFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return <div style={{ opacity }}>Hello</div>;
};
```

**主要差异：**
1. `useCurrentFrame()` → `useFrame()`
2. `<Composition>` → `<VideoComposition>`
3. 新增：预制组件库
4. 新增：AI 功能

### 从 Hyperframes 迁移

**HTML 模式 100% 兼容**

```html
<!-- Hyperframes -->
<div data-composition-id="my-video" data-duration="10">
  <video data-start="0" data-duration="5" src="clip.mp4"></video>
</div>

<!-- Seqvio - 相同 -->
<div data-video-id="my-video" data-duration="10">
  <video data-start="0" data-duration="5" src="clip.mp4"></video>
</div>
```

**优势：**
- 所有 Hyperframes 组件都可以用
- 额外获得 React 模式 + AI 功能

### 从 Garden Skills 迁移

**工作流直接复用**

Garden Skills 项目本质上就是 Vite + React，可以：

1. 安装 Seqvio 包
2. 替换时间轴系统
3. 使用 Seqvio 组件库
4. 保持原有的主题和音频工作流

---

## 总结：为什么选择 Seqvio？

### ✅ 如果你需要...

- **最丰富的组件库** → Seqvio (200+) vs Hyperframes (87) vs Remotion (~0)
- **完整的 React 生态** → Seqvio (自动适配) vs Garden Skills (原生) vs Remotion (需手动)
- **AI 原生支持** → 只有 Seqvio
- **多种输入方式** → 只有 Seqvio (React/HTML/JSON/Markdown)
- **完整工作流** → Seqvio ≈ Garden Skills
- **最快渲染** → Seqvio (并行+缓存) ≈ Remotion
- **完全开源** → Seqvio/Hyperframes/Garden Skills (MIT/Apache) vs Remotion (需付费)

### ⚠️ 何时不选 Seqvio？

1. **已有大量 Remotion 代码** → 迁移成本（但兼容性 90%）
2. **团队只会 HTML，不想学 React** → 纯 Hyperframes 可能更简单
3. **只需要简单的屏幕录制** → Garden Skills 足够

---

## 最终结论

| 框架 | 适合人群 | 核心优势 | 主要限制 |
|------|---------|---------|---------|
| **Remotion** | React 专家 | 最大控制权 | 需付费 + 所有组件自己写 |
| **Hyperframes** | HTML 用户 | 87 个组件开箱即用 | React 生态有限 |
| **Garden Skills** | 讲解视频创作者 | 完整工作流 | 屏幕录制模式 |
| **Seqvio** | **所有人** | **集大成者 + AI 原生** | **新框架（需要时间成熟）** |

**Seqvio 的使命：**  
成为视频创作领域的"统一框架"，让每个人都能轻松创作高质量视频。

---

**立即开始：** [快速开始指南](./QUICKSTART.md)
