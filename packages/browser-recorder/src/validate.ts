import type { BrowserAction, BrowserRecordingPlan } from './types';

const ACTION_TYPES = new Set(['click', 'fill', 'scroll', 'wait', 'navigate', 'press']);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validateAction(action: BrowserAction, index: number): void {
  assert(action && typeof action === 'object', `actions[${index}] must be an object`);
  assert(typeof action.id === 'string' && action.id.length > 0, `actions[${index}].id is required`);
  assert(ACTION_TYPES.has(action.type), `actions[${index}].type is unsupported`);
  assert(typeof action.label === 'string' && action.label.length > 0, `actions[${index}].label is required`);
  if (action.type === 'click' || action.type === 'fill') {
    assert(typeof action.selector === 'string' && action.selector.length > 0, `${action.id}.selector is required`);
  }
  if (action.type === 'fill') {
    assert(typeof action.value === 'string', `${action.id}.value is required`);
  }
  if (action.type === 'navigate') {
    assert(typeof action.value === 'string' && action.value.length > 0, `${action.id}.value is required`);
  }
  if (action.type === 'press') {
    assert(typeof action.key === 'string' && action.key.length > 0, `${action.id}.key is required`);
  }
}

export function validatePlan(value: unknown): BrowserRecordingPlan {
  assert(value && typeof value === 'object', 'Plan must be an object');
  const plan = value as BrowserRecordingPlan;
  assert(plan.version === '1.0', 'plan.version must be "1.0"');
  assert(typeof plan.name === 'string' && plan.name.trim().length > 0, 'plan.name is required');
  assert(typeof plan.startUrl === 'string', 'plan.startUrl is required');
  const url = new URL(plan.startUrl);
  assert(['http:', 'https:', 'file:'].includes(url.protocol), 'startUrl must use http, https, or file');
  assert(plan.viewport && Number.isFinite(plan.viewport.width), 'viewport.width is required');
  assert(plan.viewport && Number.isFinite(plan.viewport.height), 'viewport.height is required');
  assert(plan.viewport.width >= 640 && plan.viewport.width <= 3840, 'viewport.width must be 640-3840');
  assert(plan.viewport.height >= 360 && plan.viewport.height <= 2160, 'viewport.height must be 360-2160');
  assert(Array.isArray(plan.actions) && plan.actions.length > 0, 'actions must contain at least one action');
  assert(plan.actions.length <= 100, 'actions cannot exceed 100 items');
  plan.actions.forEach(validateAction);
  return {
    ...plan,
    name: plan.name.trim(),
    captureFps: Math.max(5, Math.min(30, plan.captureFps ?? 15)),
    renderFps: Math.max(24, Math.min(60, plan.renderFps ?? 30)),
    maxZoom: Math.max(1, Math.min(3, plan.maxZoom ?? 2.2)),
  };
}
