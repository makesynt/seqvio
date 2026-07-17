import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.resolve("examples/compositions/seqvio-overview-shared.tsx"),
  "utf8",
);

const drawShapeBlocks = source.match(/<DrawShape[\s\S]*?\/>/g) ?? [];
const underlineBlocks = drawShapeBlocks.filter((block) =>
  block.includes('type="underline"'),
);

assert.equal(underlineBlocks.length, 2, "RAG scene should have two intentional underlines");

for (const block of underlineBlocks) {
  assert.ok(block.includes("position={{"), "underline should define its actual position");
  assert.ok(block.includes("size={"), "underline should define its actual length");
  assert.ok(!block.includes("from={{"), "underline must not use ignored from/to coordinates");
  assert.ok(!block.includes("to={{"), "underline must not use ignored from/to coordinates");
}

assert.ok(
  source.includes('position={isEndpoint ? { x: x + 103, y: 346 } : { x, y: 276 }}'),
  "circle endpoints should use center coordinates instead of rectangle coordinates",
);
assert.ok(
  source.includes('position={{ x: x + 103, y: 452 }}'),
  "all RAG labels should share a baseline below their nodes",
);

assert.ok(
  source.includes("const enhanced = id.includes('product-hunt')"),
  "high-density launch visuals should stay scoped to Product Hunt compositions",
);
assert.ok(
  source.includes('name="lightbulb"') && source.includes('name="document"'),
  "mini whiteboard previews should use supported icon names",
);
assert.ok(
  !source.includes('name="idea"') && !source.includes('name="database"'),
  "unsupported icon names should not silently render blank",
);
assert.ok(
  source.includes('label="VISUAL EXPLANATION"') && source.includes('label="WORKFLOW PROOF"'),
  "launch scenes should include produced foreground metadata",
);
