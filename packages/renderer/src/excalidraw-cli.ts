#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";
import { generateExcalidrawTsx, importExcalidrawFile } from "./excalidraw";

function usage(): void {
  console.log(`Usage:
  seqvio-excalidraw import --input <file.excalidraw> --outDir <directory> [options]

Options:
  --width <number>       Output canvas width (default: 1280)
  --height <number>      Output canvas height (default: 720)
  --margin <number>      Canvas margin in pixels (default: 64)
  --drawSpeed <number>   Path pixels per frame (default: 18)
  --minDuration <number> Minimum element duration in frames (default: 18)
  --maxDuration <number> Maximum element duration in frames (default: 120)
  --force                 Overwrite generated files
  --help`);
}

function parse(argv: string[]): Map<string, string | boolean> {
  const result = new Map<string, string | boolean>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    if (key === "help" || key === "force") {
      result.set(key, true);
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--"))
      throw new Error(`Missing value for --${key}`);
    result.set(key, value);
    index += 1;
  }
  return result;
}
function required(values: Map<string, string | boolean>, key: string): string {
  const value = values.get(key);
  if (typeof value !== "string") throw new Error(`Missing required --${key}`);
  return value;
}
function write(filePath: string, content: string, force: boolean): void {
  if (fs.existsSync(filePath) && !force)
    throw new Error(`Output exists (use --force): ${filePath}`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

const values = parse(process.argv.slice(2));
if (values.get("help")) {
  usage();
  process.exit(0);
}
if (process.argv[2] !== "import") {
  usage();
  process.exit(1);
}
try {
  const input = required(values, "input");
  const outDir = path.resolve(required(values, "outDir"));
  const result = importExcalidrawFile(input, {
    width: Number(values.get("width") ?? 1280),
    height: Number(values.get("height") ?? 720),
    margin: Number(values.get("margin") ?? 64),
    drawSpeed: Number(values.get("drawSpeed") ?? 18),
    minDuration: Number(values.get("minDuration") ?? 18),
    maxDuration: Number(values.get("maxDuration") ?? 120),
  });
  write(
    path.join(outDir, "import.json"),
    JSON.stringify({ elements: result.elements, report: result.report }, null, 2) + "\n",
    Boolean(values.get("force")),
  );
  write(
    path.join(outDir, "diagram.tsx"),
    generateExcalidrawTsx(result.elements, result.report, result.document),
    Boolean(values.get("force")),
  );
  write(
    path.join(outDir, "import-report.json"),
    JSON.stringify(result.report, null, 2) + "\n",
    Boolean(values.get("force")),
  );
  console.log(JSON.stringify(result.report, null, 2));
} catch (error) {
  console.error(
    `seqvio-excalidraw failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
}
