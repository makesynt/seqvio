import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDirectorTask } from '../packages/core/dist/index.js';

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i], process.argv[i + 1]);
const mode = args.get('--mode');
const input = args.get('--ir');
const output = args.get('--out');
const candidatePath = args.get('--candidate');
const receiptPath = args.get('--receipt') ?? `${output}.receipt.json`;
if (!['generate', 'repair'].includes(mode) || !input || !output || (mode === 'repair' && !candidatePath)) {
  console.error('Usage: node scripts/director-task.mjs --mode <generate|repair> --ir <explainer.json> --out <task.json> [--candidate <artifacts.json>] [--receipt <receipt.json>]');
  process.exit(2);
}

const hash = (value) => createHash('sha256').update(value).digest('hex');
const inputPath = path.resolve(input);
const outputPath = path.resolve(output);
const source = await readFile(inputPath, 'utf8');
const document = JSON.parse(source);
const candidateSource = candidatePath ? await readFile(path.resolve(candidatePath), 'utf8') : undefined;
const candidate = candidateSource ? JSON.parse(candidateSource) : undefined;
const task = createDirectorTask(document, mode, candidate);
const serializedTask = `${JSON.stringify(task, null, 2)}\n`;
const receipt = {
  format: 'seqvio-director-receipt', version: '1.0', operation: `prepare-${mode}-task`, status: 'complete',
  input: inputPath, inputHash: hash(source), candidate: candidatePath ? path.resolve(candidatePath) : undefined,
  candidateHash: candidateSource ? hash(candidateSource) : undefined, output: outputPath, outputHash: hash(serializedTask),
  requestedArtifacts: task.requestedArtifacts, diagnosticCount: task.diagnostics.length,
};
await mkdir(path.dirname(outputPath), { recursive: true });
await mkdir(path.dirname(path.resolve(receiptPath)), { recursive: true });
await writeFile(outputPath, serializedTask, 'utf8');
await writeFile(path.resolve(receiptPath), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(receipt, null, 2));
