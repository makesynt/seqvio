import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  generateExcalidrawTsx,
  importExcalidrawFile,
} from "../dist/excalidraw.js";

const fixture = fileURLToPath(
  new URL("./fixtures/basic.excalidraw", import.meta.url),
);
const workflowFixture = fileURLToPath(
  new URL(
    "../../../examples/excalidraw/seqvio-workflow.excalidraw",
    import.meta.url,
  ),
);

test("imports static Excalidraw elements with deterministic timing", () => {
  const result = importExcalidrawFile(fixture);
  assert.equal(result.report.imported, 8);
  assert.equal(result.report.skipped, 2);
  assert.equal(result.report.canvas.background, "#f8fafc");
  assert.equal(result.elements[0].type, "path");
  assert.equal(result.elements[0].points?.[0].x, 64);
  assert.equal(
    result.elements.find((element) => element.id === "arrow").arrowhead?.length,
    4,
  );
  assert.equal(
    result.elements.find((element) => element.id === "ellipse").id,
    "ellipse",
  );
  assert.equal(
    result.elements.find((element) => element.id === "diamond").id,
    "diamond",
  );
  assert.equal(
    result.elements.find((element) => element.id === "connector").id,
    "connector",
  );
  assert.match(
    result.elements.find((element) => element.id === "caption").text,
    /explanation/,
  );
  assert.ok(
    result.report.warnings.some((warning) => warning.type === "embeddable"),
  );
  const first = JSON.stringify(importExcalidrawFile(fixture));
  const second = JSON.stringify(importExcalidrawFile(fixture));
  assert.equal(first, second);
  assert.equal(result.document.elements.length, 8);
  assert.equal(result.document.elements[2].endArrowhead, "arrow");
  assert.equal(result.document.elements[4].type, "ellipse");
});

test("generated TSX references only public Seqvio whiteboard components", () => {
  const result = importExcalidrawFile(fixture);
  const tsx = generateExcalidrawTsx(
    result.elements,
    result.report,
    result.document,
  );
  assert.match(tsx, /@seqvio\/whiteboard/);
  assert.match(tsx, /ExcalidrawCanvasScene/);
  assert.match(tsx, /"fillStyle":"cross-hatch"/);
  assert.match(tsx, /"roughness":1\.1/);
  assert.doesNotMatch(tsx, /DrawPath/);
  assert.match(tsx, /"endArrowhead":"arrow"/);
  assert.match(tsx, /export const meta/);
});

test("semantic timing keeps bound text after its container and arrows between nodes", () => {
  const result = importExcalidrawFile(workflowFixture);
  const position = (id) =>
    result.elements.findIndex((element) => element.id === id);
  assert.ok(position("session") < position("session-label"));
  assert.ok(position("session-label") < position("a1"));
  assert.ok(position("a1") < position("evidence"));
  assert.ok(position("story") < position("a3"));
  assert.ok(position("a3") < position("render"));
  assert.notEqual(
    result.elements.find((element) => element.id === "session").revealGroup,
    result.elements.find((element) => element.id === "session-label")
      .revealGroup,
  );
  assert.notEqual(
    result.elements.find((element) => element.id === "session").start,
    result.elements.find((element) => element.id === "session-label").start,
  );
});
