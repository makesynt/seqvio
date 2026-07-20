import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  applyCodeSteps,
  createLineRecords,
  highlightLine,
  resetLineIdCounter,
} from '../dist/code-utils.js';
import { layoutDiagram } from '../dist/diagram-layout.js';

describe('highlightLine', () => {
  it('colors keywords, types, and strings', () => {
    const tokens = highlightLine('const name: string = "seqvio";', 'typescript');
    assert.ok(tokens.some((token) => token.text === 'const'));
    assert.ok(tokens.some((token) => token.text === 'string'));
    assert.ok(tokens.some((token) => token.text === '"seqvio"'));
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
  it('lays out nodes deterministically', () => {
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
});
