/**
 * @seqvio/scatterbrain
 *
 * 便利贴 / 软木板 / 图钉 / 涂鸦风格组件 —— 创意工坊情绪板美学。
 *
 * 与 @seqvio/whiteboard 平行的第二个 style package：同样只依赖 @seqvio/core
 * 的帧状态（useCurrentFrame），不碰 whiteboard、不碰 renderer。同一套 Storyboard
 * IR 既能编译到 whiteboard 手绘风，也能编译到本包的便签风，证明 Seqvio 框架是
 * style-agnostic 的。
 *
 * 视觉走 div/CSS 路线，因此可自由使用旋转、渐变、柔和投影、半透明胶带 —— 这些
 * 正是 scatterbrain 的灵魂，也是它作为独立 package 而非 whiteboard 主题存在的原因。
 *
 * @example
 * ```tsx
 * import { ScatterScene, StickyNote, Scrawl } from '@seqvio/scatterbrain';
 *
 * export default function MyScene() {
 *   return (
 *     <ScatterScene surface="cork">
 *       <Scrawl text="头脑风暴" position={{ x: 80, y: 60 }} start={0} />
 *       <StickyNote title="想法 1" position={{ x: 120, y: 220 }}
 *         color="yellow" rotate={-3} start={20}>
 *         把内容钉到墙上
 *       </StickyNote>
 *     </ScatterScene>
 *   );
 * }
 *
 * export const meta = { duration: 180 };
 * ```
 *
 * @packageDocumentation
 */

export {
  ScatterScene,
  StickyNote,
  Scrawl,
  PinnedList,
  Doodle,
  Polaroid,
} from './components';
export type {
  ScatterSceneProps,
  StickyNoteProps,
  ScrawlProps,
  PinnedListProps,
  DoodleProps,
  PolaroidProps,
} from './components';

export { useReveal } from './anim';
export type { Easing } from './anim';

export {
  palette,
  fonts,
  typeScale,
  stickyColors,
} from './theme';
export type { StickyColor } from './theme';

export const VERSION = '0.1.0';
