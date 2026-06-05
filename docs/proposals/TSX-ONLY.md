# Seqvio - TSX Only 设计

> Proposal note
>
> This document captures a product direction discussion and includes aspirational CLI and AI workflows.
> For the current implementation, use `README.md`, `QUICKSTART-TSX.md`, and `docs/COMPOSITION-AUTHORING.md`.

**最简化版本：只用一种文件格式**

---

## 核心设计

```
📝 只用 .tsx           🎨 AI 自动生成           🎬 一键输出
     ↓                      ↓                      ↓
   React                智能编写              MP4/Web/GIF
     ↓                      ↓                      ↓
   统一                  零决策                 完美输出
```

---

## 为什么只用 .tsx？

### 1. **最大统一性**

```
之前：3 种格式 (.tsx / .html / .json)
问题：AI 需要决策"什么时候用哪个？"

现在：1 种格式 (.tsx)
优势：AI 无需决策，直接生成
```

### 2. **AI 视角无差异**

```typescript
// AI 生成简单场景（3 行）
export default () => <h1>Hello</h1>;

// AI 生成复杂场景（30 行）
export default () => {
  const frame = useCurrentFrame();
  return <Animation frame={frame} />;
};

// 对 AI 来说，两者几乎一样简单
```

### 3. **无缝扩展**

```typescript
// 第一版：简单
export default () => <h1>Title</h1>;

// 第二版：加动画（无需改格式）
export default () => {
  const frame = useCurrentFrame();
  return <h1 style={{ opacity: frame / 30 }}>Title</h1>;
};

// 第三版：加交互（继续扩展）
export default () => {
  const [state, setState] = useState(0);
  return <h1 onClick={() => setState(s => s + 1)}>{state}</h1>;
};

// 如果用 .html 开始，任何扩展都需要切换格式
```

### 4. **最大灵活性**

```typescript
// .tsx 可以做一切：

// 静态内容（之前用 .html）
export default () => <div><h1>Hello</h1></div>;

// 预制组件（之前用 .json）
import { DataChart } from '@seqvio/components';
export default () => <DataChart data={[...]} />;

// 复杂逻辑（只能用 .tsx）
export default () => {
  const frame = useCurrentFrame();
  const data = computeData(frame);
  return <CustomVisualization data={data} />;
};
```

---

## 项目结构

```
my-video/
├── scenes/
│   ├── 01-intro.tsx          # 简单标题
│   ├── 02-features.tsx       # 功能列表
│   ├── 03-chart.tsx          # 数据图表
│   ├── 04-animation.tsx      # 复杂动画
│   └── 05-outro.tsx          # 结尾
├── components/               # 自定义组件
│   └── CustomChart.tsx
├── public/                   # 静态资源
│   ├── logo.png
│   └── demo.mp4
└── seqvio.config.ts            # 配置文件
```

**全部都是 .tsx！**

---

## 使用方式

### 方式 1：AI 生成（最快）

```bash
# 创建项目
seqvio init my-video && cd my-video

# AI 生成所有场景
seqvio ai add "Logo with fade-in animation"
# → 生成 scenes/01-logo.tsx

seqvio ai add "Show Q1-Q4 revenue bar chart"
# → 生成 scenes/02-chart.tsx

seqvio ai add "Feature list with 3 items"
# → 生成 scenes/03-features.tsx

seqvio ai add "Call to action button"
# → 生成 scenes/04-cta.tsx

# 预览
seqvio dev

# 渲染
seqvio render
```

### 方式 2：手写（如果需要）

```bash
# 创建项目
seqvio init my-video && cd my-video

# 手写场景
cat > scenes/01-intro.tsx << 'EOF'
export default function Intro() {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%'
    }}>
      <h1>Welcome to My Product</h1>
    </div>
  );
}

export const meta = { duration: 90 };
EOF

# 运行
seqvio dev
seqvio render
```

### 方式 3：批量生成

```bash
# 从描述列表批量生成
seqvio ai generate \
  "Intro: company logo with fade-in" \
  "Features: list 3 key benefits" \
  "Demo: product walkthrough" \
  "Data: show growth chart" \
  "CTA: signup button"

# → 生成 5 个 .tsx 文件
# scenes/01-intro.tsx
# scenes/02-features.tsx
# scenes/03-demo.tsx
# scenes/04-data.tsx
# scenes/05-cta.tsx

seqvio dev
```

---

## 场景示例

### 1. 简单标题（最简单）

```tsx
// scenes/01-title.tsx
export default function Title() {
  return <h1>Hello World</h1>;
}

export const meta = { duration: 90 };
```

### 2. 带样式的内容

```tsx
// scenes/02-styled.tsx
export default function Styled() {
  return (
    <div style={{
      background: 'linear-gradient(45deg, #667eea, #764ba2)',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '48px',
      fontWeight: 'bold'
    }}>
      Beautiful Design
    </div>
  );
}

export const meta = { duration: 120 };
```

### 3. 使用预制组件

```tsx
// scenes/03-chart.tsx
import { DataChart } from '@seqvio/components';

export default function Chart() {
  return (
    <DataChart
      data={[
        { quarter: 'Q1', revenue: 120000 },
        { quarter: 'Q2', revenue: 145000 },
        { quarter: 'Q3', revenue: 160000 },
        { quarter: 'Q4', revenue: 180000 }
      ]}
      chartType="bar"
      title="Quarterly Revenue"
    />
  );
}

export const meta = { duration: 150 };
```

### 4. 帧精确动画

```tsx
// scenes/04-animation.tsx
import { useCurrentFrame, interpolate } from '@seqvio/core';

export default function Animation() {
  const frame = useCurrentFrame();
  
  // 淡入效果
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  
  // 缩放效果
  const scale = interpolate(frame, [0, 30], [0.8, 1]);
  
  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      transition: 'all 0.3s ease'
    }}>
      <h1>Animated Title</h1>
    </div>
  );
}

export const meta = { duration: 120 };
```

### 5. 复杂交互逻辑

```tsx
// scenes/05-complex.tsx
import { useCurrentFrame, spring } from '@seqvio/core';
import { useState, useEffect } from 'react';

export default function Complex() {
  const frame = useCurrentFrame();
  const [data, setData] = useState([]);
  
  // 根据帧数更新数据
  useEffect(() => {
    const progress = frame / 120;
    setData(generateData(progress));
  }, [frame]);
  
  // 弹性动画
  const scale = spring({
    frame,
    from: 0,
    to: 1,
    config: { stiffness: 100, damping: 10 }
  });
  
  return (
    <div style={{ transform: `scale(${scale})` }}>
      <CustomVisualization data={data} />
    </div>
  );
}

export const meta = { duration: 240 };
```

---

## AI 生成流程

### AI 的思维模式（简化版）

```typescript
// AI 只需要做一件事：生成 React 组件
function generateScene(description: string): string {
  const analysis = analyzeDescription(description);
  
  // 简单场景
  if (analysis.isSimple) {
    return `
      export default () => (
        <div>${generateSimpleHTML(description)}</div>
      );
      export const meta = { duration: 90 };
    `;
  }
  
  // 需要动画
  if (analysis.needsAnimation) {
    return `
      import { useCurrentFrame, interpolate } from '@seqvio/core';
      
      export default () => {
        const frame = useCurrentFrame();
        ${generateAnimationLogic(analysis)}
        return <div>${generateAnimatedContent()}</div>;
      };
      export const meta = { duration: ${analysis.estimatedDuration} };
    `;
  }
  
  // 使用预制组件
  if (analysis.canUsePrebuiltComponent) {
    const component = findBestComponent(analysis);
    return `
      import { ${component.name} } from '@seqvio/components';
      
      export default () => (
        <${component.name}
          ${generateProps(analysis)}
        />
      );
      export const meta = { duration: ${analysis.estimatedDuration} };
    `;
  }
  
  // 复杂自定义逻辑
  return `
    import { useCurrentFrame } from '@seqvio/core';
    import { useState } from 'react';
    
    export default () => {
      const frame = useCurrentFrame();
      ${generateComplexLogic(analysis)}
      return ${generateComplexContent()};
    };
    export const meta = { duration: ${analysis.estimatedDuration} };
  `;
}
```

**关键：AI 总是生成 .tsx，无需决策格式！**

---

## 命令参考

### 项目管理

```bash
seqvio init <name>              # 创建项目
seqvio dev                      # 开发服务器
seqvio build                    # 构建项目
seqvio render                   # 渲染视频
```

### AI 场景生成

```bash
# 单个场景
seqvio ai add "描述"
# → 生成一个 .tsx 文件

# 批量生成
seqvio ai generate \
  "场景1描述" \
  "场景2描述" \
  "场景3描述"
# → 生成多个 .tsx 文件

# 从文本文件生成
seqvio ai generate --from script.txt
# → 分析文本，生成多个 .tsx 文件

# 交互式生成
seqvio ai generate
? How many scenes? 3
? Scene 1: Logo reveal
? Scene 2: Feature showcase
? Scene 3: Call to action
# → 生成 3 个 .tsx 文件
```

### 组件管理

```bash
seqvio search <query>           # 搜索预制组件
seqvio add <component>          # 安装组件（供 import 使用）
seqvio list                     # 列出已安装组件
```

---

## 完整案例

### 案例 1：产品介绍视频（2 分钟完成）

```bash
seqvio init product-intro && cd product-intro

# AI 生成所有场景
seqvio ai generate \
  "Logo reveal with fade-in and scale animation" \
  "Product demo video in MacBook Pro frame with 3D rotation" \
  "Feature list showing 3 key benefits with staggered reveal" \
  "Call to action with animated button and contact info"

# → 生成 4 个 .tsx 文件

# 预览
seqvio dev

# 渲染
seqvio render --output product-intro.mp4

# 完成！
```

### 案例 2：数据报告视频（5 分钟完成）

```bash
seqvio init data-report && cd data-report

# 手写标题（最快）
cat > scenes/01-title.tsx << 'EOF'
export default () => <h1>Q4 Sales Report</h1>;
export const meta = { duration: 60 };
EOF

# AI 生成图表
seqvio ai add "Bar chart showing Q1-Q4 sales: Jan 120K, Feb 145K, Mar 180K"
# → scenes/02-chart.tsx

# AI 生成总结
seqvio ai add "Text slide with 3 key insights and next steps"
# → scenes/03-insights.tsx

# 完成
seqvio dev && seqvio render
```

### 案例 3：教学视频（使用所有功能）

```bash
seqvio init tutorial && cd tutorial

# 场景 1: 简单标题
cat > scenes/01-intro.tsx << 'EOF'
export default () => (
  <div style={{ textAlign: 'center', fontSize: '72px' }}>
    <h1>React Hooks Tutorial</h1>
  </div>
);
export const meta = { duration: 90 };
EOF

# 场景 2: AI 生成代码演示
seqvio ai add "Split screen showing code on left and result on right, demonstrating useState hook"
# → scenes/02-demo.tsx

# 场景 3: 手写交互式演示
cat > scenes/03-interactive.tsx << 'EOF'
import { useCurrentFrame } from '@seqvio/core';
import { useState } from 'react';

export default function Interactive() {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 60);
  
  const steps = [
    'Import useState',
    'Declare state variable',
    'Use state in JSX',
    'Update state on click'
  ];
  
  return (
    <div>
      <h2>Step {step + 1}</h2>
      <CodeEditor code={codeSteps[step]} />
      <Preview result={resultSteps[step]} />
    </div>
  );
}

export const meta = { duration: 240 };
EOF

# 场景 4: AI 生成总结
seqvio ai add "Summary slide with key takeaways and resources"
# → scenes/04-outro.tsx

# 完成
seqvio dev && seqvio render
```

---

## 对比总结

### 之前的设计（3 种格式）

```
格式：.tsx / .html / .json

AI 决策树：
if (简单静态) → .html
else if (纯数据) → .json
else → .tsx

问题：
- AI 需要判断"简单程度"
- 用户可能不理解"什么时候用哪个"
- 扩展可能需要切换格式
```

### 现在的设计（1 种格式）

```
格式：.tsx

AI 决策树：
→ .tsx

优势：
- ✅ AI 零决策
- ✅ 用户零困惑
- ✅ 无缝扩展
- ✅ 最大灵活性
```

---

## 技术优势

### 1. **统一的时间轴**

```tsx
// 所有场景使用相同的 API
import { useCurrentFrame, interpolate, spring } from '@seqvio/core';

export default () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return <div style={{ opacity }}>Content</div>;
};
```

### 2. **完整的 React 生态**

```tsx
// 可以使用任何 React 库
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Chart } from 'recharts';

export default () => (
  <div>
    <motion.div animate={{ x: 100 }} />
    <Canvas><mesh /></Canvas>
    <Chart data={data} />
  </div>
);
```

### 3. **TypeScript 类型安全**

```tsx
import { Scene, Meta } from '@seqvio/core';

export default function MyScene(): Scene {
  return <div>Type-safe content</div>;
}

export const meta: Meta = {
  duration: 120,
  fps: 30
};
```

### 4. **热重载开发**

```bash
seqvio dev
# → 修改 .tsx 文件，立即看到效果
```

---

## 核心价值

### Seqvio (TSX Only) 的价值主张

1. **最简单** - 只有 1 种文件格式
2. **最统一** - 所有场景相同处理方式
3. **最灵活** - React 可以做一切
4. **最强大** - 完整的 React + npm 生态
5. **AI 友好** - 零决策，直接生成

---

## 总结

### 为什么选择 TSX Only？

| 方面 | 多格式 | TSX Only |
|------|--------|----------|
| **格式数量** | 3-4 种 | 1 种 |
| **学习成本** | 需要理解各格式用途 | 只需学 React |
| **AI 决策** | 需要判断用哪个 | 无需判断 |
| **扩展性** | 可能需要换格式 | 无缝扩展 |
| **灵活性** | 各有限制 | 无限制 |
| **维护成本** | 多套系统 | 单一系统 |

**结论：TSX Only 是 AI 主导场景下的最佳选择**

---

## 最终理念

> **"一种格式，无限可能，AI 自动生成"**

- 简单场景 → 简单的 .tsx（3 行）
- 复杂场景 → 复杂的 .tsx（30 行）
- 预制组件 → import 后使用
- 需要帮助 → seqvio ai add "描述"

**框架处理一切细节，你只需专注内容！**

---

## 立即开始

```bash
# 安装
npm install -g unified-video

# 创建项目
seqvio init my-video && cd my-video

# AI 生成内容
seqvio ai add "Your scene description"

# 开发
seqvio dev

# 渲染
seqvio render
```

**就是这么简单！**
