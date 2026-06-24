const HIDDEN_LAYER_ATTR_RE = /\sdata-seqvio-layer-hidden=(?:"true"|'true')/g;
const STYLE_ATTR_RE = /\sstyle=(["'])(.*?)\1/gs;

function sanitizeStyleAttribute(styleValue: string): string {
  return styleValue
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .filter((part) => !/^visibility\s*:\s*hidden$/i.test(part))
    .join('; ');
}

export function sanitizeCachedSvgMarkup(markup: string): string {
  return markup
    .replace(HIDDEN_LAYER_ATTR_RE, '')
    .replace(STYLE_ATTR_RE, (_match, quote: string, styleValue: string) => {
      const sanitized = sanitizeStyleAttribute(styleValue);
      return sanitized ? ` style=${quote}${sanitized}${quote}` : '';
    });
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizeCachedSvgMarkup(svg))}`;
}

export async function waitForImageReady(image: {
  complete?: boolean;
  decode?: () => Promise<void>;
  addEventListener?: (
    type: 'load' | 'error',
    listener: () => void,
    options?: { once: boolean }
  ) => void;
}): Promise<void> {
  if (typeof image.decode === 'function') {
    try {
      await image.decode();
      return;
    } catch {
      // Some sources cannot be decoded directly; load/error still settles them.
    }
  }

  if (image.complete || typeof image.addEventListener !== 'function') return;

  await new Promise<void>((resolve) => {
    image.addEventListener!('load', () => resolve(), { once: true });
    image.addEventListener!('error', () => resolve(), { once: true });
  });
}
