import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deriveDirectionPlan, validateDirectionPlan } from '../packages/core/dist/index.js';

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/generate-direction-sidecar.mjs <explainer.json> <direction.json>');
  process.exit(2);
}

const inputPath = path.resolve(inputArg);
const outputPath = path.resolve(outputArg);
const document = JSON.parse(await readFile(inputPath, 'utf8'));
const plan = deriveDirectionPlan(document);
const issues = validateDirectionPlan(plan, document);
const errors = issues.filter((item) => item.severity === 'error');
if (errors.length > 0) {
  console.error(JSON.stringify({ ok: false, issues }, null, 2));
  process.exit(1);
}
await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, inputPath, outputPath, segments: plan.segments.length, issues }, null, 2));
