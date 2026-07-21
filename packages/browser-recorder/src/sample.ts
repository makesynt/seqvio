import type { BrowserRecordingPlan } from './types';

export function samplePlan(baseUrl: string): BrowserRecordingPlan {
  return {
    version: '1.0',
    name: 'Seqvio Recorder Demo',
    startUrl: `${baseUrl}/demo`,
    viewport: { width: 1280, height: 720 },
    captureFps: 12,
    renderFps: 30,
    maxZoom: 2.1,
    actions: [
      { id: 'name', type: 'fill', label: 'Enter project name', selector: '#project-name', value: 'Launch walkthrough' },
      { id: 'template', type: 'click', label: 'Choose tutorial template', selector: '[data-template="tutorial"]' },
      { id: 'create', type: 'click', label: 'Create recording task', selector: '#create-task', afterMs: 900 },
      { id: 'scroll', type: 'scroll', label: 'Review generated timeline', y: 420, durationMs: 650 },
      { id: 'wait', type: 'wait', label: 'Hold final result', durationMs: 900 },
    ],
  };
}
