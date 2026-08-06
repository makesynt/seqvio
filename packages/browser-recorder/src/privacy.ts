import type { Page } from "puppeteer";
import type { BrowserPrivacyMask, BrowserPrivacyPolicy } from "./types";

const MASK_ROOT_ID = "__seqvio-privacy-masks";
const MASK_STATE_KEY = "__seqvioPrivacyMaskState";

export interface PrivacyMaskStatus {
  foundIds: string[];
}

export function normalizePrivacyPolicy(
  value: unknown,
): BrowserPrivacyPolicy | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object")
    throw new Error("privacy must be an object");
  const masks = (value as BrowserPrivacyPolicy).masks;
  if (!Array.isArray(masks) || masks.length === 0) {
    throw new Error("privacy.masks must contain at least one mask");
  }
  if (masks.length > 100)
    throw new Error("privacy.masks cannot exceed 100 items");
  const ids = new Set<string>();
  return {
    masks: masks.map((mask, index) => normalizeMask(mask, index, ids)),
  };
}

function normalizeMask(
  mask: BrowserPrivacyMask,
  index: number,
  ids: Set<string>,
): BrowserPrivacyMask {
  if (!mask || typeof mask !== "object")
    throw new Error(`privacy.masks[${index}] must be an object`);
  if (
    typeof mask.id !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(mask.id)
  ) {
    throw new Error(
      `privacy.masks[${index}].id must be a safe 1-64 character identifier`,
    );
  }
  if (ids.has(mask.id))
    throw new Error(`privacy mask id is duplicated: ${mask.id}`);
  ids.add(mask.id);
  const hasSelector =
    typeof mask.selector === "string" && mask.selector.trim().length > 0;
  const hasRect = mask.rect !== undefined;
  if (hasSelector === hasRect) {
    throw new Error(
      `privacy mask ${mask.id} must define exactly one of selector or rect`,
    );
  }
  let rect: BrowserPrivacyMask["rect"];
  if (hasRect) {
    const candidate = mask.rect!;
    if (
      ![candidate.x, candidate.y, candidate.width, candidate.height].every(
        Number.isFinite,
      )
    ) {
      throw new Error(
        `privacy mask ${mask.id}.rect values must be finite numbers`,
      );
    }
    if (candidate.width <= 0 || candidate.height <= 0) {
      throw new Error(
        `privacy mask ${mask.id}.rect width and height must be positive`,
      );
    }
    rect = { ...candidate };
  }
  const padding = mask.padding ?? 4;
  if (!Number.isFinite(padding) || padding < 0 || padding > 64) {
    throw new Error(`privacy mask ${mask.id}.padding must be between 0 and 64`);
  }
  const color = mask.color ?? "#111827";
  if (!/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(color)) {
    throw new Error(
      `privacy mask ${mask.id}.color must be a 6 or 8 digit hex color`,
    );
  }
  return {
    id: mask.id,
    ...(hasSelector ? { selector: mask.selector!.trim() } : { rect }),
    padding,
    color,
    required: mask.required ?? true,
  };
}

export async function installPrivacyMasks(
  page: Page,
  policy?: BrowserPrivacyPolicy,
): Promise<void> {
  if (!policy) return;
  await page.evaluate(
    ({ masks, rootId, stateKey }) => {
      type PageMaskState = { timer?: number; foundIds: string[] };
      const runtime = window as typeof window &
        Record<string, PageMaskState | undefined>;
      const previous = runtime[stateKey];
      if (previous?.timer !== undefined) window.clearInterval(previous.timer);
      document.getElementById(rootId)?.remove();

      const root = document.createElement("div");
      root.id = rootId;
      root.setAttribute("aria-hidden", "true");
      root.style.cssText =
        "position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden";
      document.documentElement.appendChild(root);
      const found = new Set<string>();
      const overlays = masks.map((mask) => {
        const overlay = document.createElement("div");
        overlay.dataset.seqvioPrivacyMask = mask.id;
        overlay.style.cssText = `position:fixed;display:none;background:${mask.color};pointer-events:none`;
        root.appendChild(overlay);
        return { mask, overlay };
      });
      const update = () => {
        for (const { mask, overlay } of overlays) {
          let rect = mask.rect;
          if (mask.selector) {
            try {
              const target = document.querySelector(mask.selector);
              if (target) {
                const live = target.getBoundingClientRect();
                if (live.width > 0 && live.height > 0) {
                  rect = {
                    x: live.x,
                    y: live.y,
                    width: live.width,
                    height: live.height,
                  };
                  found.add(mask.id);
                }
              }
            } catch {
              rect = undefined;
            }
          } else {
            found.add(mask.id);
          }
          if (!rect) {
            overlay.style.display = "none";
            continue;
          }
          const padding = mask.padding ?? 0;
          overlay.style.display = "block";
          overlay.style.left = `${Math.max(0, rect.x - padding)}px`;
          overlay.style.top = `${Math.max(0, rect.y - padding)}px`;
          overlay.style.width = `${Math.max(0, rect.width + padding * 2)}px`;
          overlay.style.height = `${Math.max(0, rect.height + padding * 2)}px`;
        }
        const state = runtime[stateKey];
        if (state) state.foundIds = [...found];
      };
      const state: PageMaskState = { foundIds: [] };
      runtime[stateKey] = state;
      update();
      state.timer = window.setInterval(update, 50);
    },
    { masks: policy.masks, rootId: MASK_ROOT_ID, stateKey: MASK_STATE_KEY },
  );
}

export async function readPrivacyMaskStatus(
  page: Page,
): Promise<PrivacyMaskStatus> {
  return page.evaluate((stateKey) => {
    const runtime = window as typeof window &
      Record<string, { foundIds?: string[] } | undefined>;
    return { foundIds: [...(runtime[stateKey]?.foundIds ?? [])] };
  }, MASK_STATE_KEY);
}
