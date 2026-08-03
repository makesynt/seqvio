import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildRenderPlanFromDocument,
  computeDocumentTimeline,
  chapterContentHash,
} from '../dist/index.js';

describe('buildRenderPlanFromDocument', () => {
  it('builds contiguous chapter frame ranges for the technical explainer', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const doc = JSON.parse(
      readFileSync(join(root, 'examples', 'ir', 'technical-explainer.explainer.json'), 'utf8')
    );
    const timeline = computeDocumentTimeline(doc);
    const plan = buildRenderPlanFromDocument(doc);

    assert.strictEqual(plan.chapters.length, 5);
    assert.strictEqual(plan.chapters[0].startFrame, 0);
    assert.ok(plan.chapters[0].endFrame > plan.chapters[0].startFrame);

    for (let i = 1; i < plan.chapters.length; i++) {
      assert.strictEqual(
        plan.chapters[i].startFrame,
        plan.chapters[i - 1].endFrame + 1,
        `chapter ${plan.chapters[i].id} should start after previous chapter`
      );
    }

    const last = plan.chapters[plan.chapters.length - 1];
    assert.strictEqual(last.endFrame, timeline.totalFrames - 1);
    assert.ok(plan.chapters.every((chapter) => chapter.contentHash));
    assert.strictEqual(chapterContentHash(doc, doc.chapters[0]), plan.chapters[0].contentHash);
  });

  it('marks changed chapters pending when IR content changes', async () => {
    const { readFileSync } = await import('node:fs');
    const { join, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const { syncRenderPlanWithDocument } = await import('../dist/index.js');
    const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
    const doc = JSON.parse(
      readFileSync(join(root, 'examples', 'ir', 'technical-explainer.explainer.json'), 'utf8')
    );
    const plan = buildRenderPlanFromDocument(doc);
    plan.chapters[0].status = 'complete';
    plan.chapters[0].outputPath = 'hook.mp4';
    plan.chapters[0].settingsHash = 'abc';
    plan.chapters[1].status = 'complete';
    plan.chapters[1].outputPath = 'model.mp4';
    plan.chapters[1].settingsHash = 'abc';

    const mutated = structuredClone(doc);
    mutated.scenes[0].elements[0].text = 'Changed title';
    const synced = syncRenderPlanWithDocument(plan, mutated);
    assert.ok(synced.changedChapterIds.includes('hook'));
    assert.strictEqual(synced.plan.chapters[0].status, 'pending');
    assert.strictEqual(synced.plan.chapters[1].status, 'complete');
  });
});
