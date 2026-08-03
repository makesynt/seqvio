import {
  EDITORIAL_PLAN_FORMAT,
  VISUAL_DESIGN_BRIEF_FORMAT,
  type EditorialPlan,
  type VisualDesignBrief,
} from './schema';
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
