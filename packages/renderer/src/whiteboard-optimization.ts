export type WhiteboardOptimizeMode =
  | 'none'
  | 'react-static'
  | 'bitmap-layer'
  | 'frame-dedup';

export type WhiteboardOptimizeInput = WhiteboardOptimizeMode | '1' | '2' | '3';

const MODE_ALIASES: Record<string, WhiteboardOptimizeMode> = {
  '1': 'react-static',
  '2': 'bitmap-layer',
  '3': 'frame-dedup',
  none: 'none',
  'react-static': 'react-static',
  'bitmap-layer': 'bitmap-layer',
  'frame-dedup': 'frame-dedup',
};

export function normalizeWhiteboardOptimize(
  value: string | undefined
): WhiteboardOptimizeMode {
  if (value === undefined || value.trim() === '') return 'none';
  const normalized = MODE_ALIASES[value.trim()];
  if (!normalized) {
    throw new Error(
      `Unknown whiteboard optimization mode "${value}". Valid values: none | 1 | 2 | 3 | react-static | bitmap-layer | frame-dedup`
    );
  }
  return normalized;
}

export function usesStaticFrameDedup(
  mode: WhiteboardOptimizeMode,
  explicitStaticFrameDedup: boolean | undefined
): boolean {
  return mode === 'frame-dedup' || Boolean(explicitStaticFrameDedup);
}
