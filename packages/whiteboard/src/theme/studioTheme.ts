/**
 * Studio 主题 — "字即形状"设计工作室风格。
 *
 * 设计参考：beautiful-html-templates / studio（Boring Studios agency aesthetic）
 *
 * 核心设计决策：
 * - 二元色板：近黑 #1C1C1C ↔ 酸柠黄 #F5D200，全系统无第三色
 * - 所有标题：最大字重（fontWeight="bold"）+ 全大写 + 负字距
 *   → 字体在屏幕上读作"几何形块"，而非普通文字
 * - handDrawn: false — 光滑 SVG，印刷平面感
 * - defaultBorderRadius: 0 — 无圆角，纯矩形
 * - 无阴影、无渐变、无装饰元素——标题 IS 设计本身
 * - strokeWidth 1 为通用发丝线，2 为统计卡顶线 / 图表基线（"锚"规则）
 *
 * 使用方式：
 *   深色场景（默认）：
 *     <WhiteboardScene texture="none" background={studioPalette.dark} theme={studioTheme}>
 *       <DrawText text="SEQVIO" strokeColor={studioPalette.yellow} fontWeight="bold" ... />
 *
 *   黄色场景（翻转）：
 *     <WhiteboardScene texture="none" background={studioPalette.yellow} theme={studioTheme}>
 *       <DrawText text="CODE AS MEDIUM" strokeColor={studioPalette.dark} fontWeight="bold" ... />
 *
 * 字号阶梯（1280×720 基准，按 vw 比例换算）：
 *   display  154px — 封面超大标题，字即形状
 *   h1        96px — 整屏陈述标题 / 章节标题
 *   h2        62px — 主要幻灯片标题
 *   body      20px — 正文 / 数据标注（生产环境中几乎不用）
 *   caption   16px — 说明 / 来源注释
 *   [label]   13px — 统计卡注释、底栏元数据（用 DejaVuSans 模拟等宽感）
 *
 * 颜色规则：
 *   深色背景场景：标题 = yellow，次级文字 = yellow@58%，三级 = yellow@32%
 *   黄色背景场景：标题 = dark，次级文字 = dark@62%，三级 = dark@35%
 *   — 绝不引入第三色 —
 *
 * 统计卡规则：
 *   2px 顶部横线（DrawShape line）+ 数字（h1/display 级）+ 标签（body）
 *   → strokeWidth=2 的顶线是系统唯一"锚"元素，chrome 发丝线保持 strokeWidth=1
 */

import { WhiteboardTheme } from './defaultTheme';

/** Studio 调色板 token */
export const studioPalette = {
  dark:       '#1C1C1C',   // 近黑暖调，主暗色背景
  darkAlt:    '#242422',   // 微亮近黑，次级暗色
  yellow:     '#F5D200',   // 酸柠黄，暗色场景标题色 / 亮色场景背景色
  yellowAlt:  '#F0CC00',   // 略冷黄，亮色场景次级背景
  // 透明度变体 — 系统无独立灰色，全用透明度表达层级
  yellowMuted:  'rgba(245,210,0,0.58)',   // 次级文字（深色场景）
  yellowFaint:  'rgba(245,210,0,0.32)',   // 三级文字（深色场景）
  darkMuted:    'rgba(28,28,28,0.62)',    // 次级文字（黄色场景）
  darkFaint:    'rgba(28,28,28,0.35)',    // 三级文字（黄色场景）
  borderDark:   '#2E2E2C',               // 深色场景发丝线
  borderLight:  'rgba(28,28,28,0.18)',   // 黄色场景发丝线
} as const;

/** Studio 主题 — 默认以深色背景为基准 */
export const studioTheme: Partial<WhiteboardTheme> = {
  handDrawn: false,

  colors: {
    ink:        studioPalette.yellow,     // 深色背景下文字 = 黄
    accent:     studioPalette.yellow,
    accent2:    studioPalette.yellow,
    muted:      studioPalette.yellowMuted,
    surface:    studioPalette.darkAlt,
    cta:        studioPalette.yellow,
    background: studioPalette.dark,
  },

  // 发丝线 1px；重线 2px（统计卡顶线 / 图表基线）通过 strokeWidth prop 覆盖
  strokeWidth:     1,
  strokeWidthBold: 2,

  shapeFillDefault:    'none',
  defaultBorderRadius: 0,
  textRender:          'fill',
  penSize:             50,

  // 字体：NotoSansSC 作全局无衬线体；DejaVuSans 在等宽标签场合模拟 Mono
  fontFamily:
    '"Noto Sans SC", "Microsoft YaHei UI", system-ui, sans-serif',

  pathFontUrls: {
    noto:   './NotoSansSC-Regular.woff',
    dejavu: './DejaVuSans.ttf',
  },

  // 字号阶梯（1280×720，按 vw 1280px 基准）
  typeScale: {
    display: 154,   // 12vw — 封面标题，字即形状
    h1:       96,   // 7.5vw — 陈述标题 / 章节标题
    h2:       62,   // 4.8vw — 主要幻灯片标题
    body:     20,   // ~1.6vw — 正文
    caption:  16,   // ~1.25vw — 注释
  },

  // 间距（vw/vh 换算至 1280×720）
  spacing: {
    padX:  64,   // 5vw
    padY:  36,   // 5vh
    gapLg: 25,   // 3.5vh
    gapMd: 14,   // 2vh
    gapSm:  7,   // 1vh
  },
};
