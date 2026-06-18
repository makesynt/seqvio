# Scatterbrain Style — Authoring Reference

便利贴 / 软木板 / 图钉 / 涂鸦的创意工坊风格。彩色便签钉在软木板或纸桌面上，
配手绘涂鸦、红图钉、半透明胶带、拍立得照片。灵感来自
[beautiful-html-templates `scatterbrain`](d:/beautiful-html-templates/templates/scatterbrain/) 设计系统。

## ⚠️ 这不是 whiteboard 主题，而是独立 style package

| | whiteboard 主题（pin-and-paper / studio / field-note …） | scatterbrain |
|---|---|---|
| 归属 | `@seqvio/whiteboard` 内的 `theme` 对象 | 独立包 `@seqvio/scatterbrain` |
| 渲染 | SVG 手绘路径（roughjs） | div / CSS |
| 组件 | `WhiteboardScene` / `DrawText` / `DrawShape` / `Hand` | `ScatterScene` / `StickyNote` / `Scrawl` / … |
| 能力 | 逐帧路径绘出、手部跟随 | 旋转、渐变、柔和投影、胶带（whiteboard 做不到） |
| 依赖 | whiteboard + core | **仅 core**（`useCurrentFrame`） |

**不要**把 scatterbrain 组件和 `WhiteboardScene` / `DrawText` 混用——它们是两套平行的视觉系统。
一个 `<Scene>` 内只用其中一套。`@seqvio/core` 的 `VideoComposition` / `Scene` / `Transition` 两者通用。

## Quick Start

```tsx
import React from 'react';
import { VideoComposition, Scene, Transition } from '@seqvio/core';
import {
  ScatterScene,
  StickyNote,
  Scrawl,
  PinnedList,
  Doodle,
  Polaroid,
  palette,
  typeScale,
} from '@seqvio/scatterbrain';

function CoverScene() {
  return (
    <ScatterScene surface="cork">
      <Scrawl text="头脑风暴" position={{ x: 90, y: 120 }} fontSize={120}
        color="#fff8e7" rotate={-2} start={0} duration={24} />
      <StickyNote title="想法 1" position={{ x: 820, y: 160 }}
        color="yellow" rotate={3} attach="pin" start={30}>
        把内容钉到墙上
      </StickyNote>
    </ScatterScene>
  );
}
```

时间模型与 whiteboard 完全一致：每个组件用 `start` / `duration`（帧），帧驱动。

## Components

### `ScatterScene` — 场景容器
- `surface`: `'paper'`（奶油纸 + 淡网格，默认）｜ `'cork'`（软木板暖棕）｜ `'warm'`（暖色光晕渐变）
- 自动叠加全屏颗粒质感、注入捆绑手写字体的 `@font-face`
- `width` / `height` 默认 1280×720

选面规则：封面 / 结语用 `cork`（深底，手写大字用浅色 `#fff8e7`）；流程 / 列表用 `paper`；特性 / 情绪页用 `warm`。

### `StickyNote` — 便利贴
- `position` `{x,y}`（必填，左上角）、`width`（默认 320）、`height`（可选，省略则自适应）
- `color`: `yellow｜blue｜pink｜green｜orange｜purple`（六色，每色自带 135° 渐变）
- `rotate`: 旋转角度（度）。**便签必须略微旋转**，±1～±5° 读作"手贴上去"
- `attach`: `'pin'`（红图钉）｜`'tape'`（半透明胶带）｜`'none'`
- `pinColor`: `red｜blue｜green｜gold`（`attach='pin'` 时）
- `title`: 顶部手写标题（h2 手写体）；`children`: 正文
- `start` / `duration`：弹出用 `back-out` 缓动，自带轻微回弹

### `Scrawl` — 手写大字
直接写在背景上的标题 / 章节字（不在便签里）。
- `hand`: `true`（手写 display 体，默认）｜`false`（清晰正文体）
- `rotate`、`align`、`color`、`fontSize`、`width`、`easing`
- 深底（cork）场景用浅色 `color="#fff8e7"`

### `PinnedList` — 错位便签列
一列竖排便签，逐张弹出，自动交替旋转 + 交替图钉/胶带。
- `items: string[]`、`position`、`itemWidth`（默认 360）、`gap`（默认 22）
- `colors`: 便签色循环数组（默认六色全用）
- `start` / `stagger`（默认 12 帧/项）

### `Doodle` — 手绘涂鸦
SVG 描边逐渐画出的装饰标记。
- `type`: `circle｜squiggle｜arrow｜star｜underline`
- `position`、`size`（默认 80）、`color`、`rotate`、`opacity`（默认 0.85）
- 用于角落点缀、强调下划线、便签间箭头连接

### `Polaroid` — 拍立得照片框
白边照片框 + 底部手写说明。
- `fill`: 内容区背景（纯色或渐变字符串）、`caption`、`width`（默认 280）、`rotate`（默认 -2）
- `children`: 放在照片区中央（图标 / emoji / 文字）

## Color Palette

```ts
import { palette, stickyColors } from '@seqvio/scatterbrain';
```

| Token | Hex | Use |
|---|---|---|
| `palette.cream` | `#faf8f3` | 纸背景（surface="paper"） |
| `palette.cork` | `#c9a875` | 软木板背景 |
| `palette.ink` | `#2d2a26` | 所有文字 / 涂鸦（暖炭灰，**非纯黑**） |
| `palette.inkLight` | `#5c5750` | 次级文字 |
| `palette.pinRed` | `#ff6b6b` | 红图钉 / 强调 |
| `stickyColors.{yellow,blue,pink,green,orange,purple}` | — | 便签色（`.base` / `.deep` 双色渐变） |

深底（cork）场景的手写大字用 `#fff8e7`（暖白），不要用纯白。

## Typography Scale

```ts
import { typeScale } from '@seqvio/scatterbrain';
// { display: 88, h1: 60, h2: 40, body: 26, caption: 21 }
```

字体由 `ScatterScene` 自动注入（复用 renderer 捆绑字体）：
- 手写 display / 标题 / 批注 → Virgil（拉丁）+ Long Cang（中文）
- 正文 → Noto Sans SC（清晰可读）

不需要、也不要引用 Google Fonts（Caveat / Shrikhand / Zilla Slab）——渲染器里不可用，会回退成系统字体。

## Layout Patterns

### 封面（cork）
1. `Scrawl` 手写大标题（浅色，rotate -2°）+ 副标题
2. 右侧 2 张钉着的 `StickyNote`（不同色、相反旋转方向）
3. 1～2 个 `Doodle`（circle / arrow）点缀
4. 底部 `Scrawl` 链接（caption 字号，半透明浅色）

### 流程（paper）
1. `Scrawl` 标题 + `Doodle` underline（红色）
2. 3～4 张 `StickyNote` 横排，y 坐标各错开几像素，旋转方向交替
3. 便签之间用 `Doodle type="arrow"` 连接
4. 底部一行 `Scrawl`（`hand={false}` 正文体）小结

### 特性（warm）
1. `Scrawl` 标题
2. 左侧 `PinnedList` 错位便签列
3. 右侧 1～2 张 `Polaroid` 拍立得（相反旋转）
4. `Doodle star` 强调

## Do / Don't

### Do
- 每张便签都给 `rotate`（±1～±5°），相邻便签旋转方向相反——这是"手贴"质感的核心
- 同一 `<Scene>` 只用 scatterbrain 组件，不要混 `WhiteboardScene` / `DrawText`
- 便签色作分类语言：相邻用不同色
- cork / warm 深底场景，手写大字用浅色 `#fff8e7`
- 便签正文保持短句，留足内边距（避免文字贴边）

### Don't
- 不要引用 Google Fonts（Caveat/Shrikhand/Zilla Slab）——用包内已配好的字体栈
- 不要把便签摆成严格网格——错位 + 旋转才是 scatterbrain
- 不要在 cork 深底上用 `palette.ink` 写大字（看不清，用浅色）
- 不要一个场景塞超过 5～6 张便签，会拥挤
- 不要加 `Hand`——那是 whiteboard 的组件，本包没有手部光标

## Example File

完整 4 场景演示见
[`examples/compositions/seqvio-scatterbrain.tsx`](../../../examples/compositions/seqvio-scatterbrain.tsx)。

## Render Command

```bash
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-scatterbrain.tsx \
  --output output/seqvio-scatterbrain.mp4
```

带旁白：

```bash
seqvio-audio extract examples/compositions/seqvio-scatterbrain.tsx
seqvio-audio synthesize examples/compositions/seqvio-scatterbrain.tsx
node packages/renderer/dist/cli.js \
  --component examples/compositions/seqvio-scatterbrain.tsx \
  --audioManifest output/audio-manifest.resolved.json \
  --burnCaptions \
  --output output/seqvio-scatterbrain.mp4
```

> 注：scatterbrain 的全屏渐变 + 颗粒质感使每帧截图比 whiteboard 重，
> 990 帧约需数分钟，属正常。
