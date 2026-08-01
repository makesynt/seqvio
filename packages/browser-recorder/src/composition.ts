import * as fs from 'node:fs';
import * as path from 'node:path';
import { compileCompositionDocumentToTsx, type CompositionDocument } from '@seqvio/core';
import {
  compileCaptureManifestToCompositionDocument,
  type BrowserCaptureManifest,
} from '@seqvio/capture';
import { compileBrowserCapture } from './compile-to-ir';

export interface CaptureCompositionArtifacts {
  componentPath: string;
  audioManifestPath?: string;
  captureManifestPath: string;
  compositionDocumentPath: string;
  document: CompositionDocument;
}

export async function writeCaptureArtifacts(
  manifest: BrowserCaptureManifest,
  jobDir: string
): Promise<CaptureCompositionArtifacts> {
  fs.mkdirSync(jobDir, { recursive: true });
  const captureManifestPath = path.join(jobDir, 'capture-manifest.json');
  fs.writeFileSync(captureManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  const seed = await compileCaptureManifestToCompositionDocument(manifest, {
    jobDir,
    compilers: { browser: compileBrowserCapture },
  });
  const componentPath = path.join(jobDir, 'composition.tsx');
  const compositionDocumentPath = path.join(jobDir, 'composition-document.json');
  const tsx = compileCompositionDocumentToTsx(seed.document);
  fs.writeFileSync(
    compositionDocumentPath,
    `${JSON.stringify(seed.document, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(componentPath, tsx.code, 'utf8');
  return {
    componentPath,
    audioManifestPath: seed.audioManifestPath,
    captureManifestPath,
    compositionDocumentPath,
    document: seed.document,
  };
}
