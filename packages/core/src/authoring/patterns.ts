import {
  EXPLANATION_PATTERN_IDS,
  type EditorialSectionPurpose,
  type ExplanationPatternId,
} from './schema';

export interface ExplanationPatternStage {
  id: string;
  title: string;
  purpose: EditorialSectionPurpose;
  outcome: string;
}

export interface ExplanationPatternDefinition {
  id: ExplanationPatternId;
  name: string;
  intent: string;
  stages: readonly ExplanationPatternStage[];
  advisoryChecks: readonly string[];
}

export const EXPLANATION_PATTERNS = {
  'causal-diagnosis': {
    id: 'causal-diagnosis',
    name: 'Causal diagnosis',
    intent: 'Explain a failure from observed symptom through root cause and verified repair.',
    stages: [
      { id: 'symptom', title: 'Observed symptom', purpose: 'hook', outcome: 'The audience can state the failure without assuming its cause.' },
      { id: 'expected-path', title: 'Expected mechanism', purpose: 'establish-model', outcome: 'The audience understands the path that should have succeeded.' },
      { id: 'break-point', title: 'Break point', purpose: 'explain-mechanism', outcome: 'The audience can locate where actual behavior diverged.' },
      { id: 'root-cause', title: 'Root cause', purpose: 'explain-mechanism', outcome: 'The audience can connect evidence to the causal explanation.' },
      { id: 'repair', title: 'Repair', purpose: 'demonstrate', outcome: 'The audience understands the change and why it addresses the cause.' },
      { id: 'verification', title: 'Verification', purpose: 'summarize', outcome: 'The audience can distinguish a verified result from a successful command.' },
    ],
    advisoryChecks: ['Keep symptoms separate from inferred causes.', 'End with evidence that verifies the repaired behavior.'],
  },
  'mechanism-trace': {
    id: 'mechanism-trace',
    name: 'Mechanism trace',
    intent: 'Explain how inputs are transformed through state changes into outputs.',
    stages: [
      { id: 'input', title: 'Input and actors', purpose: 'establish-model', outcome: 'The audience knows the starting state and relevant objects.' },
      { id: 'transformations', title: 'Transformations', purpose: 'explain-mechanism', outcome: 'The audience can follow the ordered changes.' },
      { id: 'state', title: 'State change', purpose: 'explain-mechanism', outcome: 'The audience understands what is different after each operation.' },
      { id: 'output', title: 'Output', purpose: 'demonstrate', outcome: 'The audience connects the mechanism to its observable result.' },
      { id: 'boundary', title: 'Boundary conditions', purpose: 'summarize', outcome: 'The audience knows when the model does and does not apply.' },
    ],
    advisoryChecks: ['Name the state changed by each important operation.', 'Do not replace mechanism with a list of component names.'],
  },
  'system-flow': {
    id: 'system-flow',
    name: 'System flow',
    intent: 'Follow a request, event, or data item across actors and system boundaries.',
    stages: [
      { id: 'origin', title: 'Origin', purpose: 'hook', outcome: 'The audience knows what starts the flow.' },
      { id: 'actors', title: 'Actors and boundaries', purpose: 'establish-model', outcome: 'The audience can identify ownership and boundaries.' },
      { id: 'forward-path', title: 'Forward path', purpose: 'explain-mechanism', outcome: 'The audience can trace the ordered handoffs.' },
      { id: 'handling', title: 'Critical handling', purpose: 'explain-mechanism', outcome: 'The audience understands the important processing point.' },
      { id: 'result', title: 'Response or terminal state', purpose: 'demonstrate', outcome: 'The audience can connect the path to its result.' },
    ],
    advisoryChecks: ['Make every boundary crossing explicit.', 'Keep actor ownership stable throughout the explanation.'],
  },
  'evidence-demonstration': {
    id: 'evidence-demonstration',
    name: 'Evidence demonstration',
    intent: 'Support a claim with an operation, observed state, interpretation, and conclusion.',
    stages: [
      { id: 'claim', title: 'Claim', purpose: 'hook', outcome: 'The audience knows what the demonstration will establish.' },
      { id: 'setup', title: 'Setup', purpose: 'establish-model', outcome: 'The audience knows the relevant conditions.' },
      { id: 'operation', title: 'Operation', purpose: 'demonstrate', outcome: 'The audience can reproduce or inspect the action.' },
      { id: 'observation', title: 'Observed state', purpose: 'demonstrate', outcome: 'The audience sees the result independently of the plan.' },
      { id: 'interpretation', title: 'Interpretation', purpose: 'explain-mechanism', outcome: 'The audience understands why the observation supports the claim.' },
      { id: 'conclusion', title: 'Conclusion', purpose: 'summarize', outcome: 'The audience can apply the demonstrated result.' },
    ],
    advisoryChecks: ['Do not treat an intended operation as observed evidence.', 'Explain what the observation proves, not only what appeared.'],
  },
  'misconception-reframe': {
    id: 'misconception-reframe',
    name: 'Misconception reframe',
    intent: 'Replace a plausible but incomplete model with one that explains conflicting evidence.',
    stages: [
      { id: 'prior-model', title: 'Plausible prior model', purpose: 'hook', outcome: 'The audience recognizes why the misconception is attractive.' },
      { id: 'conflict', title: 'Conflicting evidence', purpose: 'correct-misconception', outcome: 'The audience sees what the prior model cannot explain.' },
      { id: 'replacement', title: 'Replacement model', purpose: 'establish-model', outcome: 'The audience gains a coherent alternative.' },
      { id: 'reapply', title: 'Reapply the model', purpose: 'demonstrate', outcome: 'The audience can explain the original evidence correctly.' },
      { id: 'rule', title: 'Decision rule', purpose: 'summarize', outcome: 'The audience can avoid the misconception in a new case.' },
    ],
    advisoryChecks: ['Represent the prior model fairly before correcting it.', 'Provide a usable replacement model, not only a negation.'],
  },
  'progressive-model': {
    id: 'progressive-model',
    name: 'Progressive model',
    intent: 'Introduce a complex system from a small stable overview, then deepen and reintegrate it.',
    stages: [
      { id: 'overview', title: 'Small overview', purpose: 'establish-model', outcome: 'The audience has a compact map of the main objects.' },
      { id: 'focus', title: 'Focus one subsystem', purpose: 'explain-mechanism', outcome: 'The audience knows which part is being expanded.' },
      { id: 'deep-dive', title: 'Deep dive', purpose: 'explain-mechanism', outcome: 'The audience understands the focused mechanism.' },
      { id: 'reintegrate', title: 'Reintegrate', purpose: 'summarize', outcome: 'The audience connects local detail back to the whole.' },
    ],
    advisoryChecks: ['Keep object identity stable between overview and detail.', 'Do not reveal the complete complex model before its parts are introduced.'],
  },
} as const satisfies Record<ExplanationPatternId, ExplanationPatternDefinition>;

export function isExplanationPatternId(value: unknown): value is ExplanationPatternId {
  return typeof value === 'string' && EXPLANATION_PATTERN_IDS.includes(value as ExplanationPatternId);
}

export function getExplanationPattern(id: ExplanationPatternId): ExplanationPatternDefinition {
  return EXPLANATION_PATTERNS[id];
}

export function listExplanationPatterns(): ExplanationPatternDefinition[] {
  return EXPLANATION_PATTERN_IDS.map((id) => EXPLANATION_PATTERNS[id]);
}
