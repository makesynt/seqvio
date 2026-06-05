# Seqvio 统一模式设计

> Proposal note
>
> This document describes a broader multi-mode product concept. It is not the active implementation contract for this repository.
> Current Seqvio usage is TSX-first and documented in `docs/COMPOSITION-AUTHORING.md`.

**理念：你只需要创作内容，框架自动选择最佳方式**

---

## 问题分析

### ❌ 原设计的问题

```bash
# 用户需要选择模式
seqvio init --template react      # React 模式
seqvio init --template html       # HTML 模式
seqvio init --template json       # JSON 模式

# 问题：
1. 用户需要提前决定用哪种模式
2. 增加学习成本
3. 不同模式之间不能混用
```

### ✅ 新设计目标

**一个统一的创作环境，支持所有输入方式，框架自动识别和处理**

---

## 统一模式：文件系统约定

### 核心理念

> **类似 Next.js 的文件系统路由 - 你只需要放对地方，框架自动处理**

```
my-video/
├── scenes/                 # 场景目录（核心）
│   ├── 01-intro.tsx       # React 组件 ✅
│   ├── 02-data.html       # HTML 模板 ✅
│   ├── 03-chart.json      # JSON 配置 ✅
│   └── 04-outro.tsx       # 又是 React ✅
├── assets/                # 资源文件
├── audio/                 # 音频文件（可选）
└── seqvio.config.ts          # 配置（可选）
```

**只有 3 种文件类型：.tsx / .html / .json**

**关键特性：**
- ✅ **混合使用** - 一个视频里既可以有 React 也可以有 HTML
- ✅ **自动识别** - 框架根据文件扩展名自动选择处理方式
- ✅ **按需加载** - 只有用到的功能才会加载
- ✅ **零配置** - 大部分情况不需要配置文件

---

## 使用方式

### 步骤 1: 创建项目（零选择）

```bash
seqvio init my-video
cd my-video
```

生成的最小项目：
```
my-video/
├── index.html     # 空白画布
└── scenes/        # 空目录
```

### 步骤 2: 添加场景（用你喜欢的方式）

#### 方式 A: 用 React（直接创建 .tsx）

```bash
# 无需任何配置，直接创建文件
touch scenes/01-intro.tsx
```

```tsx
// scenes/01-intro.tsx
export default function Intro() {
  return (
    <div className="scene">
      <h1>Hello Seqvio</h1>
    </div>
  );
}

// 元数据（可选）
export const meta = {
  duration: 90,  // 90 帧（3秒 @ 30fps）
};
```

#### 方式 B: 用 HTML（直接创建 .html）

```bash
touch scenes/02-features.html
```

```html
<!-- scenes/02-features.html -->
<div class="scene" data-duration="120">
  <h2>Key Features</h2>
  <ul>
    <li>Easy to use</li>
    <li>Powerful</li>
  </ul>
</div>
```

#### 方式 C: 用 JSON（直接创建 .json）

```bash
touch scenes/03-chart.json
```

```json
{
  "type": "data-chart",
  "duration": 150,
  "props": {
    "data": [
      { "name": "Jan", "value": 400 },
      { "name": "Feb", "value": 300 }
    ],
    "chartType": "bar"
  }
}
```

#### 方式 D: 用 AI（直接命令）

```bash
# 直接描述你想要的
seqvio ai add "Show logo with fade-in animation"
# ✅ 自动生成 scenes/01-logo.json 或 .tsx

# 批量生成
seqvio ai generate \
  "Intro: logo animation" \
  "Features: list 3 points" \
  "CTA: signup button"
# ✅ 自动生成 3 个场景文件

# 从现有文本
seqvio ai generate --from article.txt
# ✅ 分析内容，生成多个场景
```

**无需创建额外的文件，直接命令行搞定！**

---

## 框架自动处理

### 自动场景排序

```
scenes/
├── 01-intro.tsx      # 第一个场景
├── 02-features.html  # 第二个场景
├── 03-chart.json     # 第三个场景
└── 04-outro.tsx      # 第四个场景
```

框架按文件名数字前缀自动排序。

### 自动类型识别

```typescript
// 框架内部逻辑
function loadScene(filePath: string) {
  if (filePath.endsWith('.tsx')) {
    return loadReactComponent(filePath);
  }
  if (filePath.endsWith('.html')) {
    return loadHTMLTemplate(filePath);
  }
  if (filePath.endsWith('.json')) {
    return loadJSONConfig(filePath);
  }
}
```

### 自动依赖处理

```tsx
// scenes/01-intro.tsx
import { motion } from 'framer-motion';  // ✅ 自动安装
import Chart from 'recharts';            // ✅ 自动安装

export default function Intro() {
  return <motion.div>...</motion.div>;
}
```

框架检测到导入，自动：
1. 检查是否已安装
2. 如未安装，询问是否安装
3. 自动配置适配器（如 Framer Motion）

---

## 智能入口文件

### index.html（自动生成，可自定义）

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Video</title>
</head>
<body>
  <!-- Seqvio 会自动注入所有场景 -->
  <div id="seqvio-root"></div>
  
  <!-- 可选：全局样式 -->
  <style>
    /* 你的全局 CSS */
  </style>
</body>
</html>
```

如果你不创建这个文件，框架会自动生成。

---

## 渐进式配置

### 零配置（推荐）

```bash
# 直接开发
seqvio dev

# 直接渲染
seqvio render
```

框架使用智能默认值：
- 分辨率：1920×1080
- 帧率：30fps
- 时长：自动计算（所有场景时长相加）
- 主题：tech-minimal

### 最小配置

```typescript
// seqvio.config.ts（可选）
export default {
  width: 1920,
  height: 1080,
  fps: 30,
  theme: 'corporate-blue',
};
```

### 完整配置（高级用户）

```typescript
// seqvio.config.ts
export default {
  // 基础配置
  width: 1920,
  height: 1080,
  fps: 30,
  
  // 场景配置
  scenes: {
    order: 'auto',  // 'auto' | 'manual'
    transitions: {
      default: 'fade',
      duration: 15,  // 帧数
    },
  },
  
  // 主题
  theme: 'tech-minimal',
  
  // 渲染配置
  rendering: {
    concurrency: 4,
    quality: 'high',
  },
  
  // AI 配置
  ai: {
    provider: 'anthropic',
    autoGenerate: true,
  },
};
```

---

## 智能命令

### 开发命令（自动检测）

```bash
seqvio dev
```

自动做的事情：
1. ✅ 检测 scenes/ 目录下的所有文件
2. ✅ 识别每个文件类型
3. ✅ 安装缺失的依赖
4. ✅ 配置适配器
5. ✅ 启动开发服务器
6. ✅ 打开浏览器预览

### 添加场景（交互式）

```bash
seqvio add scene
```

交互式引导：
```
? Scene name: features
? Which way do you prefer?
  > React Component (.tsx)     - Full power with React
    HTML Template (.html)      - Simple and direct
    JSON Config (.json)        - Use pre-built components
    Let AI generate            - Describe what you want
```

选择后自动创建对应文件和模板。

### AI 增强（自动理解）

```bash
# 从任何内容生成
seqvio ai enhance

# 框架自动：
# 1. 检测 script.md 是否存在 → 解析
# 2. 检测现有场景 → 分析内容
# 3. 生成建议 → 询问是否应用
```

---

## 实际工作流

### 场景 1: 快速原型（纯 HTML）

```bash
seqvio init quick-demo
cd quick-demo

# 创建几个简单的 HTML 场景
cat > scenes/01-title.html << 'EOF'
<div data-duration="60">
  <h1 style="font-size: 5rem; text-align: center;">
    My Product
  </h1>
</div>
EOF

cat > scenes/02-feature.html << 'EOF'
<div data-duration="90">
  <ul style="font-size: 2rem;">
    <li>Fast</li>
    <li>Secure</li>
    <li>Beautiful</li>
  </ul>
</div>
EOF

# 预览
seqvio dev

# 渲染
seqvio render
```

**无需任何配置，无需选择模式！**

### 场景 2: React 专家（纯 React）

```bash
seqvio init react-video
cd react-video

# 创建 React 组件
cat > scenes/01-intro.tsx << 'EOF'
import { motion } from 'framer-motion';

export default function Intro() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <h1>Hello React Video</h1>
    </motion.div>
  );
}

export const meta = { duration: 90 };
EOF

# 开发（自动安装 framer-motion + 适配）
seqvio dev

# 渲染
seqvio render
```

**框架自动处理一切！**

### 场景 3: 混合模式（最灵活）

```bash
seqvio init mixed-video
cd mixed-video

# 第一个场景：用预制组件（JSON）
cat > scenes/01-logo.json << 'EOF'
{
  "type": "logo-reveal",
  "duration": 90,
  "props": {
    "src": "/logo.svg",
    "animation": "fade-scale-in"
  }
}
EOF

# 第二个场景：用 React（自定义）
cat > scenes/02-features.tsx << 'EOF'
export default function Features() {
  return (
    <div>
      <h2>Amazing Features</h2>
      {/* 自定义逻辑 */}
    </div>
  );
}
export const meta = { duration: 120 };
EOF

# 第三个场景：用 HTML（简单）
cat > scenes/03-cta.html << 'EOF'
<div data-duration="60">
  <button>Get Started</button>
</div>
EOF

# 开发 - 框架自动处理三种不同格式
seqvio dev
```

**不需要选择模式，直接混用！**

### 场景 4: AI 驱动（最简单）

```bash
seqvio init ai-video
cd ai-video

# 只写一个脚本
cat > script.md << 'EOF'
# Product Demo Video

## Scene 1: Logo Animation
Show our logo with a smooth fade-in and scale animation.

## Scene 2: Key Features
Display three features:
- Lightning fast performance
- Military-grade security
- Beautiful user interface

## Scene 3: Call to Action
Large button saying "Start Free Trial"
EOF

# AI 自动生成所有场景
seqvio ai generate

# 生成结果：
# scenes/01-logo.json
# scenes/02-features.tsx
# scenes/03-cta.html

# 预览和调整
seqvio dev

# 满意后渲染
seqvio render
```

**框架根据内容自动选择最佳实现方式！**

---

## 智能类型推导

### TypeScript 自动补全

```tsx
// scenes/my-scene.tsx
import { Scene } from 'unified-video/auto';
//                              ^^^^^ 自动导入所需类型

export default function MyScene() {
  // 框架自动提供所有可用组件的类型
  return <Logo src="..." />;
  //      ^^^^ TypeScript 自动补全
}
```

### 配置智能提示

```typescript
// seqvio.config.ts
export default {
  width: 1920,  // 鼠标悬停显示：Video width in pixels (default: 1920)
  theme: 'te',  // 输入时自动补全所有可用主题
  //      ^ 显示：tech-minimal, tech-bold, tech-clean...
};
```

---

## 框架内部实现

### 自动加载器

```typescript
class SceneLoader {
  async loadAllScenes(sceneDir: string): Promise<Scene[]> {
    const files = await fs.readdir(sceneDir);
    const scenes = await Promise.all(
      files
        .filter(f => /\.(tsx?|html|json)$/.test(f))
        .sort() // 按文件名排序
        .map(file => this.loadScene(path.join(sceneDir, file)))
    );
    return scenes;
  }
  
  async loadScene(filePath: string): Promise<Scene> {
    const ext = path.extname(filePath);
    
    switch (ext) {
      case '.tsx':
      case '.ts':
        return this.loadReactScene(filePath);
      case '.html':
        return this.loadHTMLScene(filePath);
      case '.json':
        return this.loadJSONScene(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
  
  private async loadReactScene(filePath: string): Promise<Scene> {
    // 1. 动态导入 React 组件
    const module = await import(filePath);
    const Component = module.default;
    const meta = module.meta || {};
    
    // 2. 检测组件导入的依赖
    const dependencies = this.detectDependencies(filePath);
    
    // 3. 自动安装和配置适配器
    await this.setupAdapters(dependencies);
    
    // 4. 返回场景
    return {
      id: path.basename(filePath, '.tsx'),
      component: Component,
      duration: meta.duration || 90,
      type: 'react',
    };
  }
  
  private detectDependencies(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = content.match(/import .+ from ['"](.+)['"]/g) || [];
    return imports.map(imp => {
      const match = imp.match(/from ['"](.+)['"]/);
      return match ? match[1] : '';
    }).filter(imp => !imp.startsWith('.'));
  }
  
  private async setupAdapters(dependencies: string[]): Promise<void> {
    const adapterMap = {
      'framer-motion': FramerMotionAdapter,
      'gsap': GSAPAdapter,
      'three': ThreeAdapter,
      'lottie-web': LottieAdapter,
    };
    
    for (const dep of dependencies) {
      if (adapterMap[dep]) {
        const Adapter = adapterMap[dep];
        await new Adapter().initialize();
      }
    }
  }
}
```

---

## 对比：之前 vs 现在

### ❌ 之前（多模式，需要选择）

```bash
# 用户需要决定
seqvio init my-video --template react    # 选择 React 模式
seqvio init my-video --template html     # 或选择 HTML 模式
seqvio init my-video --template json     # 或选择 JSON 模式

# 问题：
1. 不知道该选哪个
2. 选错了难以更改
3. 不能混用
```

### ✅ 现在（统一模式，自动识别）

```bash
# 用户无需选择
seqvio init my-video

# 然后随意创建：
touch scenes/01-intro.tsx        # React
touch scenes/02-chart.json       # JSON
touch scenes/03-outro.html       # HTML

# 框架自动处理所有格式
seqvio dev
```

---

## 优势总结

### 1. **零学习成本**
- 不需要学习"有哪些模式"
- 不需要决策"用哪种模式"
- 直接用你熟悉的方式写

### 2. **最大灵活性**
- 可以混用所有格式
- 随时切换实现方式
- 不被任何模式锁定

### 3. **渐进式增强**
- 简单场景：写个 HTML 就行
- 复杂场景：用 React 全功能
- 自动化场景：让 AI 生成

### 4. **智能辅助**
- 自动安装依赖
- 自动配置适配器
- 自动排序场景
- 自动推导类型

---

## 总结

### 设计哲学

> **"约定优于配置，自动优于手动"**

用户不应该被迫选择"模式"，而应该：
1. 用最自然的方式表达创意
2. 框架自动理解和处理
3. 需要时才提供配置选项

### 核心原则

1. **文件系统约定** - 放对地方就行
2. **自动类型识别** - 框架自己判断
3. **智能依赖管理** - 需要什么装什么
4. **渐进式配置** - 大部分情况零配置

### 使用体验

```bash
# 创建项目
seqvio init my-video && cd my-video

# 添加内容（用你喜欢的方式）
touch scenes/01-intro.tsx     # 或 .html, .json

# 开发
seqvio dev

# 渲染
seqvio render

# 就这么简单！
```

**没有模式选择，没有复杂配置，只有纯粹的创作。**

---

这样的设计是不是更好？用户完全不需要关心"模式"的概念，只需要用自己舒服的方式创作内容！
