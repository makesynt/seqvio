/**
 * Migrate Storyboard IR v1 to CompositionDocument v2.
 */

import type { Storyboard, StoryboardScene } from '../storyboard/schema';
import type {
  CompositionDocument,
  WhiteboardSceneSpec,
} from './schema';
import { COMPOSITION_DOCUMENT_VERSION } from './schema';

function toWhiteboardScene(scene: StoryboardScene): WhiteboardSceneSpec {
  return {
    type: 'whiteboard',
    id: scene.id,
    layout: scene.layout,
    sceneRole: scene.sceneRole,
    density: scene.density,
    narration: scene.narration,
    duration: scene.duration,
    elements: scene.elements,
  };
}

export function storyboardToCompositionV2(board: Storyboard): CompositionDocument {
  return {
    version: COMPOSITION_DOCUMENT_VERSION,
    id: board.id,
    width: board.width,
    height: board.height,
    fps: board.fps,
    backgroundColor: board.backgroundColor,
    lockToAudio: board.lockToAudio,
    transitionDuration: board.transitionDuration,
    scenes: board.scenes.map(toWhiteboardScene),
  };
}
