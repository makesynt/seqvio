import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { gzipSync } from 'node:zlib';
import { createPublishEnvironment, publishPackages } from '../publish-packages.mjs';
import { readTarEntries, requiredPublishFiles } from '../verify-publish-artifacts.mjs';

test('publish environment disables npm lifecycle scripts without dropping credentials', () => {
  const environment = createPublishEnvironment({ NODE_AUTH_TOKEN: 'test-token', CUSTOM: 'value' });
  assert.equal(environment.npm_config_ignore_scripts, 'true');
  assert.equal(environment.NODE_AUTH_TOKEN, 'test-token');
  assert.equal(environment.CUSTOM, 'value');
});

test('publish wrapper passes the safe environment to the Changesets child process', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-publish-wrapper-'));
  const output = path.join(root, 'child.json');
  const cli = path.join(root, 'fake-changeset.mjs');
  fs.writeFileSync(cli, [
    "import fs from 'node:fs';",
    "fs.writeFileSync(process.env.TEST_OUTPUT, JSON.stringify({",
    "  command: process.argv[2],",
    "  ignoreScripts: process.env.npm_config_ignore_scripts,",
    "  token: process.env.NODE_AUTH_TOKEN,",
    "}));",
  ].join('\n'));

  let inspections = 0;
  await publishPackages({
    cliPath: cli,
    cwd: root,
    npmCli: process.env.npm_execpath,
    packages: [{ name: '@seqvio/test', version: '1.0.0' }],
    inspectState: () => ({
      complete: inspections++ > 0, missingVersions: ['@seqvio/test@1.0.0'], missingTags: [],
    }),
    postconditionDelayMs: 0,
    environment: { TEST_OUTPUT: output, NODE_AUTH_TOKEN: 'test-token' },
    stdio: 'pipe',
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), {
    command: 'publish', ignoreScripts: 'true', token: 'test-token',
  });
});

test('publish wrapper accepts a nonzero child only after complete postconditions', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-publish-postcondition-'));
  const cli = path.join(root, 'failing-changeset.mjs');
  fs.writeFileSync(cli, 'process.exitCode = 1;\n');
  let inspections = 0;

  await publishPackages({
    cliPath: cli,
    cwd: root,
    npmCli: process.env.npm_execpath,
    packages: [{ name: '@seqvio/test', version: '1.0.0' }],
    inspectState: () => inspections++ === 0
      ? { complete: false, missingVersions: ['@seqvio/test@1.0.0'], missingTags: [] }
      : { complete: true, missingVersions: [], missingTags: [] },
    postconditionDelayMs: 0,
    environment: {},
    stdio: 'pipe',
  });
});

test('publish wrapper rejects a zero exit when release postconditions are incomplete', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-publish-incomplete-'));
  const cli = path.join(root, 'successful-changeset.mjs');
  fs.writeFileSync(cli, 'process.exitCode = 0;\n');

  await assert.rejects(publishPackages({
    cliPath: cli,
    cwd: root,
    npmCli: process.env.npm_execpath,
    packages: [{ name: '@seqvio/test', version: '1.0.0' }],
    inspectState: () => ({
      complete: false,
      missingVersions: ['@seqvio/test@1.0.0'],
      missingTags: ['@seqvio/test@1.0.0'],
    }),
    postconditionAttempts: 2,
    postconditionDelayMs: 0,
    environment: {},
    stdio: 'pipe',
  }), /release is incomplete.*missing npm versions.*missing git tags/);
});

test('publish artifact requirements cover entrypoints, bins, and conditional exports', () => {
  assert.deepEqual(requiredPublishFiles({
    main: 'dist/index.js',
    types: './dist/index.d.ts',
    bin: { seqvio: 'dist/cli.js' },
    exports: {
      '.': { import: './dist/index.js', types: './dist/index.d.ts' },
      './package.json': './package.json',
      './generated/*': './dist/generated/*',
    },
  }), ['dist/index.js', 'dist/index.d.ts', 'dist/cli.js', 'package.json']);
});

test('tar reader returns actual package entry paths without npm JSON output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'seqvio-tar-reader-'));
  const tarball = path.join(root, 'package.tgz');
  const blocks = [];
  for (const [name, content] of [['package/package.json', '{}'], ['package/dist/index.js', 'ok']]) {
    const data = Buffer.from(content);
    const header = Buffer.alloc(512);
    header.write(name, 0, 100, 'utf8');
    header.write(`${data.length.toString(8).padStart(11, '0')}\0`, 124, 12, 'ascii');
    blocks.push(header, data, Buffer.alloc(Math.ceil(data.length / 512) * 512 - data.length));
  }
  blocks.push(Buffer.alloc(1024));
  fs.writeFileSync(tarball, gzipSync(Buffer.concat(blocks)));

  assert.deepEqual(readTarEntries(tarball), [
    'package/package.json', 'package/dist/index.js',
  ]);
});
