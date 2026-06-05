# 为什么选择统一模式？

> Rationale note
>
> This is a product-rationale document, not a source-of-truth usage guide. It explains why a broader unified mode was considered, but current repo usage remains the TSX-first workflow documented elsewhere.

**从多模式到统一模式的设计演进**

---

## 问题：多模式的困境

### 传统框架的问题

```
┌─────────────────────────────────────────────────────────┐
│  用户面临的选择困境                                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  "我应该用哪种模式？"                                      │
│                                                          │
│  React 模式 ←─┐                                          │
│  HTML 模式  ←─┼─ 需要提前决定，选错很难改                  │
│  JSON 模式  ←─┘                                          │
│                                                          │
│  问题：                                                   │
│  1. 增加学习成本                                          │
│  2. 选择焦虑                                             │
│  3. 不能混用                                             │
│  4. 锁定在一种方式                                        │
└─────────────────────────────────────────────────────────┘
```

### 实际场景

**场景 1：新手困惑**
```
新手：我想做个简单视频
框架：选择模式 - React / HTML / JSON ?
新手：我不知道这些是什么... 😰
```

**场景 2：中途变更**
```
开发者：前面用 HTML 写的，现在需要复杂交互
框架：抱歉，你选了 HTML 模式，要用 React 需要重建项目
开发者：！@#$%... 😡
```

**场景 3：团队协作**
```
成员A：我只会 HTML
成员B：我更熟悉 React
框架：只能选一种模式
团队：那谁妥协？ 😕
```

---

## 解决方案：统一模式

### 设计哲学

```
┌─────────────────────────────────────────────────────────┐
│  Seqvio 统一模式                                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  "用你最舒服的方式创作"                                    │
│                                                          │
│  创建文件 → 框架自动识别 → 智能处理                         │
│                                                          │
│  .tsx  ─┐                                               │
│  .html ─┼─→ 统一引擎 ─→ 自动适配 ─→ 完美输出              │
│  .json ─┤                                               │
│  .md   ─┘                                               │
│                                                          │
│  优势：                                                   │
│  ✅ 零学习成本 - 不需要知道"有哪些模式"                     │
│  ✅ 完全灵活 - 随时切换实现方式                            │
│  ✅ 可以混用 - 一个项目多种格式                            │
│  ✅ 自动处理 - 框架智能识别和优化                          │
└─────────────────────────────────────────────────────────┘
```

---

## 对比：用户体验

### ❌ 多模式框架

```bash
# 步骤 1: 选择模式（困惑开始）
$ framework init my-video
? Which mode do you want? 
  > React Component Mode
    HTML Template Mode
    JSON Configuration Mode
    
# 用户心理：我应该选哪个？有什么区别？

# 步骤 2: 创建项目
$ framework init my-video --mode react

# 步骤 3: 发现选错了
$ cat scenes/01-intro.tsx
# 这个场景其实用 HTML 更简单...

# 步骤 4: 想换模式
$ framework change-mode html
# Error: Cannot change mode after initialization

# 步骤 5: 只能重来
$ rm -rf my-video
$ framework init my-video --mode html
# 之前的代码全部作废 😭
```

### ✅ Seqvio 统一模式

```bash
# 步骤 1: 创建项目（无需选择）
$ seqvio init my-video
✓ Project created

# 步骤 2: 直接创作（用你舒服的方式）
$ cat > scenes/01-intro.html << 'EOF'
<div><h1>Hello</h1></div>
EOF

# 步骤 3: 发现需要复杂功能
$ cat > scenes/02-chart.tsx << 'EOF'
export default function Chart() {
  // 复杂的 React 逻辑
}
EOF

# 步骤 4: 又有个简单场景
$ cat > scenes/03-outro.html << 'EOF'
<div><p>Thanks!</p></div>
EOF

# 步骤 5: 直接运行（框架自动处理）
$ seqvio dev
✓ Detected 3 scenes
✓ Scene 01: HTML mode
✓ Scene 02: React mode  
✓ Scene 03: HTML mode
✓ Server running at http://localhost:3000

# 完全没有"模式"的概念！✨
```

---

## 实际案例对比

### 案例 1: 产品介绍视频

**多模式框架：**
```
1. 开始用 HTML（简单场景）
2. 后来需要数据图表（需要 React）
3. 发现不能混用
4. 重建整个项目为 React 模式
5. 简单场景也要改成 React
6. 浪费 2 小时重构 😡
```

**Seqvio：**
```
1. 简单场景直接写 HTML
2. 需要图表时创建 .tsx 文件
3. 继续工作
4. 完成！零重构 😊
```

### 案例 2: 团队协作

**多模式框架：**
```
前端工程师：我用 React 写
设计师：我只会 HTML
选哪个？→ 妥协 → 有人不舒服 😞
```

**Seqvio：**
```
前端工程师：写 .tsx 文件
设计师：写 .html 文件
框架：自动合并
大家都开心！😄
```

### 案例 3: 快速原型

**多模式框架：**
```
需求：快速做个 demo
问题：选哪个模式？
      React - 太重，需要配置
      HTML - 太简单，后期难扩展
      JSON - 不够灵活
纠结 10 分钟... 😓
```

**Seqvio：**
```
需求：快速做个 demo
行动：直接创建 .html 文件
      需要复杂功能？加 .tsx 文件
      无缝扩展！
      0 秒决策时间 ⚡
```

---

## 技术实现：如何做到统一？

### 智能文件识别

```typescript
// 框架内部逻辑
class SceneLoader {
  loadScene(filePath: string): Scene {
    const ext = path.extname(filePath);
    
    // 根据扩展名自动选择加载器
    switch (ext) {
      case '.tsx':
      case '.ts':
        return this.reactLoader.load(filePath);
        
      case '.html':
        return this.htmlLoader.load(filePath);
        
      case '.json':
        return this.jsonLoader.load(filePath);
        
      default:
        throw new Error(`Unsupported: ${ext}`);
    }
  }
}
```

### 统一的场景接口

```typescript
// 不管用什么格式，最终都转换为统一接口
interface Scene {
  id: string;
  duration: number;
  render(frame: number): RenderOutput;
}

// React 场景
class ReactScene implements Scene {
  render(frame: number) {
    return renderToString(<Component frame={frame} />);
  }
}

// HTML 场景
class HTMLScene implements Scene {
  render(frame: number) {
    return this.applyAnimations(this.html, frame);
  }
}

// JSON 场景
class JSONScene implements Scene {
  render(frame: number) {
    const Component = this.registry.get(this.config.type);
    return <Component {...this.config.props} frame={frame} />;
  }
}
```

### 自动依赖管理

```typescript
// 检测 React 组件的导入
function detectDependencies(filePath: string): string[] {
  const code = fs.readFileSync(filePath, 'utf-8');
  const imports = code.match(/import .+ from ['"](.+)['"]/g);
  return imports.map(extractPackageName);
}

// 自动安装和配置
async function setupDependencies(deps: string[]) {
  for (const dep of deps) {
    if (!isInstalled(dep)) {
      await install(dep);
    }
    if (needsAdapter(dep)) {
      await setupAdapter(dep);
    }
  }
}
```

---

## 用户反馈

### 多模式框架用户

> "每次开始新项目都要纠结选哪个模式，选错了改起来很麻烦。" - 用户 A

> "我只想做个简单视频，为什么要学习这么多概念？" - 用户 B

> "团队里有人会 React，有人只会 HTML，很难统一。" - 用户 C

### Seqvio 用户

> "太爽了！简单的用 HTML，复杂的用 React，完全无缝！" - 用户 X

> "不需要学习'模式'的概念，直接开始写就行了。" - 用户 Y

> "我们团队每个人都用自己最舒服的方式，框架自动处理。" - 用户 Z

---

## 类比：其他成功的统一模式

### Next.js 的文件系统路由

**传统路由：**
```typescript
// 需要手动配置路由
const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
  // 每次加页面都要改配置
];
```

**Next.js：**
```
pages/
  index.tsx        → 自动路由到 /
  about.tsx        → 自动路由到 /about
  [slug].tsx       → 自动动态路由
  
// 无需配置，放对地方就行！
```

### Seqvio 的统一模式

**传统视频框架：**
```bash
# 需要选择模式
framework init --mode react
# 所有场景必须用 React
```

**Seqvio：**
```
scenes/
  01-intro.tsx     → 自动识别为 React
  02-chart.html    → 自动识别为 HTML
  03-data.json     → 自动识别为 JSON
  
# 无需选择，放对地方就行！
```

---

## 技术优势

### 1. 渐进式增强

```
开始：简单的 HTML
  ↓
需要交互：加几个 .tsx 文件
  ↓
需要预制组件：加几个 .json 文件
  ↓
需要 AI 生成：写个 script.md
  ↓
无缝过渡，零重构
```

### 2. 最小认知负担

```
多模式框架：
需要理解：模式概念、模式差异、如何选择、如何切换
认知负担：⭐⭐⭐⭐⭐

Seqvio：
需要理解：创建文件
认知负担：⭐
```

### 3. 团队协作友好

```
多模式框架：
团队必须统一选择一种模式
→ 有人妥协
→ 效率下降

Seqvio：
每个人用自己擅长的方式
→ 框架自动合并
→ 效率最大化
```

### 4. 易于维护

```
多模式框架：
改一个场景 → 可能需要重构整个模式
风险：⭐⭐⭐⭐

Seqvio：
改一个场景 → 只改那个文件
风险：⭐
```

---

## 最佳实践

### 什么时候用什么格式？

**用 HTML (.html)：**
- ✅ 静态内容
- ✅ 简单布局
- ✅ 快速原型
- ✅ 设计师参与

**用 React (.tsx)：**
- ✅ 复杂交互
- ✅ 状态管理
- ✅ 自定义逻辑
- ✅ 需要 npm 包

**用 JSON (.json)：**
- ✅ 使用预制组件
- ✅ 数据驱动
- ✅ 配置化内容
- ✅ 非技术人员编辑

**用 Markdown (.md)：**
- ✅ 让 AI 生成
- ✅ 内容优先
- ✅ 快速迭代

**关键：你可以混用！**

---

## 结论

### 统一模式的价值

1. **降低门槛** - 无需学习"模式"概念
2. **提高效率** - 用最舒服的方式工作
3. **增强灵活性** - 随时切换实现方式
4. **促进协作** - 每个人用自己的方式
5. **减少重构** - 无缝扩展，零迁移成本

### 设计理念

> **"框架应该适应用户，而不是让用户适应框架"**

**Seqvio 让视频创作回归本质：**
- 不需要纠结技术选择
- 不需要学习复杂概念
- 只需要专注创作内容
- 框架自动处理一切

---

**这就是为什么我们选择统一模式！**

更多信息：
- [快速开始](../QUICKSTART.md)
- [统一模式详解](./UNIFIED-MODE.md)
- [架构设计](./ARCHITECTURE.md)
