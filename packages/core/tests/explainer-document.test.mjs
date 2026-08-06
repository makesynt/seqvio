/**
 * ExplainerDocument tests — run against compiled dist.
 * Build core first: `npm run build -w @seqvio/core`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateExplainerDocument,
  compileExplainerDocumentToTsx,
  storyboardToExplainerDocument,
  validateIr,
  compileIr,
  detectIrFormat,
  SCENE_CAPABILITIES,
  SCENE_TYPES,
  listAgentAuthorableSceneCapabilities,
  resolveAttentionSequence,
  resolveAttentionSequenceAtOutputFrame,
  selectAttentionForScene,
  validateAttentionSequence,
  routeConnector,
  routeGuidedPath,
  resolveSafeLabelPlacement,
  resolveSafeLabelPlacements,
} from '../dist/index.js';

describe('attention sequence', () => {
  it('resolves holds and explicit handoffs deterministically', () => {
    const sequence = [
      { id: 'a', targetId: 'metric-a', kind: 'box', start: 0, duration: 10, minHoldFrames: 20, handoffTo: 'metric-b' },
      { id: 'b', targetId: 'metric-b', kind: 'circle', start: 15, duration: 20 },
    ];
    assert.strictEqual(resolveAttentionSequence(sequence, 12)[0].active, true);
    assert.strictEqual(resolveAttentionSequence(sequence, 16)[0].handoff, true);
    assert.strictEqual(resolveAttentionSequence(sequence, 21)[0].active, false);
  });

  it('reflows attention through a post-TTS scene time map', () => {
    const sequence = [
      { id: 'a', targetId: 'metric-a', kind: 'box', start: 20, duration: 20, sourceBeatId: 'scene.beat-a' },
      { id: 'b', targetId: 'metric-b', kind: 'circle', start: 60, duration: 20, sourceBeatId: 'scene.beat-b' },
    ];
    const timeMap = [
      { outputFrame: 0, sourceFrame: 0 },
      { outputFrame: 80, sourceFrame: 20 },
      { outputFrame: 160, sourceFrame: 60 },
      { outputFrame: 240, sourceFrame: 100 },
    ];
    const atFirstPhrase = resolveAttentionSequenceAtOutputFrame(sequence, 80, 100, 240, timeMap);
    const atSecondPhrase = resolveAttentionSequenceAtOutputFrame(sequence, 160, 100, 240, timeMap);
    assert.strictEqual(atFirstPhrase[0].active, true);
    assert.strictEqual(atSecondPhrase[1].active, true);
  });

  it('selects scene-local segments and enforces explicit clearing', () => {
    const sequence = [
      { id: 'a', sceneId: 'before', targetId: 'metric-a', kind: 'spotlight', start: 0, duration: 10, persistence: 'until-clear', clearAt: 50, handoffTo: 'metric-b', handoffToSceneId: 'after' },
      { id: 'b', sceneId: 'after', targetId: 'metric-b', kind: 'box', start: 0, duration: 20 },
    ];
    assert.deepStrictEqual(selectAttentionForScene(sequence, 'before').map((item) => item.id), ['a']);
    assert.deepStrictEqual(validateAttentionSequence(sequence), []);
    assert.strictEqual(resolveAttentionSequence(sequence.slice(0, 1), 49)[0].active, true);
    assert.strictEqual(resolveAttentionSequence(sequence.slice(0, 1), 50)[0].active, false);
  });
});

describe('attention routing', () => {
  it('routes connectors deterministically inside the safe area', () => {
    const from = { x: 10, y: 40, width: 80, height: 40 };
    const to = { x: 1110, y: 600, width: 100, height: 50 };
    const route = routeConnector(from, to, 1280, 720, 24);
    assert.deepStrictEqual(route, routeConnector(from, to, 1280, 720, 24));
    assert.ok(route.every((point) => point.x >= 24 && point.x <= 1256 && point.y >= 24 && point.y <= 696));
    assert.ok(routeGuidedPath([from, to], 1280, 720).length >= 4);
  });

  it('keeps callout labels inside the canvas', () => {
    const placement = resolveSafeLabelPlacement({ x: 0, y: 0, width: 60, height: 30 }, 180, 38, 1280, 720);
    assert.ok(placement.x >= 18 && placement.y >= 18);
  });

  it('places multiple labels without collisions and reroutes around obstacles', () => {
    const targetA = { x: 400, y: 240, width: 80, height: 50 };
    const targetB = { x: 490, y: 245, width: 80, height: 50 };
    const labels = resolveSafeLabelPlacements([
      { id: 'a', target: targetA, width: 180, height: 38 },
      { id: 'b', target: targetB, width: 180, height: 38 },
      { id: 'c', target: { x: 445, y: 330, width: 80, height: 50 }, width: 180, height: 38 },
    ], 960, 540, [targetA, targetB], 24);
    assert.deepStrictEqual(labels, resolveSafeLabelPlacements([
      { id: 'a', target: targetA, width: 180, height: 38 },
      { id: 'b', target: targetB, width: 180, height: 38 },
      { id: 'c', target: { x: 445, y: 330, width: 80, height: 50 }, width: 180, height: 38 },
    ], 960, 540, [targetA, targetB], 24));
    const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    assert.ok(labels.every((label, index) => labels.slice(index + 1).every((other) => !overlap(label, other))));

    const from = { x: 80, y: 250, width: 80, height: 50 };
    const to = { x: 800, y: 250, width: 80, height: 50 };
    const obstacle = { x: 420, y: 180, width: 120, height: 140 };
    const unobstructed = routeConnector(from, to, 960, 540, 24);
    const routed = routeConnector(from, to, 960, 540, 24, [obstacle]);
    assert.notDeepStrictEqual(routed, unobstructed);
    assert.ok(routed.some((point) => point.y > obstacle.y + obstacle.height));
  });
});

describe('scene capability registry', () => {
  it('is the complete source for stable scene validation and compilation metadata', () => {
    assert.deepStrictEqual(SCENE_TYPES, ['whiteboard', 'code', 'diagram', 'infographic', 'terminal', 'browser', 'manim']);
    for (const type of SCENE_TYPES) {
      const capability = SCENE_CAPABILITIES[type];
      assert.strictEqual(capability.schemaVersion, '1.0');
      assert.strictEqual(capability.compiler, 'complete');
      assert.ok(['public', 'experimental'].includes(capability.lifecycle));
      assert.ok(capability.requiredPackage.startsWith('@seqvio/'));
      assert.ok(capability.qaRules.length > 0);
    }
    assert.deepStrictEqual(
      listAgentAuthorableSceneCapabilities().map((capability) => capability.type),
      ['whiteboard', 'code', 'diagram'],
    );
  });
});

const mixedExplainer = {
  format: 'seqvio-explainer',
  schemaVersion: '1.0',
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

describe('detectIrFormat', () => {
  it('detects an explainer document', () => {
    assert.strictEqual(detectIrFormat(mixedExplainer), 'explainer');
  });

  it('detects storyboard v1', () => {
    assert.strictEqual(
      detectIrFormat({ id: 'demo', scenes: [{ id: 's', elements: [] }] }),
      'storyboard'
    );
  });
});

describe('validateExplainerDocument', () => {
  it('accepts a mixed whiteboard + technical document', () => {
    assert.deepStrictEqual(validateExplainerDocument(mixedExplainer), []);
  });

  it('rejects unknown annotation targets', () => {
    const issues = validateExplainerDocument({
      ...mixedExplainer,
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

  it('validates connector annotations against both stable targets', () => {
    const valid = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'connector-valid',
      scenes: [{
        type: 'infographic', id: 'summary',
        metrics: [{ id: 'from', label: 'From', value: '1' }, { id: 'to', label: 'To', value: '2' }],
        annotations: [{ id: 'link', targetId: 'from', toTargetId: 'to', kind: 'connector', start: 0, duration: 20 }],
      }],
    };
    assert.deepStrictEqual(validateExplainerDocument(valid), []);
    const invalid = structuredClone(valid);
    invalid.scenes[0].annotations[0].toTargetId = 'missing';
    assert.ok(validateExplainerDocument(invalid).some((issue) => issue.code === 'unknown_annotation_target'));
  });

  it('rejects chapter references to unknown scenes', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0',
      id: 'x',
      scenes: [{ type: 'code', id: 'c', language: 'js', source: '', steps: [] }],
      chapters: [{ id: 'ch', sceneIds: ['missing'] }],
    });
    assert.ok(issues.some((i) => i.code === 'unknown_chapter_scene'));
  });

  it('rejects unknown pacing profiles', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'x', pacingProfile: 'future-v9',
      scenes: [{ type: 'code', id: 'c', language: 'js', source: '', steps: [] }],
    });
    assert.ok(issues.some((issue) => issue.code === 'unsupported_pacing_profile'));
  });

  it('rejects a terminal scene with neither events nor commands', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0',
      id: 'x',
      scenes: [{ type: 'terminal', id: 'shell' }],
    });
    assert.ok(issues.some((i) => i.code === 'missing_terminal_events_or_commands'));
  });

  it('rejects a terminal event with an invalid kind', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0',
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

  it('rejects removed chat and diff scene types', () => {
    for (const scene of [
      { type: 'chat', id: 'conversation', messages: [{ role: 'user', text: 'hello' }] },
      { type: 'diff', id: 'change', before: 'old', after: 'new' },
    ]) {
      const issues = validateExplainerDocument({
        format: 'seqvio-explainer', schemaVersion: '1.0',
        id: `removed-${scene.type}`,
        scenes: [scene],
      });
      assert.ok(
        issues.some((issue) => issue.code === 'unsupported_scene_type'),
        `expected ${scene.type} to be rejected`,
      );
    }
  });

  it('accepts a jointly authored explanation beat and visual target', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0',
      id: 'beat-demo',
      scenes: [{
        type: 'whiteboard',
        id: 'math',
        elements: [{ id: 'result', type: 'text', text: '5050', position: { x: 100, y: 100 } }],
        explanation: {
          cues: [{ id: 'voice', text: '五十乘一百零一，等于五千零五十。' }],
          beats: [{
            id: 'show-result',
            cueId: 'voice',
            anchor: { text: '等于五千零五十' },
            visuals: [{ targetId: 'result', action: 'reveal', offsetMs: -150, minHoldMs: 1200 }],
          }],
        },
      }],
    });
    assert.deepEqual(issues, []);
  });

  it('rejects missing, ambiguous, and unknown beat references', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0',
      id: 'bad-beats',
      scenes: [{
        type: 'whiteboard',
        id: 'scene',
        elements: [],
        explanation: {
          cues: [{ id: 'voice', text: '检查结果，然后再次检查结果。' }],
          beats: [
            {
              id: 'ambiguous', cueId: 'voice', anchor: { text: '检查结果' },
              visuals: [{ targetId: 'missing', action: 'reveal' }],
            },
            {
              id: 'missing', cueId: 'absent', anchor: { text: '不存在' },
              visuals: [{ targetId: 'scene', action: 'reveal' }],
            },
          ],
        },
      }],
    });
    assert.ok(issues.some((entry) => entry.code === 'ambiguous_beat_anchor'));
    assert.ok(issues.some((entry) => entry.code === 'unknown_beat_visual_target'));
    assert.ok(issues.some((entry) => entry.code === 'unknown_explanation_cue'));
  });
});

describe('storyboardToExplainerDocument', () => {
  it('wraps whiteboard scenes with type whiteboard', () => {
    const migrated = storyboardToExplainerDocument({
      id: 'demo',
      scenes: [{ id: 'intro', elements: [{ type: 'text', text: 'Hi', position: { x: 1, y: 1 } }] }],
    });
    assert.strictEqual(migrated.format, 'seqvio-explainer');
    assert.strictEqual(migrated.schemaVersion, '1.0');
    assert.strictEqual(migrated.scenes[0].type, 'whiteboard');
  });
});

describe('compileExplainerDocumentToTsx', () => {
  it('emits whiteboard and technical components', () => {
    const { code } = compileExplainerDocumentToTsx(mixedExplainer);
    assert.match(code, /from '@seqvio\/core'/);
    assert.match(code, /from '@seqvio\/whiteboard'/);
    assert.match(code, /from '@seqvio\/technical'/);
    assert.match(code, /<WhiteboardScene/);
    assert.match(code, /<CodeWalkthrough/);
    assert.match(code, /<ArchitectureDiagram/);
    assert.match(code, /<TechnicalScene/);
    assert.match(code, /Welcome to the technical explainer\./);
    assert.match(code, /"startMs":/);
    assert.match(code, /"endMs":/);
    assert.match(code, /pacing: \{ profile: "explainer-v1", highlights:/);
    assert.match(code, /sceneTimings:/);
    assert.match(code, /pacingProfile: "explainer-v1"/);
  });

  it('converts legacy terminal commands into visible events and steps', () => {
    const { code } = compileExplainerDocumentToTsx({
      format: 'seqvio-explainer', schemaVersion: '1.0',
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
    const { code } = compileExplainerDocumentToTsx({
      format: 'seqvio-explainer', schemaVersion: '1.0',
      id: 'terminal-explicit',
      scenes: [{ type: 'terminal', id: 'shell', events, steps }],
    });

    assert.match(code, /"text": "echo hi"/);
    assert.match(code, /"transient": true/);
    assert.match(code, /"label": "Run echo"/);
    assert.doesNotMatch(code, /shell-command-1/);
  });

  it('compiles an infographic scene', () => {
    const { code } = compileExplainerDocumentToTsx({
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'infographic-compile',
      scenes: [{
        type: 'infographic', id: 'summary',
        metrics: [{ id: 'total', label: 'Total', value: '42' }],
        comparisons: [{ id: 'delta', label: 'Delta', before: 10, after: 4 }],
        charts: [{
          id: 'trend', title: 'Verified trend', kind: 'line', unit: 'ms', sourceLabel: 'fixture',
          xAxis: { label: 'Run' }, yAxis: { label: 'Latency', min: 0, max: 20, ticks: 4 }, legend: 'top',
          series: [{ id: 'p95', label: 'p95', points: [{ x: 'A', y: 18 }, { x: 'B', y: 7 }] }],
        }],
        explanation: {
          cues: [{ id: 'result', text: 'The total improves, then the delta becomes clear.' }],
          beats: [
            { id: 'total-beat', cueId: 'result', anchor: { text: 'total improves' }, visuals: [{ targetId: 'total', action: 'focus', minHoldMs: 1200 }] },
            { id: 'delta-beat', cueId: 'result', anchor: { text: 'delta becomes clear' }, visuals: [{ targetId: 'delta', action: 'highlight' }] },
          ],
        },
      }],
    });
    assert.match(code, /InfographicScene/);
    assert.match(code, /"id": "total"/);
    assert.match(code, /"kind": "spotlight"/);
    assert.match(code, /"handoffTo": "delta"/);
    assert.match(code, /"sourceBeatId": "summary.total-beat"/);
    assert.match(code, /"sourceLabel": "fixture"/);
    assert.match(code, /"id": "p95"/);
  });

  it('rejects malformed infographic chart data and axis domains', () => {
    const issues = validateExplainerDocument({
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'bad-chart',
      scenes: [{ type: 'infographic', id: 'chart', charts: [{ id: 'trend', title: 'Trend', kind: 'line', yAxis: { min: 10, max: 2 }, series: [{ id: 'series', label: 'Series', points: [] }] }] }],
    });
    const codes = issues.map((issue) => issue.code);
    assert.ok(codes.includes('invalid_infographic_chart_points'));
    assert.ok(codes.includes('invalid_infographic_axis_domain'));
  });

  it('validates and compiles a Manim-backed scene with named markers', () => {
    const document = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'manim-compile',
      scenes: [{
        type: 'manim', id: 'equation', sourceVideo: 'equation.mp4', mediaFps: 30,
        markers: [{ id: 'start', frame: 0 }, { id: 'result', frame: 60, targetId: 'equation-result' }],
      }],
    };
    assert.deepEqual(validateExplainerDocument(document), []);
    const { code } = compileExplainerDocumentToTsx(document);
    assert.match(code, /ManimClip/);
    assert.match(code, /equation\.mp4/);
    assert.match(code, /"equation-result"/);
  });

  it('refuses removed scene types when validation is bypassed', () => {
    for (const type of ['chat', 'diff']) {
      assert.throws(
        () => compileExplainerDocumentToTsx({
          format: 'seqvio-explainer', schemaVersion: '1.0',
          id: `removed-${type}`,
          scenes: [{ type, id: 'removed' }],
        }),
        new RegExp(`Unsupported ExplainerDocument scene type: ${type}`),
      );
    }
  });

  it('compiles explanation beats into visual starts and audio metadata', () => {
    const { code } = compileExplainerDocumentToTsx({
      format: 'seqvio-explainer', schemaVersion: '1.0',
      id: 'beat-compile',
      fps: 30,
      scenes: [{
        type: 'whiteboard',
        id: 'math',
        elements: [
          { id: 'first', type: 'text', text: 'First', position: { x: 100, y: 100 }, start: 999 },
          { id: 'second', type: 'text', text: 'Second', position: { x: 100, y: 200 }, start: 999 },
        ],
        explanation: {
          cues: [{ id: 'voice', text: 'First appears, then second appears.' }],
          beats: [
            { id: 'first-beat', cueId: 'voice', anchor: { text: 'First' }, visuals: [{ targetId: 'first', action: 'reveal' }] },
            { id: 'second-beat', cueId: 'voice', anchor: { text: 'second' }, visuals: [{ targetId: 'second', action: 'reveal' }] },
          ],
        },
      }],
    });
    assert.match(code, /"id": "math\.first-beat"/);
    assert.match(code, /"id": "math\.voice"/);
    assert.match(code, /"sourceFrame": 0/);
    assert.match(code, /"sourceFrame": 27/);
    assert.doesNotMatch(code, /start=\{999\}/);
    assert.match(code, /start=\{0\}/);
    assert.match(code, /start=\{27\}/);
  });

  it('retimes code and diagram steps from explanation targets', () => {
    const document = {
      format: 'seqvio-explainer', schemaVersion: '1.0', id: 'technical-beats', fps: 30,
      scenes: [
        {
          type: 'code', id: 'code', language: 'ts', source: 'const x = 1;',
          steps: [{ id: 'show-line', at: 999, action: 'focus', range: { startLine: 1, endLine: 1 } }],
          explanation: {
            cues: [{ id: 'voice', text: 'Now inspect this line.' }],
            beats: [{
              id: 'inspect', cueId: 'voice', anchor: { text: 'inspect' },
              visuals: [{ targetId: 'show-line', action: 'focus' }],
            }],
          },
        },
        {
          type: 'diagram', id: 'diagram',
          nodes: [{ id: 'api', label: 'API' }], edges: [],
          steps: [{ id: 'show-api', at: 999, action: 'reveal', targetId: 'api' }],
          explanation: {
            cues: [{ id: 'voice', text: 'Reveal the API.' }],
            beats: [{
              id: 'reveal-api', cueId: 'voice', anchor: { text: 'API' },
              visuals: [{ targetId: 'show-api', action: 'reveal' }],
            }],
          },
        },
      ],
    };
    assert.deepEqual(validateExplainerDocument(document), []);
    const { code } = compileExplainerDocumentToTsx(document);
    assert.doesNotMatch(code, /"at": 999/);
    assert.match(code, /"id": "show-line",\s+"at": 0/);
    assert.match(code, /"id": "show-api",\s+"at": 0,\s+"action": "reveal"/);
  });
});

describe('technical explainer reference IR', () => {
  it('validates the full 3-5 minute reference document', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, join } = await import('node:path');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const ir = JSON.parse(
      readFileSync(join(root, 'examples', 'ir', 'technical-explainer.explainer.json'), 'utf8')
    );
    const issues = validateExplainerDocument(ir);
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
  it('routes explainer documents through the explainer pipeline', () => {
    assert.deepStrictEqual(validateIr(mixedExplainer), []);
    const { code } = compileIr(mixedExplainer);
    assert.match(code, /ExplainerDocument/);
  });

  it('still routes storyboards through the storyboard pipeline', () => {
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
