import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAgentPlanningPrompt,
  formatAgentSceneCapabilities,
  resolveAgentIrFormat,
} from '../dist/agent-contract.js';

describe('agent-contract', () => {
  it('routes technical domains to composition-v2 by default', () => {
    assert.equal(resolveAgentIrFormat({ domain: 'programming' }), 'composition-v2');
    assert.equal(resolveAgentIrFormat({ domain: 'ai' }), 'composition-v2');
    assert.equal(resolveAgentIrFormat({ domain: 'devops' }), 'composition-v2');
    assert.equal(resolveAgentIrFormat({ domain: 'history' }), 'storyboard-v1');
    assert.equal(resolveAgentIrFormat({ domain: 'auto' }), 'storyboard-v1');
  });

  it('writes a composition-v2 planning prompt for programming', () => {
    const prompt = formatAgentPlanningPrompt('Explain HTTP caching', {
      domain: 'programming',
      language: 'en',
      maxScenes: 6,
    });
    assert.match(prompt, /CompositionDocument v2/);
    assert.match(prompt, /"pacingProfile": "explainer-v1"/);
    assert.match(prompt, /"version": "2\.0"/);
    assert.match(prompt, /type": "code"/);
    assert.match(prompt, /explanation\.beats/);
    assert.match(prompt, /"anchor": \{ "text": "typed helper" \}/);
    assert.doesNotMatch(prompt, /"narration": "The client uses/);
    assert.match(prompt, /IR format: composition-v2/);
    assert.match(prompt, /Public agent-authorable scene types/);
    assert.match(prompt, /Terminal and browser scenes are capture-derived/);
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
    });
    assert.match(prompt, /whiteboard Storyboard IR/);
    assert.doesNotMatch(prompt, /"version": "2\.0"/);
  });
});
