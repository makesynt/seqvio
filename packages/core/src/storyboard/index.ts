/**
 * Storyboard IR: the structured generation target between content and TSX.
 *
 *   prompt/document -> Storyboard IR (JSON) -> TSX composition -> MP4
 *
 * validate -> compile is a pure, deterministic pipeline (no LLM). The LLM step
 * that produces the IR plugs in ahead of validateStoryboard.
 */

export * from './schema';
export * from './validate';
export * from './compile';
