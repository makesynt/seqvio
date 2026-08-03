import type { EditorialPlan, VisualDesignBrief } from './schema';

function bullets(values: string[] | undefined, empty = 'None declared.'): string {
  return values?.length ? values.map((value) => `- ${value}`).join('\n') : empty;
}
export function formatEditorialPlanMarkdown(plan: EditorialPlan): string {
  const concepts = plan.concepts.map((concept) => [
    `### ${concept.claim}`,
    '',
    `- ID: \`${concept.id}\``,
    `- Decision: **${concept.decision}**`,
    `- Role: ${concept.role}`,
    `- Reason: ${concept.reason}`,
    `- Prerequisites: ${(concept.prerequisites ?? []).map((id) => `\`${id}\``).join(', ') || 'none'}`,
    concept.estimatedSeconds === undefined ? '' : `- Estimate: ${concept.estimatedSeconds}s`,
  ].filter(Boolean).join('\n')).join('\n\n');

  const sections = plan.sections.map((section, index) => [
    `### ${index + 1}. ${section.title}`,
    '',
    `- ID: \`${section.id}\``,
    `- Purpose: ${section.purpose}`,
    `- Concepts: ${section.conceptIds.map((id) => `\`${id}\``).join(', ')}`,
    `- Audience outcome: ${section.expectedOutcome}`,
    section.targetSeconds === undefined ? '' : `- Target: ${section.targetSeconds}s`,
  ].filter(Boolean).join('\n')).join('\n\n');

  return `---\nformat: ${plan.format}\nid: ${plan.id}\nduration_budget_sec: ${plan.durationBudgetSec}\n---\n\n# Editorial Plan: ${plan.title}\n\n## Objective\n\n${plan.objective}\n\n## Audience\n\n${plan.audience.description}\n\n### Prior Knowledge\n\n${bullets(plan.audience.priorKnowledge)}\n\n### Likely Misconceptions\n\n${bullets(plan.audience.likelyMisconceptions)}\n\n## Thesis\n\n${plan.thesis}\n\n## Content Decisions\n\n${concepts}\n\n## Explanation Structure\n\n${sections}\n`;
}

export function formatVisualDesignBriefMarkdown(brief: VisualDesignBrief): string {
  const palette = brief.palette.map((item) => `| ${item.role} | \`${item.value}\` | ${item.use} |`).join('\n');
  const typography = brief.typography.map((item) => `| ${item.role} | ${item.family} | ${item.sizePx}px | ${item.weight ?? 'normal'} | ${item.use} |`).join('\n');
  const treatments = brief.sceneTreatments?.map((item) => `### ${item.sectionId}\n\n- Visual form: ${item.visualForm}\n- Composition: ${item.composition}\n- Emphasis: ${item.emphasis}`).join('\n\n') ?? 'No section-specific treatments.';

  return `---\nformat: ${brief.format}\nid: ${brief.id}\ncanvas: ${brief.canvas.width}x${brief.canvas.height}\n---\n\n# Visual Design Brief: ${brief.title}\n\n## Direction\n\n${brief.direction}\n\n## Canvas\n\n- Size: ${brief.canvas.width} x ${brief.canvas.height}\n- Background: \`${brief.canvas.background}\`\n- Safe area: ${brief.canvas.safeAreaPx ?? 'not specified'} px\n\n## Palette\n\n| Role | Value | Use |\n|---|---|---|\n${palette}\n\n## Typography\n\n| Role | Family | Size | Weight | Use |\n|---|---|---:|---:|---|\n${typography}\n\n## Layout Rules\n\n${bullets(brief.layoutRules)}\n\n## Motion Rules\n\n${bullets(brief.motionRules)}\n\n## Section Treatments\n\n${treatments}\n\n## Avoid\n\n${bullets(brief.avoid)}\n`;
}
