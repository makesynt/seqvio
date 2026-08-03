import type { TerminalNarratorPlan } from './types';

export function samplePlan(): TerminalNarratorPlan {
  // PowerShell emits VT color sequences on modern Windows — better VHS demo than cmd echo.
  const isWin = process.platform === 'win32';
  return {
    version: '1.0',
    name: 'VHS-style terminal demo',
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 220,
    presentation: 'vhs',
    typeDelayMs: 28,
    startupWaitMs: 5000,
    shell: isWin
      ? {
          command: 'powershell.exe',
          args: ['-NoLogo', '-NoProfile', '-NoExit'],
          cols: 100,
          rows: 28,
          cwd: process.cwd(),
        }
      : {
          command: 'bash',
          args: ['-l'],
          cols: 100,
          rows: 28,
          cwd: process.cwd(),
        },
    inputs: isWin
      ? [
          {
            id: 'hello',
            label: '打印 Hello',
            text: 'echo "$([char]27)[32mHello$([char]27)[0m"',
            waitForPattern: '\u001b\\[32mHello',
            afterMs: 1000,
          },
          {
            id: 'world',
            label: '打印 World',
            text: 'echo "$([char]27)[36mWorld$([char]27)[0m"',
            waitForPattern: '\u001b\\[36mWorld',
            afterMs: 1000,
          },
          {
            id: 'done',
            label: '结束会话',
            text: 'echo "$([char]27)[35mDone$([char]27)[0m"',
            waitForPattern: '\u001b\\[35mDone',
            afterMs: 800,
          },
        ]
      : [
          {
            id: 'hello',
            label: '打印 Hello',
            text: "printf '\\033[32mHello\\033[0m\\n'",
            afterMs: 900,
          },
          {
            id: 'world',
            label: '打印 World',
            text: "printf '\\033[36mWorld\\033[0m\\n'",
            afterMs: 900,
          },
          {
            id: 'done',
            label: '结束会话',
            text: "printf '\\033[35mDone\\033[0m\\n'",
            afterMs: 700,
          },
        ],
    finalWaitMs: 1400,
    timeoutMs: 45_000,
    readyPattern: isWin ? 'PS [^\\r\\n>]*>' : undefined,
  };
}

export interface ClaudeSampleOptions {
  /** Skill invocation text, e.g. `/my-skill demo-arg`. */
  skill?: string;
  /** Claude Code binary. Defaults to CLAUDE_BIN or claude(.cmd). */
  claudeBin?: string;
  /** Extra args passed to Claude Code CLI. */
  claudeArgs?: string[];
  /** Working directory for the recorded Claude session. */
  cwd?: string;
  /** Human typing delay (ms per character). */
  typeDelayMs?: number;
  /** Wait after spawn before looking for readyPattern. */
  startupWaitMs?: number;
  /** Regex for Claude prompt readiness. Empty string disables wait. */
  readyPattern?: string;
  /** How long to wait after skill input for AI/tool output. */
  skillAfterMs?: number;
}

/**
 * Mechanism 1 sample: outer controller spawns Claude Code in a PTY and types a Skill.
 * Requires a locally installed & authenticated Claude Code CLI.
 */
export function sampleClaudePlan(options: ClaudeSampleOptions = {}): TerminalNarratorPlan {
  const skill = (options.skill ?? process.env.SEQVIO_DEMO_SKILL ?? '/help').trim();
  const claudeBin = resolveClaudeBin(options.claudeBin);
  const cwd = options.cwd ?? process.cwd();
  const typeDelayMs = options.typeDelayMs ?? 125;
  const startupWaitMs = options.startupWaitMs ?? 2500;
  const envReadyPattern = process.env.SEQVIO_CLAUDE_READY_PATTERN?.trim();
  const readyPattern =
    options.readyPattern === undefined
      ? envReadyPattern || '❯'
      : options.readyPattern === ''
        ? undefined
        : options.readyPattern;
  const skillAfterMs = options.skillAfterMs ?? 20_000;

  return {
    version: '1.0',
    name: `Claude Code skill demo: ${skill}`,
    viewport: { width: 1280, height: 720 },
    renderFps: 30,
    maxLines: 280,
    presentation: 'vhs',
    typingCps: 8,
    shell: {
      command: claudeBin,
      args: options.claudeArgs ?? [],
      cols: 120,
      rows: 30,
      cwd,
      env: {
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        FORCE_COLOR: '3',
      },
    },
    startupWaitMs,
    readyPattern,
    typeDelayMs,
    inputs: [
      {
        id: 'skill',
        label: `运行 ${skill}`,
        text: skill,
        afterMs: skillAfterMs,
      },
    ],
    finalWaitMs: 4000,
    timeoutMs: 180_000,
  };
}

export function resolveClaudeBin(explicit?: string): string {
  return (
    explicit ??
    process.env.CLAUDE_BIN ??
    (process.platform === 'win32' ? 'claude.exe' : 'claude')
  );
}
