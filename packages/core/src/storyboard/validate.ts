/**
 * Runtime validation for Storyboard IR.
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
  path?: string;
  code?: string;
  suggestion?: string;
  expected?: string;
  received?: unknown;
  repairable?: boolean;
}

function issue(
  issues: StoryboardIssue[],
  detail: StoryboardIssue
): void {
  issues.push(detail);
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
    issue(issues, {
      severity: 'error',
      path,
      code: 'expected_object',
      message: `${path} must be an object`,
      expected: 'object',
      received: element,
      repairable: true,
      suggestion: 'Replace this value with an element object.',
    });
    return;
  }

  const type = element.type;
  if (typeof type !== 'string' || !ELEMENT_TYPES.includes(type as never)) {
    issue(issues, {
      severity: 'error',
      path: `${path}.type`,
      code: 'unsupported_element_type',
      message: `${path}.type must be one of ${ELEMENT_TYPES.join(', ')} (got ${JSON.stringify(type)})`,
      expected: ELEMENT_TYPES.join(' | '),
      received: type,
      repairable: true,
      suggestion: `Use one of: ${ELEMENT_TYPES.join(', ')}.`,
    });
    return;
  }

  const el = element as Partial<StoryboardElement> & Record<string, unknown>;

  if (typeof el.start === 'number' && el.start < 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.start`,
      code: 'invalid_start_frame',
      message: `${path}.start must be >= 0`,
      expected: 'number >= 0',
      received: el.start,
      repairable: true,
      suggestion: 'Use a non-negative frame number.',
    });
  }
  if (typeof el.duration === 'number' && el.duration <= 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.duration`,
      code: 'invalid_duration',
      message: `${path}.duration must be > 0`,
      expected: 'number > 0',
      received: el.duration,
      repairable: true,
      suggestion: 'Use a positive frame duration.',
    });
  }

  switch (type) {
    case 'text': {
      if (typeof el.text !== 'string' || el.text.length === 0) {
        issue(issues, {
          severity: 'error',
          path: `${path}.text`,
          code: 'missing_text',
          message: `${path}.text must be a non-empty string`,
          expected: 'non-empty string',
          received: el.text,
          repairable: true,
          suggestion: 'Add the text to render.',
        });
      }
      if (!isVec2(el.position)) {
        issue(issues, {
          severity: 'error',
          path: `${path}.position`,
          code: 'missing_position',
          message: `${path}.position must be { x, y }`,
          expected: '{ x: number, y: number }',
          received: el.position,
          repairable: true,
          suggestion: 'Add numeric x and y coordinates.',
        });
      }
      break;
    }
    case 'shape': {
      const shape = el.shape;
      if (typeof shape !== 'string' || !SHAPE_KINDS.includes(shape as never)) {
        issue(issues, {
          severity: 'error',
          path: `${path}.shape`,
          code: 'unsupported_shape',
          message: `${path}.shape must be one of ${SHAPE_KINDS.join(', ')} (got ${JSON.stringify(shape)})`,
          expected: SHAPE_KINDS.join(' | '),
          received: shape,
          repairable: true,
          suggestion: `Use one of: ${SHAPE_KINDS.join(', ')}.`,
        });
        break;
      }
      const directional = shape === 'arrow' || shape === 'line' || shape === 'underline';
      if (directional) {
        if (!isVec2(el.from) || !isVec2(el.to)) {
          issue(issues, {
            severity: 'error',
            path,
            code: 'missing_directional_points',
            message: `${path} (${shape}) requires from { x, y } and to { x, y }`,
            expected: 'from and to vectors',
            received: { from: el.from, to: el.to },
            repairable: true,
            suggestion: 'Add both from and to coordinates.',
          });
        }
      } else if (!isVec2(el.position)) {
        issue(issues, {
          severity: 'error',
          path: `${path}.position`,
          code: 'missing_position',
          message: `${path} (${shape}) requires position { x, y }`,
          expected: '{ x: number, y: number }',
          received: el.position,
          repairable: true,
          suggestion: 'Add numeric x and y coordinates.',
        });
      }
      break;
    }
    case 'image': {
      if (typeof el.src !== 'string' || el.src.length === 0) {
        issue(issues, {
          severity: 'error',
          path: `${path}.src`,
          code: 'missing_image_src',
          message: `${path}.src must be a non-empty string`,
          expected: 'non-empty string',
          received: el.src,
          repairable: true,
          suggestion: 'Add a local or bundled image path.',
        });
      }
      break;
    }
    case 'icon': {
      if (typeof el.name !== 'string' || el.name.length === 0) {
        issue(issues, {
          severity: 'error',
          path: `${path}.name`,
          code: 'missing_icon_name',
          message: `${path}.name must be a non-empty string`,
          expected: 'non-empty string',
          received: el.name,
          repairable: true,
          suggestion: 'Add a supported icon name.',
        });
      }
      if (!isVec2(el.position)) {
        issue(issues, {
          severity: 'error',
          path: `${path}.position`,
          code: 'missing_position',
          message: `${path}.position must be { x, y }`,
          expected: '{ x: number, y: number }',
          received: el.position,
          repairable: true,
          suggestion: 'Add numeric x and y coordinates.',
        });
      }
      break;
    }
  }
}

export function validateStoryboard(input: unknown): StoryboardIssue[] {
  const issues: StoryboardIssue[] = [];

  if (!isObject(input)) {
    return [{
      severity: 'error',
      path: '$',
      code: 'expected_storyboard_object',
      message: 'Storyboard must be a JSON object',
      expected: 'object',
      received: input,
      repairable: true,
      suggestion: 'Return one JSON object with id, style, and scenes.',
    }];
  }

  const board = input as Partial<Storyboard> & Record<string, unknown>;
  const style = board.style ?? 'whiteboard';

  if (
    board.style !== undefined &&
    board.style !== 'whiteboard'
  ) {
    issue(issues, {
      severity: 'error',
      path: 'style',
      code: 'unsupported_style',
      message: `style "${String(board.style)}" is not supported (use "whiteboard")`,
      expected: 'whiteboard',
      received: board.style,
      repairable: true,
      suggestion: 'Use style "whiteboard" or omit style.',
    });
  }

  if (typeof board.id !== 'string' || board.id.length === 0) {
    issue(issues, {
      severity: 'error',
      path: 'id',
      code: 'missing_storyboard_id',
      message: 'id must be a non-empty string',
      expected: 'non-empty string',
      received: board.id,
      repairable: true,
      suggestion: 'Add a short ASCII id such as "photosynthesis-explainer".',
    });
  }

  for (const numField of ['width', 'height', 'fps'] as const) {
    const value = board[numField];
    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      issue(issues, {
        severity: 'error',
        path: numField,
        code: 'invalid_positive_number',
        message: `${numField} must be a positive number`,
        expected: 'positive number',
        received: value,
        repairable: true,
        suggestion: `Set ${numField} to a positive number.`,
      });
    }
  }

  if (!Array.isArray(board.scenes) || board.scenes.length === 0) {
    issue(issues, {
      severity: 'error',
      path: 'scenes',
      code: 'missing_scenes',
      message: 'scenes must be a non-empty array',
      expected: 'non-empty array',
      received: board.scenes,
      repairable: true,
      suggestion: 'Add at least one scene.',
    });
    return issues;
  }

  const seenSceneIds = new Set<string>();
  board.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `scenes[${sceneIndex}]`;
    if (!isObject(scene)) {
      issue(issues, {
        severity: 'error',
        path: scenePath,
        code: 'expected_scene_object',
        message: `${scenePath} must be an object`,
        expected: 'object',
        received: scene,
        repairable: true,
        suggestion: 'Replace this scene with an object containing id and visual/elements.',
      });
      return;
    }
    if (typeof scene.id !== 'string' || scene.id.length === 0) {
      issue(issues, {
        severity: 'error',
        path: `${scenePath}.id`,
        code: 'missing_scene_id',
        message: `${scenePath}.id must be a non-empty string`,
        expected: 'non-empty string',
        received: scene.id,
        repairable: true,
        suggestion: 'Add a short scene id such as "intro" or "process".',
      });
    } else if (seenSceneIds.has(scene.id)) {
      issue(issues, {
        severity: 'error',
        path: `${scenePath}.id`,
        code: 'duplicate_scene_id',
        message: `${scenePath}.id "${scene.id}" is duplicated`,
        expected: 'unique scene id',
        received: scene.id,
        repairable: true,
        suggestion: 'Rename this scene id so every scene id is unique.',
      });
    } else {
      seenSceneIds.add(scene.id);
    }

    if (!Array.isArray(scene.elements)) {
      issue(issues, {
        severity: 'error',
        path: `${scenePath}.elements`,
        code: 'missing_scene_elements',
        message: `${scenePath}.elements must be an array`,
        expected: 'array',
        received: scene.elements,
        repairable: true,
        suggestion: 'Add elements array, empty if this scene has no drawable elements.',
      });
      return;
    }
    if (scene.elements.length === 0) {
      issue(issues, {
        severity: 'warning',
        path: `${scenePath}.elements`,
        code: 'empty_scene_elements',
        message: `${scenePath}.elements is empty`,
        repairable: true,
        suggestion: 'Add drawable elements or confirm this scene should be blank.',
      });
    }
    if (scene.visual) {
      issue(issues, {
        severity: 'warning',
        path: `${scenePath}.visual`,
        code: 'ignored_visual',
        message: `${scenePath}.visual is ignored by the whiteboard storyboard compiler`,
        repairable: true,
        suggestion: 'Move drawable content into elements or remove visual.',
      });
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
