/**
 * @seqvio/presentation
 *
 * Slide/keynote-style presentation components. A second style package proving
 * the Seqvio framework is style-agnostic: it depends only on @seqvio/core (for
 * frame state), exactly like @seqvio/whiteboard, and the same Storyboard IR can
 * compile to either style.
 */

export {
  PresentationScene,
  SlideTitle,
  BulletList,
  Callout,
} from './components';
export type {
  PresentationSceneProps,
  SlideTitleProps,
  BulletListProps,
  CalloutProps,
} from './components';
export { useReveal } from './anim';
export type { Easing } from './anim';

export const VERSION = '0.1.0';
