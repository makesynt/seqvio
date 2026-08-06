import type { AttentionSequenceItem } from '../annotation';
import { validateAttentionSequence } from '../annotation';
import type { ExplainerDocument } from '../explainer-document';
import { deriveDirectionPlan, type DirectionPlan, validateDirectionPlan } from '../direction';
import type { MotionGrammar } from '../motion-grammar';
import { validateMotionGrammar } from '../motion-grammar';

export const DIRECTOR_TASK_FORMAT = 'seqvio-director-task' as const;
export const DIRECTOR_TASK_VERSION = '1.0' as const;

export type DirectorTaskMode = 'generate' | 'repair';
export type DirectorArtifactKind = 'directionPlan' | 'attentionSequence' | 'motionGrammar';

export interface DirectorArtifactBundle {
  directionPlan?: DirectionPlan;
  attentionSequence?: AttentionSequenceItem[];
  motionGrammar?: MotionGrammar;
}

export interface DirectorDiagnostic {
  artifact: DirectorArtifactKind;
  code: string;
  path: string;
  message: string;
  suggestion: string;
}

export interface DirectorTask {
  format: typeof DIRECTOR_TASK_FORMAT;
  version: typeof DIRECTOR_TASK_VERSION;
  id: string;
  mode: DirectorTaskMode;
  approvedDocumentId: string;
  requestedArtifacts: DirectorArtifactKind[];
  constraints: string[];
  baseline: DirectorArtifactBundle;
  candidate?: DirectorArtifactBundle;
  diagnostics: DirectorDiagnostic[];
  outputContract: {
    format: 'seqvio-director-result';
    version: '1.0';
    artifacts: DirectorArtifactKind[];
  };
}

const suggestionFor = (code: string): string => {
  if (code.includes('target')) return 'Reference a stable target id that exists in the owning scene.';
  if (code.includes('transition')) return 'Pair the source and destination targets and keep a following segment.';
  if (code.includes('focus') || code.includes('camera')) return 'Use one compatible focus path and camera intent.';
  if (code.includes('trace')) return 'Provide an ordered path with at least two stable target ids.';
  if (code.includes('compare')) return 'Provide both the primary and related comparison targets.';
  if (code.includes('clear') || code.includes('handoff')) return 'Add an explicit clear or a valid semantic handoff target.';
  return 'Repair the versioned artifact while preserving approved document ids and evidence order.';
};

export function validateDirectorArtifacts(bundle: DirectorArtifactBundle, document: ExplainerDocument): DirectorDiagnostic[] {
  const diagnostics: DirectorDiagnostic[] = [];
  for (const item of bundle.directionPlan ? validateDirectionPlan(bundle.directionPlan, document) : []) {
    diagnostics.push({ artifact: 'directionPlan', code: item.code, path: item.path, message: item.message, suggestion: suggestionFor(item.code) });
  }
  for (const item of bundle.attentionSequence ? validateAttentionSequence(bundle.attentionSequence) : []) {
    diagnostics.push({ artifact: 'attentionSequence', code: item.code, path: item.itemId, message: item.message, suggestion: suggestionFor(item.code) });
  }
  for (const item of bundle.motionGrammar ? validateMotionGrammar(bundle.motionGrammar, document) : []) {
    diagnostics.push({ artifact: 'motionGrammar', code: item.code, path: item.path, message: item.message, suggestion: suggestionFor(item.code) });
  }
  return diagnostics;
}

export function createDirectorTask(document: ExplainerDocument, mode: DirectorTaskMode, candidate?: DirectorArtifactBundle): DirectorTask {
  const requestedArtifacts: DirectorArtifactKind[] = ['directionPlan', 'attentionSequence', 'motionGrammar'];
  const baselineAttention = document.scenes.flatMap((scene) => scene.type === 'infographic' ? (scene.attention ?? []) : []);
  const baseline: DirectorArtifactBundle = {
    directionPlan: deriveDirectionPlan(document),
    attentionSequence: baselineAttention,
  };
  return {
    format: DIRECTOR_TASK_FORMAT,
    version: DIRECTOR_TASK_VERSION,
    id: `${document.id}.director.${mode}`,
    mode,
    approvedDocumentId: document.id,
    requestedArtifacts,
    constraints: [
      'Preserve scene ids, target ids, ExplanationBeat ids, and evidence order.',
      'Express intent as semantic artifacts; do not emit renderer code or pixel-level animation.',
      'Keep every action deterministic at an arbitrary seek frame.',
      'Return only the versioned director result contract for local validation.',
    ],
    baseline,
    candidate,
    diagnostics: mode === 'repair' && candidate ? validateDirectorArtifacts(candidate, document) : [],
    outputContract: { format: 'seqvio-director-result', version: '1.0', artifacts: requestedArtifacts },
  };
}
