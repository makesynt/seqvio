import React from 'react';
import { useCurrentFrame } from '@seqvio/core';
import { AnnotationTarget } from './AnnotationLayer';
import { applyCodeSteps, highlightLine, type CodeStep } from './code-utils';
import { technicalFonts, technicalPalette } from './theme';

export interface CodeWalkthroughProps {
  id: string;
  language: string;
  source: string;
  steps?: CodeStep[];
  width?: number;
  height?: number;
  title?: string;
}

export const CodeWalkthrough: React.FC<CodeWalkthroughProps> = ({
  id,
  language,
  source,
  steps = [],
  width = 1280,
  height = 720,
  title,
}) => {
  const frame = useCurrentFrame();
  const { records, focusLineIds, typedChars, annotations } = applyCodeSteps(
    source,
    steps,
    frame
  );
  const lineHeight = 28;
  const gutterWidth = 52;
  const pad = 32;
  const focused = new Set(focusLineIds);

  return (
    <AnnotationTarget id={id} style={{ width, height }}>
      <div
        style={{
          width,
          height,
          background: technicalPalette.codeBg,
          color: technicalPalette.ink,
          fontFamily: technicalFonts.mono,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 18px',
            borderBottom: `1px solid ${technicalPalette.line}`,
            background: technicalPalette.panel,
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#ef4444' }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#f59e0b' }} />
          <span style={{ width: 10, height: 10, borderRadius: 999, background: '#22c55e' }} />
          <span style={{ marginLeft: 8, fontSize: 13, color: technicalPalette.muted }}>
            {title ?? `${language} walkthrough`}
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', padding: pad, position: 'relative' }}>
          <pre
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: `${lineHeight}px`,
              fontFamily: technicalFonts.mono,
            }}
          >
            {records.map((record) => {
              const typedCount = typedChars.get(record.id);
              const visibleLine =
                typedCount === undefined
                  ? record.text
                  : record.text.slice(0, typedCount);
              const tokens = highlightLine(visibleLine, language);
              return (
                <AnnotationTarget
                  key={record.id}
                  id={`${id}:${record.id}`}
                  style={{
                    display: 'block',
                    background: focused.has(record.id)
                      ? technicalPalette.accentSoft
                      : 'transparent',
                    borderRadius: 6,
                  }}
                >
                  <div
                    data-line-id={record.id}
                    data-line-number={record.lineNumber}
                    style={{ display: 'flex' }}
                  >
                    <span
                      style={{
                        width: gutterWidth,
                        color: technicalPalette.gutter,
                        userSelect: 'none',
                        textAlign: 'right',
                        paddingRight: 16,
                      }}
                    >
                      {record.lineNumber}
                    </span>
                    <code>
                      {tokens.map((token, tokenIndex) => (
                        <span key={tokenIndex} style={{ color: token.color }}>
                          {token.text}
                        </span>
                      ))}
                    </code>
                  </div>
                </AnnotationTarget>
              );
            })}
          </pre>
          {annotations.map((annotation, index) => (
            <div
              key={`${annotation.targetId}-${index}`}
              style={{
                position: 'absolute',
                right: 24,
                top: 24 + index * 36,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#7dd3fc',
                fontSize: 13,
                maxWidth: 280,
              }}
            >
              {annotation.text}
            </div>
          ))}
        </div>
      </div>
    </AnnotationTarget>
  );
};
