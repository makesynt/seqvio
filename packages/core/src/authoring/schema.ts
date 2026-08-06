export const EDITORIAL_PLAN_FORMAT = 'seqvio-editorial-plan' as const;
export const VISUAL_DESIGN_BRIEF_FORMAT = 'seqvio-visual-design' as const;

export const EXPLANATION_PATTERN_IDS = [
  'causal-diagnosis',
  'mechanism-trace',
  'system-flow',
  'evidence-demonstration',
  'misconception-reframe',
  'progressive-model',
] as const;

export type ExplanationPatternId = (typeof EXPLANATION_PATTERN_IDS)[number];
export type ExplanationPatternRole = 'primary' | 'supporting';

export interface ExplanationPatternSelection {
  id: ExplanationPatternId;
  role: ExplanationPatternRole;
  reason: string;
  /** Explicit departures from the suggested pattern arc. */
  adaptations?: string[];
}

export interface EditorialExplanationStrategy {
  /** Omit explanationStrategy entirely when a custom structure is better. */
  patterns: ExplanationPatternSelection[];
}

export type EditorialConceptRole =
  | 'essential'
  | 'evidence'
  | 'example'
  | 'boundary'
  | 'optional';

export type EditorialSectionPurpose =
  | 'hook'
  | 'establish-model'
  | 'explain-mechanism'
  | 'demonstrate'
  | 'correct-misconception'
  | 'summarize';

export type EvidenceSource =
  | 'authored'
  | 'terminal-capture'
  | 'browser-capture'
  | 'recorded-media';

export type VisualRole = 'hook' | 'model' | 'mechanism' | 'evidence' | 'result';
export type TransitionIntent = 'cut' | 'crossfade' | 'focus-transfer' | 'match-object';

export interface EditorialPlan {
  format: typeof EDITORIAL_PLAN_FORMAT;
  id: string;
  title: string;
  objective: string;
  audience: {
    description: string;
    priorKnowledge?: string[];
    likelyMisconceptions?: string[];
  };
  thesis: string;
  /** Opening promise or tension; narration-sized, not a required title card. */
  hook?: string;
  durationBudgetSec: number;
  /** Optional, composable structural guidance. It does not constrain executable IR. */
  explanationStrategy?: EditorialExplanationStrategy;
  concepts: Array<{
    id: string;
    claim: string;
    role: EditorialConceptRole;
    decision: 'include' | 'omit';
    reason: string;
    prerequisites?: string[];
    estimatedSeconds?: number;
  }>;
  sections: Array<{
    id: string;
    title: string;
    purpose: EditorialSectionPurpose;
    conceptIds: string[];
    expectedOutcome: string;
    evidenceSource?: EvidenceSource;
    targetSeconds?: number;
  }>;
}
export interface VisualDesignBrief {
  format: typeof VISUAL_DESIGN_BRIEF_FORMAT;
  id: string;
  title: string;
  direction: string;
  canvas: {
    width: number;
    height: number;
    background: string;
    safeAreaPx?: number;
  };
  palette: Array<{
    role: string;
    value: string;
    use: string;
  }>;
  typography: Array<{
    role: string;
    family: string;
    sizePx: number;
    weight?: number;
    use: string;
  }>;
  layoutRules: string[];
  motionRules: string[];
  sceneTreatments?: Array<{
    sectionId: string;
    sceneIds: string[];
    visualForm: 'whiteboard' | 'code' | 'diagram' | 'infographic' | 'terminal' | 'browser' | 'manim';
    visualRole?: VisualRole;
    focalTarget?: string;
    evidenceSource?: EvidenceSource;
    /** Maximum words visible as primary explanatory text at once. */
    onScreenTextBudget?: number;
    transitionIntent?: TransitionIntent;
    composition: string;
    emphasis: string;
  }>;
  avoid?: string[];
}
