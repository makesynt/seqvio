# Seekable Animations

`@seqvio/core` exports a `SeekableAdapter` interface that lets you drive **any**
paused external animation library (GSAP, Lottie, Three.js, CSS animations) from
the Seqvio render clock. The renderer calls `flushSeekables(frame, fps)` after
`timeline.seekToFrame()` on each frame, so every adapter is seeked before the
screenshot is taken.

---

## Quick start — GSAP

```tsx
import gsap from 'gsap';
import { useSeekable, gsapSeekable } from '@seqvio/core';

function MyScene() {
  const tl = useMemo(() => {
    const t = gsap.timeline({ paused: true });
    t.fromTo('#box', { opacity: 0 }, { opacity: 1, duration: 1.5 });
    return t;
  }, []);

  useSeekable(gsapSeekable(tl, 'my-gsap'));

  return <div id="box">Hello</div>;
}
```

`gsap` is an optional peer — install it only when you need it:
```
npm install gsap
```

---

## Custom adapter

```tsx
import { registerSeekable, unregisterSeekable, SeekableAdapter } from '@seqvio/core';

const adapter: SeekableAdapter = {
  id: 'lottie-hero',
  seek(timeSeconds) {
    lottiePlayer.goToAndStop(timeSeconds * 1000, false); // Lottie uses ms
  },
  requiresRaf: true, // Lottie needs an extra rAF before DOM is ready
};

// In a React component:
useEffect(() => {
  registerSeekable(adapter);
  return () => unregisterSeekable(adapter.id);
}, []);
```

### `SeekableAdapter` fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | ✓ | Unique key; re-registration replaces the previous adapter |
| `seek` | `(timeSeconds, frame) => void` | ✓ | Called on every captured frame |
| `requiresRaf` | `boolean` | — | Set `true` if the library needs a rAF to update the DOM after `seek` |

---

## `useSeekable` hook

```tsx
useSeekable(adapter)
```

Registers on mount, unregisters on unmount or when `adapter` changes.
Useful as a one-liner; for imperative code prefer `registerSeekable` directly.

---

## How it integrates with the renderer

1. Author registers one or more adapters via `useSeekable` or `registerSeekable`.
2. On each frame the browser runtime calls `applyFrame(frame)`:
   - `timeline.seekToFrame(frame)` — advances the Seqvio timeline.
   - `setGlobalFrame(frame)` — updates `useCurrentFrame()` subscribers.
   - `flushSeekables(frame, fps)` — iterates every registered adapter and calls `seek()`.
3. If any adapter has `requiresRaf: true`, the runtime waits one extra rAF.
4. `page.screenshot()` is taken.

This guarantees all adapters are at the exact frame position before capture.

---

## Preview / scrubbing

Seekable adapters also work in `seqvio-preview`. The preview player calls
`__seqvio_setFrame` on scrub, which flows through the same `applyFrame` path.

---

## Example

See [examples/compositions/seqvio-gsap-demo.tsx](../../../examples/compositions/seqvio-gsap-demo.tsx) for a full working example with GSAP + whiteboard annotations on the same timeline.
