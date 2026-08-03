/**
 * Compile a CaptureManifest into an ExplainerDocument IR.
 *
 * This is a dispatcher: per-kind compilers are injected via `options.compilers`
 * because they carry kind-specific dependencies (terminal needs @xterm/headless
 * for grid snapshots; browser needs video-asset handling). Adapters implement
 * the compilers and callers inject them - capture itself depends on no adapter,
 * so there is no import cycle.
 *
 * The AI explain step runs inside each compiler: if a NarrationProvider is
 * supplied, narration is generated from each step's captured real state and
 * injected into the scene - narration follows what actually happened, not the
 * plan.
 */

import type {
  CaptureKind,
  CaptureManifest,
  CompileOptions,
  ExplainerDocumentSeed,
} from './types';

type CaptureManifestFor<K extends CaptureKind> = Extract<CaptureManifest, { kind: K }>;

export type CaptureCompiler<K extends CaptureKind> = (
  manifest: CaptureManifestFor<K>,
  options?: CompileOptions
) => Promise<ExplainerDocumentSeed>;

export type CompilerMap = {
  [K in CaptureKind]?: CaptureCompiler<K>;
};

export interface CompileCaptureOptions extends CompileOptions {
  /** Per-kind compilers, injected by the caller (adapters provide them). */
  compilers?: CompilerMap;
}

export async function compileCaptureManifestToExplainerDocument(
  manifest: CaptureManifest,
  options?: CompileCaptureOptions
): Promise<ExplainerDocumentSeed> {
  const missingCompiler = (): never => {
    throw new Error(
      `No compiler registered for capture kind "${manifest.kind}". ` +
        'Pass it via options.compilers (adapter packages provide per-kind compilers).'
    );
  };

  if (manifest.kind === 'terminal') {
    const compiler = options?.compilers?.terminal;
    if (!compiler) return missingCompiler();
    return compiler(manifest, options);
  }

  const compiler = options?.compilers?.browser;
  if (!compiler) return missingCompiler();
  return compiler(manifest, options);
}
