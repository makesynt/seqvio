import { parse } from 'acorn';
import type {
  GsapMethod,
  GsapTween,
  ParsedGsapTimeline,
  GsapParseResult,
  GsapParserOptions,
} from './gsap-types';

const TWEEN_METHODS = new Set(['set', 'to', 'from', 'fromTo']);
const BUILTIN_PROPS = new Set(['duration', 'ease', 'delay', 'stagger', 'yoyo', 'repeat', 'repeatDelay', 'overwrite', 'immediateRender', 'paused']);
const CALLBACK_PROPS = new Set(['onComplete', 'onStart', 'onUpdate', 'onRepeat', 'onReverseComplete']);

interface AstNode {
  type: string;
  [key: string]: unknown;
}

export function parseGsapFromSource(
  source: string,
  options?: GsapParserOptions
): GsapParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const timelines: ParsedGsapTimeline[] = [];

  let ast: AstNode;
  try {
    ast = parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
    }) as unknown as AstNode;
  } catch (err) {
    return {
      timelines: [],
      errors: [`Parse error: ${(err as Error).message}`],
      warnings: [],
    };
  }

  const timelineVars = findTimelineVars(ast);
  if (timelineVars.length === 0) {
    return { timelines: [], errors: [], warnings: ['No gsap.timeline() calls found'] };
  }

  for (const tlVar of timelineVars) {
    const tweens = collectTweenCalls(ast, tlVar.name, warnings);
    resolvePositions(tweens);
    assignIds(tweens, tlVar.name);

    const totalDuration = tweens.reduce((max, tw) => {
      const end = (tw.resolvedStart ?? 0) + (tw.duration ?? 0);
      return Math.max(max, end);
    }, 0);

    timelines.push({
      timelineVar: tlVar.name,
      tweens,
      totalDuration,
      hasDynamicContent: warnings.some((w) => w.includes('dynamic')),
    });
  }

  if (options?.strict && warnings.length > 0) {
    errors.push(...warnings);
    warnings.length = 0;
  }

  return { timelines, errors, warnings };
}

interface TimelineVarInfo {
  name: string;
  defaults?: { ease?: string; duration?: number };
}

function findTimelineVars(ast: AstNode): TimelineVarInfo[] {
  const results: TimelineVarInfo[] = [];
  walkNode(ast, (node) => {
    if (node.type === 'VariableDeclarator' && node.init) {
      const init = node.init as AstNode;
      if (isGsapTimelineCall(init)) {
        const id = node.id as AstNode;
        if (id.type === 'Identifier') {
          const defaults = extractTimelineDefaults(init);
          results.push({ name: id.name as string, defaults });
        }
      }
    }
    if (node.type === 'AssignmentExpression') {
      const right = node.right as AstNode;
      if (isGsapTimelineCall(right)) {
        const left = node.left as AstNode;
        if (left.type === 'Identifier') {
          results.push({ name: left.name as string });
        }
      }
    }
  });
  return results;
}

function isGsapTimelineCall(node: AstNode): boolean {
  if (node.type !== 'CallExpression') return false;
  const callee = node.callee as AstNode;
  if (callee.type !== 'MemberExpression') return false;
  const obj = callee.object as AstNode;
  const prop = callee.property as AstNode;
  return (
    obj.type === 'Identifier' &&
    obj.name === 'gsap' &&
    prop.type === 'Identifier' &&
    prop.name === 'timeline'
  );
}

function extractTimelineDefaults(callNode: AstNode): { ease?: string; duration?: number } | undefined {
  const args = callNode.arguments as AstNode[] | undefined;
  if (!args?.length) return undefined;
  const config = args[0];
  if (config.type !== 'ObjectExpression') return undefined;
  const defaults: { ease?: string; duration?: number } = {};
  for (const prop of (config.properties as AstNode[]) ?? []) {
    if (prop.type !== 'Property') continue;
    const key = prop.key as AstNode;
    const val = prop.value as AstNode;
    if (key.type === 'Identifier' && key.name === 'defaults' && val.type === 'ObjectExpression') {
      for (const dp of (val.properties as AstNode[]) ?? []) {
        if (dp.type !== 'Property') continue;
        const dk = dp.key as AstNode;
        const dv = dp.value as AstNode;
        if (dk.type === 'Identifier' && dk.name === 'ease' && dv.type === 'Literal') {
          defaults.ease = dv.value as string;
        }
        if (dk.type === 'Identifier' && dk.name === 'duration' && dv.type === 'Literal') {
          defaults.duration = dv.value as number;
        }
      }
    }
  }
  return Object.keys(defaults).length > 0 ? defaults : undefined;
}

function collectTweenCalls(ast: AstNode, timelineVar: string, warnings: string[]): GsapTween[] {
  const tweens: GsapTween[] = [];

  walkNode(ast, (node) => {
    if (node.type !== 'CallExpression') return;
    const callee = node.callee as AstNode;
    if (callee.type !== 'MemberExpression') return;

    const prop = callee.property as AstNode;
    if (prop.type !== 'Identifier' || !TWEEN_METHODS.has(prop.name as string)) return;

    if (!isRootedAt(node, timelineVar)) return;

    const method = prop.name as GsapMethod;
    const args = (node.arguments as AstNode[]) ?? [];

    let target = '<unknown>';
    let varsArg: AstNode | undefined;
    let fromArg: AstNode | undefined;
    let positionArg: AstNode | undefined;

    if (method === 'fromTo') {
      target = extractTarget(args[0]);
      fromArg = args[1];
      varsArg = args[2];
      positionArg = args[3];
    } else {
      target = extractTarget(args[0]);
      varsArg = args[1];
      positionArg = args[2];
    }

    if (target === '<unknown>') {
      warnings.push(`Could not statically resolve target in ${method}() call — dynamic content`);
    }

    const { properties, duration, ease } = extractVars(varsArg);
    const fromProperties = fromArg ? extractVars(fromArg).properties : undefined;
    const position = extractPosition(positionArg);

    tweens.push({
      id: '',
      target,
      method,
      position,
      properties,
      fromProperties,
      duration: method === 'set' ? 0 : duration,
      ease,
      implicitPosition: positionArg == null,
    });
  });

  return tweens;
}

function isRootedAt(node: AstNode, rootName: string): boolean {
  const callee = node.callee as AstNode;
  if (callee.type !== 'MemberExpression') return false;
  let obj = callee.object as AstNode;

  while (obj.type === 'CallExpression') {
    const innerCallee = obj.callee as AstNode;
    if (innerCallee.type !== 'MemberExpression') return false;
    obj = innerCallee.object as AstNode;
  }

  if (obj.type === 'Identifier' && obj.name === rootName) return true;
  if (obj.type === 'MemberExpression') {
    return isRootedAt({ type: 'CallExpression', callee: obj } as AstNode, rootName);
  }
  return false;
}

function extractTarget(node: AstNode | undefined): string {
  if (!node) return '<unknown>';
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral') {
    const quasis = node.quasis as AstNode[];
    if (quasis?.length === 1) return (quasis[0].value as { raw: string }).raw;
  }
  if (node.type === 'MemberExpression') {
    const obj = node.object as AstNode;
    const prop = node.property as AstNode;
    if (obj.type === 'Identifier' && prop.type === 'Identifier') {
      return `${obj.name}.${prop.name}`;
    }
  }
  if (node.type === 'Identifier') return node.name as string;
  return '<unknown>';
}

function extractVars(node: AstNode | undefined): {
  properties: Record<string, number | string>;
  duration?: number;
  ease?: string;
} {
  const properties: Record<string, number | string> = {};
  let duration: number | undefined;
  let ease: string | undefined;

  if (!node || node.type !== 'ObjectExpression') return { properties, duration, ease };

  for (const prop of (node.properties as AstNode[]) ?? []) {
    if (prop.type !== 'Property') continue;
    const key = prop.key as AstNode;
    const val = prop.value as AstNode;
    const keyName = key.type === 'Identifier' ? (key.name as string) : key.type === 'Literal' ? String(key.value) : null;
    if (!keyName) continue;

    if (CALLBACK_PROPS.has(keyName)) continue;

    if (keyName === 'duration' && val.type === 'Literal' && typeof val.value === 'number') {
      duration = val.value;
      continue;
    }
    if (keyName === 'ease' && val.type === 'Literal' && typeof val.value === 'string') {
      ease = val.value;
      continue;
    }
    if (BUILTIN_PROPS.has(keyName)) continue;

    if (val.type === 'Literal' && (typeof val.value === 'number' || typeof val.value === 'string')) {
      properties[keyName] = val.value as number | string;
    } else if (val.type === 'UnaryExpression' && val.operator === '-' && (val.argument as AstNode).type === 'Literal') {
      properties[keyName] = -((val.argument as AstNode).value as number);
    }
  }

  return { properties, duration, ease };
}

function extractPosition(node: AstNode | undefined): number | string {
  if (!node) return 0;
  if (node.type === 'Literal' && typeof node.value === 'number') return node.value;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-' && (node.argument as AstNode).type === 'Literal') {
    return -((node.argument as AstNode).value as number);
  }
  return 0;
}

function resolvePositions(tweens: GsapTween[]): void {
  let cursor = 0;
  let prevStart = 0;

  for (const tween of tweens) {
    const pos = tween.position;
    let start: number;

    if (tween.implicitPosition) {
      start = cursor;
    } else if (typeof pos === 'number') {
      start = pos;
    } else if (typeof pos === 'string') {
      if (pos.startsWith('+=')) {
        start = cursor + parseFloat(pos.slice(2));
      } else if (pos.startsWith('-=')) {
        start = cursor - parseFloat(pos.slice(2));
      } else if (pos === '<') {
        start = prevStart;
      } else if (pos === '>') {
        start = cursor;
      } else if (pos.startsWith('<+')) {
        start = prevStart + parseFloat(pos.slice(2));
      } else if (pos.startsWith('<-')) {
        start = prevStart - parseFloat(pos.slice(2));
      } else {
        const num = parseFloat(pos);
        start = Number.isFinite(num) ? num : cursor;
      }
    } else {
      start = cursor;
    }

    start = Math.max(0, start);
    tween.resolvedStart = start;
    prevStart = start;
    cursor = start + (tween.duration ?? 0);
  }
}

function assignIds(tweens: GsapTween[], timelineVar: string): void {
  tweens.forEach((tween, i) => {
    tween.id = `${timelineVar}-tween-${i}`;
  });
}

function walkNode(node: AstNode, visitor: (node: AstNode) => void): void {
  if (!node || typeof node !== 'object') return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === 'type') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && (item as AstNode).type) {
          walkNode(item as AstNode, visitor);
        }
      }
    } else if (child && typeof child === 'object' && (child as AstNode).type) {
      walkNode(child as AstNode, visitor);
    }
  }
}
