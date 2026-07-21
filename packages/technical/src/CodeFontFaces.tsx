/**
 * Injects @font-face for the bundled JetBrains Mono used by code scenes.
 */

import React, { useLayoutEffect, useState } from 'react';
import {
  BUNDLED_CODE_FONT_FAMILY,
  BUNDLED_CODE_FONT_FILE,
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
