/**
 * Runtime validation for ExplainerDocument.
 */

import { validateStoryboard, type StoryboardIssue } from '../storyboard/validate';
import {
  ANNOTATION_KINDS,
  type AnnotationSpec,
  type ChapterSpec,
  type CodeSceneSpec,
  EXPLAINER_DOCUMENT_FORMAT,
  EXPLAINER_DOCUMENT_SCHEMA_VERSION,
  type ExplainerDocument,
  type DiagramSceneSpec,
  type InfographicSceneSpec,
  type ManimSceneSpec,
  type SceneExplanationSpec,
  type SceneSpec,
  type WhiteboardSceneSpec,
} from './schema';
import { SCENE_TYPES, isSceneType } from './capabilities';
import { isPacingProfileId } from '../pacing';
import { findNarrationAnchorMatches, normalizeNarrationText } from '../narration-anchor';

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

function validateInfographicScene(
  scene: InfographicSceneSpec,
  scenePath: string,
  issues: CompositionIssue[],
): void {
  const collections = [
    ['metrics', scene.metrics],
    ['comparisons', scene.comparisons],
    ['process', scene.process],
    ['timeline', scene.timeline],
    ['relationshipNodes', scene.relationshipNodes],
    ['relationships', scene.relationships],
    ['charts', scene.charts],
  ] as const;
  const ids = new Set<string>();
  for (const [name, items] of collections) {
    if (!items) continue;
    items.forEach((item, index) => {
      const itemPath = `${scenePath}.${name}[${index}]`;
      if (typeof item.id !== 'string' || item.id.length === 0) {
        issue(issues, { severity: 'error', path: `${itemPath}.id`, code: 'missing_infographic_item_id', message: `${itemPath}.id must be a non-empty string`, repairable: true });
      } else if (ids.has(item.id)) {
        issue(issues, { severity: 'error', path: `${itemPath}.id`, code: 'duplicate_infographic_item_id', message: `Duplicate infographic item id "${item.id}"`, repairable: true });
      } else ids.add(item.id);
      if (name !== 'relationships' && name !== 'charts' && (!('label' in item) || typeof item.label !== 'string' || item.label.length === 0)) {
        issue(issues, { severity: 'error', path: `${itemPath}.label`, code: 'missing_infographic_item_label', message: `${itemPath}.label must be a non-empty string`, repairable: true });
      }
      if (name === 'charts' && (!('title' in item) || typeof item.title !== 'string' || item.title.length === 0)) {
        issue(issues, { severity: 'error', path: `${itemPath}.title`, code: 'missing_infographic_chart_title', message: `${itemPath}.title must be a non-empty string`, repairable: true });
      }
      if ('at' in item && item.at !== undefined && (typeof item.at !== 'number' || item.at < 0)) {
        issue(issues, { severity: 'error', path: `${itemPath}.at`, code: 'invalid_infographic_item_time', message: `${itemPath}.at must be a non-negative number`, repairable: true });
      }
    });
  }
  const nodeIds = new Set((scene.relationshipNodes ?? []).map((node) => node.id));
  (scene.relationships ?? []).forEach((relationship, index) => {
    if (!nodeIds.has(relationship.from)) issue(issues, { severity: 'error', path: `${scenePath}.relationships[${index}].from`, code: 'invalid_infographic_relationship_from', message: 'Relationship source must reference a relationship node', repairable: true });
    if (!nodeIds.has(relationship.to)) issue(issues, { severity: 'error', path: `${scenePath}.relationships[${index}].to`, code: 'invalid_infographic_relationship_to', message: 'Relationship target must reference a relationship node', repairable: true });
  });
  (scene.charts ?? []).forEach((chart, chartIndex) => {
    const chartPath = `${scenePath}.charts[${chartIndex}]`;
    if (chart.kind !== 'bar' && chart.kind !== 'line') issue(issues, { severity: 'error', path: `${chartPath}.kind`, code: 'invalid_infographic_chart_kind', message: 'Chart kind must be bar or line', repairable: true });
    if (!Array.isArray(chart.series) || chart.series.length === 0) {
      issue(issues, { severity: 'error', path: `${chartPath}.series`, code: 'missing_infographic_chart_series', message: 'Chart must contain at least one data series', repairable: true });
    }
    const seriesIds = new Set<string>();
    (chart.series ?? []).forEach((series, seriesIndex) => {
      const seriesPath = `${chartPath}.series[${seriesIndex}]`;
      if (!series.id || seriesIds.has(series.id)) issue(issues, { severity: 'error', path: `${seriesPath}.id`, code: series.id ? 'duplicate_infographic_series_id' : 'missing_infographic_series_id', message: 'Chart series ids must be non-empty and unique within the chart', repairable: true });
      else seriesIds.add(series.id);
      if (!series.label) issue(issues, { severity: 'error', path: `${seriesPath}.label`, code: 'missing_infographic_series_label', message: 'Chart series label is required', repairable: true });
      if (!Array.isArray(series.points) || series.points.length === 0 || series.points.some((point) => typeof point.x !== 'string' || !Number.isFinite(point.y))) {
        issue(issues, { severity: 'error', path: `${seriesPath}.points`, code: 'invalid_infographic_chart_points', message: 'Chart points require a string x value and finite numeric y value', repairable: true });
      }
    });
    if (chart.yAxis?.min !== undefined && chart.yAxis?.max !== undefined && chart.yAxis.min >= chart.yAxis.max) {
      issue(issues, { severity: 'error', path: `${chartPath}.yAxis`, code: 'invalid_infographic_axis_domain', message: 'yAxis min must be less than max', repairable: true });
    }
  });
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

function validateManimScene(scene: ManimSceneSpec, scenePath: string, issues: CompositionIssue[]): void {
  if (typeof scene.sourceVideo !== 'string' || !scene.sourceVideo.trim()) {
    issue(issues, { severity: 'error', path: `${scenePath}.sourceVideo`, code: 'missing_manim_media', message: `${scenePath}.sourceVideo must reference rendered media`, repairable: true });
  }
  const markerIds = new Set<string>();
  const beatIds = new Set((scene.explanation?.beats ?? []).map((beat) => beat.id));
  (scene.markers ?? []).forEach((marker, index) => {
    const path = `${scenePath}.markers[${index}]`;
    if (!marker.id) issue(issues, { severity: 'error', path: `${path}.id`, code: 'missing_manim_marker_id', message: `${path}.id is required`, repairable: true });
    else if (markerIds.has(marker.id)) issue(issues, { severity: 'error', path: `${path}.id`, code: 'duplicate_manim_marker_id', message: `Duplicate Manim marker id "${marker.id}"`, repairable: true });
    else markerIds.add(marker.id);
    if (!Number.isInteger(marker.frame) || marker.frame < 0) issue(issues, { severity: 'error', path: `${path}.frame`, code: 'invalid_manim_marker_frame', message: `${path}.frame must be a non-negative integer`, repairable: true });
    if (marker.beatId && !beatIds.has(marker.beatId)) issue(issues, { severity: 'error', path: `${path}.beatId`, code: 'unknown_manim_marker_beat', message: `${path}.beatId must reference an ExplanationBeat in the same scene`, repairable: true });
  });
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
  if (annotation.kind === 'connector' && (typeof annotation.toTargetId !== 'string' || annotation.toTargetId.length === 0)) {
    issue(issues, {
      severity: 'error', path: `${path}.toTargetId`, code: 'missing_connector_target',
      message: `${path}.toTargetId must be a non-empty string for connector annotations`, repairable: true,
    });
  }
  if (annotation.kind === 'guided-path' && (!Array.isArray(annotation.pathTargetIds) || annotation.pathTargetIds.length < 2)) {
    issue(issues, {
      severity: 'error', path: `${path}.pathTargetIds`, code: 'invalid_guided_path_targets',
      message: `${path}.pathTargetIds must contain at least two target ids`, repairable: true,
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
    for (const step of scene.steps) {
      if (step.id) ids.push(step.id);
    }
  } else if (scene.type === 'whiteboard') {
    for (const element of scene.elements) {
      if (typeof element.id === 'string' && element.id.length > 0) {
        ids.push(element.id);
      }
    }
  } else if (scene.type === 'code') {
    for (const step of scene.steps) {
      if (step.id) ids.push(step.id);
    }
  } else if (scene.type === 'infographic') {
    for (const item of [
      ...(scene.metrics ?? []),
      ...(scene.comparisons ?? []),
      ...(scene.process ?? []),
      ...(scene.timeline ?? []),
      ...(scene.relationshipNodes ?? []),
      ...(scene.relationships ?? []),
      ...(scene.charts ?? []),
    ]) ids.push(item.id);
    for (const chart of scene.charts ?? []) for (const series of chart.series ?? []) ids.push(series.id);
  } else if (scene.type === 'terminal' || scene.type === 'browser') {
    for (const step of scene.steps ?? []) ids.push(step.id);
    if (scene.type === 'browser') {
      for (const target of scene.focusTargets ?? []) {
        if (target.id) ids.push(target.id);
      }
    }
  } else if (scene.type === 'manim') {
    for (const marker of scene.markers ?? []) {
      ids.push(marker.id);
      if (marker.targetId) ids.push(marker.targetId);
    }
  }
  for (const annotation of scene.annotations ?? []) ids.push(annotation.id);
  return ids;
}

function validateExplanation(
  explanation: SceneExplanationSpec,
  scene: SceneSpec,
  scenePath: string,
  issues: CompositionIssue[],
): void {
  const path = `${scenePath}.explanation`;
  if (typeof scene.narration === 'string' && scene.narration.trim()) {
    issue(issues, {
      severity: 'error',
      path,
      code: 'conflicting_scene_narration',
      message: `${scenePath} cannot define both narration and explanation`,
      repairable: true,
    });
  }
  if (!Array.isArray(explanation.cues) || explanation.cues.length === 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.cues`,
      code: 'missing_explanation_cues',
      message: `${path}.cues must be a non-empty array`,
      repairable: true,
    });
    return;
  }
  if (!Array.isArray(explanation.beats) || explanation.beats.length === 0) {
    issue(issues, {
      severity: 'error',
      path: `${path}.beats`,
      code: 'missing_explanation_beats',
      message: `${path}.beats must be a non-empty array`,
      repairable: true,
    });
    return;
  }

  const cues = new Map<string, { text: string; path: string }>();
  explanation.cues.forEach((cue, index) => {
    const cuePath = `${path}.cues[${index}]`;
    if (!isObject(cue) || typeof cue.id !== 'string' || !cue.id.trim()) {
      issue(issues, {
        severity: 'error', path: `${cuePath}.id`, code: 'missing_explanation_cue_id',
        message: `${cuePath}.id must be a non-empty string`, repairable: true,
      });
      return;
    }
    if (cues.has(cue.id)) {
      issue(issues, {
        severity: 'error', path: `${cuePath}.id`, code: 'duplicate_explanation_cue_id',
        message: `Duplicate explanation cue id "${cue.id}"`, repairable: true,
      });
    }
    if (typeof cue.text !== 'string' || !normalizeNarrationText(cue.text)) {
      issue(issues, {
        severity: 'error', path: `${cuePath}.text`, code: 'missing_explanation_cue_text',
        message: `${cuePath}.text must be a non-empty string`, repairable: true,
      });
    }
    cues.set(cue.id, { text: typeof cue.text === 'string' ? cue.text : '', path: cuePath });
  });

  const addressableIds = new Set(collectAddressableIds(scene));
  const captureStepIds = new Set(
    scene.type === 'terminal' || scene.type === 'browser'
      ? (scene.steps ?? []).map((step) => step.id)
      : [],
  );
  const beatIds = new Set<string>();
  const priorAnchorIndexByCue = new Map<string, number>();
  explanation.beats.forEach((beat, index) => {
    const beatPath = `${path}.beats[${index}]`;
    if (!isObject(beat) || typeof beat.id !== 'string' || !beat.id.trim()) {
      issue(issues, {
        severity: 'error', path: `${beatPath}.id`, code: 'missing_explanation_beat_id',
        message: `${beatPath}.id must be a non-empty string`, repairable: true,
      });
      return;
    }
    if (beatIds.has(beat.id)) {
      issue(issues, {
        severity: 'error', path: `${beatPath}.id`, code: 'duplicate_explanation_beat_id',
        message: `Duplicate explanation beat id "${beat.id}"`, repairable: true,
      });
    }
    beatIds.add(beat.id);
    if (typeof beat.cueId !== 'string' || !cues.has(beat.cueId)) {
      issue(issues, {
        severity: 'error', path: `${beatPath}.cueId`, code: 'unknown_explanation_cue',
        message: `${beatPath}.cueId must reference an explanation cue`, repairable: true,
      });
    }
    if (!isObject(beat.anchor) || typeof beat.anchor.text !== 'string' || !normalizeNarrationText(beat.anchor.text)) {
      issue(issues, {
        severity: 'error', path: `${beatPath}.anchor`, code: 'missing_beat_anchor',
        message: `${beatPath}.anchor.text must be a non-empty string`, repairable: true,
      });
    } else if (typeof beat.cueId === 'string' && cues.has(beat.cueId)) {
      const occurrence = beat.anchor.occurrence;
      if (occurrence !== undefined && (!Number.isInteger(occurrence) || occurrence < 1)) {
        issue(issues, {
          severity: 'error', path: `${beatPath}.anchor.occurrence`, code: 'invalid_beat_anchor_occurrence',
          message: `${beatPath}.anchor.occurrence must be a positive integer`, repairable: true,
        });
      }
      const matches = findNarrationAnchorMatches(cues.get(beat.cueId)!.text, beat.anchor.text);
      if (matches.length === 0 || (occurrence !== undefined && matches[occurrence - 1] === undefined)) {
        issue(issues, {
          severity: 'error', path: `${beatPath}.anchor.text`, code: 'missing_beat_anchor',
          message: `Anchor "${beat.anchor.text}" was not found in cue "${beat.cueId}"`, repairable: true,
        });
      } else if (occurrence === undefined && matches.length > 1) {
        issue(issues, {
          severity: 'error', path: `${beatPath}.anchor`, code: 'ambiguous_beat_anchor',
          message: `Anchor "${beat.anchor.text}" occurs ${matches.length} times; set occurrence`, repairable: true,
        });
      } else {
        const anchorIndex = matches[(occurrence ?? 1) - 1];
        const previous = priorAnchorIndexByCue.get(beat.cueId);
        if (previous !== undefined && anchorIndex < previous) {
          issue(issues, {
            severity: 'error', path: `${beatPath}.anchor`, code: 'non_monotonic_beat_anchor',
            message: `Beat anchor order reverses within cue "${beat.cueId}"`, repairable: true,
          });
        }
        priorAnchorIndexByCue.set(beat.cueId, anchorIndex);
      }
    }

    if (!Array.isArray(beat.visuals) || beat.visuals.length === 0) {
      issue(issues, {
        severity: 'error', path: `${beatPath}.visuals`, code: 'missing_beat_visuals',
        message: `${beatPath}.visuals must be a non-empty array`, repairable: true,
      });
    } else {
      beat.visuals.forEach((visual, visualIndex) => {
        const visualPath = `${beatPath}.visuals[${visualIndex}]`;
        if (!isObject(visual) || typeof visual.targetId !== 'string' || !addressableIds.has(visual.targetId)) {
          issue(issues, {
            severity: 'error', path: `${visualPath}.targetId`, code: 'unknown_beat_visual_target',
            message: `${visualPath}.targetId must reference an addressable element in the scene`, repairable: true,
          });
        }
        if (!isObject(visual) || !['reveal', 'highlight', 'focus', 'annotate'].includes(String(visual.action))) {
          issue(issues, {
            severity: 'error', path: `${visualPath}.action`, code: 'unsupported_beat_visual_action',
            message: `${visualPath}.action is unsupported`, repairable: true,
          });
        }
        if (isObject(visual) && visual.offsetMs !== undefined && !Number.isFinite(visual.offsetMs)) {
          issue(issues, {
            severity: 'error', path: `${visualPath}.offsetMs`, code: 'invalid_beat_visual_offset',
            message: `${visualPath}.offsetMs must be finite`, repairable: true,
          });
        }
        if (isObject(visual) && visual.minHoldMs !== undefined &&
          (!Number.isFinite(visual.minHoldMs) || Number(visual.minHoldMs) <= 0)) {
          issue(issues, {
            severity: 'error', path: `${visualPath}.minHoldMs`, code: 'invalid_beat_visual_hold',
            message: `${visualPath}.minHoldMs must be greater than zero`, repairable: true,
          });
        }
      });
    }

    const captureStepId = isObject(beat.evidence) ? beat.evidence.captureStepId : undefined;
    if (captureStepId !== undefined &&
      (typeof captureStepId !== 'string' || !captureStepIds.has(captureStepId))) {
      issue(issues, {
        severity: 'error', path: `${beatPath}.evidence.captureStepId`, code: 'unknown_beat_capture_step',
        message: `${beatPath}.evidence.captureStepId must reference a capture step in this scene`, repairable: true,
      });
    }
  });
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

export function validateExplainerDocument(input: unknown): CompositionIssue[] {
  const issues: CompositionIssue[] = [];

  if (!isObject(input)) {
    return [{
      severity: 'error',
      path: '$',
      code: 'expected_composition_object',
      message: 'ExplainerDocument must be a JSON object',
      expected: 'object',
      received: input,
      repairable: true,
      suggestion: 'Return one JSON object with format "seqvio-explainer", schemaVersion "1.0", id, and scenes.',
    }];
  }

  const doc = input as Partial<ExplainerDocument> & Record<string, unknown>;

  if (doc.format !== EXPLAINER_DOCUMENT_FORMAT) {
    issue(issues, {
      severity: 'error',
      path: 'format',
      code: 'unsupported_document_format',
      message: `format must be "${EXPLAINER_DOCUMENT_FORMAT}"`,
      expected: `"${EXPLAINER_DOCUMENT_FORMAT}"`,
      received: doc.format,
      repairable: true,
      suggestion: 'Set format to "seqvio-explainer" for ExplainerDocument IR.',
    });
  }

  if (doc.schemaVersion !== EXPLAINER_DOCUMENT_SCHEMA_VERSION) {
    issue(issues, {
      severity: 'error',
      path: 'schemaVersion',
      code: 'unsupported_schema_version',
      message: `schemaVersion must be "${EXPLAINER_DOCUMENT_SCHEMA_VERSION}"`,
      expected: `"${EXPLAINER_DOCUMENT_SCHEMA_VERSION}"`,
      received: doc.schemaVersion,
      repairable: true,
      suggestion: 'Set schemaVersion to "1.0". This field is an implementation compatibility marker, not the product name.',
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
    if (!isSceneType(sceneType)) {
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
    } else if (typedScene.type === 'infographic') {
      validateInfographicScene(typedScene, scenePath, issues);
    } else if (typedScene.type === 'manim') {
      validateManimScene(typedScene, scenePath, issues);
    } else {
      validatePlaceholderScene(typedScene, scenePath, issues);
    }

    if (typedScene.explanation !== undefined) {
      if (!isObject(typedScene.explanation)) {
        issue(issues, {
          severity: 'error', path: `${scenePath}.explanation`, code: 'invalid_scene_explanation',
          message: `${scenePath}.explanation must be an object`, repairable: true,
        });
      } else {
        validateExplanation(typedScene.explanation, typedScene, scenePath, issues);
      }
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
      if (isObject(annotation) && typeof annotation.toTargetId === 'string') {
        annotationTargets.push({
          path: `annotations[${index}].toTargetId`,
          targetId: annotation.toTargetId,
        });
      }
      if (isObject(annotation) && Array.isArray(annotation.pathTargetIds)) {
        annotation.pathTargetIds.forEach((targetId, targetIndex) => {
          if (typeof targetId === 'string') annotationTargets.push({ path: `annotations[${index}].pathTargetIds[${targetIndex}]`, targetId });
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
      if (isObject(annotation) && typeof annotation.toTargetId === 'string') {
        annotationTargets.push({
          path: `scenes[${sceneIndex}].annotations[${annotationIndex}].toTargetId`,
          targetId: annotation.toTargetId,
        });
      }
      if (isObject(annotation) && Array.isArray(annotation.pathTargetIds)) {
        annotation.pathTargetIds.forEach((targetId, targetIndex) => {
          if (typeof targetId === 'string') annotationTargets.push({ path: `scenes[${sceneIndex}].annotations[${annotationIndex}].pathTargetIds[${targetIndex}]`, targetId });
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

export function assertValidExplainerDocument(
  input: unknown
): asserts input is ExplainerDocument {
  const issues = validateExplainerDocument(input);
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(
      `Invalid explainer document:\n${errors.map((e) => ` - ${e.message}`).join('\n')}`
    );
  }
}
