import * as fs from 'node:fs';
import * as path from 'node:path';
import * as pty from 'node-pty';

import { writeAsciinemaCast } from './cast';
import {
  DEFAULT_AFTER_MS,
  DEFAULT_COLS,
  DEFAULT_FINAL_WAIT_MS,
  DEFAULT_MAX_LINES,
  DEFAULT_RENDER_FPS,
  DEFAULT_ROWS,
  DEFAULT_STARTUP_WAIT_MS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_TRAILING_HOLD_MS,
  DEFAULT_TYPE_DELAY_MS,
  DEFAULT_WAIT_TIMEOUT_MS,
} from './constants';
import { redactPlanForArtifacts, redactSecrets } from './redact';
import type {
  PipelineProgress,
  TerminalEvent,
  TerminalNarratorPlan,
  TerminalRecordingManifest,
} from './types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalize a node-pty exit event into a POSIX-style exit code.
 * Signal terminations become 128 + signal, mirroring asciinema's Exit event.
 */
export function resolveExitCode(event: { exitCode: number; signal?: number }): number {
  if (typeof event.signal === 'number' && event.signal > 0) {
    return 128 + event.signal;
  }
  return event.exitCode;
}

export function resolveRecordingDurationMs(options: {
  nowMs?: number;
  lastEventTimeMs: number;
  steps: Array<{ timeMs: number }>;
  events: Array<{ timeMs: number }>;
  trailingHoldMs: number;
}): number {
  const lastStepTimeMs = options.steps.reduce(
    (max, step) => Math.max(max, step.timeMs),
    0
  );
  const lastRecordedEventMs = options.events.reduce(
    (max, event) => Math.max(max, event.timeMs),
    0
  );
  return (
    Math.max(
      1,
      options.lastEventTimeMs,
      lastStepTimeMs,
      lastRecordedEventMs
    ) + options.trailingHoldMs
  );
}

async function waitForReadyPattern(options: {
  getBuffer: () => string;
  pattern: string;
  timeoutMs: number;
  isExited: () => boolean;
  /** Label used in error messages. Defaults to "readyPattern". */
  label?: string;
}): Promise<void> {
  const label = options.label ?? 'readyPattern';
  let regex: RegExp;
  try {
    regex = new RegExp(options.pattern, 'm');
  } catch {
    throw new Error(`Invalid ${label} regex: ${options.pattern}`);
  }

  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    if (options.isExited()) {
      throw new Error(`Terminal exited before ${label} matched`);
    }
    if (regex.test(options.getBuffer())) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label} /${options.pattern}/`);
}

async function writeHumanInput(
  child: pty.IPty,
  text: string,
  typeDelayMs: number
): Promise<void> {
  if (typeDelayMs <= 0) {
    child.write(text);
    return;
  }
  for (const ch of text) {
    child.write(ch);
    await delay(typeDelayMs);
  }
}

export async function recordPlan(
  plan: TerminalNarratorPlan,
  jobDir: string,
  onProgress?: (progress: PipelineProgress) => void
): Promise<{
  manifest: TerminalRecordingManifest;
  manifestPath: string;
  castPath: string;
}> {
  fs.mkdirSync(jobDir, { recursive: true });
  fs.writeFileSync(
    path.join(jobDir, 'plan.json'),
    JSON.stringify(redactPlanForArtifacts(plan), null, 2) + '\n',
    'utf8'
  );

  const startedAt = Date.now();
  const nowMs = () => Date.now() - startedAt;

  const cols = plan.shell.cols ?? DEFAULT_COLS;
  const rows = plan.shell.rows ?? DEFAULT_ROWS;
  const renderFps = plan.renderFps ?? DEFAULT_RENDER_FPS;
  const maxLines = plan.maxLines ?? DEFAULT_MAX_LINES;
  const finalWaitMs = plan.finalWaitMs ?? DEFAULT_FINAL_WAIT_MS;
  const startupWaitMs = plan.startupWaitMs ?? DEFAULT_STARTUP_WAIT_MS;
  const defaultTypeDelayMs = plan.typeDelayMs ?? DEFAULT_TYPE_DELAY_MS;
  const trailingHoldMs = plan.trailingHoldMs ?? DEFAULT_TRAILING_HOLD_MS;

  const env: Record<string, string | undefined> = { ...process.env, ...(plan.shell.env ?? {}) };
  const requestsColor = Boolean(env.COLORTERM || env.FORCE_COLOR);
  if (requestsColor && plan.shell.env?.NO_COLOR === undefined) {
    delete env.NO_COLOR;
  }

  let timeoutHandle: NodeJS.Timeout | undefined;
  let timeoutError: Error | undefined;

  const child = pty.spawn(
    plan.shell.command,
    plan.shell.args ?? [],
    {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: plan.shell.cwd,
      env: {
        ...(env as Record<string, string>),
        TERM: (env.TERM as string | undefined) ?? 'xterm-256color',
        COLORTERM: (env.COLORTERM as string | undefined) ?? 'truecolor',
      },
      useConpty: plan.shell.useConpty,
    } as pty.IPtyForkOptions
  );

  const events: TerminalEvent[] = [];
  let lastEventTimeMs = 0;
  let stdoutBuffer = '';

  const redactOptions = {
    env: plan.shell.env,
    patterns: plan.redactPatterns?.map((p) => new RegExp(p, 'g')),
  };

  const dataSubscription = child.onData((data) => {
    const t = nowMs();
    lastEventTimeMs = t;
    const cleaned = redactSecrets(String(data), redactOptions);
    stdoutBuffer += cleaned;
    events.push({ timeMs: t, kind: 'stdout', text: cleaned });
  });

  let exited = false;
  let exitCode: number | undefined;
  let exitSubscription: { dispose(): void } | undefined;
  const exitPromise = new Promise<void>((resolve) => {
    exitSubscription = child.onExit((event) => {
      exited = true;
      exitCode = resolveExitCode(event);
      resolve();
    });
  });

  if (plan.timeoutMs && plan.timeoutMs > 0) {
    timeoutHandle = setTimeout(() => {
      timeoutError = new Error(`Terminal session timeout after ${plan.timeoutMs}ms`);
      try {
        child.kill();
      } catch {
        // ignore
      }
    }, plan.timeoutMs);
  }

  const steps: Array<{ id: string; label: string; timeMs: number }> = [];
  try {
    onProgress?.({ phase: 'recording', percent: 2, message: 'PTY spawned' });

    if (startupWaitMs > 0) {
      onProgress?.({
        phase: 'recording',
        percent: 3,
        message: `Startup wait ${startupWaitMs}ms`,
      });
      await delay(startupWaitMs);
    }

    if (plan.readyPattern) {
      const waitBudget = Math.max(
        5_000,
        (plan.timeoutMs ?? DEFAULT_TIMEOUT_MS) - (Date.now() - startedAt) - finalWaitMs
      );
      onProgress?.({
        phase: 'recording',
        percent: 4,
        message: `Waiting for readyPattern /${plan.readyPattern}/`,
      });
      await waitForReadyPattern({
        getBuffer: () => stdoutBuffer,
        pattern: plan.readyPattern,
        timeoutMs: waitBudget,
        isExited: () => exited,
      });
    }

    for (let i = 0; i < plan.inputs.length; i += 1) {
      const input = plan.inputs[i];
      onProgress?.({
        phase: 'recording',
        percent: 5 + Math.round((i / Math.max(1, plan.inputs.length)) * 70),
        message: input.label,
      });

      const inputText = input.text ?? '';
      const typeDelayMs = input.typeDelayMs ?? defaultTypeDelayMs;
      const t = nowMs();
      steps.push({ id: input.id, label: input.label, timeMs: t });
      events.push({
        timeMs: t,
        kind: 'stdin',
        text: redactSecrets(inputText, redactOptions),
        transient: true,
      });

      await writeHumanInput(child, inputText, typeDelayMs);
      child.write('\r');
      lastEventTimeMs = Math.max(lastEventTimeMs, nowMs());

      if (input.waitForPattern) {
        const waitTimeoutMs = input.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
        const remainingTimeoutMs =
          (plan.timeoutMs ?? DEFAULT_TIMEOUT_MS) - (Date.now() - startedAt) - finalWaitMs;
        const effectiveWaitMs = Math.max(1_000, Math.min(waitTimeoutMs, remainingTimeoutMs));
        onProgress?.({
          phase: 'recording',
          percent: 5 + Math.round((i / Math.max(1, plan.inputs.length)) * 70) + 1,
          message: `Waiting for /${input.waitForPattern}/`,
        });
        await waitForReadyPattern({
          getBuffer: () => stdoutBuffer,
          pattern: input.waitForPattern,
          timeoutMs: effectiveWaitMs,
          isExited: () => exited,
          label: 'waitForPattern',
        });
      }

      await delay(input.afterMs ?? DEFAULT_AFTER_MS);
      if (exited) break;
    }

    onProgress?.({ phase: 'recording', percent: 90, message: 'Flushing output' });
    await delay(finalWaitMs);

    if (!exited) child.kill();
    await exitPromise;
    if (timeoutError) throw timeoutError;

    const durationMs = resolveRecordingDurationMs({
      lastEventTimeMs,
      steps,
      events,
      trailingHoldMs,
    });

    const manifest: TerminalRecordingManifest = {
      version: '1.0',
      name: plan.name,
      viewport: plan.viewport,
      renderFps,
      maxLines,
      durationMs,
      cols,
      rows,
      steps,
      events,
      exitCode,
    };

    const manifestPath = path.join(jobDir, 'recording-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

    const castPath = path.join(jobDir, 'session.cast');
    writeAsciinemaCast(manifest, castPath);

    onProgress?.({ phase: 'composing', percent: 0, message: 'Manifest + cast written' });
    return { manifest, manifestPath, castPath };
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    if (!exited) {
      try {
        child.kill();
      } catch {
        // The PTY may already have exited while an earlier operation failed.
      }
      await Promise.race([exitPromise, delay(1_000)]);
    }
    dataSubscription.dispose();
    exitSubscription?.dispose();
  }
}
