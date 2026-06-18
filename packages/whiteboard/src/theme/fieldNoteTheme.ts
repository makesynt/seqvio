/**
 * Field Note 主题 — 黄色法律笔记本 + 钴蓝印刷体风格。
 *
 * 设计灵感来自 Pin & Paper 视觉系统的核心张力：
 *   "官方印刷品被手工钉在黄色笔记本上"
 *
 * 关键设计决策：
 * - handDrawn: false — 所有笔画是光滑的 SVG 路径，模拟印刷感而非手写感
 * - 字体使用系统无衬线字体栈，渲染为清晰印刷体
 * - 色板严格遵循原版：钴蓝 + 黄纸，朱红只作单一强调
 * - shapeFillDefault: 'none' — 形状不自动填充，强迫作者明确颜色意图
 * - strokeWidth 更粗 (2.5/3.5)，在视频中有更强的印刷重量感
 *
 * 背景用法：
 *   <WhiteboardScene texture="none" background={fieldNotePalette.paper} theme={fieldNoteTheme}>
 *
 * 卡片模式（硬投影）：
 *   两层 DrawShape 叠加：
 *   1. 偏移 (+5, +6)，fillColor=ink，strokeWidth=0 → 实心钴蓝投影
 *   2. 正常位置，fillColor=cream，strokeColor=ink，strokeWidth=2.5 → 奶油色卡面
 *
 * 字号阶梯（1280×720 画布）：
 *   display  88px — 封面超大标题，极紧字距
 *   h1       58px — 区块标题
 *   h2       38px — 卡片标题
 *   body     24px — 正文
 *   caption  17px — 底栏标签、元数据
 *
 * 颜色使用规则：
 *   ink (钴蓝)   — 所有文字、边框、形状默认色
 *   cream (奶油) — 卡片填充（通过 fillColor prop 传入）
 *   red (朱红)   — 每个场景最多一处强调，用于下划线或标注
 *   muted        — 次要文字、页脚标签
 *
 * 不要使用手写体字体、不要开启 handDrawn、不要引入第四种颜色。
 */

import { WhiteboardTheme } from './defaultTheme';

/** Field Note 调色板 token — 直接使用，不要硬编码 hex */
export const fieldNotePalette = {
  paper:   '#EFE56A',   // 黄纸背景，每个场景必须使用
  cream:   '#F8F1D6',   // 卡片填充
  ink:     '#1F3A8A',   // 钴蓝，所有笔画和文字的主色
  inkSoft: '#3457C4',   // 次级钴蓝，用于辅助线条和 muted 文字
  red:     '#C2342B',   // 朱红，单一强调，每场景最多一处
  olive:   '#6B7A2E',   // 橄榄绿，正向信号（可选）
} as const;

export const fieldNoteTheme: Partial<WhiteboardTheme> = {
  // 印刷感：关闭手绘路径，所有形状渲染为光滑 SVG
  handDrawn: false,

  colors: {
    ink:        fieldNotePalette.ink,
    accent:     fieldNotePalette.red,
    accent2:    fieldNotePalette.olive,
    muted:      fieldNotePalette.inkSoft,
    surface:    fieldNotePalette.cream,
    cta:        fieldNotePalette.red,
    background: fieldNotePalette.paper,
  },

  // 更粗的笔画 — 印刷感需要更强的线重
  strokeWidth:     2.5,
  strokeWidthBold: 3.5,

  // 形状不自动填充，作者必须显式传 fillColor
  shapeFillDefault: 'none',

  // 直角（borderRadius=0）→ 印刷裁切感；需要圆角时通过 borderRadius prop 覆盖
  defaultBorderRadius: 0,

  textRender: 'fill',

  penSize: 50,

  // 系统无衬线字体栈 — 渲染为清晰印刷体，不依赖任何手写字体文件
  // 优先顺序：苹方(macOS/iOS) → 微软雅黑(Windows) → Noto Sans SC → 系统 sans
  fontFamily:
    '"PingFang SC", "Microsoft YaHei UI", "Noto Sans SC", system-ui, sans-serif',

  pathFontUrls: {
    noto:   './NotoSansSC-Regular.woff',
    dejavu: './DejaVuSans.ttf',
    // 不声明 virgil / longcang，彻底禁止手写字体渲染路径
  },

  // 字号阶梯 — 1280×720 基准，比例关系参考 Pin & Paper 原版
  typeScale: {
    display: 88,   // 封面超大标题
    h1:      58,   // 区块标题
    h2:      38,   // 卡片标题
    body:    24,   // 正文
    caption: 17,   // 标签 / 元数据
  },

  // 间距 — 比默认主题边距稍大，给黄纸更多呼吸空间
  spacing: {
    padX:  90,
    padY:  72,
    gapLg: 54,
    gapMd: 32,
    gapSm: 16,
  },
};
