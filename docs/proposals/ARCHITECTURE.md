# Seqvio 架构设计

## 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户层 (User Layer)                        │
├─────────────────────────────────────────────────────────────────┤
│  CLI  │  VS Code Ext  │  Web Studio  │  AI Assistant  │  API    │
└──────┬────────────────┴──────────────┴────────────────┴─────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                   编排层 (Orchestration Layer)                    │
├──────────────────────────────────────────────────────────────────┤
│  Project Manager  │  Workflow Engine  │  Build System           │
└──────┬───────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                     核心层 (Core Layer)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Timeline   │  │  Composition │  │   Renderer   │          │
│  │    Engine    │  │    Manager   │  │    Engine    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│  ┌──────▼─────────────────▼──────────────────▼───────┐          │
│  │            Unified Frame Controller               │          │
│  │         (帧精确控制 + 状态同步)                     │          │
│  └────────────────────────┬──────────────────────────┘          │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                    适配器层 (Adapter Layer)                       │
├──────────────────────────────────────────────────────────────────┤
│  GSAP   │  Framer  │  Three.js  │  Lottie  │  CSS  │  Custom   │
│ Adapter │  Adapter │   Adapter  │  Adapter │ Adapt │  Adapter  │
└──────┬──────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                   组件层 (Component Layer)                        │
├──────────────────────────────────────────────────────────────────┤
│  Registry  │  Primitives  │  Templates  │  User Components      │
└──────┬───────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────────┐
│                    渲染层 (Rendering Layer)                       │
├──────────────────────────────────────────────────────────────────┤
│  Puppeteer │  FFmpeg  │  WebGL  │  Canvas2D  │  WebCodecs       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 核心模块详解

### 1. Timeline Engine (时间轴引擎)

**职责：**
- 统一时间管理
- 帧精确控制
- 关键帧插值
- 时间重映射

**核心 API：**
```typescript
class TimelineEngine {
  private currentFrame: number = 0;
  private fps: number = 30;
  private duration: number = 0;
  
  // 跳转到指定帧
  seekToFrame(frame: number): void;
  
  // 跳转到指定时间（秒）
  seekToTime(seconds: number): void;
  
  // 插值计算
  interpolate(
    range: [number, number],
    output: [number, number],
    options?: InterpolateOptions
  ): number;
  
  // 物理弹簧动画
  spring(
    target: number,
    options: SpringOptions
  ): number;
  
  // 关键帧动画
  keyframes<T>(
    frames: Record<number, T>,
    options?: KeyframeOptions
  ): T;
  
  // 注册时间轴监听器
  on(event: TimelineEvent, handler: Handler): void;
}
```

**时间轴事件：**
```typescript
type TimelineEvent = 
  | 'frame-change'      // 帧变化
  | 'scene-enter'       // 进入场景
  | 'scene-exit'        // 退出场景
  | 'composition-ready' // 合成就绪
  | 'render-start'      // 渲染开始
  | 'render-complete';  // 渲染完成
```

---

### 2. Composition Manager (合成管理器)

**职责：**
- 场景管理
- 图层管理
- 依赖解析
- 状态管理

**核心数据结构：**
```typescript
interface Composition {
  id: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  scenes: Scene[];
  layers: Layer[];
  assets: Asset[];
  theme?: Theme;
  metadata?: Metadata;
}

interface Scene {
  id: string;
  start: number;        // 开始帧
  duration: number;     // 持续帧数
  layers: Layer[];
  transitions?: {
    in?: Transition;
    out?: Transition;
  };
  props?: Record<string, any>;
}

interface Layer {
  id: string;
  type: LayerType;
  start: number;
  duration: number;
  trackIndex: number;   // Z-index
  component: Component;
  animations?: Animation[];
  blendMode?: BlendMode;
}

type LayerType = 
  | 'video' 
  | 'image' 
  | 'audio' 
  | 'text' 
  | 'shape' 
  | 'component';
```

---

### 3. Renderer Engine (渲染引擎)

**双模式渲染架构：**

#### **模式 A: Headless 渲染（程序化）**
```typescript
class HeadlessRenderer {
  private browser: Browser;
  private ffmpeg: FFmpegInstance;
  
  async render(composition: Composition): Promise<void> {
    // 1. 启动无头浏览器
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--enable-gpu', '--use-angle=gl']
    });
    
    // 2. 创建页面并注入合成
    const page = await this.browser.newPage();
    await page.setViewport({
      width: composition.width,
      height: composition.height
    });
    
    // 3. 逐帧渲染
    const totalFrames = composition.duration;
    for (let frame = 0; frame < totalFrames; frame++) {
      // 跳转到当前帧
      await page.evaluate((f) => {
        window.__seqvio_seek(f);
      }, frame);
      
      // 等待渲染完成
      await page.waitForFunction(
        () => window.__seqvio_frame_ready === true
      );
      
      // 截图
      const screenshot = await page.screenshot({
        type: 'png',
        omitBackground: false
      });
      
      // 发送到 FFmpeg
      this.ffmpeg.stdin.write(screenshot);
      
      // 进度回调
      this.emit('progress', {
        frame,
        total: totalFrames,
        percent: (frame / totalFrames) * 100
      });
    }
    
    // 4. 合成音频（如果有）
    if (composition.audio) {
      await this.muxAudio(composition.audio);
    }
    
    // 5. 清理
    await this.browser.close();
    this.ffmpeg.stdin.end();
  }
}
```

#### **模式 B: Live 渲染（实时录屏）**
```typescript
class LiveRenderer {
  private server: ViteDevServer;
  
  async preview(composition: Composition): Promise<void> {
    // 1. 启动开发服务器
    this.server = await createServer({
      root: composition.projectPath,
      server: { port: 3000 }
    });
    
    await this.server.listen();
    
    // 2. 打开预览窗口
    console.log('Preview running at http://localhost:3000');
    console.log('Controls:');
    console.log('  Space     - Play/Pause');
    console.log('  ←/→       - Previous/Next frame');
    console.log('  R         - Start recording');
    console.log('  Esc       - Stop recording');
    
    // 3. 监听录屏命令
    this.on('record-start', async () => {
      // 使用 WebCodecs API 或 MediaRecorder
      await this.startScreenRecording();
    });
  }
  
  private async startScreenRecording(): Promise<void> {
    // 实现屏幕录制逻辑
    // 可选：自动音频同步
  }
}
```

---

### 4. Adapter Layer (适配器层)

**统一适配器接口：**

```typescript
interface AnimationAdapter {
  name: string;
  version: string;
  
  // 初始化适配器
  initialize(context: RenderContext): void;
  
  // 跳转到指定帧
  seekToFrame(frame: number): void;
  
  // 获取当前动画状态
  getState(): AnimationState;
  
  // 暂停/恢复
  pause(): void;
  resume(): void;
  
  // 清理资源
  dispose(): void;
}
```

**GSAP 适配器实现：**
```typescript
class GSAPAdapter implements AnimationAdapter {
  name = 'gsap';
  version = '3.12.0';
  
  private timelines: Map<string, gsap.core.Timeline> = new Map();
  
  initialize(context: RenderContext): void {
    // 拦截所有 GSAP timeline 创建
    const originalTimeline = gsap.timeline;
    gsap.timeline = (vars?: any) => {
      const tl = originalTimeline.call(gsap, { 
        ...vars, 
        paused: true  // 强制暂停
      });
      
      // 注册到适配器
      const id = generateId();
      this.timelines.set(id, tl);
      
      return tl;
    };
  }
  
  seekToFrame(frame: number): void {
    const time = frame / this.context.fps;
    
    // 跳转所有注册的时间轴
    this.timelines.forEach(tl => {
      tl.seek(time);
    });
  }
}
```

**Framer Motion 适配器（自动转换）：**
```typescript
class FramerMotionAdapter implements AnimationAdapter {
  name = 'framer-motion';
  
  initialize(context: RenderContext): void {
    // 重写 motion 组件
    const originalMotion = require('framer-motion').motion;
    
    // 创建适配版本
    const adaptedMotion = new Proxy(originalMotion, {
      get(target, prop) {
        return (componentProps: any) => {
          // 拦截 animate 属性
          const { animate, transition, ...rest } = componentProps;
          
          if (animate && typeof animate === 'object') {
            // 转换为 useFrame() 驱动的动画
            const converted = this.convertToFrameBased(
              animate,
              transition
            );
            return originalMotion[prop]({
              ...rest,
              style: converted
            });
          }
          
          return originalMotion[prop](componentProps);
        };
      }
    });
    
    // 替换导出
    require.cache['framer-motion'].exports.motion = adaptedMotion;
  }
  
  private convertToFrameBased(
    animate: Record<string, any>,
    transition?: any
  ): CSSProperties {
    const frame = this.context.currentFrame;
    const result: CSSProperties = {};
    
    for (const [key, targetValue] of Object.entries(animate)) {
      const duration = transition?.duration || 1;
      const durationInFrames = duration * this.context.fps;
      
      // 线性插值（简化版，实际需要处理缓动）
      const progress = Math.min(frame / durationInFrames, 1);
      result[key] = this.interpolate(0, targetValue, progress);
    }
    
    return result;
  }
}
```

---

### 5. Component Registry (组件注册表)

**组件元数据：**
```typescript
interface ComponentMetadata {
  id: string;
  name: string;
  version: string;
  category: ComponentCategory;
  tags: string[];
  description: string;
  author: string;
  license: string;
  
  // 组件依赖
  dependencies?: {
    npm?: Record<string, string>;
    peer?: Record<string, string>;
    components?: string[];
  };
  
  // 组件配置
  props: PropDefinition[];
  defaultProps?: Record<string, any>;
  
  // 示例
  examples?: Example[];
  
  // 预览
  thumbnail?: string;
  preview?: string;
  
  // 文档
  readme?: string;
  documentation?: string;
}

interface PropDefinition {
  name: string;
  type: PropType;
  required: boolean;
  default?: any;
  description: string;
  validation?: ValidationRule[];
}

type ComponentCategory = 
  | 'data-viz'
  | 'social'
  | 'transitions'
  | 'ui-mockups'
  | 'text'
  | 'effects'
  | 'ai-powered'
  | 'audio-visual'
  | 'templates';
```

**组件安装流程：**
```typescript
class ComponentRegistry {
  async install(componentId: string): Promise<void> {
    // 1. 从注册表获取元数据
    const metadata = await this.fetchMetadata(componentId);
    
    // 2. 检查依赖
    await this.checkDependencies(metadata.dependencies);
    
    // 3. 下载组件包
    const packagePath = await this.download(componentId);
    
    // 4. 安装 npm 依赖
    if (metadata.dependencies?.npm) {
      await this.installNpmDeps(metadata.dependencies.npm);
    }
    
    // 5. 注册组件
    await this.register(componentId, packagePath);
    
    // 6. 生成类型定义
    await this.generateTypes(metadata);
    
    console.log(`✓ Installed ${componentId}@${metadata.version}`);
  }
  
  async search(query: string): Promise<ComponentMetadata[]> {
    const response = await fetch(
      `${REGISTRY_URL}/search?q=${query}`
    );
    return response.json();
  }
  
  list(): string[] {
    return Array.from(this.components.keys());
  }
}
```

---

### 6. Theme System (主题系统)

**主题架构：**
```typescript
interface Theme {
  id: string;
  name: string;
  description: string;
  
  // 设计 Token
  tokens: {
    colors: ColorTokens;
    typography: TypographyTokens;
    spacing: SpacingTokens;
    motion: MotionTokens;
    effects: EffectTokens;
  };
  
  // 组件级样式覆盖
  components?: Record<string, ComponentTheme>;
  
  // 全局样式
  global?: CSSProperties;
}

interface ColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  
  // 语义化颜色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // 渐变
  gradients?: Record<string, string>;
}

interface TypographyTokens {
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  
  weights: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

interface MotionTokens {
  durations: {
    fast: number;
    normal: number;
    slow: number;
  };
  
  easings: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    spring: string;
  };
  
  transitions: Record<string, string>;
}
```

**主题应用：**
```typescript
class ThemeManager {
  private currentTheme: Theme;
  
  apply(themeId: string): void {
    this.currentTheme = this.loadTheme(themeId);
    
    // 1. 注入 CSS 变量
    this.injectCSSVariables(this.currentTheme.tokens);
    
    // 2. 应用全局样式
    if (this.currentTheme.global) {
      this.applyGlobalStyles(this.currentTheme.global);
    }
    
    // 3. 更新组件主题
    if (this.currentTheme.components) {
      this.updateComponentThemes(this.currentTheme.components);
    }
  }
  
  private injectCSSVariables(tokens: Theme['tokens']): void {
    const cssVars = this.convertTokensToCSSVars(tokens);
    const style = document.createElement('style');
    style.textContent = `
      :root {
        ${Object.entries(cssVars)
          .map(([key, value]) => `${key}: ${value};`)
          .join('\n')}
      }
    `;
    document.head.appendChild(style);
  }
}
```

---

### 7. AI Integration Layer (AI 集成层)

**AI 服务架构：**

```typescript
interface AIService {
  // 代码生成
  generateCode(prompt: string, context: ProjectContext): Promise<Code>;
  
  // 风格建议
  suggestStyle(content: string): Promise<StyleSuggestion>;
  
  // 语音合成
  synthesizeVoice(text: string, options: VoiceOptions): Promise<AudioBuffer>;
  
  // 智能剪辑
  smartEdit(footage: Video[], style: EditingStyle): Promise<Timeline>;
}

class ClaudeCodeGenerator implements AIService {
  private client: Anthropic;
  
  async generateCode(
    prompt: string, 
    context: ProjectContext
  ): Promise<Code> {
    const systemPrompt = `
You are a Seqvio expert. Generate production-ready video composition code.

Available components: ${context.availableComponents.join(', ')}
Theme: ${context.theme}
Duration: ${context.duration}s

Generate TypeScript/React code using the Seqvio API.
`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });
    
    const code = this.extractCode(response.content);
    return this.validateAndFormat(code);
  }
  
  async suggestStyle(content: string): Promise<StyleSuggestion> {
    const prompt = `
Analyze this content and suggest the best visual style:

${content}

Suggest:
1. Theme (from: ${AVAILABLE_THEMES.join(', ')})
2. Color palette mood
3. Animation style (energetic/calm/professional)
4. Pacing (fast/medium/slow)
`;

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return this.parseStyleSuggestion(response.content);
  }
}
```

**AI 工作流示例：**
```typescript
// 端到端 AI 生成流程
async function generateVideoFromArticle(
  articlePath: string
): Promise<Project> {
  const ai = new AIService();
  
  // 1. 读取内容
  const content = await readFile(articlePath);
  
  // 2. 分析内容，生成结构
  const structure = await ai.analyzeContent(content);
  // 返回：{ sections: [...], keyPoints: [...], duration: 120 }
  
  // 3. 风格建议
  const style = await ai.suggestStyle(content);
  // 返回：{ theme: 'tech-minimal', mood: 'professional', ... }
  
  // 4. 生成场景代码
  const scenes = await Promise.all(
    structure.sections.map(section => 
      ai.generateSceneCode(section, style)
    )
  );
  
  // 5. 合成旁白
  const narration = await ai.extractNarration(content);
  const audio = await ai.synthesizeVoice(narration, {
    voice: 'professional',
    language: 'zh-CN'
  });
  
  // 6. 组装项目
  const project = new Project({
    scenes,
    audio,
    theme: style.theme
  });
  
  return project;
}
```

---

## 性能优化

### 1. 并行渲染

```typescript
class ParallelRenderer {
  async render(
    composition: Composition,
    concurrency: number = 4
  ): Promise<void> {
    const totalFrames = composition.duration;
    const chunkSize = Math.ceil(totalFrames / concurrency);
    
    // 分片渲染
    const chunks = Array.from(
      { length: concurrency },
      (_, i) => ({
        start: i * chunkSize,
        end: Math.min((i + 1) * chunkSize, totalFrames)
      })
    );
    
    // 并行渲染各片段
    await Promise.all(
      chunks.map(chunk => 
        this.renderChunk(composition, chunk)
      )
    );
    
    // 合并片段
    await this.mergeChunks(chunks);
  }
}
```

### 2. 增量渲染（热重载）

```typescript
class IncrementalRenderer {
  private frameCache: Map<number, Buffer> = new Map();
  
  async renderWithCache(
    composition: Composition,
    changedScenes: Set<string>
  ): Promise<void> {
    const totalFrames = composition.duration;
    
    for (let frame = 0; frame < totalFrames; frame++) {
      // 检查是否需要重新渲染此帧
      const sceneAtFrame = this.getSceneAtFrame(composition, frame);
      
      if (!changedScenes.has(sceneAtFrame.id)) {
        // 使用缓存
        const cached = this.frameCache.get(frame);
        if (cached) {
          this.output.write(cached);
          continue;
        }
      }
      
      // 重新渲染
      const rendered = await this.renderFrame(composition, frame);
      this.frameCache.set(frame, rendered);
      this.output.write(rendered);
    }
  }
}
```

### 3. WebCodecs 加速

```typescript
class WebCodecsRenderer {
  private encoder: VideoEncoder;
  
  async initialize(): Promise<void> {
    this.encoder = new VideoEncoder({
      output: (chunk) => {
        this.writeChunk(chunk);
      },
      error: (e) => {
        console.error('Encode error:', e);
      }
    });
    
    this.encoder.configure({
      codec: 'avc1.42E01E',  // H.264 baseline
      width: 1920,
      height: 1080,
      bitrate: 5_000_000,     // 5 Mbps
      framerate: 30
    });
  }
  
  async encodeFrame(
    imageData: ImageData,
    timestamp: number
  ): Promise<void> {
    const frame = new VideoFrame(imageData, { timestamp });
    this.encoder.encode(frame, { keyFrame: false });
    frame.close();
  }
}
```

---

## 插件系统

```typescript
interface Plugin {
  name: string;
  version: string;
  
  // 生命周期钩子
  hooks?: {
    'before-render'?: (composition: Composition) => void;
    'after-render'?: (output: RenderOutput) => void;
    'before-scene'?: (scene: Scene) => void;
    'after-scene'?: (scene: Scene) => void;
    'frame-render'?: (frame: number, data: Buffer) => Buffer;
  };
  
  // 自定义命令
  commands?: Record<string, CommandHandler>;
  
  // 自定义组件
  components?: Component[];
  
  // 初始化
  initialize?(context: PluginContext): void;
}

// 示例：自动字幕插件
const autoCaptionsPlugin: Plugin = {
  name: '@seqvio/plugin-auto-captions',
  version: '1.0.0',
  
  hooks: {
    'before-render': async (composition) => {
      // 1. 转录音频
      const transcript = await transcribeAudio(composition.audio);
      
      // 2. 生成字幕层
      const captionLayer = createCaptionLayer(transcript);
      
      // 3. 添加到合成
      composition.layers.push(captionLayer);
    }
  }
};
```

---

## 总结

Seqvio 通过模块化的架构设计，实现了：

1. ✅ **多输入模式统一** - 通过适配器层支持 React/HTML/JSON
2. ✅ **帧精确控制** - 通过统一时间轴引擎确保确定性
3. ✅ **动画库兼容** - 通过适配器自动转换各种动画库
4. ✅ **灵活渲染** - 支持程序化渲染和实时录屏两种模式
5. ✅ **丰富生态** - 组件注册表 + 插件系统
6. ✅ **AI 集成** - 原生支持 AI 辅助创作

这个架构既保持了 Remotion 的程序化优势，又融合了 Hyperframes 的易用性和 Garden Skills 的工作流完整性。
