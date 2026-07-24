/**
 * Injects @font-face for the bundled JetBrains Mono used by code scenes.
 */

import React, { useLayoutEffect, useState } from 'react';
import {
  BUNDLED_CODE_FONT_FAMILY,
  BUNDLED_CODE_FONT_FILE,
  TERMINAL_FONT_FAMILY,
  TERMINAL_FONT_LATIN_FILE,
  TERMINAL_FONT_SYMBOLS_FILE,
  preloadBundledCodeFont,
} from './fonts';

export function CodeFontFaces(): React.ReactElement {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    void preloadBundledCodeFont().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@font-face {
  font-family: '${BUNDLED_CODE_FONT_FAMILY}';
  src: url('./${BUNDLED_CODE_FONT_FILE}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
@font-face {
  font-family: '${TERMINAL_FONT_FAMILY}';
  src: url('./${TERMINAL_FONT_LATIN_FILE}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
  unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
}
@font-face {
  font-family: '${TERMINAL_FONT_FAMILY}';
  src: url('./${TERMINAL_FONT_SYMBOLS_FILE}') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: block;
  unicode-range: U+2000-2001,U+2004-2008,U+200A,U+23B8-23BD,U+2500-259F;
}
`,
        }}
      />
      {/* data attribute helps debugging which face loaded */}
      <span
        aria-hidden
        data-seqvio-code-font={BUNDLED_CODE_FONT_FAMILY}
        data-seqvio-code-font-ready={ready ? '1' : '0'}
        style={{ display: 'none' }}
      />
    </>
  );
}
