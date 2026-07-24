import { describe, it } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import {
  buildConcatListFile,
  hashRenderSettings,
  shouldSkipChapter,
} from '../dist/chapter-render.js';

describe('chapter render helpers', () => {
  it('hashes render settings deterministically', () => {
    const a = hashRenderSettings({ component: 'x.tsx', output: 'out.mp4', fps: 30, quality: 'low' }, 'preview');
    const b = hashRenderSettings({ component: 'x.tsx', output: 'out.mp4', fps: 30, quality: 'low' }, 'preview');
    const c = hashRenderSettings({ component: 'x.tsx', output: 'out.mp4', fps: 24, quality: 'low' }, 'preview');
    assert.strictEqual(a, b);
    assert.notStrictEqual(a, c);
  });

  it('decides resume skip only for complete matching chapters', () => {
    const entry = {
      id: 'intro',
      startFrame: 0,
      endFrame: 100,
      contentHash: 'abc',
      settingsHash: 'settings',
      status: 'complete',
      outputPath: 'intro.mp4',
    };
    assert.equal(shouldSkipChapter(entry, 'abc', 'settings', true), false);
    entry.outputPath = fileURLToPath(import.meta.url);
    assert.equal(shouldSkipChapter(entry, 'abc', 'settings', true), true);
    assert.equal(shouldSkipChapter(entry, 'changed', 'settings', true), false);
    assert.equal(shouldSkipChapter(entry, 'abc', 'settings', false), false);
  });

  it('builds ffmpeg concat list lines', () => {
    const list = buildConcatListFile(['C:/tmp/a.mp4', "C:/tmp/b's.mp4"]);
    assert.match(list, /file 'C:\/tmp\/a\.mp4'/);
    assert.match(list, /b'\\''s\.mp4/);
  });
});
