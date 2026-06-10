/**
 * Storyboard IR tests — run against the compiled dist (CommonJS) so they need
 * no TypeScript loader. Build core first: `npm run build -w @seqvio/core`.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateStoryboard,
  compileStoryboardToTsx,
} from '../dist/index.js';

const validBoard = {
  id: 'demo',
  scenes: [
    {
      id: 'intro',
      narration: 'Hello from a storyboard.',
      elements: [
        { type: 'text', text: 'Hi', position: { x: 100, y: 100 }, start: 0, duration: 20 },
        { type: 'shape', shape: 'arrow', from: { x: 0, y: 0 }, to: { x: 10, y: 10 } },
      ],
    },
  ],
};

describe('validateStoryboard', () => {
  it('accepts a well-formed storyboard', () => {
    assert.deepStrictEqual(validateStoryboard(validBoard), []);
  });

  it('rejects a non-object', () => {
    const issues = validateStoryboard(null);
    assert.ok(issues.some((i) => i.severity === 'error'));
  });

  it('rejects a missing id and empty scenes', () => {
    const issues = validateStoryboard({ scenes: [] });
    assert.ok(issues.some((i) => /id/.test(i.message)));
    assert.ok(issues.some((i) => /scenes/.test(i.message)));
  });

  it('rejects an unsupported element type', () => {
    const issues = validateStoryboard({
      id: 'x',
      scenes: [{ id: 's', elements: [{ type: 'video' }] }],
    });
    assert.ok(issues.some((i) => /type/.test(i.message)));
  });

  it('requires from/to for directional shapes', () => {
    const issues = validateStoryboard({
      id: 'x',
      scenes: [{ id: 's', elements: [{ type: 'shape', shape: 'arrow' }] }],
    });
    assert.ok(issues.some((i) => /from/.test(i.message)));
  });

  it('flags duplicate scene ids', () => {
    const issues = validateStoryboard({
      id: 'x',
      scenes: [
        { id: 'dup', elements: [] },
        { id: 'dup', elements: [] },
      ],
    });
    assert.ok(issues.some((i) => /duplicated/.test(i.message)));
  });
});

describe('compileStoryboardToTsx', () => {
  it('emits TSX that imports core and whiteboard, not the reverse', () => {
    const { code } = compileStoryboardToTsx(validBoard);
    assert.match(code, /from '@seqvio\/core'/);
    assert.match(code, /from '@seqvio\/whiteboard'/);
    assert.match(code, /<VideoComposition/);
    assert.match(code, /<DrawText/);
    assert.match(code, /<DrawShape/);
  });

  it('carries narration into the audio manifest', () => {
    const { code } = compileStoryboardToTsx(validBoard);
    assert.match(code, /Hello from a storyboard\./);
    assert.match(code, /lockToAudio: true/);
  });

  it('compiles icon elements and imports DrawIcon', () => {
    const board = {
      id: 'icons',
      scenes: [
        {
          id: 's',
          elements: [
            { type: 'icon', name: 'check', position: { x: 100, y: 100 }, size: 80 },
          ],
        },
      ],
    };
    const { code } = compileStoryboardToTsx(board);
    assert.match(code, /DrawIcon/);
    assert.match(code, /name=\{"check"\}/);
  });

  it('emits explicit scene duration so it renders before audio synthesis', () => {
    const board = {
      id: 'x',
      scenes: [
        {
          id: 's',
          elements: [{ type: 'text', text: 'hi', position: { x: 1, y: 1 }, start: 0, duration: 40 }],
        },
      ],
    };
    const { code } = compileStoryboardToTsx(board);
    assert.match(code, /<Scene id="s" duration=\{\d+\}>/);
  });

  it('omits audio/lockToAudio when there is no narration', () => {
    const board = {
      id: 'x',
      scenes: [{ id: 's', elements: [{ type: 'text', text: 'hi', position: { x: 1, y: 1 } }] }],
    };
    const { code } = compileStoryboardToTsx(board);
    assert.doesNotMatch(code, /lockToAudio/);
    assert.doesNotMatch(code, /audio=\{meta\.audio\}/);
  });

  it('inserts a fade transition between consecutive scenes', () => {
    const board = {
      id: 'two',
      scenes: [
        { id: 'a', elements: [{ type: 'text', text: 'A', position: { x: 1, y: 1 } }] },
        { id: 'b', elements: [{ type: 'text', text: 'B', position: { x: 1, y: 1 } }] },
      ],
    };
    const { code } = compileStoryboardToTsx(board);
    assert.match(code, /<Transition type="fade"/);
  });
});
