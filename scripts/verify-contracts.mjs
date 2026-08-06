import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const policy = readJson('seqvio.release-policy.json');
const rootPackage = readJson('package.json');
const errors = [];

function fail(message) {
  errors.push(message);
}

const packageFiles = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `packages/${entry.name}/package.json`)
  .filter((file) => fs.existsSync(path.join(root, file)));
const packages = new Map(packageFiles.map((file) => {
  const manifest = readJson(file);
  return [manifest.name, { file, manifest }];
}));

if (rootPackage.version !== `${policy.releaseTrain.line}.0`) {
  fail(`Root version ${rootPackage.version} must identify release train ${policy.releaseTrain.line}.0`);
}
if (rootPackage.seqvio?.lifecycle !== 'internal') {
  fail('The private workspace root must have seqvio.lifecycle "internal"');
}

const knownPolicyPackages = new Set([
  ...policy.releaseTrain.packages,
  ...policy.independentPackages,
]);
for (const [name, { file, manifest }] of packages) {
  if (!knownPolicyPackages.has(name)) fail(`${file}: package is missing from seqvio.release-policy.json`);
  if (!policy.lifecycles.includes(manifest.seqvio?.lifecycle)) {
    fail(`${file}: invalid or missing seqvio.lifecycle`);
  }
  for (const [dependency, range] of Object.entries(manifest.dependencies ?? {})) {
    const local = packages.get(dependency)?.manifest;
    if (local && range !== local.version) {
      fail(`${file}: ${dependency} must use exact local version ${local.version}, received ${range}`);
    }
  }
}

for (const name of policy.releaseTrain.packages) {
  const entry = packages.get(name);
  if (!entry) {
    fail(`Release-train package is missing: ${name}`);
    continue;
  }
  const { file, manifest } = entry;
  if (!manifest.version.startsWith(`${policy.releaseTrain.line}.`)) {
    fail(`${file}: version ${manifest.version} is outside release train ${policy.releaseTrain.line}`);
  }
  if (manifest.seqvio?.lifecycle !== 'public' || manifest.seqvio?.releaseTrain !== policy.releaseTrain.line) {
    fail(`${file}: release-train packages require public lifecycle and matching releaseTrain metadata`);
  }
}

for (const name of policy.independentPackages) {
  const entry = packages.get(name);
  if (!entry) {
    fail(`Independent package is missing: ${name}`);
    continue;
  }
  if (entry.manifest.seqvio?.lifecycle !== 'experimental' || entry.manifest.seqvio?.versionPolicy !== 'independent') {
    fail(`${entry.file}: independent packages require experimental lifecycle and independent versionPolicy`);
  }
}

for (const name of policy.adapterPackages) {
  const entry = packages.get(name);
  if (entry?.manifest.seqvio?.adapterLifecycle !== 'stable') {
    fail(`${entry?.file ?? name}: capture adapters must declare the promoted stable lifecycle`);
  }
}

const changeset = readJson('.changeset/config.json');
const fixedGroup = new Set(changeset.fixed?.flat() ?? []);
for (const name of policy.releaseTrain.packages) {
  if (!fixedGroup.has(name)) fail(`.changeset/config.json: fixed release train is missing ${name}`);
}
for (const name of fixedGroup) {
  if (!policy.releaseTrain.packages.includes(name)) fail(`.changeset/config.json: unexpected fixed package ${name}`);
}

let capabilities;
try {
  capabilities = require('../packages/core/dist/explainer-document/capabilities.js');
} catch (error) {
  fail(`Build @seqvio/core before contract verification: ${error.message}`);
}
if (capabilities) {
  const snapshot = readJson('docs/scene-capabilities.json');
  const actual = {
    schemaVersion: capabilities.SCENE_CAPABILITIES[capabilities.SCENE_TYPES[0]].schemaVersion,
    scenes: capabilities.SCENE_TYPES.map((type) => {
      const capability = capabilities.SCENE_CAPABILITIES[type];
      return {
        type,
        compiler: capability.compiler,
        requiredPackage: capability.requiredPackage,
        lifecycle: capability.lifecycle,
        agentAuthoring: capability.agentAuthoring,
        qaRules: [...capability.qaRules],
      };
    }),
  };
  if (JSON.stringify(snapshot) !== JSON.stringify(actual)) {
    fail('docs/scene-capabilities.json has drifted from the core scene capability registry');
  }
  for (const scene of actual.scenes) {
    const required = packages.get(scene.requiredPackage)?.manifest;
    if (!required) fail(`Scene ${scene.type} requires missing package ${scene.requiredPackage}`);
    else if (scene.lifecycle === 'public' && required.seqvio?.lifecycle !== 'public') {
      fail(`Public scene ${scene.type} requires non-public package ${scene.requiredPackage}`);
    } else if (scene.lifecycle === 'experimental' && !['public', 'experimental'].includes(required.seqvio?.lifecycle)) {
      fail(`Experimental scene ${scene.type} requires unavailable package ${scene.requiredPackage}`);
    }
  }
}

if (errors.length) {
  process.stderr.write(`Seqvio contract verification failed:\n${errors.map((error) => `- ${error}`).join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Seqvio contracts verified: ${packages.size} packages, ${capabilities.SCENE_TYPES.length} scene capabilities.\n`);
}
