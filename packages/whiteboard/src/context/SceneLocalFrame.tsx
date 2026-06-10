/**
 * Optional scene-local frame for multi-scene compositions.
 *
 * Moved into @seqvio/core (style-agnostic). Re-exported here to preserve the
 * existing @seqvio/whiteboard public API. See packages/core/src/frame.ts.
 */

export {
  SceneLocalFrameProvider,
  useSceneLocalFrame,
} from '@seqvio/core';
