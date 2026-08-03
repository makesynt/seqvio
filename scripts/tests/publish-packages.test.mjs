import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import test from 'node:test';
import { createPublishEnvironment, publishPackages } from '../publish-packages.mjs';
import { requiredPublishFiles } from '../verify-publish-artifacts.mjs';

test('publish environment disables npm lifecycle scripts without dropping credentials', () => {
  const environment = createPublishEnvironment({ NODE_AUTH_TOKEN: 'test-token', CUSTOM: 'value' });
  assert.equal(environment.npm_config_ignore_scripts, 'true');
  assert.equal(environment.NODE_AUTH_TOKEN, 'test-token');
  assert.equal(environment.CUSTOM, 'value');
});

test('publish wrapper passes the safe environment to the Changesets child process', () => {
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

  publishPackages({
    cliPath: cli,
    cwd: root,
    environment: { TEST_OUTPUT: output, NODE_AUTH_TOKEN: 'test-token' },
    stdio: 'pipe',
  });
  assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), {
    command: 'publish', ignoreScripts: 'true', token: 'test-token',
  });
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
