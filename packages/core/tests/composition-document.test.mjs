/**
 * CompositionDocument v2 tests — run against compiled dist.
 * Build core first: `npm run build -w @seqvio/core`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateCompositionDocument,
  compileCompositionDocumentToTsx,
  storyboardToCompositionV2,
  validateIr,
  compileIr,
  detectIrVersion,
} from '../dist/index.js';

const mixedV2 = {
  version: '2.0',
  id: 'technical-demo',
  scenes: [
    {
      type: 'whiteboard',
      id: 'intro',
      narration: 'Welcome to the technical explainer.',
      elements: [
        { type: 'text', text: 'Hello', position: { x: 100, y: 100 }, start: 0, duration: 20 },
      ],
      annotations: [
        {
          id: 'intro-label',
          targetId: 'intro',
          kind: 'box',
          start: 0,
          duration: 30,
          label: 'Scene',
        },
      ],
    },
    {
      type: 'code',
      id: 'walkthrough',
      language: 'typescript',
      source: 'const answer = 42;\n',
      steps: [
        { at: 0, action: 'focus', range: { startLine: 1, endLine: 1 } },
        { at: 30, action: 'type', range: { startLine: 1, endLine: 1 } },
      ],
      narration: 'Here is the code.',
    },
    {
      type: 'diagram',
      id: 'architecture',
      nodes: [
        { id: 'client', label: 'Client' },
        { id: 'api', label: 'API' },
      ],
      edges: [{ id: 'request', from: 'client', to: 'api', label: 'HTTP' }],
      steps: [
        { at: 0, action: 'reveal', targetId: 'client' },
        { at: 20, action: 'connect', edgeId: 'request' },
      ],
    },
  ],
  chapters: [
    { id: 'chapter-intro', sceneIds: ['intro'] },
    { id: 'chapter-deep-dive', sceneIds: ['walkthrough', 'architecture'] },
  ],
};

describe('detectIrVersion', () => {
  it('detects composition v2', () => {
    assert.strictEqual(detectIrVersion(mixedV2), 'composition-v2');
  });

  it('detects storyboard v1', () => {
    assert.strictEqual(
      detectIrVersion({ id: 'demo', scenes: [{ id: 's', elements: [] }] }),
      'storyboard-v1'
    );
  });
});

describe('validateCompositionDocument', () => {
  it('accepts a mixed whiteboard + technical document', () => {
    assert.deepStrictEqual(validateCompositionDocument(mixedV2), []);
  });

  it('rejects unknown annotation targets', () => {
    const issues = validateCompositionDocument({
      ...mixedV2,
      scenes: [
        {
          type: 'whiteboard',
          id: 'intro',
          elements: [],
          annotations: [
            {
              id: 'bad',
              targetId: 'missing-target',
              kind: 'arrow',
              start: 0,
              duration: 10,
            },
          ],
        },
      ],
      chapters: undefined,
    });
    assert.ok(issues.some((i) => i.code === 'unknown_annotation_target'));
  });

  it('rejects chapter references to unknown scenes', () => {
    const issues = validateCompositionDocument({
      version: '2.0',
      id: 'x',
      scenes: [{ type: 'code', id: 'c', language: 'js', source: '', steps: [] }],
      chapters: [{ id: 'ch', sceneIds: ['missing'] }],
    });
    assert.ok(issues.some((i) => i.code === 'unknown_chapter_scene'));
  });

  it('rejects a terminal scene with neither events nor commands', () => {
    const issues = validateCompositionDocument({
      version: '2.0',
      id: 'x',
      scenes: [{ type: 'terminal', id: 'shell' }],
    });
    assert.ok(issues.some((i) => i.code === 'missing_terminal_events_or_commands'));
  });

  it('rejects a terminal event with an invalid kind', () => {
    const issues = validateCompositionDocument({
      version: '2.0',
      id: 'x',
      scenes: [
        {
          type: 'terminal',
          id: 'shell',
          events: [{ timeMs: 0, kind: 'system', text: 'hi' }],
        },
      ],
    });
    assert.ok(issues.some((i) => i.code === 'invalid_terminal_event_kind'));
  });
});

describe('storyboardToCompositionV2', () => {
  it('wraps whiteboard scenes with type whiteboard', () => {
    const migrated = storyboardToCompositionV2({
      id: 'demo',
      scenes: [{ id: 'intro', elements: [{ type: 'text', text: 'Hi', position: { x: 1, y: 1 } }] }],
    });
    assert.strictEqual(migrated.version, '2.0');
    assert.strictEqual(migrated.scenes[0].type, 'whiteboard');
  });
});

describe('compileCompositionDocumentToTsx', () => {
  it('emits whiteboard and technical components', () => {
    const { code } = compileCompositionDocumentToTsx(mixedV2);
    assert.match(code, /from '@seqvio\/core'/);
    assert.match(code, /from '@seqvio\/whiteboard'/);
    assert.match(code, /from '@seqvio\/technical'/);
    assert.match(code, /<WhiteboardScene/);
    assert.match(code, /<CodeWalkthrough/);
    assert.match(code, /<ArchitectureDiagram/);
    assert.match(code, /<TechnicalScene/);
    assert.match(code, /Welcome to the technical explainer\./);
  });

  it('converts legacy terminal commands into visible events and steps', () => {
    const { code } = compileCompositionDocumentToTsx({
      version: '2.0',
      id: 'terminal-legacy',
      scenes: [
        {
          type: 'terminal',
          id: 'shell',
          commands: ['npm test', 'npm run build'],
        },
      ],
    });

    assert.match(code, /"text": "\$ npm test\\n"/);
    assert.match(code, /"text": "\$ npm run build\\n"/);
    assert.match(code, /shell-command-1/);
    assert.match(code, /shell-command-2/);
  });

  it('passes explicit terminal events and steps through verbatim', () => {
    const events = [
      { timeMs: 0, kind: 'stdin', text: 'echo hi', transient: true },
      { timeMs: 500, kind: 'stdout', text: 'hi\n' },
    ];
    const steps = [{ id: 's1', label: 'Run echo', timeMs: 0 }];
    const { code } = compileCompositionDocumentToTsx({
      version: '2.0',
      id: 'terminal-explicit',
      scenes: [{ type: 'terminal', id: 'shell', events, steps }],
    });

    assert.match(code, /"text": "echo hi"/);
    assert.match(code, /"transient": true/);
    assert.match(code, /"label": "Run echo"/);
    assert.doesNotMatch(code, /shell-command-1/);
  });
});

describe('technical-explainer-v2 reference IR', () => {
  it('validates the full 3-5 minute reference document', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const ir = JSON.parse(
      readFileSync(join(root, 'examples', 'ir', 'technical-explainer-v2.json'), 'utf8')
    );
    const issues = validateCompositionDocument(ir);
    assert.deepStrictEqual(issues, []);
    assert.strictEqual(ir.scenes.length, 9);
    assert.strictEqual(ir.chapters.length, 5);
    const sceneFrames = ir.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const transitionFrames = (ir.scenes.length - 1) * ir.transitionDuration;
    const totalFrames = sceneFrames + transitionFrames;
    assert.ok(totalFrames >= 5400, `expected >= 3 minutes, got ${totalFrames} frames`);
    assert.ok(totalFrames <= 9000, `expected <= 5 minutes, got ${totalFrames} frames`);
  });
});

describe('validateIr / compileIr', () => {
  it('routes v2 documents through the composition pipeline', () => {
    assert.deepStrictEqual(validateIr(mixedV2), []);
    const { code } = compileIr(mixedV2);
    assert.match(code, /CompositionDocument v2/);
  });

  it('still routes v1 storyboards through the storyboard pipeline', () => {
    const v1 = {
      id: 'demo',
      scenes: [{ id: 's', elements: [{ type: 'text', text: 'Hi', position: { x: 1, y: 1 } }] }],
    };
    assert.deepStrictEqual(validateIr(v1), []);
    const { code } = compileIr(v1);
    assert.match(code, /from a Seqvio storyboard/);
    assert.doesNotMatch(code, /<CodeWalkthrough/);
  });
});
