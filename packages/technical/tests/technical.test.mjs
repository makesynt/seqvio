import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  applyCodeSteps,
  createLineRecords,
  highlightLine,
  highlightSource,
  resetLineIdCounter,
} from '../dist/code-utils.js';
import {
  collapsedGroupsAt,
  layoutDiagram,
} from '../dist/diagram-layout.js';

describe('highlightLine / highlightSource (Shiki)', () => {
  it('colors keywords, types, and strings via Shiki', () => {
    const tokens = highlightLine('const name: string = "seqvio";', 'typescript');
    assert.ok(tokens.some((token) => token.text === 'const'));
    assert.ok(tokens.some((token) => token.text.includes('seqvio') || token.text === '"seqvio"'));
    const lines = highlightSource('function hi() {\n  return 1;\n}\n', 'typescript');
    assert.ok(lines.length >= 3);
    assert.ok(lines[0].some((token) => token.text === 'function'));
  });
});

describe('applyCodeSteps', () => {
  it('reveals typed characters over time using stable line ids', () => {
    resetLineIdCounter();
    const source = 'hello';
    const steps = [{ at: 0, action: 'type', range: { startLine: 1, endLine: 1 } }];
    const early = applyCodeSteps(source, steps, 0);
    const later = applyCodeSteps(source, steps, 10);
    const lineId = early.records[0].id;
    assert.strictEqual(early.typedChars.get(lineId), 0);
    assert.ok((later.typedChars.get(lineId) ?? 0) > 0);
  });

  it('types multiple lines sequentially, not in parallel', () => {
    resetLineIdCounter();
    const source = 'aaa\nbbbb\ncc\n';
    const steps = [{ at: 0, action: 'type', range: { startLine: 1, endLine: 3 } }];
    // 3 chars on line1 need 6 frames; at frame 4 only line1 should be partial.
    const midFirst = applyCodeSteps(source, steps, 4);
    assert.strictEqual(midFirst.typedChars.get(midFirst.records[0].id), 2);
    assert.strictEqual(midFirst.typedChars.get(midFirst.records[1].id), 0);
    assert.strictEqual(midFirst.typedChars.get(midFirst.records[2].id), 0);

    // After line1 completes (3 chars => 6 frames), line2 starts.
    const midSecond = applyCodeSteps(source, steps, 8);
    assert.strictEqual(midSecond.typedChars.get(midSecond.records[0].id), 3);
    assert.strictEqual(midSecond.typedChars.get(midSecond.records[1].id), 1);
    assert.strictEqual(midSecond.typedChars.get(midSecond.records[2].id), 0);
  });

  it('preserves line identity across insert and delete', () => {
    resetLineIdCounter();
    const source = 'alpha\nbeta\ngamma\n';
    const records = createLineRecords(source);
    const betaId = records[1].id;
    const afterInsert = applyCodeSteps(
      source,
      [{ at: 0, action: 'insert', line: 2, text: 'NEW\n' }],
      10
    );
    assert.ok(afterInsert.records.some((line) => line.id === betaId));
    assert.strictEqual(
      afterInsert.records.find((line) => line.id === betaId)?.lineNumber,
      3
    );

    const afterDelete = applyCodeSteps(
      source,
      [{ at: 0, action: 'delete', range: { startLine: 1, endLine: 1 } }],
      10
    );
    assert.ok(afterDelete.records.some((line) => line.id === betaId));
    assert.strictEqual(
      afterDelete.records.find((line) => line.id === betaId)?.lineNumber,
      1
    );
  });
});

describe('layoutDiagram', () => {
  it('lays out nodes deterministically with dagre', () => {
    const a = layoutDiagram(
      [
        { id: 'client', label: 'Client' },
        { id: 'api', label: 'API' },
      ],
      [{ id: 'edge', from: 'client', to: 'api' }],
      1280,
      720
    );
    const b = layoutDiagram(
      [
        { id: 'client', label: 'Client' },
        { id: 'api', label: 'API' },
      ],
      [{ id: 'edge', from: 'client', to: 'api' }],
      1280,
      720
    );
    assert.deepStrictEqual(a.nodes, b.nodes);
    assert.strictEqual(a.nodes.length, 2);
    assert.strictEqual(a.edges.length, 1);
  });

  it('collapses and expands a subsystem group', () => {
    const nodes = [
      { id: 'gw', label: 'Gateway' },
      { id: 'svc', label: 'Service', groupId: 'backend' },
      { id: 'db', label: 'DB', groupId: 'backend' },
    ];
    const edges = [
      { id: 'e1', from: 'gw', to: 'svc' },
      { id: 'e2', from: 'svc', to: 'db' },
    ];
    const steps = [
      { at: 10, action: 'collapse', groupId: 'backend' },
      { at: 40, action: 'expand', groupId: 'backend' },
    ];
    assert.deepStrictEqual([...collapsedGroupsAt(steps, 5)], []);
    assert.deepStrictEqual([...collapsedGroupsAt(steps, 20)], ['backend']);
    assert.deepStrictEqual([...collapsedGroupsAt(steps, 50)], []);

    const collapsed = layoutDiagram(nodes, edges, 1280, 720, new Set(['backend']));
    assert.ok(collapsed.nodes.some((node) => node.id === '__group:backend'));
    assert.ok(!collapsed.nodes.some((node) => node.id === 'svc'));
    assert.strictEqual(collapsed.nodes.length, 2);
  });
});
