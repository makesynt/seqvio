import puppeteer from 'puppeteer';
import type { InteractiveElement } from './types';

export async function inspectPage(url: string): Promise<InteractiveElement[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    return await page.evaluate(() => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('a,button,input,textarea,select,[role="button"],[contenteditable="true"]'),
      ).filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      });

      const escape = (value: string) => CSS.escape(value);
      const selectorFor = (element: HTMLElement): string => {
        if (element.id) return `#${escape(element.id)}`;
        const testId = element.getAttribute('data-testid');
        if (testId) return `[data-testid="${testId.replace(/"/g, '\\"')}"]`;
        const name = element.getAttribute('name');
        if (name) return `${element.tagName.toLowerCase()}[name="${name.replace(/"/g, '\\"')}"]`;
        const parent = element.parentElement;
        if (!parent) return element.tagName.toLowerCase();
        const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
        return `${selectorFor(parent)} > ${element.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(element) + 1})`;
      };

      return candidates.slice(0, 80).map((element) => ({
        selector: selectorFor(element),
        role: element.getAttribute('role') || element.tagName.toLowerCase(),
        text: (element.innerText || element.getAttribute('aria-label') || '').trim().slice(0, 160),
        placeholder: element.getAttribute('placeholder') || undefined,
        name: element.getAttribute('name') || undefined,
      }));
    });
  } finally {
    await browser.close();
  }
}
