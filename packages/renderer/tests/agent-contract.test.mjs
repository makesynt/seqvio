import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAgentPlanningPrompt,
  formatEditorialPlanningPrompt,
  formatVisualDesignPrompt,
  formatAgentSceneCapabilities,
  formatExplanationPatternCatalog,
  resolveAgentIrFormat,
} from '../dist/agent-contract.js';

describe('agent-contract', () => {
  it('routes technical domains to the explainer IR by default', () => {
    assert.equal(resolveAgentIrFormat({ domain: 'programming' }), 'explainer');
    assert.equal(resolveAgentIrFormat({ domain: 'ai' }), 'explainer');
    assert.equal(resolveAgentIrFormat({ domain: 'devops' }), 'explainer');
    assert.equal(resolveAgentIrFormat({ domain: 'history' }), 'storyboard');
    assert.equal(resolveAgentIrFormat({ domain: 'auto' }), 'storyboard');
  });

  it('writes an ExplainerDocument prompt constrained by approved authoring artifacts', () => {
    const prompt = formatAgentPlanningPrompt('Explain HTTP caching', {
      domain: 'programming',
      language: 'en',
      maxScenes: 6,
    }, {
      editorialPlan: '# Editorial Plan: HTTP caching',
      visualDesignBrief: '# Visual Design Brief: HTTP caching',
    });
    assert.match(prompt, /ExplainerDocument/);
    assert.match(prompt, /"pacingProfile": "explainer-v1"/);
    assert.match(prompt, /"format": "seqvio-explainer"/);
    assert.match(prompt, /"schemaVersion": "1\.0"/);
    assert.match(prompt, /type": "code"/);
    assert.match(prompt, /explanation\.beats/);
    assert.match(prompt, /"anchor": \{ "text": "typed helper" \}/);
    assert.doesNotMatch(prompt, /"narration": "The client uses/);
    assert.match(prompt, /IR format: explainer/);
    assert.match(prompt, /Approved Editorial Plan/);
    assert.match(prompt, /Approved Visual Design Brief/);
    assert.match(prompt, /Public agent-authorable scene types/);
    assert.match(prompt, /Terminal and browser scenes are capture-derived/);
  });

  it('creates separate human-readable editorial and visual planning tasks', () => {
    const editorial = formatEditorialPlanningPrompt('Explain HTTP caching', { language: 'en' });
    assert.match(editorial, /Content Decisions/);
    assert.match(editorial, /Make omissions explicit/);
    assert.match(editorial, /zero to two explanation patterns/);
    assert.match(editorial, /Patterns are guidance, not templates/);
    assert.match(editorial, /causal-diagnosis/);
    assert.match(editorial, /progressive-model/);
    const visual = formatVisualDesignPrompt('Explain HTTP caching', '# Editorial Plan: Cache', { language: 'en' });
    assert.match(visual, /Section Treatments/);
    assert.match(visual, /real\s+capture material/);
  });

  it('describes all optional editorial patterns without adding scene capabilities', () => {
    const catalog = formatExplanationPatternCatalog();
    assert.equal(catalog.split('Suggested arc:').length - 1, 6);
    assert.match(catalog, /evidence-demonstration/);
    assert.doesNotMatch(catalog, /terminal:/);
  });

  it('refuses final IR planning without both approved authoring artifacts', () => {
    assert.throws(
      () => formatAgentPlanningPrompt('Explain HTTP caching', { domain: 'programming' }),
      /requires both an editorial plan and a visual design brief/,
    );
  });

  it('derives agent scene descriptions from the public capability registry', () => {
    const capabilities = formatAgentSceneCapabilities();
    assert.match(capabilities, /- whiteboard:/);
    assert.match(capabilities, /- code:/);
    assert.match(capabilities, /- diagram:/);
    assert.doesNotMatch(capabilities, /- terminal:/);
    assert.doesNotMatch(capabilities, /- browser:/);
  });

  it('keeps whiteboard storyboard prompts for history', () => {
    const prompt = formatAgentPlanningPrompt('Silk Road trade', {
      domain: 'history',
      language: 'zh',
    }, {
      editorialPlan: '# Editorial Plan: Silk Road',
      visualDesignBrief: '# Visual Design Brief: Silk Road',
    });
    assert.match(prompt, /whiteboard Storyboard IR/);
    assert.doesNotMatch(prompt, /"schemaVersion": "1\.0"/);
  });
});
