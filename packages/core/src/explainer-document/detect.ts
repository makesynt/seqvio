/**
 * IR format detection — Storyboard vs ExplainerDocument.
 */

import type { ExplainerDocument } from './schema';
import { EXPLAINER_DOCUMENT_FORMAT, EXPLAINER_DOCUMENT_SCHEMA_VERSION } from './schema';

export type IrFormat = 'storyboard' | 'explainer';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isExplainerDocument(
  input: unknown
): input is ExplainerDocument {
  return (
    isObject(input) &&
    input.format === EXPLAINER_DOCUMENT_FORMAT &&
    input.schemaVersion === EXPLAINER_DOCUMENT_SCHEMA_VERSION &&
    typeof input.id === 'string' &&
    Array.isArray(input.scenes)
  );
}

export function detectIrFormat(input: unknown): IrFormat | null {
  if (!isObject(input)) return null;
  if (
    input.format === EXPLAINER_DOCUMENT_FORMAT &&
    input.schemaVersion === EXPLAINER_DOCUMENT_SCHEMA_VERSION
  ) return 'explainer';
  if (typeof input.id === 'string' && Array.isArray(input.scenes)) {
    return 'storyboard';
  }
  return null;
}
