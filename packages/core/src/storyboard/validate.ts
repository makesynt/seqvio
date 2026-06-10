/**
 * Runtime validation for Storyboard IR.
 *
 * The IR is the generation target for LLMs, so untrusted JSON must be checked
 * before it is compiled. validateStoryboard returns a flat list of issues
 * (errors block compilation; warnings are advisory) in the same shape as the
 * audio manifest validator, so callers can render them uniformly.
 */

import {
  ELEMENT_TYPES,
  SHAPE_KINDS,
  type Storyboard,
  type StoryboardElement,
} from './schema';

export interface StoryboardIssue {
  severity: 'error' | 'warning';
  message: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVec2(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.x === 'number' &&
    typeof value.y === 'number'
  );
}

function validateElement(
  element: unknown,
  path: string,
  issues: StoryboardIssue[]
): void {
  if (!isObject(element)) {
    issues.push({ severity: 'error', message: `${path} must be an object` });
    return;
  }

  const type = element.type;
  if (typeof type !== 'string' || !ELEMENT_TYPES.includes(type as never)) {
    issues.push({
      severity: 'error',
      message: `${path}.type must be one of ${ELEMENT_TYPES.join(', ')} (got ${JSON.stringify(type)})`,
    });
    return;
  }

  const el = element as Partial<StoryboardElement> & Record<string, unknown>;

  if (typeof el.start === 'number' && el.start < 0) {
    issues.push({ severity: 'error', message: `${path}.start must be >= 0` });
  }
  if (typeof el.duration === 'number' && el.duration <= 0) {
    issues.push({ severity: 'error', message: `${path}.duration must be > 0` });
  }

  switch (type) {
    case 'text': {
      if (typeof el.text !== 'string' || el.text.length === 0) {
        issues.push({ severity: 'error', message: `${path}.text must be a non-empty string` });
      }
      if (!isVec2(el.position)) {
        issues.push({ severity: 'error', message: `${path}.position must be { x, y }` });
      }
      break;
    }
    case 'shape': {
      const shape = el.shape;
      if (typeof shape !== 'string' || !SHAPE_KINDS.includes(shape as never)) {
        issues.push({
          severity: 'error',
          message: `${path}.shape must be one of ${SHAPE_KINDS.join(', ')} (got ${JSON.stringify(shape)})`,
        });
        break;
      }
      const directional = shape === 'arrow' || shape === 'line' || shape === 'underline';
      if (directional) {
        if (!isVec2(el.from) || !isVec2(el.to)) {
          issues.push({
            severity: 'error',
            message: `${path} (${shape}) requires from { x, y } and to { x, y }`,
          });
        }
      } else if (!isVec2(el.position)) {
        issues.push({
          severity: 'error',
          message: `${path} (${shape}) requires position { x, y }`,
        });
      }
      break;
    }
    case 'image': {
      if (typeof el.src !== 'string' || el.src.length === 0) {
        issues.push({ severity: 'error', message: `${path}.src must be a non-empty string` });
      }
      break;
    }
    case 'icon': {
      if (typeof el.name !== 'string' || el.name.length === 0) {
        issues.push({ severity: 'error', message: `${path}.name must be a non-empty string` });
      }
      if (!isVec2(el.position)) {
        issues.push({ severity: 'error', message: `${path}.position must be { x, y }` });
      }
      break;
    }
  }
}

export function validateStoryboard(input: unknown): StoryboardIssue[] {
  const issues: StoryboardIssue[] = [];

  if (!isObject(input)) {
    return [{ severity: 'error', message: 'Storyboard must be a JSON object' }];
  }

  const board = input as Partial<Storyboard> & Record<string, unknown>;

  if (typeof board.id !== 'string' || board.id.length === 0) {
    issues.push({ severity: 'error', message: 'id must be a non-empty string' });
  }

  if (board.style !== undefined && board.style !== 'whiteboard') {
    issues.push({
      severity: 'error',
      message: `style "${String(board.style)}" is not supported (only "whiteboard")`,
    });
  }

  for (const numField of ['width', 'height', 'fps'] as const) {
    const value = board[numField];
    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      issues.push({ severity: 'error', message: `${numField} must be a positive number` });
    }
  }

  if (!Array.isArray(board.scenes) || board.scenes.length === 0) {
    issues.push({ severity: 'error', message: 'scenes must be a non-empty array' });
    return issues;
  }

  const seenSceneIds = new Set<string>();
  board.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `scenes[${sceneIndex}]`;
    if (!isObject(scene)) {
      issues.push({ severity: 'error', message: `${scenePath} must be an object` });
      return;
    }
    if (typeof scene.id !== 'string' || scene.id.length === 0) {
      issues.push({ severity: 'error', message: `${scenePath}.id must be a non-empty string` });
    } else if (seenSceneIds.has(scene.id)) {
      issues.push({ severity: 'error', message: `${scenePath}.id "${scene.id}" is duplicated` });
    } else {
      seenSceneIds.add(scene.id);
    }

    if (!Array.isArray(scene.elements)) {
      issues.push({ severity: 'error', message: `${scenePath}.elements must be an array` });
      return;
    }
    if (scene.elements.length === 0) {
      issues.push({ severity: 'warning', message: `${scenePath}.elements is empty` });
    }
    scene.elements.forEach((element: unknown, elementIndex: number) => {
      validateElement(element, `${scenePath}.elements[${elementIndex}]`, issues);
    });
  });

  return issues;
}

export function assertValidStoryboard(input: unknown): asserts input is Storyboard {
  const issues = validateStoryboard(input);
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Invalid storyboard:\n${errors.map((e) => ` - ${e.message}`).join('\n')}`
    );
  }
}
