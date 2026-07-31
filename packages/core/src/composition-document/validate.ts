/**
 * Runtime validation for CompositionDocument v2.
 */

import { validateStoryboard, type StoryboardIssue } from '../storyboard/validate';
import {
  ANNOTATION_KINDS,
  SCENE_TYPES,
  type AnnotationSpec,
  type ChapterSpec,
  type CodeSceneSpec,
  type CompositionDocument,
  type DiagramSceneSpec,
  type SceneSpec,
  type WhiteboardSceneSpec,
} from './schema';
import { isPacingProfileId } from '../pacing';

export type CompositionIssue = StoryboardIssue;

function issue(issues: CompositionIssue[], detail: CompositionIssue): void {
  issues.push(detail);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function remapStoryboardPath(path: string | undefined, scenePath: string): string | undefined {
  if (!path) return path;
  if (path === '$') return scenePath;
  if (path === 'scenes') return scenePath;
  if (path.startsWith('scenes[0]')) {
    return path.replace('scenes[0]', scenePath);
  }
  return path;
}

function validateWhiteboardScene(
  scene: WhiteboardSceneSpec,
  scenePath: string,
  issues: CompositionIssue[]
): void {
  const { type: _type, annotations: _annotations, ...storyboardScene } = scene;
  const boardIssues = validateStoryboard({
    id: 'validation-context',
    scenes: [storyboardScene],
  });
  for (const boardIssue of boardIssues) {
    if (boardIssue.path === 'id') continue;
    issues.push({
      ...boardIssue,
      path: remapStoryboardPath(boardIssue.path, scenePath),
    });
  }
}

function validateLineRange(
  range: unknown,
  path: string,
  issues: CompositionIssue[]
): void {
  if (!isObject(range)) {
    issue(issues, {
      severity: 'error',
      path,
      code: 'invalid_line_range',
      message: `${path} must be { startLine, endLine }`,
      expected: '{ startLine: number, endLine: number }',
      received: range,
      repairable: true,
      suggestion: 'Use 1-based inclusive line numbers.',
    });
    return;
  }
  if (typeof range.startLine !== 'number' || typeof range.endLine !== 'number') {
    issue(issues, {
      severity: 'error',
      path,
      code: 'invalid_line_range',
      message: `${path} must include numeric startLine and endLine`,
      repairable: true,
    });
  } else if (range.startLine < 1 || range.endLine < range.startLine) {
    issue(issues, {
      severity: 'error',
      path,
      code: 'invalid_line_range',
      message: `${path} requires 1 <= startLine <= endLine`,
      repairable: true,
    });
  }
}

function validateCodeScene(
  scene: CodeSceneSpec,
  scenePath: string,
  issues: CompositionIssue[]
): void {
  if (typeof scene.language !== 'string' || scene.language.length === 0) {
    issue(issues, {
      severity: 'error',
      path: `${scenePath}.language`,
      code: 'missing_code_language',
      message: `${scenePath}.language must be a non-empty string`,
      repairable: true,
    });
  }
  if (typeof scene.source !== 'string') {
    issue(issues, {
      severity: 'error',
      path: `${scenePath}.source`,
      code: 'missing_code_source',
      message: `${scenePath}.source must be a string`,
      repairable: true,
    });
  }
  if (!Array.isArray(scene.steps)) {
    issue(issues, {
      severity: 'error',
      path: `${scenePath}.steps`,
      code: 'missing_code_steps',
      message: `${scenePath}.steps must be an array`,
      repairable: true,
    });
    return;
  }
  scene.steps.forEach((step, index) => {
    const stepPath = `${scenePath}.steps[${index}]`;
    if (!isObject(step) || typeof step.action !== 'string') {
      issue(issues, {
        severity: 'error',
        path: stepPath,
        code: 'invalid_code_step',
        message: `${stepPath} must be an object with action and at`,
        repairable: true,
      });
      return;
    }
    if (typeof step.at !== 'number' || step.at < 0) {
      issue(issues, {
        severity: 'error',
        path: `${stepPath}.at`,
        code: 'invalid_step_time',
        message: `${stepPath}.at must be a non-negative number`,
        repairable: true,
      });
    }
    if ('range' in step && step.range !== undefined) {
      validateLineRange(step.range, `${stepPath}.range`, issues);
    }
    if (step.action === 'insert' && typeof step.line !== 'number') {
      issue(issues, {
        severity: 'error',
        path: `${stepPath}.line`,
        code: 'missing_insert_line',
        message: `${stepPath}.line is required for insert`,
        repairable: true,
      });
    }
    if (step.action === 'annotate' && typeof step.targetId !== 'string') {
      issue(issues, {
        severity: 'error',
        path: `${stepPath}.targetId`,
        code: 'missing_annotate_target',
        message: `${stepPath}.targetId is required for annotate`,
        repairable: true,
      });
    }
  });
}

function validateDiagramScene(
  scene: DiagramSceneSpec,
  scenePath: string,
  issues: CompositionIssue[]
): void {
  if (!Array.isArray(scene.nodes) || scene.nodes.length === 0) {
    issue(issues, {
      severity: 'error',
      path: `${scenePath}.nodes`,
      code: 'missing_diagram_nodes',
      message: `${scenePath}.nodes must be a non-empty array`,
      repairable: true,
    });
  } else {
    const nodeIds = new Set<string>();
    scene.nodes.forEach((node, index) => {
      const nodePath = `${scenePath}.nodes[${index}]`;
      if (!isObject(node) || typeof node.id !== 'string' || node.id.length === 0) {
        issue(issues, {
          severity: 'error',
          path: `${nodePath}.id`,
          code: 'missing_node_id',
          message: `${nodePath}.id must be a non-empty string`,
          repairable: true,
        });
      } else if (nodeIds.has(node.id)) {
        issue(issues, {
          severity: 'error',
          path: `${nodePath}.id`,
          code: 'duplicate_node_id',
          message: `Duplicate diagram node id "${node.id}"`,
          repairable: true,
        });
      } else {
        nodeIds.add(node.id);
      }
      if (!isObject(node) || typeof node.label !== 'string' || node.label.length === 0) {
        issue(issues, {
          severity: 'error',
          path: `${nodePath}.label`,
          code: 'missing_node_label',
          message: `${nodePath}.label must be a non-empty string`,
          repairable: true,
        });
      }
    });
  }

  if (!Array.isArray(scene.edges)) {
    issue(issues, {
      severity: 'error',
      path: `${scenePath}.edges`,
      code: 'missing_diagram_edges',
      message: `${scenePath}.edges must be an array`,
      repairable: true,
    });
  } else {
    const edgeIds = new Set<string>();
    const nodeIds = new Set(
      Array.isArray(scene.nodes)
        ? scene.nodes
            .filter((n) => isObject(n) && typeof n.id === 'string')
            .map((n) => n.id as string)
        : []
    );
    scene.edges.forEach((edge, index) => {
      const edgePath = `${scenePath}.edges[${index}]`;
      if (!isObject(edge) || typeof edge.id !== 'string' || edge.id.length === 0) {
        issue(issues, {
          severity: 'error',
          path: `${edgePath}.id`,
          code: 'missing_edge_id',
          message: `${edgePath}.id must be a non-empty string`,
          repairable: true,
        });
      } else if (edgeIds.has(edge.id)) {
        issue(issues, {
          severity: 'error',
          path: `${edgePath}.id`,
          code: 'duplicate_edge_id',
          message: `Duplicate diagram edge id "${edge.id}"`,
          repairable: true,
        });
      } else {
        edgeIds.add(edge.id);
      }
      if (!isObject(edge) || typeof edge.from !== 'string' || !nodeIds.has(edge.from)) {
        issue(issues, {
          severity: 'error',
          path: `${edgePath}.from`,
          code: 'invalid_edge_from',
          message: `${edgePath}.from must reference an existing node id`,
          repairable: true,
        });
      }
      if (!isObject(edge) || typeof edge.to !== 'string' || !nodeIds.has(edge.to)) {
        issue(issues, {
          severity: 'error',
          path: `${edgePath}.to`,
          code: 'invalid_edge_to',
          message: `${edgePath}.to must reference an existing node id`,
          repairable: true,
        });
      }
    });
  }

  if (!Array.isArray(scene.steps)) {
    issue(issues, {
      severity: 'error',
      path: `${scenePath}.steps`,
      code: 'missing_diagram_steps',
      message: `${scenePath}.steps must be an array`,
      repairable: true,
    });
  }
}

function validatePlaceholderScene(
  scene: SceneSpec,
  scenePath: string,
  issues: CompositionIssue[]
): void {
  if (scene.type === 'terminal') {
    const terminal = scene as Extract<SceneSpec, { type: 'terminal' }>;
    const hasEvents = Array.isArray(terminal.events) && terminal.events.length > 0;
    const hasCommands = Array.isArray(terminal.commands) && terminal.commands.length > 0;

    if (!hasEvents && !hasCommands) {
      issue(issues, {
        severity: 'error',
        path: scenePath,
        code: 'missing_terminal_events_or_commands',
        message: `${scenePath} must include either non-empty "events" or non-empty "commands"`,
        repairable: true,
      });
      return;
    }

    if (Array.isArray(terminal.events)) {
      terminal.events.forEach((ev, index) => {
        const evPath = `${scenePath}.events[${index}]`;
        if (!isObject(ev)) {
          issue(issues, {
            severity: 'error',
            path: evPath,
            code: 'invalid_terminal_event',
            message: `${evPath} must be an object`,
            repairable: true,
          });
          return;
        }
        if (typeof ev.timeMs !== 'number' || ev.timeMs < 0) {
          issue(issues, {
            severity: 'error',
            path: `${evPath}.timeMs`,
            code: 'invalid_terminal_event_timeMs',
            message: `${evPath}.timeMs must be a non-negative number`,
            repairable: true,
          });
        }
        if (
          typeof ev.kind !== 'string' ||
          !['stdin', 'stdout', 'stderr'].includes(ev.kind)
        ) {
          issue(issues, {
            severity: 'error',
            path: `${evPath}.kind`,
            code: 'invalid_terminal_event_kind',
            message: `${evPath}.kind must be one of stdin|stdout|stderr`,
            repairable: true,
          });
        }
        if (typeof ev.text !== 'string') {
          issue(issues, {
            severity: 'error',
            path: `${evPath}.text`,
            code: 'invalid_terminal_event_text',
            message: `${evPath}.text must be a string`,
            repairable: true,
          });
        }
        if (ev.snapshot !== undefined && typeof ev.snapshot !== 'boolean') {
          issue(issues, {
            severity: 'error',
            path: `${evPath}.snapshot`,
            code: 'invalid_terminal_event_snapshot',
            message: `${evPath}.snapshot must be a boolean when provided`,
            repairable: true,
          });
        }
        if (ev.transient !== undefined && typeof ev.transient !== 'boolean') {
          issue(issues, {
            severity: 'error',
            path: `${evPath}.transient`,
            code: 'invalid_terminal_event_transient',
            message: `${evPath}.transient must be a boolean when provided`,
            repairable: true,
          });
        }
        if (ev.grid !== undefined && !isObject(ev.grid)) {
          issue(issues, {
            severity: 'error',
            path: `${evPath}.grid`,
            code: 'invalid_terminal_event_grid',
            message: `${evPath}.grid must be an object when provided`,
            repairable: true,
          });
        }
      });
    }

    if (Array.isArray(terminal.steps)) {
      terminal.steps.forEach((st, index) => {
        const stPath = `${scenePath}.steps[${index}]`;
        if (!isObject(st)) {
          issue(issues, {
            severity: 'error',
            path: stPath,
            code: 'invalid_terminal_step',
            message: `${stPath} must be an object`,
            repairable: true,
          });
          return;
        }
        if (typeof st.id !== 'string' || st.id.length === 0) {
          issue(issues, {
            severity: 'error',
            path: `${stPath}.id`,
            code: 'invalid_terminal_step_id',
            message: `${stPath}.id must be a non-empty string`,
            repairable: true,
          });
        }
        if (typeof st.label !== 'string' || st.label.length === 0) {
          issue(issues, {
            severity: 'error',
            path: `${stPath}.label`,
            code: 'invalid_terminal_step_label',
            message: `${stPath}.label must be a non-empty string`,
            repairable: true,
          });
        }
        if (typeof st.timeMs !== 'number' || st.timeMs < 0) {
          issue(issues, {
            severity: 'error',
            path: `${stPath}.timeMs`,
            code: 'invalid_terminal_step_timeMs',
            message: `${stPath}.timeMs must be a non-negative number`,
            repairable: true,
          });
        }
      });
    }
  }
}

function validateAnnotation(
  annotation: unknown,
  path: string,
  issues: CompositionIssue[]
): void {
  if (!isObject(annotation)) {
    issue(issues, {
      severity: 'error',
      path,
      code: 'expected_annotation_object',
      message: `${path} must be an object`,
      repairable: true,
    });
    return;
  }
  if (typeof annotation.id !== 'string' || annotation.id.length === 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.id`,
      code: 'missing_annotation_id',
      message: `${path}.id must be a non-empty string`,
      repairable: true,
    });
  }
  if (typeof annotation.targetId !== 'string' || annotation.targetId.length === 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.targetId`,
      code: 'missing_annotation_target',
      message: `${path}.targetId must be a non-empty string`,
      repairable: true,
    });
  }
  if (
    typeof annotation.kind !== 'string' ||
    !ANNOTATION_KINDS.includes(annotation.kind as never)
  ) {
    issue(issues, {
      severity: 'error',
      path: `${path}.kind`,
      code: 'unsupported_annotation_kind',
      message: `${path}.kind must be one of ${ANNOTATION_KINDS.join(', ')}`,
      repairable: true,
    });
  }
  if (typeof annotation.start !== 'number' || annotation.start < 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.start`,
      code: 'invalid_annotation_start',
      message: `${path}.start must be a non-negative number`,
      repairable: true,
    });
  }
  if (typeof annotation.duration !== 'number' || annotation.duration <= 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.duration`,
      code: 'invalid_annotation_duration',
      message: `${path}.duration must be > 0`,
      repairable: true,
    });
  }
}

function collectAddressableIds(scene: SceneSpec): string[] {
  const ids: string[] = [scene.id];
  if (scene.type === 'diagram') {
    for (const node of scene.nodes) ids.push(node.id);
    for (const edge of scene.edges) ids.push(edge.id);
  } else if (scene.type === 'whiteboard') {
    for (const element of scene.elements) {
      if (typeof element.id === 'string' && element.id.length > 0) {
        ids.push(element.id);
      }
    }
  }
  return ids;
}

function validateChapters(
  chapters: unknown,
  sceneIds: Set<string>,
  issues: CompositionIssue[]
): void {
  if (!Array.isArray(chapters)) {
    issue(issues, {
      severity: 'error',
      path: 'chapters',
      code: 'invalid_chapters',
      message: 'chapters must be an array when provided',
      repairable: true,
    });
    return;
  }
  const seenChapterIds = new Set<string>();
  chapters.forEach((chapter, index) => {
    const chapterPath = `chapters[${index}]`;
    if (!isObject(chapter)) {
      issue(issues, {
        severity: 'error',
        path: chapterPath,
        code: 'expected_chapter_object',
        message: `${chapterPath} must be an object`,
        repairable: true,
      });
      return;
    }
    const ch = chapter as Partial<ChapterSpec>;
    if (typeof ch.id !== 'string' || ch.id.length === 0) {
      issue(issues, {
        severity: 'error',
        path: `${chapterPath}.id`,
        code: 'missing_chapter_id',
        message: `${chapterPath}.id must be a non-empty string`,
        repairable: true,
      });
    } else if (seenChapterIds.has(ch.id)) {
      issue(issues, {
        severity: 'error',
        path: `${chapterPath}.id`,
        code: 'duplicate_chapter_id',
        message: `Duplicate chapter id "${ch.id}"`,
        repairable: true,
      });
    } else {
      seenChapterIds.add(ch.id);
    }
    if (!Array.isArray(ch.sceneIds) || ch.sceneIds.length === 0) {
      issue(issues, {
        severity: 'error',
        path: `${chapterPath}.sceneIds`,
        code: 'missing_chapter_scenes',
        message: `${chapterPath}.sceneIds must be a non-empty array`,
        repairable: true,
      });
      return;
    }
    ch.sceneIds.forEach((sceneId, sceneIndex) => {
      if (typeof sceneId !== 'string' || !sceneIds.has(sceneId)) {
        issue(issues, {
          severity: 'error',
          path: `${chapterPath}.sceneIds[${sceneIndex}]`,
          code: 'unknown_chapter_scene',
          message: `Chapter references unknown scene id "${String(sceneId)}"`,
          repairable: true,
        });
      }
    });
  });
}

export function validateCompositionDocument(input: unknown): CompositionIssue[] {
  const issues: CompositionIssue[] = [];

  if (!isObject(input)) {
    return [{
      severity: 'error',
      path: '$',
      code: 'expected_composition_object',
      message: 'CompositionDocument must be a JSON object',
      expected: 'object',
      received: input,
      repairable: true,
      suggestion: 'Return one JSON object with version "2.0", id, and scenes.',
    }];
  }

  const doc = input as Partial<CompositionDocument> & Record<string, unknown>;

  if (doc.version !== '2.0') {
    issue(issues, {
      severity: 'error',
      path: 'version',
      code: 'unsupported_document_version',
      message: 'version must be "2.0"',
      expected: '"2.0"',
      received: doc.version,
      repairable: true,
      suggestion: 'Set version to "2.0" for CompositionDocument IR.',
    });
  }

  if (typeof doc.id !== 'string' || doc.id.length === 0) {
    issue(issues, {
      severity: 'error',
      path: 'id',
      code: 'missing_composition_id',
      message: 'id must be a non-empty string',
      repairable: true,
    });
  }

  if (doc.pacingProfile !== undefined && !isPacingProfileId(doc.pacingProfile)) {
    issue(issues, {
      severity: 'error',
      path: 'pacingProfile',
      code: 'unsupported_pacing_profile',
      message: `Unsupported pacing profile "${String(doc.pacingProfile)}"`,
      expected: 'explainer-v1',
      received: doc.pacingProfile,
      repairable: true,
      suggestion: 'Use the versioned "explainer-v1" pacing profile.',
    });
  }

  for (const numField of ['width', 'height', 'fps'] as const) {
    const value = doc[numField];
    if (value !== undefined && (typeof value !== 'number' || value <= 0)) {
      issue(issues, {
        severity: 'error',
        path: numField,
        code: 'invalid_positive_number',
        message: `${numField} must be a positive number`,
        repairable: true,
      });
    }
  }

  if (!Array.isArray(doc.scenes) || doc.scenes.length === 0) {
    issue(issues, {
      severity: 'error',
      path: 'scenes',
      code: 'missing_scenes',
      message: 'scenes must be a non-empty array',
      repairable: true,
    });
    return issues;
  }

  const seenSceneIds = new Set<string>();
  const addressableIds = new Set<string>();

  doc.scenes.forEach((scene, sceneIndex) => {
    const scenePath = `scenes[${sceneIndex}]`;
    if (!isObject(scene)) {
      issue(issues, {
        severity: 'error',
        path: scenePath,
        code: 'expected_scene_object',
        message: `${scenePath} must be an object`,
        repairable: true,
      });
      return;
    }

    const sceneType = scene.type;
    if (typeof sceneType !== 'string' || !SCENE_TYPES.includes(sceneType as never)) {
      issue(issues, {
        severity: 'error',
        path: `${scenePath}.type`,
        code: 'unsupported_scene_type',
        message: `${scenePath}.type must be one of ${SCENE_TYPES.join(', ')}`,
        repairable: true,
      });
      return;
    }

    if (typeof scene.id !== 'string' || scene.id.length === 0) {
      issue(issues, {
        severity: 'error',
        path: `${scenePath}.id`,
        code: 'missing_scene_id',
        message: `${scenePath}.id must be a non-empty string`,
        repairable: true,
      });
    } else if (seenSceneIds.has(scene.id)) {
      issue(issues, {
        severity: 'error',
        path: `${scenePath}.id`,
        code: 'duplicate_scene_id',
        message: `Duplicate scene id "${scene.id}"`,
        repairable: true,
      });
    } else {
      seenSceneIds.add(scene.id);
    }

    const typedScene = scene as SceneSpec;
    for (const id of collectAddressableIds(typedScene)) {
      if (addressableIds.has(id)) {
        issue(issues, {
          severity: 'error',
          path: `${scenePath}.id`,
          code: 'duplicate_addressable_id',
          message: `Duplicate addressable id "${id}"`,
          repairable: true,
        });
      } else {
        addressableIds.add(id);
      }
    }

    if (typedScene.type === 'whiteboard') {
      validateWhiteboardScene(typedScene, scenePath, issues);
    } else if (typedScene.type === 'code') {
      validateCodeScene(typedScene, scenePath, issues);
    } else if (typedScene.type === 'diagram') {
      validateDiagramScene(typedScene, scenePath, issues);
    } else {
      validatePlaceholderScene(typedScene, scenePath, issues);
    }

    if (Array.isArray(typedScene.annotations)) {
      typedScene.annotations.forEach((annotation, annotationIndex) => {
        validateAnnotation(
          annotation,
          `${scenePath}.annotations[${annotationIndex}]`,
          issues
        );
      });
    }
  });

  if (doc.chapters !== undefined) {
    validateChapters(doc.chapters, seenSceneIds, issues);
  }

  if (Array.isArray(doc.annotations)) {
    doc.annotations.forEach((annotation, index) => {
      validateAnnotation(annotation, `annotations[${index}]`, issues);
    });
  }

  const annotationTargets: Array<{ path: string; targetId: string }> = [];
  if (Array.isArray(doc.annotations)) {
    doc.annotations.forEach((annotation, index) => {
      if (isObject(annotation) && typeof annotation.targetId === 'string') {
        annotationTargets.push({
          path: `annotations[${index}].targetId`,
          targetId: annotation.targetId,
        });
      }
    });
  }
  doc.scenes.forEach((scene, sceneIndex) => {
    if (!isObject(scene) || !Array.isArray(scene.annotations)) return;
    scene.annotations.forEach((annotation, annotationIndex) => {
      if (isObject(annotation) && typeof annotation.targetId === 'string') {
        annotationTargets.push({
          path: `scenes[${sceneIndex}].annotations[${annotationIndex}].targetId`,
          targetId: annotation.targetId,
        });
      }
    });
  });

  for (const { path, targetId } of annotationTargets) {
    if (!addressableIds.has(targetId)) {
      issue(issues, {
        severity: 'error',
        path,
        code: 'unknown_annotation_target',
        message: `Annotation targetId "${targetId}" does not match any addressable id`,
        repairable: true,
        suggestion: 'Use an existing scene, node, or edge id as targetId.',
      });
    }
  }

  return issues;
}

export function assertValidCompositionDocument(
  input: unknown
): asserts input is CompositionDocument {
  const issues = validateCompositionDocument(input);
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Invalid composition document:\n${errors.map((e) => ` - ${e.message}`).join('\n')}`
    );
  }
}
