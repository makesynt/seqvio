import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { syncReleaseTrain } from '../sync-release-train.mjs';

function writeJson(root, file, value) {
  const output = path.join(root, file);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function createFixture(versions = ['0.8.0', '0.8.0']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-release-train-'));
  writeJson(root, 'seqvio.release-policy.json', {
    releaseTrain: { line: '0.7', packages: ['@seqvio/core', '@seqvio/renderer'] },
  });
  writeJson(root, 'package.json', {
    name: 'seqvio', version: '0.7.0', seqvio: { lifecycle: 'internal', releaseTrain: '0.7' },
  });
  writeJson(root, 'package-lock.json', {
    name: 'seqvio', version: '0.7.0', lockfileVersion: 3,
    packages: {
      '': { name: 'seqvio', version: '0.7.0' },
      'packages/core': { name: '@seqvio/core', version: '0.7.2' },
      'packages/renderer': {
        name: '@seqvio/renderer', version: '0.7.2',
        dependencies: { '@seqvio/core': '0.7.2' },
      },
      'packages/capture': { name: '@seqvio/capture', version: '0.2.0' },
    },
  });
  writeJson(root, 'packages/core/package.json', {
    name: '@seqvio/core', version: versions[0], seqvio: { lifecycle: 'public', releaseTrain: '0.7' },
  });
  writeJson(root, 'packages/renderer/package.json', {
    name: '@seqvio/renderer', version: versions[1],
    seqvio: { lifecycle: 'public', releaseTrain: '0.7' },
    dependencies: { '@seqvio/core': versions[0] },
  });
  writeJson(root, 'packages/capture/package.json', {
    name: '@seqvio/capture', version: '0.3.0',
    seqvio: { lifecycle: 'experimental', versionPolicy: 'independent' },
  });
  return root;
}

test('synchronizes a generated fixed-group version into all release metadata', () => {
  const root = createFixture();
  const result = syncReleaseTrain(root);

  assert.deepEqual(result, {
    previousLine: '0.7', releaseLine: '0.8',
    packages: ['@seqvio/core', '@seqvio/renderer'],
  });
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version, '0.8.0');
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(root, 'seqvio.release-policy.json'))).releaseTrain.line,
    '0.8',
  );
  for (const packageName of ['core', 'renderer']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, `packages/${packageName}/package.json`)));
    assert.equal(manifest.seqvio.releaseTrain, '0.8');
  }
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json')));
  assert.equal(lock.version, '0.8.0');
  assert.equal(lock.packages[''].version, '0.8.0');
  assert.equal(lock.packages['packages/core'].version, '0.8.0');
  assert.equal(lock.packages['packages/renderer'].version, '0.8.0');
  assert.equal(lock.packages['packages/renderer'].dependencies['@seqvio/core'], '0.8.0');
  assert.equal(lock.packages['packages/capture'].version, '0.3.0');

  const files = ['package.json', 'package-lock.json', 'seqvio.release-policy.json',
    'packages/core/package.json', 'packages/renderer/package.json'];
  const firstPass = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8'));
  const secondResult = syncReleaseTrain(root);
  assert.equal(secondResult.previousLine, '0.8');
  assert.deepEqual(
    files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')),
    firstPass,
  );
});

test('refuses a generated fixed group that spans multiple release lines', () => {
  const root = createFixture(['0.8.0', '0.9.0']);
  assert.throws(() => syncReleaseTrain(root), /must share one major\/minor line/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version, '0.7.0');
});

test('refuses to move a release train backward', () => {
  const root = createFixture(['0.6.2', '0.6.2']);
  assert.throws(() => syncReleaseTrain(root), /cannot move backward/);
});
