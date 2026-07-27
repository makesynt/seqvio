import type {
  GsapTween,
  GsapKeyframe,
  ParsedGsapTimeline,
  GsapValidationResult,
} from './gsap-types';
import type { SeekableAdapter } from '../seekable';

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /\.call\s*\(/, message: '.call() callbacks are non-deterministic' },
  { pattern: /\.add\s*\(\s*(function|\(|[a-zA-Z]+\s*=>)/, message: '.add() with callbacks is non-deterministic' },
  { pattern: /\.addPause\s*\(/, message: '.addPause() is not supported' },
  { pattern: /ScrollTrigger/, message: 'ScrollTrigger is not supported in video rendering' },
  { pattern: /Math\.random/, message: 'Math.random() is non-deterministic' },
  { pattern: /Date\.now/, message: 'Date.now() is non-deterministic' },
  { pattern: /new Date\s*\(\s*\)/, message: 'new Date() is non-deterministic' },
  { pattern: /repeat\s*:\s*-1/, message: 'Infinite repeat is non-deterministic' },
  { pattern: /setTimeout/, message: 'setTimeout is non-deterministic' },
  { pattern: /setInterval/, message: 'setInterval is non-deterministic' },
  { pattern: /requestAnimationFrame/, message: 'requestAnimationFrame is non-deterministic' },
  { pattern: /onComplete|onStart|onUpdate|onRepeat/, message: 'Callbacks are stripped during rendering' },
];

export function validateGsapDeterminism(source: string): GsapValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(source)) {
      if (message.includes('Callbacks')) {
        warnings.push(message);
      } else {
        errors.push(message);
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function tweensToKeyframes(tweens: GsapTween[]): GsapKeyframe[] {
  const keyframes: GsapKeyframe[] = [];

  for (const tween of tweens) {
    const time = tween.resolvedStart ?? 0;

    if (tween.method === 'fromTo' && tween.fromProperties) {
      keyframes.push({
        time,
        target: tween.target,
        properties: { ...tween.fromProperties },
        ease: tween.ease,
      });
      keyframes.push({
        time: time + (tween.duration ?? 0),
        target: tween.target,
        properties: { ...tween.properties },
        ease: tween.ease,
      });
    } else if (tween.method === 'from') {
      keyframes.push({
        time,
        target: tween.target,
        properties: { ...tween.properties },
        ease: tween.ease,
      });
    } else {
      keyframes.push({
        time: tween.method === 'set' ? time : time + (tween.duration ?? 0),
        target: tween.target,
        properties: { ...tween.properties },
        ease: tween.ease,
      });
    }
  }

  return keyframes.sort((a, b) => a.time - b.time);
}

export function serializeTimeline(timeline: ParsedGsapTimeline): string {
  const lines: string[] = [];
  lines.push(`const ${timeline.timelineVar} = gsap.timeline({ paused: true });`);

  for (const tween of timeline.tweens) {
    const props = { ...tween.properties };
    if (tween.duration != null) props.duration = tween.duration;
    if (tween.ease) props.ease = tween.ease;

    const propsStr = JSON.stringify(props);
    const posStr = tween.implicitPosition ? '' : `, ${JSON.stringify(tween.position)}`;

    if (tween.method === 'fromTo' && tween.fromProperties) {
      lines.push(
        `${timeline.timelineVar}.fromTo(${JSON.stringify(tween.target)}, ${JSON.stringify(tween.fromProperties)}, ${propsStr}${posStr});`
      );
    } else {
      lines.push(
        `${timeline.timelineVar}.${tween.method}(${JSON.stringify(tween.target)}, ${propsStr}${posStr});`
      );
    }
  }

  return lines.join('\n');
}

const CSS_PROPERTY_MAP: Record<string, (v: number) => string> = {
  opacity: (v) => String(v),
  x: (v) => `${v}px`,
  y: (v) => `${v}px`,
  rotation: (v) => `${v}deg`,
  scale: (v) => String(v),
  scaleX: (v) => String(v),
  scaleY: (v) => String(v),
};

export function createKeyframeSeekableAdapter(
  timeline: ParsedGsapTimeline,
  resolveTarget: (target: string) => HTMLElement | null,
  id?: string
): SeekableAdapter {
  const keyframes = tweensToKeyframes(timeline.tweens);

  return {
    id: id ?? `${timeline.timelineVar}-keyframe-adapter`,
    requiresRaf: false,
    seek(timeSeconds: number) {
      const byTarget = new Map<string, GsapKeyframe[]>();
      for (const kf of keyframes) {
        const list = byTarget.get(kf.target) ?? [];
        list.push(kf);
        byTarget.set(kf.target, list);
      }

      for (const [target, kfs] of byTarget) {
        const el = resolveTarget(target);
        if (!el) continue;

        let activeKf: GsapKeyframe | undefined;
        for (const kf of kfs) {
          if (kf.time <= timeSeconds) activeKf = kf;
        }
        if (!activeKf) continue;

        for (const [prop, value] of Object.entries(activeKf.properties)) {
          if (typeof value !== 'number') continue;
          const cssProp = CSS_PROPERTY_MAP[prop];
          if (cssProp) {
            if (prop === 'x' || prop === 'y') {
              const current = el.style.transform || '';
              const translateProp = prop === 'x' ? 'translateX' : 'translateY';
              el.style.transform = current.replace(
                new RegExp(`${translateProp}\\([^)]*\\)`),
                ''
              ).trim() + ` ${translateProp}(${cssProp(value)})`;
            } else if (prop === 'scale' || prop === 'scaleX' || prop === 'scaleY') {
              el.style.transform = (el.style.transform || '') + ` scale(${value})`;
            } else if (prop === 'rotation') {
              el.style.transform = (el.style.transform || '') + ` rotate(${cssProp(value)})`;
            } else {
              (el.style as unknown as Record<string, string>)[prop] = cssProp(value);
            }
          }
        }
      }
    },
  };
}
