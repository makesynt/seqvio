# Seqvio 简化模式

> Proposal note
>
> This file is a design proposal for a simplified future workflow. Commands such as `seqvio ai ...`, `seqvio init`, and `seqvio dev` described here are not the active repo interface unless implemented in current source.

**真正的统一：只有三种文件类型**

---

## ❌ 问题：之前的设计还是太复杂

```
.tsx   - React 组件
.html  - HTML 模板
.json  - JSON 配置
.md    - Markdown 脚本  ← 这是什么？为什么需要？
```

**问题：**
1. 用户还是要学习 4 种格式
2. .md 的作用不够直观
3. 增加了认知负担

---

## ✅ 简化后：只有三种文件

```
my-video/
└── scenes/
    ├── 01-intro.tsx      # 写 React（复杂交互）
    ├── 02-features.html  # 写 HTML（简单内容）
    └── 03-chart.json     # 用组件（预制功能）
```

**就这么简单！**

---

## 三种文件类型

### 1. `.tsx` - 写 React

**什么时候用：**
- 需要复杂逻辑
- 需要状态管理
- 需要 npm 包
- 熟悉 React

```tsx
// scenes/01-intro.tsx
export default function Intro() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}

export const meta = { duration: 90 };
```

### 2. `.html` - 写 HTML

**什么时候用：**
- 静态内容
- 简单布局
- 快速原型
- 不熟悉 React

```html
<!-- scenes/02-features.html -->
<div data-duration="120">
  <h2>Key Features</h2>
  <ul>
    <li>Fast</li>
    <li>Powerful</li>
    <li>Open Source</li>
  </ul>
</div>
```

### 3. `.json` - 用组件

**什么时候用：**
- 使用预制组件
- 数据驱动
- 不想写代码

```json
// scenes/03-chart.json
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

---

## AI 功能：通过命令，不是文件

### ❌ 之前的设计（复杂）

```bash
# 需要创建 .md 文件
cat > script.md << 'EOF'
## Scene 1: Intro
Show logo...
EOF

# 然后运行命令
seqvio ai generate script.md

# 问题：多了一个文件格式要学习
```

### ✅ 现在的设计（简单）

```bash
# 方式 1: 直接描述（最快）
seqvio ai add "Show logo with fade-in animation"
# ✅ 自动生成 scenes/01-logo.json 或 .tsx

# 方式 2: 交互式
seqvio ai add
? Describe the scene: Show our product features
? Duration: 5 seconds
? Style: minimal
# ✅ 自动生成最合适的文件

# 方式 3: 批量生成
seqvio ai generate \
  "Intro: logo animation" \
  "Features: list 3 points" \
  "CTA: signup button"
# ✅ 生成 3 个场景文件

# 方式 4: 从现有内容
seqvio ai generate --from article.txt
# ✅ 分析文本，生成多个场景
```

**无需 .md 文件！**

---

## 完整工作流

### 场景 1: 纯手写

```bash
# 1. 创建项目
seqvio init my-video && cd my-video

# 2. 手写场景（用你喜欢的方式）
cat > scenes/01-title.html << 'EOF'
<h1>My Product</h1>
EOF

cat > scenes/02-demo.tsx << 'EOF'
export default function Demo() {
  return <video src="/demo.mp4" />;
}
export const meta = { duration: 300 };
EOF

# 3. 开发
seqvio dev

# 4. 渲染
seqvio render
```

### 场景 2: AI 辅助

```bash
# 1. 创建项目
seqvio init my-video && cd my-video

# 2. 让 AI 生成场景
seqvio ai add "Product intro with logo"
seqvio ai add "Show 3 key features"
seqvio ai add "Call to action button"

# 3. 预览
seqvio dev

# 4. 如果不满意，直接编辑生成的文件
vim scenes/01-intro.json  # 或 .tsx, .html

# 5. 渲染
seqvio render
```

### 场景 3: 混合模式

```bash
# 1. 创建项目
seqvio init my-video && cd my-video

# 2. AI 生成一些基础场景
seqvio ai add "Logo animation"
# → 生成 scenes/01-logo.json

# 3. 手写复杂场景
cat > scenes/02-interactive.tsx << 'EOF'
export default function Interactive() {
  // 自定义复杂逻辑
}
EOF

# 4. 简单场景用 HTML
cat > scenes/03-thanks.html << 'EOF'
<h2>Thanks for watching!</h2>
EOF

# 5. 完成
seqvio dev && seqvio render
```

---

## AI 命令详解

### `seqvio ai add` - 添加场景

```bash
# 基础用法
seqvio ai add "描述"

# 示例
seqvio ai add "Show company logo with fade-in"
seqvio ai add "Display revenue chart for Q1-Q4"
seqvio ai add "3D product rotation"

# AI 自动决定：
# - 简单的 → 生成 .html
# - 需要数据可视化 → 生成 .json (使用预制组件)
# - 复杂的 → 生成 .tsx
```

### `seqvio ai generate` - 批量生成

```bash
# 从文本文件
seqvio ai generate --from article.txt

# 从描述列表
seqvio ai generate \
  "Scene 1: intro" \
  "Scene 2: demo" \
  "Scene 3: outro"

# 交互式
seqvio ai generate
? How many scenes? 3
? Scene 1: Logo reveal
? Scene 2: Feature showcase
? Scene 3: Call to action
```

### `seqvio ai enhance` - 增强现有场景

```bash
# 优化所有场景
seqvio ai enhance

# AI 会：
# 1. 分析现有场景
# 2. 建议改进（动画、布局、配色）
# 3. 询问是否应用
```

### `seqvio ai voice` - 生成配音

```bash
# 为所有场景生成旁白
seqvio ai voice

# AI 会：
# 1. 分析场景内容
# 2. 生成旁白文本
# 3. 合成音频
# 4. 自动同步
```

---

## 为什么不需要 .md 文件？

### 理由 1: 增加复杂度

```
3 种格式：.tsx / .html / .json  ← 清晰
4 种格式：.tsx / .html / .json / .md  ← 混乱
```

### 理由 2: .md 只是中间产物

```
用户写 .md → AI 解析 → 生成 .tsx/.html/.json

简化后：
用户描述 → AI 直接生成 .tsx/.html/.json
```

### 理由 3: AI 应该是工具，不是格式

```
❌ 错误理解：.md 是一种"AI 模式"
✅ 正确理解：AI 是帮你生成任何格式的工具
```

### 理由 4: 用户不关心中间过程

```
用户想要：一个视频
不关心：AI 是怎么生成的

直接：seqvio ai add "logo animation"
不需要：创建 .md → 写脚本 → 运行命令
```

---

## 简化后的学习曲线

### ✅ 现在（3 种格式）

```
新手：我要做个视频
框架：用这三种文件之一：
     - .html 最简单
     - .tsx 最强大
     - .json 最快速
新手：明白了！（5 秒理解）

需要 AI：
新手：我不知道怎么写
框架：seqvio ai add "你想要什么"
新手：太简单了！
```

### ❌ 之前（4 种格式）

```
新手：我要做个视频
框架：用这四种文件之一：
     - .html
     - .tsx
     - .json
     - .md (这是什么？)
新手：.md 是干嘛的？
框架：给 AI 看的脚本
新手：那我什么时候用 .md？
框架：想让 AI 生成的时候
新手：？？？（困惑）
```

---

## 完整命令列表

### 项目管理

```bash
seqvio init <name>          # 创建项目
seqvio dev                  # 开发模式
seqvio build                # 构建
seqvio render               # 渲染视频
```

### 场景管理

```bash
# 手动创建（直接创建文件）
touch scenes/01-intro.tsx
touch scenes/02-demo.html
touch scenes/03-chart.json

# AI 创建
seqvio ai add "描述"
seqvio ai generate --from file.txt
```

### AI 功能

```bash
seqvio ai add "描述"        # 添加单个场景
seqvio ai generate         # 批量生成
seqvio ai enhance          # 优化现有场景
seqvio ai voice            # 生成配音
```

### 组件管理

```bash
seqvio search chart        # 搜索预制组件
seqvio add data-chart      # 安装组件（供 .json 使用）
seqvio list                # 列出已安装组件
```

---

## 对比总结

| 方面 | 4种格式（.md） | 3种格式（简化） |
|------|---------------|----------------|
| **学习成本** | 需要理解 .md 用途 | 只需理解 3 种文件 |
| **创建方式** | 需要写 .md 文件 | 直接命令或文件 |
| **AI 使用** | 创建 .md → 运行命令 | 直接运行命令 |
| **认知负担** | ⭐⭐⭐ | ⭐ |
| **灵活性** | 一般 | 更高 |

---

## 最终设计

### 文件类型（3 种）

```
.tsx   → React 组件（复杂）
.html  → HTML 模板（简单）
.json  → 预制组件（快速）
```

### AI 功能（命令）

```bash
seqvio ai add "描述"       # 生成场景
seqvio ai generate        # 批量生成
seqvio ai enhance         # 优化场景
seqvio ai voice           # 配音
```

### 完整示例

```bash
# 创建项目
seqvio init demo && cd demo

# 方式 1: 手写
echo "<h1>Hello</h1>" > scenes/01-intro.html

# 方式 2: AI
seqvio ai add "Product showcase"

# 方式 3: 混合
seqvio ai add "Logo"
echo "export default () => <div>Custom</div>" > scenes/03-custom.tsx

# 开发和渲染
seqvio dev
seqvio render
```

**简单、清晰、直观！**

---

## 总结

### 去掉 .md 的原因

1. **减少复杂度** - 从 4 种格式降到 3 种
2. **更加直观** - AI 通过命令使用，不是文件格式
3. **降低门槛** - 新手更容易理解
4. **保持灵活** - AI 功能更强大

### 最终理念

> **"三种文件，任意组合，AI 辅助"**

- 手写简单 → 用 .html
- 需要复杂 → 用 .tsx
- 用预制件 → 用 .json
- 需要帮助 → seqvio ai add

**就这么简单！**
