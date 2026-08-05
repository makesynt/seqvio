import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deriveDirectionPlan, validateDirectionPlan } from '../packages/core/dist/index.js';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const input = args.get('--ir');
const output = args.get('--out');
const receiptPath = args.get('--receipt') ?? `${output}.receipt.json`;
if (!input || !output) {
  console.error('Usage: node scripts/director-pass.mjs --ir <explainer.json> --out <direction.json> [--receipt <receipt.json>]');
  process.exit(2);
}
const inputPath = path.resolve(input);
const outputPath = path.resolve(output);
const source = await readFile(inputPath, 'utf8');
const document = JSON.parse(source);
const plan = deriveDirectionPlan(document);
const issues = validateDirectionPlan(plan, document);
const errors = issues.filter((item) => item.severity === 'error');
const inputHash = createHash('sha256').update(source).digest('hex');
const receipt = { format: 'seqvio-director-receipt', version: '1.0', operation: 'derive-direction-plan', input: inputPath, inputHash, output: outputPath, planId: plan.id, segmentCount: plan.segments.length, issues, status: errors.length ? 'failed' : 'complete' };
if (errors.length) { await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8'); console.error(JSON.stringify(receipt, null, 2)); process.exit(1); }
await writeFile(outputPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(receipt, null, 2));
