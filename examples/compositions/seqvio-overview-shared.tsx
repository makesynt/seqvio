import React, { type CSSProperties, type ReactNode } from 'react';
import { Scene, VideoComposition, useCurrentFrame } from '@seqvio/core';
import {
  DrawIcon,
  DrawShape,
  DrawText,
  Hand,
  WhiteboardScene,
  excalidrawTheme,
} from '@seqvio/whiteboard';
import {
  Doodle,
  PinnedList,
  ScatterScene,
  StickyNote,
} from '@seqvio/scatterbrain';
import {
  BrowserFrame,
  Callout,
  ProductDemoScene,
} from '@seqvio/product-demo';
import seqvioIcon from '../../docs/assets/brand/seqvio-icon.svg';
import seqvioIconSmall from '../../docs/assets/brand/seqvio-icon-small.svg';

const W = 1280;
const H = 720;
export const OVERVIEW_FPS = 30;

const C = {
  navy: '#0B1020',
  navy2: '#131C35',
  paper: '#F6F8FC',
  white: '#FFFFFF',
  ink: '#101828',
  muted: '#667085',
  cyan: '#5EE7FF',
  blue: '#38B6FF',
  indigo: '#6E7BFF',
  amber: '#F4B740',
  green: '#32D583',
  rose: '#FF6B7A',
};

const UI_STACK = 'Inter, "Segoe UI", Arial, sans-serif';
const MONO_STACK = '"JetBrains Mono", "Cascadia Code", Consolas, monospace';
const LONG_CANG_STACK = '"Long Cang", "Noto Sans SC", "Microsoft YaHei", cursive';

export interface OverviewCopy {
  lang: 'en' | 'zh';
  hookTop: string;
  hookBottom: string;
  hookRail: string;
  promiseTitle: string;
  promiseRail: string;
  vocabulary: [string, string, string];
  promptLabel: string;
  promptText: string;
  promptRail: string;
  files: [string, string, string];
  ragTitle: string;
  ragSteps: [string, string, string, string];
  ragRail: string;
  stylesTitle: string;
  stylesRail: string;
  styleLabels: [string, string, string];
  styleNotes: [string, string, string, string];
  proofTitle: string;
  proofRail: string;
  checks: [string, string, string, string];
  closeKicker: string;
  closeTitle: string;
  closeRail: string;
  cta: string;
}

export interface OverviewProps {
  id: string;
  copy: OverviewCopy;
  sceneDurations: readonly [number, number, number, number, number, number, number];
  duration: number;
  audio: {
    fps: number;
    lockToAudio: true;
    narration: Array<{ id: string; sceneId: string; text: string }>;
  };
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOut(value: number): number {
  const p = clamp(value);
  return 1 - Math.pow(1 - p, 3);
}

function reveal(frame: number, start: number, duration = 18, distance = 20): CSSProperties {
  const p = easeOut((frame - start) / duration);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px) scale(${0.97 + p * 0.03})`,
  };
}

function BrandBug({ light = false }: { light?: boolean }) {
  return (
    <div style={{ position: 'absolute', left: 42, top: 32, zIndex: 40, display: 'flex', alignItems: 'center', gap: 13, color: light ? C.ink : C.white, fontFamily: UI_STACK, fontSize: 24, fontWeight: 750 }}>
      <img src={seqvioIconSmall} alt="" style={{ width: 44, height: 44 }} />
      <span>Seqvio</span>
    </div>
  );
}

function Rail({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <div style={{ position: 'absolute', zIndex: 50, left: 60, right: 60, bottom: 28, minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 22px', borderTop: `2px solid ${light ? '#D7DEEA' : 'rgba(94,231,255,0.34)'}`, color: light ? C.ink : '#E9F7FF', fontFamily: UI_STACK, fontSize: 27, lineHeight: 1.25, textAlign: 'center', fontWeight: 650 }}>
      {children}
    </div>
  );
}

function DarkStage({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 34) * 10;
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.navy, color: C.white, fontFamily: UI_STACK }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.24, transform: `translateX(${drift}px)`, backgroundImage: 'linear-gradient(rgba(94,231,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(94,231,255,0.10) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      <div style={{ position: 'absolute', width: 480, height: 480, right: -120 + drift, top: -190, border: '2px solid rgba(110,123,255,0.24)', borderRadius: '50%' }} />
      <BrandBug />
      {children}
    </div>
  );
}

function LightStage({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: C.paper, color: C.ink, fontFamily: UI_STACK }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.32, backgroundImage: 'radial-gradient(#B9C5D8 1px, transparent 1px)', backgroundPosition: `${frame % 28}px ${frame % 28}px`, backgroundSize: '28px 28px' }} />
      <BrandBug light />
      {children}
    </div>
  );
}

function HookScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame() * 126 / Math.max(1, duration);
  const fragments = [
    { label: 'CLIP 01', x: 112, y: 180, color: C.indigo, delay: 0 },
    { label: 'B-ROLL', x: 922, y: 144, color: C.amber, delay: 6 },
    { label: 'MOTION', x: 850, y: 430, color: C.blue, delay: 12 },
    { label: 'FX', x: 160, y: 452, color: C.rose, delay: 18 },
  ];
  const focus = easeOut((frame - 52) / 28);
  return (
    <DarkStage>
      {fragments.map((item, index) => {
        const p = easeOut((frame - item.delay) / 22) * (1 - focus * 0.78);
        const float = Math.sin((frame + index * 13) / 15) * 8;
        return (
          <div key={item.label} style={{ position: 'absolute', left: item.x, top: item.y + float, width: 190, height: 88, opacity: p, border: `2px solid ${item.color}`, background: 'rgba(19,28,53,0.88)', display: 'grid', placeItems: 'center', color: item.color, fontFamily: MONO_STACK, fontSize: 22, fontWeight: 700, transform: `rotate(${index % 2 ? 4 : -4}deg)` }}>
            {item.label}
          </div>
        );
      })}
      <div style={{ position: 'absolute', left: 130, right: 130, top: 214, textAlign: 'center', opacity: focus }}>
        <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 850 }}>{copy.hookTop}</div>
        <div style={{ marginTop: 20, fontSize: 72, lineHeight: 1.05, fontWeight: 850, color: C.cyan }}>{copy.hookBottom}</div>
      </div>
      <Rail>{copy.hookRail}</Rail>
    </DarkStage>
  );
}

function PromiseScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame() * 168 / Math.max(1, duration);
  const iconP = easeOut(frame / 30);
  const nodes = [
    { label: copy.vocabulary[0], x: 142, y: 270, color: C.amber, start: 42 },
    { label: copy.vocabulary[1], x: 920, y: 210, color: C.green, start: 62 },
    { label: copy.vocabulary[2], x: 890, y: 430, color: C.rose, start: 82 },
  ];
  return (
    <DarkStage>
      <div style={{ position: 'absolute', left: 86, top: 116, ...reveal(frame, 8, 24) }}>
        <div style={{ fontSize: 58, maxWidth: 720, lineHeight: 1.06, fontWeight: 850 }}>{copy.promiseTitle}</div>
      </div>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {nodes.map((node) => {
          const p = easeOut((frame - node.start) / 26);
          return <line key={node.label} x1={640} y1={386} x2={node.x + 106} y2={node.y + 38} stroke={node.color} strokeWidth={3} strokeDasharray="10 10" opacity={0.56 * p} />;
        })}
      </svg>
      <img src={seqvioIcon} alt="" style={{ position: 'absolute', left: 522, top: 270, width: 236, height: 236, opacity: iconP, transform: `scale(${0.78 + iconP * 0.22}) rotate(${(1 - iconP) * -8}deg)` }} />
      {nodes.map((node) => (
        <div key={node.label} style={{ position: 'absolute', left: node.x, top: node.y, width: 212, height: 76, display: 'grid', placeItems: 'center', border: `2px solid ${node.color}`, background: 'rgba(11,16,32,0.92)', color: node.color, fontFamily: MONO_STACK, fontSize: 20, fontWeight: 700, ...reveal(frame, node.start, 24, 12) }}>
          {node.label}
        </div>
      ))}
      <Rail>{copy.promiseRail}</Rail>
    </DarkStage>
  );
}

function TerminalWindow({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: 76, top: 152, width: 710, height: 414, background: '#080D19', border: '2px solid #263556', boxShadow: '0 24px 56px rgba(11,16,32,0.25)', overflow: 'hidden' }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px', borderBottom: '1px solid #263556', background: '#10182B' }}>
        {[C.rose, C.amber, C.green].map((color) => <span key={color} style={{ width: 11, height: 11, borderRadius: '50%', background: color }} />)}
        <span style={{ marginLeft: 12, fontFamily: MONO_STACK, fontSize: 15, color: '#91A4C4' }}>agent / seqvio</span>
      </div>
      {children}
    </div>
  );
}

function PromptScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame() * 228 / Math.max(1, duration);
  return (
    <LightStage>
      <div style={{ position: 'absolute', left: 76, top: 102, fontSize: 18, color: C.muted, fontFamily: MONO_STACK }}>{copy.promptLabel}</div>
      <TerminalWindow>
        <div style={{ padding: 30, fontFamily: MONO_STACK, color: '#D8E5FF' }}>
          <div style={{ fontSize: 18, color: C.green, ...reveal(frame, 8, 18) }}>$ codex</div>
          <div style={{ marginTop: 24, fontSize: 27, lineHeight: 1.48, ...reveal(frame, 28, 26) }}><span style={{ color: C.cyan }}>&gt; </span>{copy.promptText}</div>
          <div style={{ marginTop: 30, fontSize: 17, color: '#8FA5C7', ...reveal(frame, 78, 22) }}>/seqvio&nbsp;&nbsp;planning explainer structure...</div>
          <div style={{ marginTop: 18, height: 8, background: '#1D2942', ...reveal(frame, 100, 16) }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (frame - 100) * 1.6))}%`, height: '100%', background: C.blue }} />
          </div>
        </div>
      </TerminalWindow>
      <div style={{ position: 'absolute', left: 842, top: 160, width: 348 }}>
        {copy.files.map((file, index) => (
          <div key={file} style={{ height: 96, marginBottom: 22, padding: '18px 20px', border: `2px solid ${index === 0 ? C.blue : index === 1 ? C.indigo : C.green}`, background: C.white, boxShadow: '0 14px 30px rgba(16,24,40,0.10)', fontFamily: MONO_STACK, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', ...reveal(frame, 104 + index * 28, 22, 18) }}>
            <span style={{ marginRight: 14, color: index === 2 ? C.green : C.blue }}>●</span>{file}
          </div>
        ))}
      </div>
      <Rail light>{copy.promptRail}</Rail>
    </LightStage>
  );
}

function RagExplanationScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame();
  const t = (frame: number) => Math.max(1, Math.round(frame * duration / 330));
  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        overflow: 'hidden',
        background: '#FBFCFE',
      }}
    >
      <WhiteboardScene
        width={W}
        height={H}
        texture="whiteboard"
        theme={excalidrawTheme}
        singlePen={false}
      >
        <DrawText
          text={copy.ragTitle}
          position={{ x: 88, y: 126 }}
          fontSize={43}
          fontWeight="bold"
          strokeColor={C.ink}
          start={t(8)}
          duration={t(28)}
        />
        <DrawShape
          type="underline"
          position={{ x: 88, y: 166 }}
          size={428}
          strokeColor={C.blue}
          strokeWidth={4}
          start={t(38)}
          duration={t(18)}
        />
        {copy.ragSteps.map((label, index) => {
          const x = 76 + index * 298;
          const color = [C.blue, C.indigo, C.amber, C.green][index];
          const isEndpoint = index === 0 || index === 3;
          const shapeType = isEndpoint
            ? 'circle'
            : index === 1
              ? 'rounded-rectangle'
              : 'rectangle';
          return (
            <React.Fragment key={label}>
              <DrawShape
                type={shapeType}
                position={isEndpoint ? { x: x + 103, y: 346 } : { x, y: 276 }}
                size={isEndpoint ? 140 : { width: 206, height: 140 }}
                strokeColor={color}
                fillColor="none"
                strokeWidth={3}
                start={t(58 + index * 58)}
                duration={t(24)}
              />
              <DrawText
                text={label}
                position={{ x: x + 103, y: 452 }}
                align="center"
                fontSize={25}
                fontWeight="bold"
                strokeColor={C.ink}
                start={t(84 + index * 58)}
                duration={t(18)}
              />
              {index < 3 ? (
                <DrawShape
                  type="arrow"
                  from={{ x: x + 214, y: 346 }}
                  to={{ x: x + 286, y: 346 }}
                  strokeColor={C.muted}
                  strokeWidth={2.6}
                  start={t(104 + index * 58)}
                  duration={t(12)}
                />
              ) : null}
            </React.Fragment>
          );
        })}
        <DrawText
          text={copy.ragRail}
          position={{ x: 640, y: 546 }}
          align="center"
          fontSize={31}
          fontWeight="bold"
          strokeColor={C.ink}
          start={t(280)}
          duration={t(24)}
        />
        <DrawShape
          type="underline"
          position={{ x: 370, y: 584 }}
          size={540}
          strokeColor={C.rose}
          strokeWidth={4}
          start={t(308)}
          duration={t(16)}
        />
        {frame < t(324) ? <Hand action="write" follow visible size={42} /> : null}
      </WhiteboardScene>
      <BrandBug light />
    </div>
  );
}

function MiniWhiteboard({ copy }: { copy: OverviewCopy }) {
  return (
    <WhiteboardScene
      width={344}
      height={330}
      texture="whiteboard"
      theme={excalidrawTheme}
      singlePen={false}
    >
      <DrawText
        text="RAG"
        position={{ x: 34, y: 48 }}
        fontSize={38}
        fontWeight="bold"
        strokeColor={C.blue}
        start={18}
        duration={24}
      />
      <DrawIcon
        name="idea"
        position={{ x: 34, y: 128 }}
        size={54}
        strokeColor={C.blue}
        start={48}
        duration={22}
      />
      <DrawShape
        type="arrow"
        from={{ x: 104, y: 156 }}
        to={{ x: 194, y: 156 }}
        strokeColor={C.indigo}
        start={72}
        duration={20}
      />
      <DrawIcon
        name="database"
        position={{ x: 224, y: 128 }}
        size={54}
        strokeColor={C.green}
        start={94}
        duration={22}
      />
      <DrawText
        text={copy.styleNotes[0]}
        position={{ x: 172, y: 245 }}
        align="center"
        fontSize={22}
        strokeColor={C.ink}
        start={122}
        duration={24}
      />
    </WhiteboardScene>
  );
}

function MiniScatter({ copy }: { copy: OverviewCopy }) {
  return (
    <ScatterScene
      width={344}
      height={330}
      surface="warm"
      style={{ fontFamily: copy.lang === 'zh' ? LONG_CANG_STACK : UI_STACK }}
    >
      <PinnedList
        items={[copy.styleNotes[1], copy.styleNotes[2], copy.styleNotes[3]]}
        position={{ x: 22, y: 34 }}
        itemWidth={220}
        gap={8}
        start={16}
        stagger={28}
        fontSize={20}
      />
      <StickyNote
        position={{ x: 236, y: 164 }}
        width={96}
        color="blue"
        rotate={4}
        attach="pin"
        start={108}
        duration={20}
        style={{ padding: 12 }}
      >
        RAG
      </StickyNote>
      <Doodle
        type="arrow"
        position={{ x: 214, y: 104 }}
        size={86}
        color={C.rose}
        rotate={15}
        start={132}
        duration={24}
      />
    </ScatterScene>
  );
}

function MiniProductDemo() {
  return (
    <ProductDemoScene width={344} height={330} background="#EEF2F6">
      <BrowserFrame
        position={{ x: 18, y: 38 }}
        width={308}
        height={248}
        url="rag-demo.local"
        title="sample output"
        start={18}
        duration={22}
      >
        <div style={{ padding: 18, fontFamily: UI_STACK }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink }}>
            How does RAG answer?
          </div>
          <div style={{ marginTop: 16, height: 10, width: 230, background: '#DCE5F3' }} />
          <div style={{ marginTop: 9, height: 10, width: 186, background: '#DCE5F3' }} />
          <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
            {['Q', 'DB', 'A'].map((item, index) => (
              <div
                key={item}
                style={{
                  width: 72,
                  height: 58,
                  display: 'grid',
                  placeItems: 'center',
                  color: C.white,
                  background: [C.blue, C.indigo, C.green][index],
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </BrowserFrame>
      <Callout
        text="context found"
        position={{ x: 182, y: 236 }}
        width={132}
        start={92}
        duration={18}
        accent={C.green}
      />
    </ProductDemoScene>
  );
}

function StylesScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame() * 258 / Math.max(1, duration);
  const cards = [
    { label: copy.styleLabels[0], child: <MiniWhiteboard copy={copy} />, color: C.blue },
    { label: copy.styleLabels[1], child: <MiniScatter copy={copy} />, color: C.amber },
    { label: copy.styleLabels[2], child: <MiniProductDemo />, color: C.green },
  ];
  return (
    <LightStage>
      <div
        style={{
          position: 'absolute',
          left: 74,
          top: 102,
          fontSize: 50,
          fontWeight: 850,
          ...reveal(frame, 4, 22),
        }}
      >
        {copy.stylesTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 74,
          right: 74,
          top: 186,
          display: 'flex',
          gap: 28,
        }}
      >
        {cards.map((card, index) => (
          <div
            key={card.label}
            style={{
              width: 356,
              background: C.white,
              border: `3px solid ${card.color}`,
              boxShadow: '0 18px 40px rgba(16,24,40,0.12)',
              overflow: 'hidden',
              ...reveal(frame, 34 + index * 52, 26, 28),
            }}
          >
            <div style={{ height: 330 }}>{card.child}</div>
            <div
              style={{
                height: 58,
                display: 'grid',
                placeItems: 'center',
                fontFamily: MONO_STACK,
                fontSize: 18,
                fontWeight: 800,
                color: C.ink,
              }}
            >
              {card.label}
            </div>
          </div>
        ))}
      </div>
      <Rail light>{copy.stylesRail}</Rail>
    </LightStage>
  );
}

function ProofScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame() * 246 / Math.max(1, duration);
  const commands = [
    'seqvio-generate validate storyboard.json',
    'seqvio-audio synthesize --manifest audio.json',
    'seqvio-qa --frames 0,120,240',
    'seqvio-render --component rag-explainer.tsx',
  ];
  return (
    <DarkStage>
      <div
        style={{
          position: 'absolute',
          left: 78,
          top: 104,
          fontSize: 50,
          fontWeight: 850,
          ...reveal(frame, 4, 22),
        }}
      >
        {copy.proofTitle}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 182,
          width: 718,
          height: 392,
          background: '#070B13',
          border: '2px solid #2A3A5F',
        }}
      >
        <div
          style={{
            height: 42,
            padding: '11px 16px',
            color: '#8FA5C7',
            fontFamily: MONO_STACK,
            fontSize: 15,
            borderBottom: '1px solid #2A3A5F',
          }}
        >
          real Seqvio CLI
        </div>
        <div style={{ padding: 24, fontFamily: MONO_STACK }}>
          {commands.map((command, index) => (
            <div
              key={command}
              style={{
                marginBottom: 25,
                fontSize: 17,
                color: '#D8E5FF',
                ...reveal(frame, 28 + index * 42, 20, 10),
              }}
            >
              <span style={{ color: C.green }}>$ </span>
              {command}
              <span style={{ marginLeft: 14, color: C.green }}>✓</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 840, top: 184, width: 350 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                height: 126,
                padding: 14,
                border: `2px solid ${[C.blue, C.indigo, C.amber, C.green][index]}`,
                background: C.navy2,
                ...reveal(frame, 64 + index * 34, 20, 14),
              }}
            >
              <div
                style={{
                  height: 10,
                  width: `${56 + index * 8}%`,
                  background: [C.blue, C.indigo, C.amber, C.green][index],
                }}
              />
              <div style={{ marginTop: 16, height: 46, border: '1px solid #35476D' }} />
              <div
                style={{
                  marginTop: 10,
                  fontFamily: MONO_STACK,
                  color: '#AFC2E2',
                  fontSize: 13,
                }}
              >
                {copy.checks[index]}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 18,
            padding: 16,
            border: `2px solid ${C.green}`,
            color: C.green,
            fontFamily: MONO_STACK,
            fontSize: 18,
            textAlign: 'center',
            ...reveal(frame, 198, 22),
          }}
        >
          output/seqvio-rag.mp4
        </div>
      </div>
      <Rail>{copy.proofRail}</Rail>
    </DarkStage>
  );
}

function ClosingScene({ copy, duration }: { copy: OverviewCopy; duration: number }) {
  const frame = useCurrentFrame() * 228 / Math.max(1, duration);
  const p = easeOut((frame - 18) / 30);
  return (
    <DarkStage>
      <div
        style={{
          position: 'absolute',
          left: 76,
          top: 154,
          width: 740,
          ...reveal(frame, 8, 26),
        }}
      >
        <div
          style={{
            fontFamily: MONO_STACK,
            color: C.cyan,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {copy.closeKicker}
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 72,
            lineHeight: 1.04,
            fontWeight: 880,
          }}
        >
          {copy.closeTitle}
        </div>
        <div
          style={{
            marginTop: 30,
            color: '#B8C7E3',
            fontSize: 25,
            lineHeight: 1.4,
          }}
        >
          {copy.closeRail}
        </div>
        <div
          style={{
            marginTop: 34,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
            border: `2px solid ${C.cyan}`,
            color: C.cyan,
            fontFamily: MONO_STACK,
            fontSize: 18,
            ...reveal(frame, 82, 24),
          }}
        >
          {copy.cta}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 92,
          top: 166,
          width: 310,
          height: 310,
          transform: `scale(${0.82 + p * 0.18}) rotate(${(1 - p) * 9}deg)`,
          opacity: p,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -30,
            border: '2px solid rgba(94,231,255,0.28)',
            borderRadius: '50%',
            transform: `rotate(${frame * 0.32}deg)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: -62,
            border: '1px dashed rgba(110,123,255,0.38)',
            borderRadius: '50%',
            transform: `rotate(${-frame * 0.22}deg)`,
          }}
        />
        <img src={seqvioIcon} alt="" style={{ width: '100%', height: '100%' }} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 76,
          right: 76,
          bottom: 46,
          height: 2,
          background: 'linear-gradient(90deg, #5EE7FF, #6E7BFF, #32D583)',
        }}
      />
    </DarkStage>
  );
}

export function SeqvioOverview({
  id,
  copy,
  sceneDurations,
  duration,
  audio,
}: OverviewProps) {
  const [hook, promise, prompt, explanation, styles, proof, closing] = sceneDurations;
  return (
    <VideoComposition
      id={id}
      width={W}
      height={H}
      fps={OVERVIEW_FPS}
      duration={duration}
      backgroundColor={C.navy}
      audio={audio}
    >
      <Scene id="hook" duration={hook}><HookScene copy={copy} duration={hook} /></Scene>
      <Scene id="promise" duration={promise}><PromiseScene copy={copy} duration={promise} /></Scene>
      <Scene id="prompt" duration={prompt}><PromptScene copy={copy} duration={prompt} /></Scene>
      <Scene id="explanation" duration={explanation}><RagExplanationScene copy={copy} duration={explanation} /></Scene>
      <Scene id="styles" duration={styles}><StylesScene copy={copy} duration={styles} /></Scene>
      <Scene id="proof" duration={proof}><ProofScene copy={copy} duration={proof} /></Scene>
      <Scene id="closing" duration={closing}><ClosingScene copy={copy} duration={closing} /></Scene>
    </VideoComposition>
  );
}
