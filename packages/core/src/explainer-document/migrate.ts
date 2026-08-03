/**
 * Adapt a whiteboard Storyboard to an ExplainerDocument.
 */

import type { Storyboard, StoryboardScene } from '../storyboard/schema';
import type {
  ExplainerDocument,
  WhiteboardSceneSpec,
} from './schema';
import { EXPLAINER_DOCUMENT_FORMAT, EXPLAINER_DOCUMENT_SCHEMA_VERSION } from './schema';

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

export function storyboardToExplainerDocument(board: Storyboard): ExplainerDocument {
  return {
    format: EXPLAINER_DOCUMENT_FORMAT,
    schemaVersion: EXPLAINER_DOCUMENT_SCHEMA_VERSION,
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
