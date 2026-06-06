# Seqvio 项目结构

完整的 monorepo 架构设计

---

## 目录树

```
seqvio/
├── packages/                          # 核心包
│   ├── core/                         # 核心引擎
│   │   ├── src/
│   │   │   ├── timeline.ts           # 时间轴引擎
│   │   │   ├── composition.tsx       # 合成组件
│   │   │   ├── renderer.ts           # 渲染器基类
│   │   │   ├── adapters/             # 动画库适配器
│   │   │   │   ├── gsap.ts
│   │   │   │   ├── framer-motion.ts
│   │   │   │   ├── three.ts
│   │   │   │   └── lottie.ts
│   │   │   ├── utils/                # 工具函数
│   │   │   │   ├── interpolate.ts
│   │   │   │   ├── spring.ts
│   │   │   │   └── easing.ts
│   │   │   └── types/                # TypeScript 类型
│   │   │       ├── composition.ts
│   │   │       ├── scene.ts
│   │   │       └── layer.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                          # 命令行工具
│   │   ├── src/
│   │   │   ├── commands/             # CLI 命令
│   │   │   │   ├── init.ts           # 创建项目
│   │   │   │   ├── dev.ts            # 开发服务器
│   │   │   │   ├── render.ts         # 渲染视频
│   │   │   │   ├── add.ts            # 添加组件
│   │   │   │   ├── ai.ts             # AI 命令集
│   │   │   │   └── doctor.ts         # 诊断工具
│   │   │   ├── templates/            # 项目模板
│   │   │   │   ├── react/
│   │   │   │   ├── html/
│   │   │   │   └── typescript/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── renderer/                     # 渲染引擎
│   │   ├── src/
│   │   │   ├── headless/             # 无头渲染
│   │   │   │   ├── puppeteer-renderer.ts
│   │   │   │   ├── frame-buffer.ts
│   │   │   │   └── ffmpeg-wrapper.ts
│   │   │   ├── live/                 # 实时渲染
│   │   │   │   ├── dev-server.ts
│   │   │   │   ├── screen-recorder.ts
│   │   │   │   └── audio-sync.ts
│   │   │   ├── parallel/             # 并行渲染
│   │   │   │   ├── worker-pool.ts
│   │   │   │   ├── chunk-manager.ts
│   │   │   │   └── merge.ts
│   │   │   └── webcodecs/            # WebCodecs 加速
│   │   │       ├── encoder.ts
│   │   │       └── decoder.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── components/                   # 组件库
│   │   ├── src/
│   │   │   ├── data-viz/             # 数据可视化 (50+)
│   │   │   │   ├── charts/
│   │   │   │   │   ├── BarChart.tsx
│   │   │   │   │   ├── LineChart.tsx
│   │   │   │   │   ├── PieChart.tsx
│   │   │   │   │   ├── AreaChart.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── maps/
│   │   │   │   │   ├── WorldMap.tsx
│   │   │   │   │   ├── USMap.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── infographics/
│   │   │   │
│   │   │   ├── social/               # 社交媒体 (30+)
│   │   │   │   ├── overlays/
│   │   │   │   │   ├── InstagramFollow.tsx
│   │   │   │   │   ├── TikTokFollow.tsx
│   │   │   │   │   ├── YouTubeLike.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── captions/
│   │   │   │       ├── TikTokCaption.tsx
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── transitions/          # 转场效果 (60+)
│   │   │   │   ├── shaders/
│   │   │   │   │   ├── DomainWarp.tsx
│   │   │   │   │   ├── LightLeak.tsx
│   │   │   │   │   ├── Glitch.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── css/
│   │   │   │   └── 3d/
│   │   │   │
│   │   │   ├── ui-mockups/           # UI 组件 (40+)
│   │   │   │   ├── mobile/
│   │   │   │   │   ├── iPhone15Frame.tsx
│   │   │   │   │   ├── AndroidFrame.tsx
│   │   │   │   │   └── ...
│   │   │   │   ├── desktop/
│   │   │   │   │   ├── MacBookFrame.tsx
│   │   │   │   │   ├── BrowserFrame.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── devices/
│   │   │   │
│   │   │   ├── text/                 # 文本组件 (20+)
│   │   │   │   ├── AnimatedText.tsx
│   │   │   │   ├── TypewriterText.tsx
│   │   │   │   ├── KineticText.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── effects/              # 特效 (30+)
│   │   │   │   ├── ParticleSystem.tsx
│   │   │   │   ├── LiquidGlass.tsx
│   │   │   │   ├── NeonGlow.tsx
│   │   │   │   └── ...
│   │   │   │
│   │   │   └── ai-powered/           # AI 组件 (20+)
│   │   │       ├── AIAvatar.tsx
│   │   │       ├── AutoCaption.tsx
│   │   │       ├── LipSync.tsx
│   │   │       └── ...
│   │   │
│   │   ├── registry/                 # 组件注册表
│   │   │   ├── metadata.json
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── themes/                       # 主题系统
│   │   ├── src/
│   │   │   ├── presets/              # 预设主题 (50+)
│   │   │   │   ├── tech-minimal/
│   │   │   │   │   ├── theme.json
│   │   │   │   │   ├── tokens.css
│   │   │   │   │   └── preview.png
│   │   │   │   ├── corporate-blue/
│   │   │   │   ├── creative-bold/
│   │   │   │   ├── editorial-clean/
│   │   │   │   └── ...
│   │   │   ├── tokens/               # 设计 Token 系统
│   │   │   │   ├── colors.ts
│   │   │   │   ├── typography.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   └── motion.ts
│   │   │   ├── manager.ts            # 主题管理器
│   │   │   └── builder.ts            # 主题构建器
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── ai/                           # AI 集成
│   │   ├── src/
│   │   │   ├── code-generator/       # 代码生成
│   │   │   │   ├── claude.ts
│   │   │   │   ├── gpt.ts
│   │   │   │   └── prompt-templates/
│   │   │   ├── content-analyzer/     # 内容分析
│   │   │   │   ├── script-parser.ts
│   │   │   │   ├── structure-detector.ts
│   │   │   │   └── style-suggester.ts
│   │   │   ├── voice-synthesis/      # 语音合成
│   │   │   │   ├── elevenlabs.ts
│   │   │   │   ├── openai-tts.ts
│   │   │   │   ├── azure.ts
│   │   │   │   └── kokoro.ts
│   │   │   ├── smart-editor/         # 智能剪辑
│   │   │   │   ├── auto-cut.ts
│   │   │   │   ├── scene-detector.ts
│   │   │   │   └── music-sync.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── studio/                       # 可视化编辑器 (可选)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── TimelineEditor.tsx
│   │   │   │   ├── PropertyPanel.tsx
│   │   │   │   ├── ComponentLibrary.tsx
│   │   │   │   ├── PreviewWindow.tsx
│   │   │   │   └── LayersPanel.tsx
│   │   │   ├── stores/
│   │   │   │   ├── composition.ts
│   │   │   │   ├── selection.ts
│   │   │   │   └── history.ts
│   │   │   ├── hooks/
│   │   │   └── App.tsx
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── plugins/                      # 插件系统
│   │   ├── analytics/
│   │   ├── auto-captions/
│   │   ├── cloud-render/
│   │   └── ...
│   │
│   └── shared/                       # 共享工具
│       ├── src/
│       │   ├── constants.ts
│       │   ├── types.ts
│       │   └── utils.ts
│       └── package.json
│
├── examples/                         # 示例项目
│   ├── product-intro/
│   ├── data-report/
│   ├── social-video/
│   ├── tutorial/
│   └── presentation/
│
├── docs/                             # 文档
│   ├── guides/
│   │   ├── getting-started.md
│   │   ├── react-mode.md
│   │   ├── html-mode.md
│   │   ├── ai-features.md
│   │   └── advanced.md
│   ├── api/
│   │   ├── timeline.md
│   │   ├── composition.md
│   │   └── components.md
│   └── tutorials/
│       ├── first-video.md
│       ├── data-visualization.md
│       └── ai-generation.md
│
├── apps/                             # 应用
│   ├── website/                      # 官网
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   └── playground/                   # 在线 Playground
│       ├── src/
│       └── package.json
│
├── scripts/                          # 构建脚本
│   ├── build.sh
│   ├── release.sh
│   └── generate-docs.sh
│
├── .github/                          # GitHub 配置
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── docs.yml
│   └── ISSUE_TEMPLATE/
│
├── README.md                         # 主文档
├── ARCHITECTURE.md                   # 架构设计
├── CONTRIBUTING.md                   # 贡献指南
├── CHANGELOG.md                      # 更新日志
├── LICENSE                           # MIT 许可证
├── package.json                      # 根 package.json
├── pnpm-workspace.yaml               # pnpm workspace 配置
├── turbo.json                        # Turbo 配置
└── tsconfig.json                     # TypeScript 配置
```

---

## 核心包说明

### @seqvio/core
**核心引擎包** - 提供时间轴、合成管理、渲染基类

```json
{
  "name": "@seqvio/core",
  "version": "0.1.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./timeline": "./dist/timeline.js",
    "./composition": "./dist/composition.js",
    "./adapters/*": "./dist/adapters/*.js"
  }
}
```

### @seqvio/cli
**命令行工具** - 提供项目管理、开发、渲染等命令

```json
{
  "name": "@seqvio/cli",
  "version": "0.1.0",
  "bin": {
    "seqvio": "./dist/cli.js"
  }
}
```

### @seqvio/renderer
**渲染引擎** - 无头渲染、实时预览、并行渲染

### @seqvio/components
**组件库** - 200+ 预制组件，按类别组织

### @seqvio/themes
**主题系统** - 50+ 预设主题，设计 Token 系统

### @seqvio/ai
**AI 集成** - 代码生成、内容分析、语音合成、智能剪辑

### @seqvio/studio
**可视化编辑器** - 基于 Web 的图形化编辑器（可选）

---

## 技术栈

### 核心依赖
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "gsap": "^3.12.0",
    "three": "^0.160.0",
    "framer-motion": "^11.0.0",
    "lottie-web": "^5.12.0"
  }
}
```

### 渲染相关
```json
{
  "dependencies": {
    "puppeteer": "^22.0.0",
    "puppeteer-core": "^22.0.0",
    "chrome-aws-lambda": "^10.1.0",
    "fluent-ffmpeg": "^2.1.2",
    "ffmpeg-static": "^5.2.0"
  }
}
```

### AI 集成
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.0.0",
    "elevenlabs": "^0.8.0"
  }
}
```

### 开发工具
```json
{
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "turbo": "^1.12.0",
    "vitest": "^1.2.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
```

---

## 构建流程

### 开发模式
```bash
# 启动所有包的开发模式
pnpm dev

# 仅启动核心包
pnpm --filter @seqvio/core dev

# 启动 Studio
pnpm --filter @seqvio/studio dev
```

### 构建
```bash
# 构建所有包
pnpm build

# 按依赖顺序构建
turbo run build

# 构建特定包
pnpm --filter @seqvio/cli build
```

### 测试
```bash
# 运行所有测试
pnpm test

# 单元测试
pnpm test:unit

# E2E 测试
pnpm test:e2e
```

### 发布
```bash
# 创建 changeset
pnpm changeset

# 版本升级
pnpm version

# 发布到 npm
pnpm release
```

---

## 插件开发

### 插件结构
```typescript
// packages/plugins/my-plugin/src/index.ts
import { Plugin } from '@seqvio/core';

export default {
  name: '@seqvio/plugin-my-plugin',
  version: '1.0.0',

  hooks: {
    'before-render': async (composition) => {
      // 渲染前处理
    },
    'after-render': async (output) => {
      // 渲染后处理
    },
  },

  commands: {
    'my-command': async (args) => {
      // 自定义命令
    },
  },

  components: [
    // 自定义组件
  ],
} satisfies Plugin;
```

---

## 贡献指南

### 添加新组件
1. 在 `packages/components/src/` 下创建组件
2. 添加 TypeScript 类型定义
3. 在 `registry/metadata.json` 注册
4. 编写测试
5. 更新文档

### 添加新主题
1. 在 `packages/themes/src/presets/` 下创建主题目录
2. 创建 `theme.json` 配置文件
3. 创建 `tokens.css` 样式文件
4. 添加预览图 `preview.png`
5. 在主题管理器中注册

### 添加 AI 功能
1. 在 `packages/ai/src/` 下添加功能
2. 实现服务接口
3. 添加 CLI 命令
4. 编写文档和示例

---

## 路线图

### v0.1.0 - MVP (当前)
- [x] 核心时间轴引擎
- [x] React 组件 API
- [x] 基础渲染器
- [ ] 50 个基础组件
- [ ] CLI 工具

### v0.2.0 - 组件生态
- [ ] 150+ 组件
- [ ] HTML 模式
- [ ] 主题系统
- [ ] 组件注册表

### v0.3.0 - AI 集成
- [ ] AI 代码生成
- [ ] 内容分析
- [ ] TTS 集成
- [ ] 智能剪辑

### v0.4.0 - 可视化编辑器
- [ ] Studio UI
- [ ] 拖拽编辑
- [ ] 实时预览
- [ ] 协作功能

### v1.0.0 - 生产就绪
- [ ] 性能优化
- [ ] 完整测试覆盖
- [ ] 详细文档
- [ ] 社区生态

---

这个项目结构为 Seqvio 提供了：

1. ✅ **清晰的模块化** - 每个包职责单一
2. ✅ **可扩展性** - 插件系统支持第三方扩展
3. ✅ **完整的工具链** - 从开发到发布的全流程
4. ✅ **良好的文档** - 每个包都有独立文档
5. ✅ **现代化工程** - TypeScript + Turbo + pnpm

**开始贡献：** [CONTRIBUTING.md](./CONTRIBUTING.md)
