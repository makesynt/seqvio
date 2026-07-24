import {
  DEFAULT_FINAL_WAIT_MS,
  DEFAULT_MAX_LINES,
  DEFAULT_PRESENTATION,
  DEFAULT_RENDER_FPS,
  DEFAULT_TRAILING_HOLD_MS,
  DEFAULT_TYPING_CPS,
  MAX_MAX_LINES,
  MAX_RENDER_FPS,
  MAX_VIEWPORT_HEIGHT,
  MAX_VIEWPORT_WIDTH,
  MIN_MAX_LINES,
  MIN_RENDER_FPS,
  MIN_VIEWPORT_HEIGHT,
  MIN_VIEWPORT_WIDTH,
} from './constants';
import type { TerminalNarratorPlan } from './types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function validatePlan(value: unknown): TerminalNarratorPlan {
  assert(value && typeof value === 'object', 'plan must be an object');
  const plan = value as TerminalNarratorPlan;

  assert(plan.version === '1.0', 'plan.version must be "1.0"');
  assert(typeof plan.name === 'string' && plan.name.trim().length > 0, 'plan.name is required');
  assert(plan.viewport && typeof plan.viewport === 'object', 'plan.viewport is required');
  assert(typeof plan.viewport.width === 'number', 'plan.viewport.width must be a number');
  assert(typeof plan.viewport.height === 'number', 'plan.viewport.height must be a number');
  assert(
    plan.viewport.width >= MIN_VIEWPORT_WIDTH && plan.viewport.width <= MAX_VIEWPORT_WIDTH,
    `viewport.width must be ${MIN_VIEWPORT_WIDTH}-${MAX_VIEWPORT_WIDTH}`
  );
  assert(
    plan.viewport.height >= MIN_VIEWPORT_HEIGHT && plan.viewport.height <= MAX_VIEWPORT_HEIGHT,
    `viewport.height must be ${MIN_VIEWPORT_HEIGHT}-${MAX_VIEWPORT_HEIGHT}`
  );

  assert(plan.shell && typeof plan.shell === 'object', 'plan.shell is required');
  assert(typeof plan.shell.command === 'string' && plan.shell.command.trim().length > 0, 'plan.shell.command is required');

  assert(Array.isArray(plan.inputs) && plan.inputs.length > 0, 'plan.inputs must be a non-empty array');
  plan.inputs.forEach((step, idx) => {
    assert(step && typeof step === 'object', `inputs[${idx}] must be an object`);
    assert(typeof step.id === 'string' && step.id.trim().length > 0, `inputs[${idx}].id is required`);
    assert(typeof step.label === 'string' && step.label.trim().length > 0, `inputs[${idx}].label is required`);
    assert(typeof step.text === 'string' && step.text.trim().length > 0, `inputs[${idx}].text is required`);
    if (step.afterMs !== undefined) {
      assert(typeof step.afterMs === 'number' && step.afterMs >= 0, `inputs[${idx}].afterMs must be >= 0`);
    }
    if (step.waitForPattern !== undefined) {
      assert(
        typeof step.waitForPattern === 'string' && step.waitForPattern.length > 0,
        `inputs[${idx}].waitForPattern must be a non-empty string`
      );
      try {
        void new RegExp(step.waitForPattern);
      } catch {
        throw new Error(`inputs[${idx}].waitForPattern is not a valid regular expression: ${step.waitForPattern}`);
      }
    }
    if (step.waitTimeoutMs !== undefined) {
      assert(
        typeof step.waitTimeoutMs === 'number' && step.waitTimeoutMs > 0,
        `inputs[${idx}].waitTimeoutMs must be > 0`
      );
    }
  });

  const renderFps = Math.max(MIN_RENDER_FPS, Math.min(MAX_RENDER_FPS, plan.renderFps ?? DEFAULT_RENDER_FPS));
  const maxLines = Math.max(MIN_MAX_LINES, Math.min(MAX_MAX_LINES, plan.maxLines ?? DEFAULT_MAX_LINES));
  const finalWaitMs = plan.finalWaitMs ?? DEFAULT_FINAL_WAIT_MS;
  assert(typeof finalWaitMs === 'number' && finalWaitMs > 0, 'plan.finalWaitMs must be > 0');

  const timeoutMs = plan.timeoutMs;
  if (timeoutMs !== undefined) {
    assert(typeof timeoutMs === 'number' && timeoutMs > 0, 'plan.timeoutMs must be > 0');
  }

  if (plan.startupWaitMs !== undefined) {
    assert(typeof plan.startupWaitMs === 'number' && plan.startupWaitMs >= 0, 'plan.startupWaitMs must be >= 0');
  }
  if (plan.typeDelayMs !== undefined) {
    assert(typeof plan.typeDelayMs === 'number' && plan.typeDelayMs >= 0, 'plan.typeDelayMs must be >= 0');
  }
  if (plan.readyPattern !== undefined) {
    assert(typeof plan.readyPattern === 'string' && plan.readyPattern.length > 0, 'plan.readyPattern must be a non-empty string');
    try {
      void new RegExp(plan.readyPattern);
    } catch {
      throw new Error('plan.readyPattern must be a valid regular expression');
    }
  }
  if (plan.presentation !== undefined) {
    assert(
      plan.presentation === 'minimal' || plan.presentation === 'vhs',
      'plan.presentation must be "minimal" or "vhs"'
    );
  }

  const typingCps = plan.typingCps ?? DEFAULT_TYPING_CPS;
  if (plan.typingCps !== undefined) {
    assert(typeof plan.typingCps === 'number' && plan.typingCps >= 1, 'plan.typingCps must be >= 1');
  }

  const trailingHoldMs = plan.trailingHoldMs ?? DEFAULT_TRAILING_HOLD_MS;
  if (plan.trailingHoldMs !== undefined) {
    assert(typeof plan.trailingHoldMs === 'number' && trailingHoldMs > 0, 'plan.trailingHoldMs must be > 0');
  }

  if (plan.idleTimeLimitMs !== undefined) {
    assert(
      typeof plan.idleTimeLimitMs === 'number' && plan.idleTimeLimitMs > 0,
      'plan.idleTimeLimitMs must be > 0'
    );
  }
  if (plan.minSnapshotMs !== undefined) {
    assert(
      typeof plan.minSnapshotMs === 'number' && plan.minSnapshotMs > 0,
      'plan.minSnapshotMs must be > 0'
    );
  }

  if (plan.zoomOnInput !== undefined) {
    assert(typeof plan.zoomOnInput === 'boolean', 'plan.zoomOnInput must be a boolean');
  }
  if (plan.maxZoom !== undefined) {
    assert(typeof plan.maxZoom === 'number' && plan.maxZoom > 1, 'plan.maxZoom must be a number > 1');
  }
  if (plan.zoomTransitionMs !== undefined) {
    assert(typeof plan.zoomTransitionMs === 'number' && plan.zoomTransitionMs > 0, 'plan.zoomTransitionMs must be > 0');
  }
  if (plan.zoomHoldMs !== undefined) {
    assert(typeof plan.zoomHoldMs === 'number' && plan.zoomHoldMs >= 0, 'plan.zoomHoldMs must be >= 0');
  }

  const narrationLocale = plan.narrationLocale ?? 'en';
  if (plan.narrationLocale !== undefined) {
    assert(
      plan.narrationLocale === 'zh' || plan.narrationLocale === 'en',
      'plan.narrationLocale must be "zh" or "en"'
    );
  }

  if (plan.redactPatterns !== undefined) {
    assert(Array.isArray(plan.redactPatterns), 'plan.redactPatterns must be an array');
    plan.redactPatterns.forEach((p, idx) => {
      assert(typeof p === 'string', `redactPatterns[${idx}] must be a string`);
      try {
        void new RegExp(p);
      } catch {
        throw new Error(`redactPatterns[${idx}] is not a valid regular expression: ${p}`);
      }
    });
  }

  plan.inputs.forEach((step, idx) => {
    if (step.typeDelayMs !== undefined) {
      assert(
        typeof step.typeDelayMs === 'number' && step.typeDelayMs >= 0,
        `inputs[${idx}].typeDelayMs must be >= 0`
      );
    }
  });

  return {
    ...plan,
    name: plan.name.trim(),
    renderFps,
    maxLines,
    finalWaitMs,
    presentation: plan.presentation ?? DEFAULT_PRESENTATION,
    typingCps,
    trailingHoldMs,
    narrationLocale,
    shell: {
      ...plan.shell,
      command: plan.shell.command.trim(),
      args: plan.shell.args ?? [],
    },
  };
}

