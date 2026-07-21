import { inspectPage } from './inspect';
import type { BrowserRecordingPlan } from './types';
import { validatePlan } from './validate';

export async function requestAiPlan(input: {
  task: string;
  startUrl: string;
  viewport?: { width: number; height: number };
}): Promise<BrowserRecordingPlan> {
  const plannerUrl = process.env.BROWSER_RECORDER_PLANNER_URL;
  if (!plannerUrl) {
    throw new Error('BROWSER_RECORDER_PLANNER_URL is not configured');
  }
  const elements = await inspectPage(input.startUrl);
  const response = await fetch(plannerUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.BROWSER_RECORDER_PLANNER_TOKEN
        ? { authorization: `Bearer ${process.env.BROWSER_RECORDER_PLANNER_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      task: input.task,
      startUrl: input.startUrl,
      viewport: input.viewport ?? { width: 1280, height: 720 },
      interactiveElements: elements,
      outputContract: {
        version: '1.0',
        fields: ['name', 'startUrl', 'viewport', 'captureFps', 'renderFps', 'maxZoom', 'actions'],
        actionTypes: ['click', 'fill', 'scroll', 'wait', 'navigate', 'press'],
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Planner returned HTTP ${response.status}`);
  }
  const payload = await response.json() as { plan?: unknown } | unknown;
  const plan = typeof payload === 'object' && payload && 'plan' in payload
    ? (payload as { plan: unknown }).plan
    : payload;
  return validatePlan(plan);
}
