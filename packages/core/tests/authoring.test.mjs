import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatEditorialPlanMarkdown,
  formatVisualDesignBriefMarkdown,
  listExplanationPatterns,
  validateEditorialPlan,
  validateAuthoringTrace,
  validateVisualDesignBrief,
} from '../dist/index.js';

const plan = {
  format: 'seqvio-editorial-plan',
  id: 'native-module-editorial',
  title: 'Why the native module cannot load',
  objective: 'Explain the difference between a successful rebuild command and a loadable binary.',
  audience: {
    description: 'Node.js maintainers familiar with npm and CI.',
    priorKnowledge: ['npm install', 'CI jobs'],
    likelyMisconceptions: ['A successful rebuild always creates the binary.'],
  },
  thesis: 'Blocked install scripts can leave node-pty without a loadable native binary.',
  durationBudgetSec: 60,
  explanationStrategy: {
    patterns: [
      {
        id: 'causal-diagnosis',
        role: 'primary',
        reason: 'The source contains an observed failure, a break point, and a verifiable repair.',
        adaptations: ['Combine the repair and verification into one concise section.'],
      },
      {
        id: 'evidence-demonstration',
        role: 'supporting',
        reason: 'The conclusion depends on distinguishing command output from a loadable artifact.',
      },
    ],
  },
  concepts: [
    {
      id: 'blocked-script',
      claim: 'The package install script was blocked.',
      role: 'essential',
      decision: 'include',
      reason: 'This is the direct cause.',
      prerequisites: [],
      estimatedSeconds: 20,
    },
    {
      id: 'abi-history',
      claim: 'Review the complete Node ABI history.',
      role: 'optional',
      decision: 'omit',
      reason: 'It does not change the repair.',
    },
  ],
  sections: [
    {
      id: 'root-cause',
      title: 'Locate the blocked step',
      purpose: 'explain-mechanism',
      conceptIds: ['blocked-script'],
      expectedOutcome: 'The viewer can distinguish command success from module loadability.',
      targetSeconds: 20,
    },
  ],
};

const design = {
  format: 'seqvio-visual-design',
  id: 'native-module-visual',
  title: 'Native module failure',
  direction: 'Quiet technical editorial layout with one active causal step at a time.',
  canvas: { width: 1280, height: 720, background: '#f7f8fa', safeAreaPx: 48 },
  palette: [
    { role: 'ink', value: '#16181d', use: 'Primary text and diagram nodes' },
    { role: 'accent', value: '#d64045', use: 'The blocked step only' },
  ],
  typography: [
    { role: 'body', family: 'Inter', sizePx: 32, weight: 500, use: 'Explanation labels' },
  ],
  layoutRules: ['Keep the causal path centered.', 'Show no more than five nodes.'],
  motionRules: ['Trace the path in narration order.', 'Hold the blocked step for two seconds.'],
  sceneTreatments: [
    { sectionId: 'root-cause', sceneIds: ['root-cause'], visualForm: 'diagram', composition: 'Left-to-right install path.', emphasis: 'Only the blocked install script uses red.' },
  ],
  avoid: ['Decorative gradients', 'Fake terminal output'],
};

describe('human-readable authoring artifacts', () => {
  it('validates and formats an editorial plan', () => {
    assert.deepEqual(validateEditorialPlan(plan), []);
    const markdown = formatEditorialPlanMarkdown(plan);
    assert.match(markdown, /# Editorial Plan:/);
    assert.match(markdown, /Decision: \*\*omit\*\*/);
    assert.match(markdown, /## Explanation Strategy/);
    assert.match(markdown, /Causal diagnosis/);
    assert.match(markdown, /Combine the repair and verification/);
    assert.match(markdown, /## Explanation Structure/);
  });

  it('exports six optional explanation patterns without requiring one', () => {
    assert.deepEqual(
      listExplanationPatterns().map((pattern) => pattern.id),
      [
        'causal-diagnosis',
        'mechanism-trace',
        'system-flow',
        'evidence-demonstration',
        'misconception-reframe',
        'progressive-model',
      ],
    );
    const customPlan = { ...plan, explanationStrategy: undefined };
    assert.deepEqual(validateEditorialPlan(customPlan), []);
    assert.match(formatEditorialPlanMarkdown(customPlan), /Custom structure/);
  });

  it('validates strategy references but keeps pattern fit advisory', () => {
    const unknown = {
      ...plan,
      explanationStrategy: {
        patterns: [{ id: 'generic-template', role: 'primary', reason: 'Forced template.' }],
      },
    };
    assert.ok(validateEditorialPlan(unknown).some((issue) => issue.code === 'unknown_explanation_pattern'));

    const broad = {
      ...plan,
      explanationStrategy: {
        patterns: [
          ...plan.explanationStrategy.patterns,
          { id: 'system-flow', role: 'supporting', reason: 'A third optional lens.' },
        ],
      },
    };
    const broadIssues = validateEditorialPlan(broad);
    assert.ok(broadIssues.some((issue) => issue.code === 'too_many_explanation_patterns' && issue.severity === 'warning'));

    const malformed = {
      ...plan,
      explanationStrategy: { patterns: [null, { id: 'causal-diagnosis', role: 'primary' }] },
    };
    assert.doesNotThrow(() => validateEditorialPlan(malformed));
    assert.ok(validateEditorialPlan(malformed).some((issue) => issue.code === 'invalid_explanation_pattern_selection'));
  });

  it('rejects an included concept that is missing from the structure', () => {
    const issues = validateEditorialPlan({ ...plan, sections: [] });
    assert.ok(issues.some((issue) => issue.code === 'unscheduled_concept'));
  });

  it('validates and formats a visual brief against editorial section ids', () => {
    assert.deepEqual(validateVisualDesignBrief(design, plan), []);
    assert.match(formatVisualDesignBriefMarkdown(design), /# Visual Design Brief:/);
  });

  it('rejects visual treatments for unknown sections', () => {
    const issues = validateVisualDesignBrief({
      ...design,
      sceneTreatments: [{ ...design.sceneTreatments[0], sectionId: 'missing' }],
    }, plan);
    assert.ok(issues.some((issue) => issue.code === 'unknown_section'));
  });

  it('traces editorial sections and visual treatments into the executable IR', () => {
    const document = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'native-module', width: 1280, height: 720,
      scenes: [{ type: 'diagram', id: 'root-cause', nodes: [], edges: [], steps: [] }],
    };
    assert.deepEqual(validateAuthoringTrace(plan, design, document), []);
    const issues = validateAuthoringTrace(plan, design, { ...document, scenes: [{ ...document.scenes[0], type: 'code' }] });
    assert.ok(issues.some((issue) => issue.code === 'visual_form_mismatch'));
  });
});
