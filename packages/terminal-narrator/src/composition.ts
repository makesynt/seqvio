import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileExplainerDocumentToTsx, type ExplainerDocument } from '@seqvio/core';
import {
  compileCaptureManifestToExplainerDocument,
  type TerminalCaptureManifest,
} from '@seqvio/capture';
import { compileTerminalCapture } from './compile-to-ir';

export interface CaptureCompositionArtifacts {
  componentPath: string;
  audioManifestPath?: string;
  captureManifestPath: string;
  explainerDocumentPath: string;
  document: ExplainerDocument;
}

export async function writeCaptureArtifacts(
  manifest: TerminalCaptureManifest,
  jobDir: string
): Promise<CaptureCompositionArtifacts> {
  fs.mkdirSync(jobDir, { recursive: true });
  const captureManifestPath = path.join(jobDir, 'capture-manifest.json');
  fs.writeFileSync(captureManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const seed = await compileCaptureManifestToExplainerDocument(manifest, {
    jobDir,
    compilers: { terminal: compileTerminalCapture },
  });
  const componentPath = path.join(jobDir, 'composition.tsx');
  const explainerDocumentPath = path.join(jobDir, 'explainer.json');
  const tsx = compileExplainerDocumentToTsx(seed.document);
  fs.writeFileSync(
    explainerDocumentPath,
    `${JSON.stringify(seed.document, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(componentPath, tsx.code, 'utf8');
  return {
    componentPath,
    audioManifestPath: seed.audioManifestPath,
    captureManifestPath,
    explainerDocumentPath,
    document: seed.document,
  };
}
