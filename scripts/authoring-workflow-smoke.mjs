#!/usr/bin/env node

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compileExplainerDocumentToTsx,
  formatEditorialPlanMarkdown,
  formatVisualDesignBriefMarkdown,
  validateAuthoringTrace,
  validateExplainerDocument,
} from '../packages/core/dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleDir = path.join(root, 'examples', 'authoring', 'native-module-ci');

function normalized(text) {
  return text.replace(/\r\n/g, '\n').trimEnd();
}

function assertNoErrors(label, issues) {
  const errors = issues.filter((issue) => issue.severity === 'error');
  if (errors.length > 0) {
    throw new Error(`${label} failed:\n${errors.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n')}`);
  }
}

function assertMatchesGenerated(label, actual, expected) {
  const actualLines = normalized(actual).split('\n');
  const expectedLines = normalized(expected).split('\n');
  const length = Math.max(actualLines.length, expectedLines.length);
  for (let index = 0; index < length; index += 1) {
    if (actualLines[index] !== expectedLines[index]) {
      throw new Error(
        `${label} has drifted from authoring-data.json at line ${index + 1}.\n` +
        `Expected: ${expectedLines[index] ?? '<EOF>'}\n` +
        `Received: ${actualLines[index] ?? '<EOF>'}`,
      );
    }
  }
}

const authoring = JSON.parse(await readFile(path.join(exampleDir, 'authoring-data.json'), 'utf8'));
const document = JSON.parse(await readFile(path.join(exampleDir, 'native-module-ci.explainer.json'), 'utf8'));
const editorialMarkdown = await readFile(path.join(exampleDir, 'EDITORIAL.md'), 'utf8');
const visualMarkdown = await readFile(path.join(exampleDir, 'VISUAL-DESIGN.md'), 'utf8');

assertNoErrors(
  'Authoring trace validation',
  validateAuthoringTrace(authoring.editorialPlan, authoring.visualDesignBrief, document),
);
assertNoErrors('ExplainerDocument validation', validateExplainerDocument(document));

assertMatchesGenerated('EDITORIAL.md', editorialMarkdown, formatEditorialPlanMarkdown(authoring.editorialPlan));
assertMatchesGenerated('VISUAL-DESIGN.md', visualMarkdown, formatVisualDesignBriefMarkdown(authoring.visualDesignBrief));

const omittedClaims = authoring.editorialPlan.concepts
  .filter((concept) => concept.decision === 'omit')
  .map((concept) => concept.claim.toLowerCase());
const executableText = JSON.stringify(document).toLowerCase();
for (const claim of omittedClaims) {
  if (executableText.includes(claim)) {
    throw new Error(`Omitted editorial claim leaked into the executable IR: ${claim}`);
  }
}

if (document.scenes.some((scene) => scene.type === 'terminal' || scene.type === 'browser')) {
  throw new Error('The no-capture fixture must not fabricate terminal or browser scenes.');
}

const { code } = compileExplainerDocumentToTsx(document);
if (!code.includes('ArchitectureDiagram') || !code.includes('CodeWalkthrough')) {
  throw new Error('Compiled TSX does not contain the visual forms required by the design brief.');
}

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'seqvio-authoring-smoke-'));
const generatedPath = path.join(tempDir, 'native-module-ci.tsx');
try {
  await writeFile(generatedPath, code, 'utf8');
  process.stdout.write(`${JSON.stringify({
    ok: true,
    editorialSections: authoring.editorialPlan.sections.length,
    visualTreatments: authoring.visualDesignBrief.sceneTreatments.length,
    scenes: document.scenes.length,
    generatedTsxVerified: true,
    generatedTsxBytes: Buffer.byteLength(code, 'utf8'),
  }, null, 2)}\n`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
