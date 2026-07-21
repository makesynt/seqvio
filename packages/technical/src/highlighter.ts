/**
 * Sync Shiki highlighter for deterministic frame rendering.
 * Falls back to the keyword highlighter when a language is unavailable.
 */

import {
  createHighlighterCoreSync,
  createJavaScriptRegexEngine,
  type HighlighterCore,
} from 'shiki';
import { technicalCodeTheme } from './theme';

// Shiki language/theme payloads are ESM-only; esbuild bundles them for the
// browser render path. TypeScript cannot resolve the .mjs subpaths under
// moduleResolution:node, so these imports are intentionally unchecked.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-expect-error Shiki language payload
import js from 'shiki/langs/javascript.mjs';
// @ts-expect-error Shiki language payload
import ts from 'shiki/langs/typescript.mjs';
// @ts-expect-error Shiki language payload
import tsx from 'shiki/langs/tsx.mjs';
// @ts-expect-error Shiki language payload
import jsx from 'shiki/langs/jsx.mjs';
// @ts-expect-error Shiki language payload
import json from 'shiki/langs/json.mjs';
// @ts-expect-error Shiki language payload
import python from 'shiki/langs/python.mjs';
// @ts-expect-error Shiki language payload
import bash from 'shiki/langs/bash.mjs';
// @ts-expect-error Shiki language payload
import go from 'shiki/langs/go.mjs';
// @ts-expect-error Shiki language payload
import rust from 'shiki/langs/rust.mjs';
// @ts-expect-error Shiki language payload
import java from 'shiki/langs/java.mjs';
// @ts-expect-error Shiki language payload
import yaml from 'shiki/langs/yaml.mjs';
// @ts-expect-error Shiki language payload
import markdown from 'shiki/langs/markdown.mjs';
// @ts-expect-error Shiki theme payload
import githubDark from 'shiki/themes/github-dark.mjs';
/* eslint-enable @typescript-eslint/ban-ts-comment */

export interface HighlightToken {
  text: string;
  color: string;
}

const KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
  'false', 'finally', 'for', 'from', 'function', 'get', 'if', 'implements',
  'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'of',
  'package', 'private', 'protected', 'public', 'return', 'set', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof',
  'undefined', 'var', 'void', 'while', 'with', 'yield',
]);

const TYPE_HINTS = new Set([
  'string', 'number', 'boolean', 'any', 'unknown', 'never', 'object', 'symbol',
  'bigint', 'Record', 'Partial', 'Required', 'Readonly', 'Array', 'Promise',
  'Map', 'Set', 'Error',
]);

const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  plain: 'text',
  text: 'text',
};

let highlighter: HighlighterCore | null = null;

function getHighlighter(): HighlighterCore {
  if (!highlighter) {
    highlighter = createHighlighterCoreSync({
      themes: [githubDark],
      langs: [ts, tsx, js, jsx, json, python, bash, go, rust, java, yaml, markdown],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighter;
}

function normalizeLanguage(language: string): string {
  const lowered = language.trim().toLowerCase();
  return LANG_ALIASES[lowered] ?? lowered;
}

/** Keyword/token fallback used when Shiki cannot load the language. */
export function highlightLineFallback(line: string, language: string): HighlightToken[] {
  if (language === 'plain' || language === 'text' || line.length === 0) {
    return [{ text: line || ' ', color: technicalCodeTheme.plain }];
  }

  const tokens: HighlightToken[] = [];
  let i = 0;
  while (i < line.length) {
    if (line.slice(i, i + 2) === '//') {
      tokens.push({ text: line.slice(i), color: technicalCodeTheme.comment });
      break;
    }
    if (line.slice(i, i + 2) === '/*') {
      const end = line.indexOf('*/', i + 2);
      const j = end >= 0 ? end + 2 : line.length;
      tokens.push({ text: line.slice(i, j), color: technicalCodeTheme.comment });
      i = j;
      continue;
    }
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === quote) {
          j += 1;
          break;
        }
        j += 1;
      }
      tokens.push({ text: line.slice(i, j), color: technicalCodeTheme.string });
      i = j;
      continue;
    }
    const wordMatch = /^[A-Za-z_$][\w$]*/.exec(line.slice(i));
    if (wordMatch) {
      const word = wordMatch[0];
      const next = line[i + word.length];
      const isFunction = next === '(';
      const color = KEYWORDS.has(word)
        ? technicalCodeTheme.keyword
        : TYPE_HINTS.has(word)
          ? technicalCodeTheme.keyword
          : isFunction
            ? technicalCodeTheme.function
            : technicalCodeTheme.plain;
      tokens.push({ text: word, color });
      i += word.length;
      continue;
    }
    const numberMatch = /^[0-9]+(\.[0-9]+)?/.exec(line.slice(i));
    if (numberMatch) {
      tokens.push({ text: numberMatch[0], color: technicalCodeTheme.number });
      i += numberMatch[0].length;
      continue;
    }
    tokens.push({ text: line[i], color: technicalCodeTheme.plain });
    i += 1;
  }
  return tokens.length > 0 ? tokens : [{ text: ' ', color: technicalCodeTheme.plain }];
}

export function highlightLine(line: string, language: string): HighlightToken[] {
  const lines = highlightSource(line, language);
  return lines[0] ?? [{ text: line || ' ', color: technicalCodeTheme.plain }];
}

/**
 * Highlight a full source string into per-line token arrays using Shiki.
 * Deterministic and synchronous for Puppeteer frame capture.
 */
export function highlightSource(source: string, language: string): HighlightToken[][] {
  const normalized = source.replace(/\r\n/g, '\n');
  const lang = normalizeLanguage(language);
  if (lang === 'text' || lang === 'plain') {
    return normalized.split('\n').map((line) => highlightLineFallback(line, 'plain'));
  }

  try {
    const result = getHighlighter().codeToTokens(normalized, {
      lang: lang as never,
      theme: 'github-dark',
    });
    return result.tokens.map((lineTokens) => {
      if (lineTokens.length === 0) {
        return [{ text: ' ', color: technicalCodeTheme.plain }];
      }
      return lineTokens.map((token) => ({
        text: token.content,
        color: token.color ?? technicalCodeTheme.plain,
      }));
    });
  } catch {
    return normalized.split('\n').map((line) => highlightLineFallback(line, language));
  }
}
