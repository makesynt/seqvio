import {
  EDITORIAL_PLAN_FORMAT,
  VISUAL_DESIGN_BRIEF_FORMAT,
  type EditorialPlan,
  type VisualDesignBrief,
} from './schema';
import { isExplanationPatternId } from './patterns';
import {
  EXPLAINER_DOCUMENT_DEFAULTS,
  type ExplainerDocument,
} from '../explainer-document/schema';

export interface AuthoringIssue {
  severity: 'error' | 'warning';
  path: string;
  code: string;
  message: string;
}
function duplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
}

export function validateEditorialPlan(plan: EditorialPlan): AuthoringIssue[] {
  const issues: AuthoringIssue[] = [];
  if (plan.format !== EDITORIAL_PLAN_FORMAT) {
    issues.push({ severity: 'error', path: 'format', code: 'invalid_format', message: `Expected ${EDITORIAL_PLAN_FORMAT}.` });
  }
  if (!plan.objective.trim() || !plan.thesis.trim()) {
    issues.push({ severity: 'error', path: 'objective', code: 'missing_editorial_core', message: 'Objective and thesis must both be explicit.' });
  }
  if (!Number.isFinite(plan.durationBudgetSec) || plan.durationBudgetSec <= 0) {
    issues.push({ severity: 'error', path: 'durationBudgetSec', code: 'invalid_duration_budget', message: 'Duration budget must be greater than zero.' });
  }

  const strategy = plan.explanationStrategy;
  if (strategy) {
    if (!Array.isArray(strategy.patterns) || strategy.patterns.length === 0) {
      issues.push({ severity: 'warning', path: 'explanationStrategy.patterns', code: 'empty_explanation_strategy', message: 'Omit explanationStrategy when no library pattern improves the plan.' });
    } else {
      const selections = strategy.patterns as unknown[];
      if (strategy.patterns.length > 2) {
        issues.push({ severity: 'warning', path: 'explanationStrategy.patterns', code: 'too_many_explanation_patterns', message: 'More than two patterns usually weakens the editorial focus; keep only patterns that materially shape the explanation.' });
      }
      const ids = selections.map((selection) => (
        selection && typeof selection === 'object' && 'id' in selection
          ? String((selection as { id?: unknown }).id)
          : ''
      ));
      for (const id of duplicateIds(ids)) {
        issues.push({ severity: 'error', path: 'explanationStrategy.patterns', code: 'duplicate_explanation_pattern', message: `Explanation pattern "${id}" is selected more than once.` });
      }
      const primaryCount = selections.filter((selection) => (
        selection && typeof selection === 'object' && (selection as { role?: unknown }).role === 'primary'
      )).length;
      if (primaryCount !== 1) {
        issues.push({ severity: 'error', path: 'explanationStrategy.patterns', code: 'invalid_primary_pattern_count', message: 'A selected strategy must contain exactly one primary pattern.' });
      }
      selections.forEach((rawSelection, index) => {
        const selectionPath = `explanationStrategy.patterns[${index}]`;
        if (!rawSelection || typeof rawSelection !== 'object') {
          issues.push({ severity: 'error', path: selectionPath, code: 'invalid_explanation_pattern_selection', message: 'Pattern selection must be an object.' });
          return;
        }
        const selection = rawSelection as { id?: unknown; role?: unknown; reason?: unknown };
        if (!isExplanationPatternId(selection.id)) {
          issues.push({ severity: 'error', path: `${selectionPath}.id`, code: 'unknown_explanation_pattern', message: `Unknown explanation pattern "${String(selection.id)}".` });
        }
        if (selection.role !== 'primary' && selection.role !== 'supporting') {
          issues.push({ severity: 'error', path: `${selectionPath}.role`, code: 'invalid_explanation_pattern_role', message: 'Pattern role must be primary or supporting.' });
        }
        if (typeof selection.reason !== 'string' || !selection.reason.trim()) {
          issues.push({ severity: 'warning', path: `${selectionPath}.reason`, code: 'missing_explanation_pattern_reason', message: 'Explain why this pattern fits the source, or remove the selection.' });
        }
      });
    }
  }

  for (const id of duplicateIds(plan.concepts.map((concept) => concept.id))) {
    issues.push({ severity: 'error', path: 'concepts', code: 'duplicate_concept_id', message: `Concept id "${id}" is duplicated.` });
  }
  for (const id of duplicateIds(plan.sections.map((section) => section.id))) {
    issues.push({ severity: 'error', path: 'sections', code: 'duplicate_section_id', message: `Section id "${id}" is duplicated.` });
  }

  const concepts = new Map(plan.concepts.map((concept) => [concept.id, concept]));
  const included = new Set(plan.concepts.filter((concept) => concept.decision === 'include').map((concept) => concept.id));
  const scheduled = new Set<string>();
  for (const section of plan.sections) {
    if (section.conceptIds.length === 0) {
      issues.push({ severity: 'warning', path: `sections.${section.id}.conceptIds`, code: 'empty_section', message: 'Section does not advance an included concept.' });
    }
    for (const conceptId of section.conceptIds) {
      scheduled.add(conceptId);
      const concept = concepts.get(conceptId);
      if (!concept) {
        issues.push({ severity: 'error', path: `sections.${section.id}.conceptIds`, code: 'unknown_concept', message: `Unknown concept "${conceptId}".` });
      } else if (concept.decision === 'omit') {
        issues.push({ severity: 'error', path: `sections.${section.id}.conceptIds`, code: 'scheduled_omission', message: `Omitted concept "${conceptId}" is scheduled for explanation.` });
      }
    }
  }

  for (const concept of plan.concepts) {
    for (const prerequisite of concept.prerequisites ?? []) {
      if (!concepts.has(prerequisite)) {
        issues.push({ severity: 'error', path: `concepts.${concept.id}.prerequisites`, code: 'unknown_prerequisite', message: `Unknown prerequisite "${prerequisite}".` });
      } else if (concept.decision === 'include' && !included.has(prerequisite)) {
        issues.push({ severity: 'error', path: `concepts.${concept.id}.prerequisites`, code: 'omitted_prerequisite', message: `Included concept "${concept.id}" depends on omitted concept "${prerequisite}".` });
      }
    }
    if (concept.decision === 'include' && !scheduled.has(concept.id)) {
      issues.push({ severity: 'error', path: `concepts.${concept.id}`, code: 'unscheduled_concept', message: `Included concept "${concept.id}" is not used by a section.` });
    }
  }

  const budget = plan.sections.reduce((sum, section) => sum + (section.targetSeconds ?? 0), 0);
  if (budget > plan.durationBudgetSec) {
    issues.push({ severity: 'error', path: 'sections', code: 'duration_budget_exceeded', message: `Section budget ${budget}s exceeds the ${plan.durationBudgetSec}s plan budget.` });
  }
  return issues;
}

export function validateAuthoringTrace(
  plan: EditorialPlan,
  brief: VisualDesignBrief,
  document: ExplainerDocument,
): AuthoringIssue[] {
  const issues = [
    ...validateEditorialPlan(plan),
    ...validateVisualDesignBrief(brief, plan),
  ];
  const treatments = brief.sceneTreatments ?? [];
  const treatmentBySection = new Map(treatments.map((item) => [item.sectionId, item]));
  const scenes = new Map(document.scenes.map((scene) => [scene.id, scene]));
  const plannedScenes = new Set<string>();

  for (const section of plan.sections) {
    if (!treatmentBySection.has(section.id)) {
      issues.push({ severity: 'error', path: `sections.${section.id}`, code: 'missing_visual_treatment', message: `Editorial section "${section.id}" has no visual treatment.` });
    }
  }

  for (const treatment of treatments) {
    if (treatment.sceneIds.length === 0) {
      issues.push({ severity: 'error', path: `sceneTreatments.${treatment.sectionId}.sceneIds`, code: 'empty_scene_treatment', message: `Visual treatment "${treatment.sectionId}" does not name a scene.` });
    }
    for (const sceneId of treatment.sceneIds) {
      plannedScenes.add(sceneId);
      const scene = scenes.get(sceneId);
      if (!scene) {
        issues.push({ severity: 'error', path: `sceneTreatments.${treatment.sectionId}.sceneIds`, code: 'unknown_scene', message: `Visual treatment references unknown scene "${sceneId}".` });
      } else if (scene.type !== treatment.visualForm) {
        issues.push({ severity: 'error', path: `sceneTreatments.${treatment.sectionId}.visualForm`, code: 'visual_form_mismatch', message: `Scene "${sceneId}" is ${scene.type}, not ${treatment.visualForm}.` });
      }
    }
  }

  for (const scene of document.scenes) {
    if (!plannedScenes.has(scene.id)) {
      issues.push({ severity: 'warning', path: `scenes.${scene.id}`, code: 'unplanned_scene', message: `Scene "${scene.id}" is not traced to a visual treatment.` });
    }
  }

  const width = document.width ?? EXPLAINER_DOCUMENT_DEFAULTS.width;
  const height = document.height ?? EXPLAINER_DOCUMENT_DEFAULTS.height;
  if (width !== brief.canvas.width || height !== brief.canvas.height) {
    issues.push({ severity: 'error', path: 'canvas', code: 'canvas_mismatch', message: `Visual brief canvas ${brief.canvas.width}x${brief.canvas.height} does not match ExplainerDocument ${width}x${height}.` });
  }
  return issues;
}

export function validateVisualDesignBrief(brief: VisualDesignBrief, plan?: EditorialPlan): AuthoringIssue[] {
  const issues: AuthoringIssue[] = [];
  if (brief.format !== VISUAL_DESIGN_BRIEF_FORMAT) {
    issues.push({ severity: 'error', path: 'format', code: 'invalid_format', message: `Expected ${VISUAL_DESIGN_BRIEF_FORMAT}.` });
  }
  if (!brief.direction.trim()) {
    issues.push({ severity: 'error', path: 'direction', code: 'missing_direction', message: 'Visual direction must be explicit.' });
  }
  if (brief.canvas.width <= 0 || brief.canvas.height <= 0) {
    issues.push({ severity: 'error', path: 'canvas', code: 'invalid_canvas', message: 'Canvas dimensions must be greater than zero.' });
  }
  if (brief.palette.length < 2) {
    issues.push({ severity: 'warning', path: 'palette', code: 'weak_palette', message: 'Define at least background/ink and accent roles.' });
  }
  if (brief.typography.length === 0) {
    issues.push({ severity: 'error', path: 'typography', code: 'missing_typography', message: 'At least one typography role is required.' });
  }
  if (plan && brief.sceneTreatments) {
    const sectionIds = new Set(plan.sections.map((section) => section.id));
    for (const treatment of brief.sceneTreatments) {
      if (!sectionIds.has(treatment.sectionId)) {
        issues.push({ severity: 'error', path: 'sceneTreatments', code: 'unknown_section', message: `Visual treatment references unknown section "${treatment.sectionId}".` });
      }
    }
  }
  return issues;
}
