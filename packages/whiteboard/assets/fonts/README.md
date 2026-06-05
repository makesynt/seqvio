# Bundled fonts

| File | License | Use |
|------|---------|-----|
| `Virgil.woff2` | [OFL-1.1](https://github.com/excalidraw/virgil) | Latin handwriting (`theme.handDrawn`) |
| `LongCang-Regular.ttf` | [OFL-1.1](https://github.com/google/fonts/tree/main/ofl/longcang) | CJK handwriting default (`handDrawn` + SVG text) |
| `Yozai-Regular.ttf` | [OFL-1.1](https://github.com/lxgw/yozai-font) | optional alternate |
| `Xiaolai-Regular.ttf` | [OFL-1.1](https://github.com/lxgw/kose-font) | optional alternate |

When `handDrawn` is on, Chinese uses **SVG `<text>` + clip** (`textRoughness: 0` by default).

## Download Long Cang (default)

```bash
curl -sL -o LongCang-Regular.ttf \
  "https://github.com/google/fonts/raw/main/ofl/longcang/LongCang-Regular.ttf"
```

Also bundled at render time: Noto Sans SC, DejaVu (opentype paths when `handDrawn` is off).

## Switch to another OFL handwriting font

```tsx
const theme = {
  ...excalidrawTheme,
  fontFamily: 'Virgil, Yozai, sans-serif',
  pathFontUrls: {
    ...excalidrawTheme.pathFontUrls,
    longcang: './Yozai-Regular.ttf',
  },
};
```

Update `fontFamily` to match the registered family (`Long Cang` for default, or extend `handwritingFonts.ts` for a new name).
