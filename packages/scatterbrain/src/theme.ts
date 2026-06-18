/**
 * Scatterbrain 调色板与设计 token。
 *
 * 设计参考：beautiful-html-templates / scatterbrain
 *   "便利贴 + 软木板 + 图钉 + 涂鸦" —— 头脑风暴墙、灵感便签板的创意工坊美学。
 *
 * 与 whiteboard 主题不同，这里是 div/CSS 实现，可以自由使用：
 *   渐变填充、柔和投影、任意旋转、半透明胶带 —— 这些正是 scatterbrain 的灵魂，
 *   也是它必须作为独立 style package、而非 whiteboard 主题存在的原因。
 */

/** 便利贴色板 —— 浅色，ink 文字在任意一种上都清晰可读。 */
export const stickyColors = {
  yellow: { base: '#ffe066', deep: '#ffd43b' },
  blue:   { base: '#a5d8ff', deep: '#74c0fc' },
  pink:   { base: '#ffc9c9', deep: '#ff9f9f' },
  green:  { base: '#b2f2bb', deep: '#8ce99a' },
  orange: { base: '#ffcc80', deep: '#ffb74d' },
  purple: { base: '#d0bfff', deep: '#b39ddb' },
} as const;

export type StickyColor = keyof typeof stickyColors;

/** 全局调色板 token。 */
export const palette = {
  // 背景表面
  cream:    '#faf8f3',   // 桌面纸（默认背景）
  paper:    '#f7f5f0',   // 次级纸
  // 软木板背景（暖棕，用于"钉满便签的墙"场景）
  cork:     '#c9a875',
  corkDeep: '#b08d5b',
  // 墨色 —— 暖炭灰，绝非纯黑
  ink:      '#2d2a26',
  inkLight: '#5c5750',
  // 图钉
  pinRed:   '#ff6b6b',
  pinRedDeep: '#c92a2a',
  pinBlue:  '#4dabf7',
  pinGreen: '#69db7c',
  pinGold:  '#ffd43b',
  // 阴影
  shadow:     'rgba(45, 42, 38, 0.15)',
  shadowDeep: 'rgba(45, 42, 38, 0.25)',
} as const;

/**
 * 字体栈 —— 复用 renderer 已捆绑的字体文件（无外网 Google Fonts）：
 *   Virgil（拉丁手写体）+ Long Cang（中文手写体）→ 手写 display / 批注
 *   Noto Sans SC → 正文清晰可读
 * 实际 @font-face 由 ScatterScene 注入（见 components.tsx）。
 */
export const fonts = {
  // 手写大字 / 标题：拉丁走 Virgil，中文走 Long Cang
  display: 'Virgil, "Long Cang", "Noto Sans SC", cursive',
  // 正文：清晰无衬线，保证可读
  body: '"Noto Sans SC", "Microsoft YaHei UI", system-ui, sans-serif',
  // 手写批注：同 display
  hand: 'Virgil, "Long Cang", "Noto Sans SC", cursive',
} as const;

/** renderer 捆绑字体的 @font-face 规则（family 名须与 whiteboard 一致）。 */
export const FONT_FACE_CSS = `
@font-face {
  font-family: 'Virgil';
  src: url('./Virgil.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: block;
}
@font-face {
  font-family: 'Long Cang';
  src: url('./LongCang-Regular.ttf') format('truetype');
  font-weight: 400; font-style: normal; font-display: block;
}
@font-face {
  font-family: 'Noto Sans SC';
  src: url('./NotoSansSC-Regular.woff') format('woff');
  font-weight: 400; font-style: normal; font-display: block;
}`;

/** 字号阶梯（1280×720 基准）。 */
export const typeScale = {
  display: 88,
  h1:      60,
  h2:      40,
  body:    26,
  caption: 21,
} as const;
