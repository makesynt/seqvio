import React, { type CSSProperties, type ReactNode } from "react";
import type { RenderableMeta } from "@seqvio/core";
import {
  DesignStage,
  Scene,
  Transition,
  VideoComposition,
  useCurrentFrame,
} from "@seqvio/core";
import { TerminalXtermDemo } from "@seqvio/technical";
import seqvioMark from "../../docs/assets/brand/seqvio-mark.svg";
import skillBenchDesktop from "../../output/html-anything-evaluation/desktop-hero.png";
import skillBenchMobile from "../../output/html-anything-evaluation/mobile-hero.png";
import browserEvidenceVideo from "../../output/seqvio-product-hunt-captures/html-anything-browser-v5/raw.mp4";
import claudeRecording from "../../output/seqvio-product-hunt-captures/html-anything-claude-v2/recording-manifest.json";

const W = 1280;
const H = 720;
const FPS = 30;
// Keep the narrative moving: each scene is long enough to read, but does not
// leave several seconds of unmotivated silence after its narration finishes.
const SCENES = [100, 280, 205, 330, 220, 235, 330, 156] as const;
const TRANSITIONS = [12, 10, 10, 12, 8, 10, 12] as const;

const C = {
  bg: "#070A0E",
  panel: "#111C29",
  raised: "#19283A",
  border: "#31465E",
  text: "#F5F8FC",
  muted: "#9BB0C6",
  blue: "#55B4FF",
  green: "#4AD39B",
  amber: "#F4B85F",
  coral: "#F47658",
  light: "#F4F7FA",
  ink: "#152231",
};

const SANS = 'Inter, "Segoe UI", Arial, sans-serif';
const MONO = '"Cascadia Mono", "Cascadia Code", Consolas, monospace';
const HAND = 'Virgil, "Long Cang", "Noto Sans SC", cursive';
const CLAUDE_EVENTS = claudeRecording.events
  .filter((event) => event.timeMs >= 2_025 && event.timeMs < 47_000)
  .map((event) => ({
    ...event,
    timeMs: Math.round((event.timeMs - 2_025) * 0.13),
  }));
const SEQVIO_SWOOSH_PATH =
  "M92 74 C120 66 176 96 188 122 C196 140 176 158 150 168 L104 186 C90 191 78 181 80 167 C88 150 118 150 118 132 C118 116 92 116 92 100 Z";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function mixHex(from: string, to: string, progress: number) {
  const p = clamp(progress);
  const start = from.slice(1).match(/.{2}/g) ?? [];
  const end = to.slice(1).match(/.{2}/g) ?? [];
  const channels = start.map((value, index) =>
    Math.round(
      parseInt(value, 16) +
        (parseInt(end[index] ?? value, 16) - parseInt(value, 16)) * p,
    ),
  );
  return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function easeOut(value: number) {
  const p = clamp(value);
  return 1 - Math.pow(1 - p, 3);
}

function smoothStep(value: number) {
  const p = clamp(value);
  return p * p * (3 - 2 * p);
}

function typedText(
  text: string,
  frame: number,
  start: number,
  framesPerCharacter: number,
) {
  const count = Math.max(
    0,
    Math.min(text.length, Math.floor((frame - start) / framesPerCharacter)),
  );
  return text.slice(0, count);
}

function enterWindow(frame: number, start = 16): CSSProperties {
  const p = easeOut((frame - start) / 20);
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * 38}px) scale(${0.965 + p * 0.035})`,
  };
}

function reveal(
  frame: number,
  start: number,
  options: { x?: number; y?: number; scale?: number; duration?: number } = {},
): CSSProperties {
  const { x = 0, y = 24, scale = 0.97, duration = 18 } = options;
  const p = easeOut((frame - start) / duration);
  return {
    opacity: p,
    transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px) scale(${scale + p * (1 - scale)})`,
  };
}

function Canvas({
  children,
  base = C.bg,
}: {
  children: ReactNode;
  tone?: string;
  base?: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        overflow: "hidden",
        color: C.text,
        fontFamily: SANS,
        background: base,
      }}
    >
      {children}
    </div>
  );
}

function Window({
  title,
  children,
  style,
}: {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "absolute",
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        borderRadius: 26,
        background: C.panel,
        boxShadow: "0 30px 90px rgba(0,0,0,.38)",
        ...style,
      }}
    >
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: C.raised,
          fontFamily: MONO,
          fontSize: 14,
          color: C.muted,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: C.coral,
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            marginLeft: 8,
            background: C.amber,
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            marginLeft: 8,
            background: C.green,
          }}
        />
        <span style={{ marginLeft: 18 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function WordReveal({
  words,
  frame,
  start,
  direction,
  align,
  fontSize,
  fontWeight,
  color,
  stagger = 9,
  duration = 12,
}: {
  words: string[];
  frame: number;
  start: number;
  direction: -1 | 1;
  align: "flex-start" | "center" | "flex-end";
  fontSize: number;
  fontWeight: number;
  color: string;
  stagger?: number;
  duration?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: align,
        gap: 10,
        whiteSpace: "nowrap",
        fontSize,
        lineHeight: 1.05,
        fontWeight,
        color,
      }}
    >
      {words.map((word, index) => {
        const p = easeOut((frame - start - index * stagger) / duration);
        return (
          <span
            key={word}
            style={{
              display: "inline-block",
              opacity: p,
              filter: `blur(${(1 - p) * 5}px)`,
              transform: `translate(${direction * (1 - p) * 22}px, ${(1 - p) * 9}px) scale(${0.96 + p * 0.04})`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

function assembledLayerTransform(
  progress: number,
  startX: number,
  startY: number,
  startScale: number,
) {
  const x = (1 - progress) * startX;
  const y = (1 - progress) * startY;
  const scale = startScale + progress * (1 - startScale);
  return `translate(${x} ${y}) translate(128 128) scale(${scale}) translate(-128 -128)`;
}

function AnimatedSeqvioMark({ frame }: { frame: number }) {
  const far = easeOut((frame - 96) / 8);
  const middle = easeOut((frame - 102) / 8);
  const front = easeOut((frame - 108) / 8);
  const assemble = smoothStep((frame - 106) / 18);
  const expand = easeOut((frame - 104) / 10);
  const contract = smoothStep((frame - 126) / 12);
  const markScale = frame < 126 ? 1 + expand * 4 : 5 - contract * 4;

  return (
    <svg
      width="168"
      height="168"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden="true"
      style={{
        display: "block",
        overflow: "visible",
        transform: `scale(${markScale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <defs>
        <linearGradient
          id="hook-seqvio-front"
          x1="80"
          y1="72"
          x2="184"
          y2="188"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#78DCF4" />
          <stop offset="0.55" stopColor="#3F9CF4" />
          <stop offset="1" stopColor="#6673E8" />
        </linearGradient>
        <linearGradient
          id="hook-seqvio-mask-gradient"
          x1="0"
          y1="118"
          x2="0"
          y2="165"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#000000" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
        <mask id="hook-seqvio-fade">
          <rect
            width="256"
            height="256"
            fill="url(#hook-seqvio-mask-gradient)"
          />
        </mask>
        <filter
          id="hook-seqvio-shadow"
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
        >
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="9"
            floodColor="#08111F"
            floodOpacity="0.28"
          />
        </filter>
      </defs>
      <g
        opacity={far * (0.36 + (1 - assemble) * 0.32)}
        transform={assembledLayerTransform(assemble, -42, -30, 1.18)}
      >
        <g mask="url(#hook-seqvio-fade)">
          <g transform="translate(16.83,-8) matrix(1,0,-0.1980,1,0,0)">
            <path d={SEQVIO_SWOOSH_PATH} fill="#7A7FF2" />
          </g>
        </g>
      </g>
      <g
        opacity={middle * (0.68 + (1 - assemble) * 0.2)}
        transform={assembledLayerTransform(assemble, -20, -14, 1.12)}
      >
        <g mask="url(#hook-seqvio-fade)">
          <g transform="translate(8.42,-4) matrix(1,0,-0.0990,1,0,0)">
            <path d={SEQVIO_SWOOSH_PATH} fill="#54B9F2" />
          </g>
        </g>
      </g>
      <g
        opacity={front}
        transform={assembledLayerTransform(assemble, 24, 18, 1.08)}
        filter="url(#hook-seqvio-shadow)"
      >
        <path d={SEQVIO_SWOOSH_PATH} fill="url(#hook-seqvio-front)" />
      </g>
    </svg>
  );
}

function LegacyEvidenceField({ frame }: { frame: number }) {
  const gather = smoothStep((frame - 68) / 28);
  const fade = smoothStep((frame - 88) / 14);
  const pathFade = smoothStep((frame - 80) / 12);
  const core = easeOut((frame - 48) / 20) * (1 - fade);
  const centerX = 640;
  const centerY = 352;
  const lanes = [
    {
      d: "M366 230 H478 Q510 230 532 256 L610 326",
      start: [366, 230],
      color: C.blue,
      delay: 12,
    },
    {
      d: "M868 214 H802 Q772 214 750 246 L670 326",
      start: [868, 214],
      color: C.amber,
      delay: 20,
    },
    {
      d: "M420 525 H500 Q530 525 548 494 L610 378",
      start: [420, 525],
      color: C.green,
      delay: 28,
    },
    {
      d: "M914 490 H804 Q774 490 754 468 L670 378",
      start: [914, 490],
      color: C.coral,
      delay: 36,
    },
  ];
  const carrierOpacity = 1 - fade;
  const carrierScale = 1.15 - gather * 0.83;
  const terminalSettle = easeOut((frame - 8) / 12);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: carrierOpacity,
      }}
    >
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          <filter
            id="evidence-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {lanes.map((lane) => {
          const draw = smoothStep((frame - lane.delay) / 30);
          return (
            <g key={lane.d} opacity={1 - pathFade}>
              <path
                d={lane.d}
                fill="none"
                stroke="#18334B"
                strokeWidth="12"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - draw}
                opacity={draw * 0.62}
              />
              <path
                d={lane.d}
                fill="none"
                stroke={lane.color}
                strokeWidth="4"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - draw}
                filter="url(#evidence-glow)"
                opacity={draw}
              />
            </g>
          );
        })}
        <circle
          cx={centerX}
          cy={centerY}
          r={42 + Math.sin(frame * 0.16) * 3}
          fill="none"
          stroke={C.blue}
          strokeWidth="3"
          strokeDasharray="7 11"
          strokeDashoffset={-frame * 0.7}
          opacity={core * (1 - pathFade)}
        />
        <g opacity={easeOut((frame - 8) / 16) * (1 - fade)}>
          <g
            transform={`translate(${96 + (centerX - 127 - 96) * gather} ${156 + (centerY - 56 - 156) * gather}) rotate(${-7 * (1 - gather)}) scale(${carrierScale * (1.12 - terminalSettle * 0.12)})`}
          >
            <rect
              width="254"
              height="112"
              rx="18"
              fill="#0E1D2E"
              stroke={C.blue}
              strokeOpacity=".65"
            />
            <rect
              x="18"
              y="20"
              width="218"
              height="18"
              rx="5"
              fill="rgba(85,180,255,.10)"
            />
            <text x="27" y="33" fontFamily={MONO} fontSize="10" fill={C.blue}>
              {typedText("$ evaluate saas-landing", frame, 9, 0.75)}
            </text>
            <text x="22" y="57" fontFamily={MONO} fontSize="10" fill={C.green}>
              {typedText("✓ 3 tests passed", frame, 28, 0.55)}
            </text>
            <text x="22" y="78" fontFamily={MONO} fontSize="10" fill={C.green}>
              {typedText("✓ build complete", frame, 40, 0.55)}
            </text>
            <text x="22" y="99" fontFamily={MONO} fontSize="10" fill={C.amber}>
              {typedText("artifact skillbench.html", frame, 51, 0.48)}
            </text>
          </g>
          <g
            transform={`translate(${870 + (centerX - 130 - 870) * gather} ${126 + (centerY - 71 - 126) * gather}) rotate(${6 * (1 - gather)}) scale(${carrierScale})`}
          >
            <rect
              width="260"
              height="142"
              rx="20"
              fill="#F3F7FB"
              stroke="#75C9F5"
              strokeWidth="2"
            />
            <rect width="260" height="26" rx="20" fill="#D9E7F3" />
            <circle cx="18" cy="13" r="4" fill="#EF6B63" />
            <circle cx="32" cy="13" r="4" fill="#F4B85F" />
            <circle cx="46" cy="13" r="4" fill="#4AD39B" />
            <path
              d="M24 88 C56 54 82 112 114 76 S172 66 222 92"
              fill="none"
              stroke={C.blue}
              strokeWidth="5"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - smoothStep((frame - 18) / 34)}
            />
            <circle cx="114" cy="76" r="7" fill={C.amber} />
            <text
              x="22"
              y="47"
              fontFamily={SANS}
              fontSize="12"
              fontWeight="700"
              fill={C.ink}
            >
              Skill evaluation
            </text>
            <text
              x="151"
              y="47"
              fontFamily={MONO}
              fontSize="9.5"
              fill="#60788C"
            >
              browser QA
            </text>
            <text
              x="137"
              y="119"
              fontFamily={MONO}
              fontSize="9.5"
              fill={C.green}
            >
              skillbench.html ready
            </text>
          </g>
          <g
            transform={`translate(${126 + (centerX - 126 - 126) * gather} ${494 + (centerY - 39 - 494) * gather}) rotate(${4 * (1 - gather)}) scale(${carrierScale})`}
          >
            <rect
              width="252"
              height="78"
              rx="18"
              fill="#122337"
              stroke={C.green}
              strokeOpacity=".58"
            />
            {[0, 1, 2, 3].map((index) => (
              <g key={index}>
                <circle
                  cx={24 + index * 53}
                  cy="26"
                  r="8"
                  fill={frame > 22 + index * 10 ? C.green : C.border}
                />
                <rect
                  x={12 + index * 53}
                  y="49"
                  width="32"
                  height="6"
                  rx="3"
                  fill={frame > 22 + index * 10 ? C.green : C.border}
                  opacity={0.45 + easeOut((frame - 22 - index * 10) / 8) * 0.4}
                />
              </g>
            ))}
            {["test", "build", "export", "video"].map((label, index) => (
              <text
                key={label}
                x={24 + index * 53}
                y="70"
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="8.5"
                fill="#9CB1C4"
              >
                {label}
              </text>
            ))}
          </g>
          <g
            transform={`translate(${930 + (centerX - 67 - 930) * gather} ${466 + (centerY - 36 - 466) * gather}) scale(${carrierScale})`}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <rect
                key={index}
                x={index * 19}
                y={48 - ((index * 17 + frame * 2) % 35)}
                width="10"
                height={18 + ((index * 17 + frame * 2) % 35)}
                rx="5"
                fill={index % 2 ? C.coral : C.amber}
                opacity=".8"
              />
            ))}
            <text x="0" y="70" fontFamily={MONO} fontSize="9.5" fill={C.amber}>
              18 events · 30 fps
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LegacyOpeningEvidenceField({ frame }: { frame: number }) {
  const gather = smoothStep((frame - 76) / 28);
  const fade = smoothStep((frame - 102) / 12);
  const cards = [
    { x: 82, y: 130, color: C.coral, label: "PR review", kind: "diff" },
    { x: 918, y: 126, color: C.green, label: "Tutorial check", kind: "steps" },
    { x: 98, y: 472, color: C.blue, label: "System map", kind: "system" },
    {
      x: 930,
      y: 466,
      color: C.amber,
      label: "Skill evaluation",
      kind: "evidence",
    },
  ] as const;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {cards.map((card, index) => {
        const enter = easeOut((frame - 5 - index * 7) / 16);
        const x = card.x + (520 - card.x) * gather;
        const y = card.y + (302 - card.y) * gather;
        const scale = (0.92 + enter * 0.08) * (1 - gather * 0.72);
        return (
          <g
            key={card.label}
            opacity={enter * (1 - fade)}
            transform={`translate(${x} ${y}) scale(${scale})`}
          >
            <rect
              width="270"
              height="138"
              rx="22"
              fill="#101A25"
              stroke={card.color}
              strokeWidth="2"
            />
            <text
              x="22"
              y="30"
              fill={card.color}
              fontFamily={SANS}
              fontSize="14"
              fontWeight="700"
            >
              {card.label}
            </text>
            {card.kind === "diff" && (
              <g fontFamily={MONO} fontSize="10">
                <text x="24" y="62" fill={C.coral}>
                  - return cachedValue
                </text>
                <text x="24" y="84" fill={C.green}>
                  + await refreshCache()
                </text>
                <path
                  d="M24 105 H152"
                  stroke={C.border}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle
                  cx="224"
                  cy="104"
                  r="13"
                  fill="none"
                  stroke={C.green}
                  strokeWidth="3"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - easeOut((frame - 25) / 20)}
                />
                <path
                  d="M218 104 l5 5 9-12"
                  fill="none"
                  stroke={C.green}
                  strokeWidth="3"
                />
              </g>
            )}
            {card.kind === "steps" &&
              [0, 1, 2].map((step) => (
                <g key={step} transform={`translate(24 ${56 + step * 26})`}>
                  <circle
                    r="8"
                    fill={frame > 24 + step * 8 ? C.green : C.border}
                  />
                  <path
                    d="M-3 0 l3 3 5-7"
                    fill="none"
                    stroke="#07110D"
                    strokeWidth="2"
                  />
                  <rect
                    x="20"
                    y="-5"
                    width={154 - step * 18}
                    height="10"
                    rx="5"
                    fill={C.muted}
                    opacity=".55"
                  />
                </g>
              ))}
            {card.kind === "system" && (
              <g fill="none" strokeWidth="3">
                <path
                  d="M58 86 H116 M152 86 H208 M135 67 V51"
                  stroke={C.blue}
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - easeOut((frame - 20) / 28)}
                />
                <rect
                  x="24"
                  y="68"
                  width="34"
                  height="34"
                  rx="8"
                  stroke={C.blue}
                />
                <circle cx="135" cy="86" r="18" stroke={C.amber} />
                <rect
                  x="208"
                  y="68"
                  width="36"
                  height="34"
                  rx="8"
                  stroke={C.green}
                />
                <rect
                  x="118"
                  y="35"
                  width="34"
                  height="20"
                  rx="6"
                  stroke={C.coral}
                />
              </g>
            )}
            {card.kind === "evidence" && (
              <g>
                <rect
                  x="22"
                  y="50"
                  width="90"
                  height="60"
                  rx="10"
                  fill="#17283A"
                  stroke={C.blue}
                />
                <path
                  d="M34 70 l10 8-10 8 M52 88 H88"
                  fill="none"
                  stroke={C.blue}
                  strokeWidth="3"
                />
                <rect
                  x="130"
                  y="50"
                  width="116"
                  height="60"
                  rx="10"
                  fill="#EEF3F7"
                />
                <path
                  d="M143 92 C163 70 183 100 204 72 S229 84 238 65"
                  fill="none"
                  stroke={C.amber}
                  strokeWidth="4"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - easeOut((frame - 28) / 28)}
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function EvidenceField({ frame }: { frame: number }) {
  const gather = smoothStep((frame - 78) / 26);
  const fade = smoothStep((frame - 100) / 10);
  const stages = [
    { x: 94, y: 116, start: 4, label: "Capture real evidence" },
    { x: 902, y: 116, start: 18, label: "Review the explanation" },
    { x: 902, y: 466, start: 32, label: "Align narration and visuals" },
    { x: 94, y: 466, start: 46, label: "Validate and render" },
  ] as const;
  const stageTransform = (index: number) => {
    const stage = stages[index];
    const enter = easeOut((frame - stage.start) / 14);
    const x = stage.x + (520 - stage.x) * gather;
    const y = stage.y + (302 - stage.y) * gather;
    const scale = (0.9 + enter * 0.1) * (1 - gather * 0.72);
    return {
      enter,
      transform: `translate(${x} ${y}) scale(${scale})`,
    };
  };
  const pathProgress = [
    easeOut((frame - 13) / 15),
    easeOut((frame - 27) / 15),
    easeOut((frame - 41) / 15),
  ];
  const activeDot = Math.min(1, Math.max(0, (frame - 12) / 46));
  const dotPoints = [
    { x: 340, y: 188 },
    { x: 902, y: 188 },
    { x: 902, y: 500 },
    { x: 340, y: 500 },
  ];
  const dotSegment = Math.min(2, Math.floor(activeDot * 3));
  const dotLocal = activeDot * 3 - dotSegment;
  const dotFrom = dotPoints[dotSegment];
  const dotTo = dotPoints[dotSegment + 1];
  const dotX = dotFrom.x + (dotTo.x - dotFrom.x) * dotLocal;
  const dotY = dotFrom.y + (dotTo.y - dotFrom.y) * dotLocal;

  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <g opacity={(1 - fade) * (1 - gather)}>
        <path
          d="M340 188 H902"
          fill="none"
          stroke="rgba(120,220,244,.34)"
          strokeWidth="3"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - pathProgress[0]}
        />
        <path
          d="M902 188 V500"
          fill="none"
          stroke="rgba(84,185,242,.34)"
          strokeWidth="3"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - pathProgress[1]}
        />
        <path
          d="M902 500 H340"
          fill="none"
          stroke="rgba(82,211,160,.34)"
          strokeWidth="3"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - pathProgress[2]}
        />
        <circle
          cx={dotX}
          cy={dotY}
          r="7"
          fill={C.amber}
          opacity={easeOut((frame - 12) / 8)}
        />
      </g>

      {(() => {
        const stage = stageTransform(0);
        const typeProgress = easeOut((frame - 9) / 25);
        const click = smoothStep((frame - 20) / 8);
        return (
          <g opacity={stage.enter * (1 - fade)} transform={stage.transform}>
            <text
              x="0"
              y="-26"
              fill={C.text}
              fontFamily={SANS}
              fontSize="18"
              fontWeight="700"
            >
              Capture real evidence
            </text>
            <rect
              x="0"
              y="0"
              width="164"
              height="104"
              rx="18"
              fill="#101A25"
              stroke={C.green}
              strokeWidth="2"
            />
            <circle cx="17" cy="15" r="4" fill={C.coral} />
            <circle cx="30" cy="15" r="4" fill={C.amber} />
            <circle cx="43" cy="15" r="4" fill={C.green} />
            <text x="16" y="48" fill={C.green} fontFamily={MONO} fontSize="12">
              {`> ${"run skill check".slice(0, Math.floor(typeProgress * 15))}`}
            </text>
            <text
              x="16"
              y="74"
              fill="#9CB1C4"
              fontFamily={MONO}
              fontSize="10"
              opacity={easeOut((frame - 22) / 8)}
            >
              PASS responsive layout
            </text>
            <rect
              x="126"
              y="32"
              width="142"
              height="88"
              rx="18"
              fill="#EEF3F7"
              stroke={C.blue}
              strokeWidth="2"
            />
            <path d="M126 52 H268" stroke="#BED0DE" strokeWidth="2" />
            <circle cx="140" cy="42" r="3.5" fill={C.coral} />
            <rect
              x="144"
              y="68"
              width="46"
              height="9"
              rx="4.5"
              fill="#6D88A1"
            />
            <rect
              x="144"
              y="85"
              width="92"
              height="7"
              rx="3.5"
              fill="#C1CFD9"
            />
            <rect
              x="144"
              y="99"
              width="70"
              height="7"
              rx="3.5"
              fill="#C1CFD9"
            />
            <circle
              cx={228 - click * 4}
              cy={75 + click * 3}
              r={4 + Math.sin(frame * 0.45) * 1.2}
              fill={C.coral}
            />
          </g>
        );
      })()}

      {(() => {
        const stage = stageTransform(1);
        const line1 = easeOut((frame - 22) / 15);
        const line2 = easeOut((frame - 29) / 15);
        return (
          <g opacity={stage.enter * (1 - fade)} transform={stage.transform}>
            <text
              x="0"
              y="-26"
              fill={C.text}
              fontFamily={SANS}
              fontSize="18"
              fontWeight="700"
            >
              Review the explanation
            </text>
            <g
              transform={`translate(${(1 - stage.enter) * 24} 0) rotate(-5 72 58)`}
            >
              <path
                d="M0 0 H140 L164 24 V116 H0 Z"
                fill="#F4F7F9"
                stroke={C.blue}
                strokeWidth="2"
              />
              <path
                d="M140 0 V24 H164"
                fill="#DCE8F0"
                stroke={C.blue}
                strokeWidth="2"
              />
              <text
                x="16"
                y="28"
                fill="#25435D"
                fontFamily={MONO}
                fontSize="11"
              >
                EDITORIAL.md
              </text>
              {[0, 1, 2].map((index) => (
                <g key={index} transform={`translate(16 ${50 + index * 20})`}>
                  <circle r="4" fill={index === 0 ? C.blue : C.green} />
                  <rect
                    x="12"
                    y="-3"
                    width={(94 - index * 12) * line1}
                    height="6"
                    rx="3"
                    fill="#7890A3"
                  />
                </g>
              ))}
            </g>
            <g
              transform={`translate(${104 - (1 - stage.enter) * 28} 24) rotate(5 72 58)`}
            >
              <path
                d="M0 0 H140 L164 24 V116 H0 Z"
                fill="#FFFFFF"
                stroke={C.amber}
                strokeWidth="2"
              />
              <path
                d="M140 0 V24 H164"
                fill="#F9E6BC"
                stroke={C.amber}
                strokeWidth="2"
              />
              <text
                x="16"
                y="28"
                fill="#634A20"
                fontFamily={MONO}
                fontSize="10"
              >
                VISUAL-DESIGN.md
              </text>
              <rect
                x="16"
                y="48"
                width={112 * line2}
                height="8"
                rx="4"
                fill="#A77A31"
              />
              <rect
                x="16"
                y="67"
                width={82 * line2}
                height="7"
                rx="3.5"
                fill="#D6B77A"
              />
              <path
                d="M18 95 l8 8 16-20"
                fill="none"
                stroke={C.green}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - line2}
              />
            </g>
          </g>
        );
      })()}

      {(() => {
        const stage = stageTransform(2);
        const wave = easeOut((frame - 35) / 24);
        const link = easeOut((frame - 45) / 18);
        return (
          <g opacity={stage.enter * (1 - fade)} transform={stage.transform}>
            <text
              x="0"
              y="-26"
              fill={C.text}
              fontFamily={SANS}
              fontSize="18"
              fontWeight="700"
            >
              Align narration and visuals
            </text>
            <path
              d="M0 46 C12 10 24 82 36 46 S60 10 72 46 S96 82 108 46 S132 10 144 46"
              fill="none"
              stroke={C.blue}
              strokeWidth="4"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - wave}
            />
            <rect
              x="166"
              y="18"
              width="116"
              height="56"
              rx="18"
              fill="#112233"
              stroke={C.green}
              strokeWidth="2"
            />
            <circle
              cx="194"
              cy="46"
              r="10"
              fill="none"
              stroke={C.green}
              strokeWidth="3"
            />
            <path
              d="M214 46 H260"
              stroke="#A3BBCD"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M142 46 C158 46 166 46 184 46"
              fill="none"
              stroke={C.amber}
              strokeWidth="3"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - link}
            />
            <circle cx={142 + link * 42} cy="46" r="5" fill={C.amber} />
            <text x="0" y="91" fill="#8FA9BE" fontFamily={MONO} fontSize="11">
              spoken phrase
            </text>
            <text x="180" y="91" fill={C.green} fontFamily={MONO} fontSize="11">
              visual action
            </text>
          </g>
        );
      })()}

      {(() => {
        const stage = stageTransform(3);
        const scan = smoothStep((frame - 50) / 22);
        const render = easeOut((frame - 61) / 15);
        return (
          <g opacity={stage.enter * (1 - fade)} transform={stage.transform}>
            <text
              x="0"
              y="-26"
              fill={C.text}
              fontFamily={SANS}
              fontSize="18"
              fontWeight="700"
            >
              Validate and render
            </text>
            <g opacity={1 - render * 0.55}>
              {[0, 1, 2].map((index) => {
                const row = easeOut((frame - 49 - index * 5) / 10);
                return (
                  <g
                    key={index}
                    transform={`translate(0 ${index * 30})`}
                    opacity={row}
                  >
                    <rect
                      width="164"
                      height="22"
                      rx="8"
                      fill="#111C27"
                      stroke={C.border}
                    />
                    <circle
                      cx="14"
                      cy="11"
                      r="5"
                      fill={scan > (index + 1) / 4 ? C.green : C.amber}
                    />
                    <rect
                      x="28"
                      y="8"
                      width={76 - index * 8}
                      height="6"
                      rx="3"
                      fill="#7890A3"
                    />
                    <path
                      d="M138 11 l5 5 10-12"
                      fill="none"
                      stroke={C.green}
                      strokeWidth="3"
                      opacity={scan > (index + 1) / 4 ? 1 : 0}
                    />
                  </g>
                );
              })}
              <path
                d={`M${scan * 164} -8 V82`}
                stroke={C.blue}
                strokeWidth="3"
                opacity=".7"
              />
            </g>
            <g
              transform={`translate(${154 + (1 - render) * 38} 4) scale(${0.82 + render * 0.18})`}
              opacity={render}
            >
              <rect
                width="128"
                height="76"
                rx="17"
                fill="#EEF3F7"
                stroke={C.green}
                strokeWidth="3"
              />
              <path d="M0 19 H128" stroke="#B7CBD9" strokeWidth="2" />
              <circle cx="64" cy="48" r="15" fill={C.green} />
              <path d="M60 40 l12 8-12 8 Z" fill="#07110D" />
              <text
                x="64"
                y="96"
                textAnchor="middle"
                fill={C.green}
                fontFamily={MONO}
                fontSize="11"
              >
                explainer.mp4
              </text>
            </g>
          </g>
        );
      })()}
    </svg>
  );
}

function Hook() {
  const f = useCurrentFrame();
  const wordmark = easeOut((f - 136) / 8);
  return (
    <Canvas tone={C.blue} base="#070A0E">
      <EvidenceField frame={f} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          display: "grid",
          placeItems: "center",
          transform: `translate(-50%, -50%) translateX(${-wordmark * 112}px)`,
        }}
      >
        <AnimatedSeqvioMark frame={f} />
        <div
          style={{
            position: "absolute",
            left: 194,
            top: "50%",
            color: C.text,
            fontFamily: SANS,
            fontSize: 68,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: 0,
            opacity: wordmark,
            transform: `translateY(-50%) translateX(${(1 - wordmark) * 28}px)`,
            whiteSpace: "nowrap",
          }}
        >
          Seqvio
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 500,
        }}
      >
        <WordReveal
          words={["An", "explainer", "video", "toolkit", "for", "agents"]}
          frame={f}
          start={140}
          direction={1}
          align="center"
          fontSize={48}
          fontWeight={700}
          color="#78DCF4"
          stagger={2}
          duration={6}
        />
      </div>
    </Canvas>
  );
}

function LegacyTaskScene() {
  const f = useCurrentFrame();
  const terminalIn = easeOut((f - 6) / 16);
  const terminalOut = smoothStep((f - 126) / 20);
  const browserIn = easeOut((f - 126) / 20);
  const browse = smoothStep((f - 150) / 62);
  const cursor = smoothStep((f - 150) / 28);
  const targetFocus = easeOut((f - 168) / 8) * (1 - smoothStep((f - 186) / 12));
  const click = easeOut((f - 177) / 7) * (1 - smoothStep((f - 190) / 8));
  const mobileIn = easeOut((f - 205) / 18);
  const evidenceIn = easeOut((f - 224) / 18);
  const terminalRows = [
    {
      text: "$ evaluate html-anything/saas-landing",
      color: C.blue,
      start: 15,
      speed: 0.72,
    },
    {
      text: "topic: SkillBench",
      color: C.amber,
      start: 47,
      speed: 0.65,
    },
    {
      text: "generated: skillbench.html",
      color: C.green,
      start: 67,
      speed: 0.58,
    },
    {
      text: "browser: desktop 1440x900",
      color: C.green,
      start: 87,
      speed: 0.5,
    },
    { text: "browser: mobile 390x844", color: C.green, start: 104, speed: 0.5 },
  ];
  return (
    <Canvas tone={C.blue} base="#070A0E">
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 46,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 34,
          fontWeight: 760,
          color: C.text,
          opacity: easeOut((f - 4) / 14),
        }}
      >
        Evaluate a real agent skill
      </div>

      <div
        style={{
          position: "absolute",
          left: 130,
          top: 112,
          width: 1020,
          height: 452,
          borderRadius: 26,
          overflow: "hidden",
          background: "#0D151E",
          border: "1px solid #29415A",
          boxShadow: "0 28px 76px rgba(0,0,0,.32)",
          opacity: terminalIn * (1 - terminalOut),
          transform: `translateY(${(1 - terminalIn) * 24}px) scale(${1 - terminalOut * 0.04})`,
        }}
      >
        <div
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            gap: 9,
            borderBottom: "1px solid #24384D",
            background: "#121C27",
          }}
        >
          {[C.coral, C.amber, C.green].map((color) => (
            <span
              key={color}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
              }}
            />
          ))}
          <span
            style={{
              marginLeft: 14,
              fontFamily: MONO,
              fontSize: 14,
              color: C.muted,
            }}
          >
            html-anything / saas-landing / SKILL.md
          </span>
        </div>
        <div
          style={{
            padding: "28px 40px",
            fontFamily: MONO,
            fontSize: 19,
            lineHeight: 1.72,
          }}
        >
          {terminalRows.map((row) => {
            const typeStart = row.start + 3;
            const value = typedText(row.text, f, typeStart, row.speed);
            const lineEnd = typeStart + row.text.length * row.speed;
            const focusIn = easeOut((f - row.start) / 10);
            const focusOut = smoothStep((f - lineEnd - 3) / 10);
            const focusOpacity = focusIn * (1 - focusOut);
            return (
              <div
                key={row.text}
                style={{
                  height: 41,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  marginLeft: -12,
                  borderRadius: 9,
                  color: row.color,
                  background:
                    row.color === C.blue
                      ? `rgba(85,180,255,${focusOpacity * 0.1})`
                      : `rgba(74,211,155,${focusOpacity * 0.09})`,
                  opacity: f >= row.start ? 1 : 0,
                  transform: `scale(${1.12 - focusIn * 0.12})`,
                  transformOrigin: "left center",
                  boxShadow: `0 0 ${18 * focusOpacity}px ${row.color}33`,
                }}
              >
                {value}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 118,
          top: 102,
          width: 1044,
          height: 522,
          borderRadius: 26,
          overflow: "hidden",
          background: "#F4F5F7",
          border: "1px solid #90A6B9",
          boxShadow: "0 30px 84px rgba(0,0,0,.3)",
          opacity: browserIn,
          transform: `translateY(${(1 - browserIn) * 34}px) scale(${0.94 + browserIn * 0.06})`,
        }}
      >
        <div
          style={{
            height: 46,
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            background: "#DCE6EE",
            borderBottom: "1px solid #B7C7D4",
          }}
        >
          <div
            style={{
              width: 600,
              height: 26,
              margin: "0 auto",
              borderRadius: 13,
              background: "#F8FAFC",
              color: "#688095",
              fontFamily: MONO,
              fontSize: 13,
              display: "grid",
              placeItems: "center",
            }}
          >
            file:///skillbench.html
          </div>
        </div>
        <div
          style={{
            position: "relative",
            height: 476,
            color: C.ink,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translateY(${-browse * 48}px) scale(${1 + targetFocus * 0.12})`,
              transformOrigin: "74% 54%",
            }}
          >
            <img
              src={skillBenchDesktop}
              alt="Generated SkillBench page"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              right: 26,
              bottom: 24,
              width: 160,
              height: 346,
              borderRadius: 22,
              overflow: "hidden",
              border: "5px solid #101820",
              background: "#F4F5F7",
              boxShadow: "0 18px 45px rgba(7,10,14,.28)",
              opacity: mobileIn,
              transform: `translateY(${(1 - mobileIn) * 28}px) scale(${0.86 + mobileIn * 0.14})`,
            }}
          >
            <img
              src={skillBenchMobile}
              alt="Generated SkillBench mobile page"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 760 - cursor * 126,
              top: 242 + cursor * 72,
              width: 0,
              height: 0,
              borderLeft: "13px solid #102131",
              borderTop: "22px solid transparent",
              transform: "rotate(-35deg)",
              filter: "drop-shadow(0 2px 2px rgba(255,255,255,.85))",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 600,
              top: 294,
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: `4px solid ${C.coral}`,
              opacity: click,
              transform: `scale(${0.3 + click * 0.7})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 178,
          right: 178,
          bottom: 30,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: evidenceIn,
        }}
      >
        {[
          "8/8 sections",
          "0 px overflow",
          "Menu + FAQ",
          "0 console errors",
        ].map((label, index) => (
          <span
            key={label}
            style={{
              flex: 1,
              color: C.text,
              fontFamily: MONO,
              fontSize: 13,
              textAlign: "center",
              opacity: easeOut((f - 226 - index * 6) / 10),
            }}
          >
            <strong style={{ color: C.green }}>✓</strong> {label}
          </span>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 4,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 22,
          fontWeight: 700,
          color: C.green,
          opacity: easeOut((f - 256) / 12),
        }}
      >
        From skill execution to browser evidence
      </div>
    </Canvas>
  );
}

function RecordedMedia({
  src,
  frame,
  light = false,
}: {
  src: string;
  frame: number;
  light?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 88,
        top: 82,
        width: 1104,
        height: 621,
        borderRadius: 26,
        overflow: "hidden",
        background: light ? "#F4F7FA" : "#111",
        border: `1px solid ${light ? "#9AABBA" : "#34495E"}`,
        boxShadow: "0 32px 90px rgba(0,0,0,.34)",
      }}
    >
      <video
        src={src}
        muted
        playsInline
        data-seqvio-seekable-media="true"
        data-seqvio-media-frame={Math.max(0, frame)}
        data-seqvio-media-fps={FPS}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}

function TaskScene() {
  const f = useCurrentFrame();
  const claudeOut = smoothStep((f - 150) / 20);
  const browserIn = easeOut((f - 146) / 22);
  const proofIn = easeOut((f - 326) / 18);
  const browserFrame = Math.min(270, Math.max(0, (f - 154) * 2.15));
  const browserTheme = smoothStep((f - 138) / 34);
  const taskBackground = mixHex("#05080C", "#EDF2F5", browserTheme);
  const taskText = mixHex(C.text, C.ink, browserTheme);
  return (
    <Canvas tone={browserTheme < 0.5 ? C.blue : C.green} base={taskBackground}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 28,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 28,
          fontWeight: 760,
          color: taskText,
        }}
      >
        A real skill evaluation from task to evidence
      </div>
      <div
        style={{
          opacity: 1 - claudeOut,
          transform: `scale(${1 + claudeOut * 0.025})`,
          position: "absolute",
          left: 88,
          top: 82,
          width: 1104,
          height: 621,
          borderRadius: 26,
          overflow: "hidden",
          border: "1px solid #34495E",
          boxShadow: "0 32px 90px rgba(0,0,0,.34)",
        }}
      >
        <div style={{ transform: "scale(.8625)", transformOrigin: "top left" }}>
          <TerminalXtermDemo
            id="claude-product-hunt"
            title="Claude Code"
            events={CLAUDE_EVENTS}
            width={1280}
            height={720}
            cols={116}
            rows={28}
            maxLines={300}
            presentation="minimal"
            windowChrome={false}
            typingCps={90}
            cursorBlink
            zoomOnInput
            maxZoom={1.72}
            zoomTransitionMs={420}
            zoomHoldMs={520}
          />
        </div>
      </div>
      <div
        style={{
          opacity: browserIn,
          transform: `scale(${0.97 + browserIn * 0.03})`,
        }}
      >
        <RecordedMedia src={browserEvidenceVideo} frame={browserFrame} light />
      </div>
      <div
        style={{
          position: "absolute",
          left: 128,
          right: 128,
          bottom: 14,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          opacity: proofIn,
        }}
      >
        {[
          "8/8 sections",
          "0 px overflow",
          "Menu + FAQ",
          "0 console errors",
        ].map((label, index) => (
          <div
            key={label}
            style={{
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              background: "#102033",
              color: C.text,
              fontFamily: MONO,
              fontSize: 12,
              opacity: easeOut((f - 326 - index * 5) / 12),
              transform: `translateY(${(1 - easeOut((f - 326 - index * 5) / 12)) * 12}px)`,
            }}
          >
            <span>
              <strong style={{ color: C.green }}>✓</strong> {label}
            </span>
          </div>
        ))}
      </div>
    </Canvas>
  );
}

function ReviewScene() {
  const f = useCurrentFrame();
  const enter = easeOut((f - 12) / 22);
  const activeProof = Math.min(3, Math.max(0, Math.floor((f - 88) / 25)));
  const reviewProgress = smoothStep((f - 88) / 76);
  const locked = easeOut((f - 158) / 22);
  const settle = smoothStep((f - 150) / 28);
  return (
    <Canvas tone={C.amber} base="#EDF2F5">
      <Window
        title="editorial.md"
        style={{
          left: 124,
          top: 100,
          width: 580,
          height: 520,
          opacity: enter,
          transform: `translateX(${(1 - enter) * -60}px) rotate(${-2 + settle * 2}deg)`,
        }}
      >
        <div
          style={{
            padding: 40,
            fontFamily: MONO,
            fontSize: 16,
            lineHeight: 1.8,
          }}
        >
          <div style={{ color: C.blue, fontWeight: 700 }}>
            Control the story
          </div>
          <div style={{ marginTop: 12 }}>
            Turn technical work into a story people can follow.
          </div>
          <div style={{ marginTop: 36, color: C.muted }}>Audience</div>
          <div style={{ marginTop: 8, color: C.blue }}>
            developers / educators / agents
          </div>
          <div style={{ marginTop: 36, color: C.muted }}>Pacing</div>
          <div style={{ marginTop: 8, color: C.green }}>
            value → demo → proof → call to action
          </div>
        </div>
      </Window>
      <Window
        title="visual-design.md"
        style={{
          right: 124,
          top: 100,
          width: 580,
          height: 520,
          opacity: enter,
          transform: `translateX(${(1 - enter) * 60}px) rotate(${2 - settle * 2}deg)`,
        }}
      >
        <div
          style={{
            position: "relative",
            padding: 40,
            fontFamily: MONO,
            fontSize: 16,
          }}
        >
          <div style={{ color: C.amber, fontWeight: 700 }}>
            Choose the proof
          </div>
          {[
            "Whiteboard / concept",
            "Architecture / system",
            "Browser / evidence",
            "Motion / result",
          ].map((label, index) => (
            <div
              key={label}
              style={{
                marginTop: 25,
                padding: "15px 17px",
                borderRadius: 17,
                color: C.ink,
                border: `2px solid ${
                  activeProof === index && f >= 88 && f < 176
                    ? [C.blue, C.green, C.amber, C.coral][index]
                    : "transparent"
                }`,
                background:
                  activeProof === index && f >= 88 && f < 176
                    ? `${[C.blue, C.green, C.amber, C.coral][index]}16`
                    : "rgba(255,255,255,.035)",
                opacity: easeOut((f - 46 - index * 18) / 14),
                transform: `translateX(${activeProof === index && f >= 88 && f < 176 ? 10 : 0}px)`,
              }}
            >
              <span
                style={{
                  color: [C.blue, C.green, C.amber, C.coral][index],
                  marginRight: 12,
                }}
              >
                ●
              </span>
              {label}
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              right: 18,
              top: 112 + reviewProgress * 220,
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: `3px solid ${C.blue}`,
              background: `${C.blue}22`,
              boxShadow: `0 0 20px ${C.blue}66`,
              opacity: easeOut((f - 82) / 10) * (1 - locked),
            }}
          />
        </div>
      </Window>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 642,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: C.green,
          fontFamily: MONO,
          fontSize: 18,
          opacity: locked,
          transform: `translateX(-50%) translateY(${(1 - locked) * 14}px)`,
        }}
      >
        <span style={{ fontSize: 24 }}>✓</span>
        Story locked
      </div>
    </Canvas>
  );
}

function ReviewSceneV2() {
  const f = useCurrentFrame();
  const enter = easeOut((f - 8) / 18);
  const treatmentIn = easeOut((f - 108) / 20);
  const compile = smoothStep((f - 166) / 28);
  const story = [
    {
      kicker: "Task",
      title: "Generate from one topic",
      treatment: "Claude session",
      color: C.blue,
    },
    {
      kicker: "Result",
      title: "Complete landing page",
      treatment: "Desktop reveal",
      color: C.amber,
    },
    {
      kicker: "Verification",
      title: "Test responsive states",
      treatment: "Browser focus",
      color: C.coral,
    },
    {
      kicker: "Conclusion",
      title: "Review the evidence",
      treatment: "Evidence summary",
      color: C.green,
    },
  ];

  return (
    <Canvas tone={C.amber} base="#EDF2F5">
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 46,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 31,
          fontWeight: 740,
          color: C.ink,
          opacity: enter,
        }}
      >
        Review the story before it becomes video
      </div>

      <div
        style={{
          position: "absolute",
          left: 78,
          top: 104,
          width: 1124,
          height: 476,
          borderRadius: 24,
          overflow: "hidden",
          background: "#F9FBFC",
          border: "1px solid #C9D5DE",
          boxShadow: "0 24px 64px rgba(38,57,75,.15)",
          opacity: enter * (1 - compile),
          transform: `translateY(${(1 - enter) * 28}px) scale(${1 - compile * 0.12})`,
        }}
      >
        <div
          style={{
            height: 60,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "0 24px",
            borderBottom: "1px solid #D7E0E6",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 14,
              fontWeight: 760,
              color: C.blue,
            }}
          >
            EDITORIAL.md
          </span>
          {[
            "Audience · skill authors and reviewers",
            "Thesis · one topic becomes verifiable output",
            "Omit · setup noise",
          ].map((label, index) => {
            const itemIn = easeOut((f - 22 - index * 8) / 12);
            return (
              <span
                key={label}
                style={{
                  padding: "7px 11px",
                  borderRadius: 9,
                  background: index === 1 ? `${C.blue}13` : "#EEF3F6",
                  color: index === 1 ? C.blue : "#587084",
                  fontFamily: MONO,
                  fontSize: 10.5,
                  opacity: itemIn,
                  transform: `translateY(${(1 - itemIn) * 7}px)`,
                }}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div
          style={{
            position: "absolute",
            left: 25,
            right: 25,
            top: 82,
            height: 250,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
          }}
        >
          {story.map((item, index) => {
            const cardIn = easeOut((f - 38 - index * 22) / 15);
            const active =
              easeOut((f - 42 - index * 22) / 8) *
              (1 - smoothStep((f - 70 - index * 22) / 13));
            return (
              <div
                key={item.kicker}
                style={{
                  position: "relative",
                  minWidth: 0,
                  borderRadius: 17,
                  overflow: "hidden",
                  background: "#FFFFFF",
                  border: `2px solid ${active > 0.08 ? item.color : "#D6E0E7"}`,
                  boxShadow:
                    active > 0.08 ? `0 14px 32px ${item.color}22` : "none",
                  opacity: cardIn,
                  transform: `translateY(${(1 - cardIn) * 20}px) scale(${0.96 + cardIn * 0.04 + active * 0.035})`,
                }}
              >
                <div
                  style={{
                    height: 144,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {index === 0 && (
                    <div style={{ padding: "18px 16px", fontFamily: MONO }}>
                      <div style={{ fontSize: 10, color: "#718699" }}>
                        SKILL.md
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          padding: "10px 11px",
                          borderRadius: 9,
                          background: "#EAF4FB",
                          color: C.blue,
                          fontSize: 11,
                        }}
                      >
                        html-anything / saas-landing
                      </div>
                      <div
                        style={{ marginTop: 13, color: C.ink, fontSize: 13 }}
                      >
                        topic: <strong>SkillBench</strong>
                      </div>
                    </div>
                  )}
                  {index === 1 && (
                    <img
                      src={skillBenchDesktop}
                      alt="Generated SkillBench landing page"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top",
                        display: "block",
                      }}
                    />
                  )}
                  {index === 2 && (
                    <div style={{ position: "absolute", inset: 12 }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 8,
                          width: 174,
                          height: 108,
                          borderRadius: 9,
                          overflow: "hidden",
                          border: "2px solid #AFC0CD",
                        }}
                      >
                        <img
                          src={skillBenchDesktop}
                          alt="Desktop verification"
                          style={{ width: "100%", display: "block" }}
                        />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 20,
                          width: 54,
                          height: 103,
                          borderRadius: 10,
                          overflow: "hidden",
                          border: `3px solid ${C.coral}`,
                          background: "#fff",
                        }}
                      >
                        <img
                          src={skillBenchMobile}
                          alt="Mobile verification"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          left: 140,
                          top: 72,
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          border: `3px solid ${C.coral}`,
                          transform: `scale(${0.84 + active * 0.35})`,
                        }}
                      />
                    </div>
                  )}
                  {index === 3 && (
                    <div
                      style={{
                        padding: "15px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 9,
                      }}
                    >
                      {[
                        "8/8 sections",
                        "Desktop + mobile",
                        "Menu + FAQ",
                        "0 errors",
                      ].map((check, checkIndex) => (
                        <div
                          key={check}
                          style={{
                            minHeight: 48,
                            padding: "7px",
                            borderRadius: 9,
                            background: "#EAF7F1",
                            color: "#176C4C",
                            fontFamily: MONO,
                            fontSize: 9.5,
                            opacity: easeOut((f - 106 - checkIndex * 5) / 10),
                          }}
                        >
                          <strong style={{ color: C.green }}>✓</strong> {check}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    padding: "13px 15px 14px",
                    borderTop: "1px solid #E1E8ED",
                  }}
                >
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: item.color,
                    }}
                  >
                    {item.kicker}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      color: C.ink,
                      fontFamily: SANS,
                      fontSize: 14,
                      fontWeight: 720,
                    }}
                  >
                    {item.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <svg
          width="1074"
          height="250"
          viewBox="0 0 1074 250"
          style={{
            position: "absolute",
            left: 25,
            top: 82,
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2].map((index) => {
            const draw = smoothStep((f - 52 - index * 22) / 18);
            return (
              <g key={index} opacity={draw}>
                <path
                  d={`M${257 + index * 273} 124 H${277 + index * 273}`}
                  stroke={story[index + 1].color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - draw}
                />
                <path
                  d={`M${270 + index * 273} 117 L${279 + index * 273} 124 L${270 + index * 273} 131`}
                  fill="none"
                  stroke={story[index + 1].color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            left: 25,
            right: 25,
            bottom: 22,
            height: 80,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 18px",
            borderRadius: 15,
            background: "#EEF3F6",
            opacity: treatmentIn,
            transform: `translateY(${(1 - treatmentIn) * 15}px)`,
          }}
        >
          <span
            style={{
              flex: "0 0 142px",
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 760,
              color: C.amber,
            }}
          >
            VISUAL-DESIGN.md
          </span>
          {story.map((item, index) => (
            <div
              key={item.treatment}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 10px",
                borderRadius: 10,
                background: "#FFFFFF",
                border: `1px solid ${item.color}55`,
                opacity: easeOut((f - 116 - index * 7) / 12),
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  flex: "0 0 auto",
                  borderRadius: "50%",
                  background: item.color,
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  color: C.ink,
                  fontFamily: MONO,
                  fontSize: 10.5,
                }}
              >
                {item.treatment}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 202,
          width: 500,
          height: 250,
          marginLeft: -250,
          borderRadius: 24,
          padding: 30,
          background: "#F9FBFC",
          border: `2px solid ${C.green}`,
          boxShadow: `0 28px 80px rgba(38,57,75,.2), 0 0 38px ${C.green}18`,
          opacity: compile,
          transform: `scale(${0.78 + compile * 0.22})`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 760,
            color: C.green,
          }}
        >
          ExplainerDocument
        </div>
        <div style={{ marginTop: 25, display: "grid", gap: 18 }}>
          {["narration cues", "visual targets", "evidence references"].map(
            (label, index) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: easeOut((f - 172 - index * 6) / 10),
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: [C.blue, C.green, C.amber][index],
                  }}
                />
                <span
                  style={{
                    width: 86 + index * 31,
                    height: 7,
                    borderRadius: 4,
                    background: [C.blue, C.green, C.amber][index],
                    opacity: 0.72,
                  }}
                />
                <span style={{ fontFamily: MONO, fontSize: 14, color: C.ink }}>
                  {label}
                </span>
              </div>
            ),
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 48,
          display: "flex",
          justifyContent: "center",
          gap: 32,
          fontFamily: MONO,
          fontSize: 15,
        }}
      >
        {[
          "Editorial reviewed",
          "Visual direction approved",
          "ExplainerDocument ready",
        ].map((label, index) => {
          const done = easeOut((f - 184 - index * 7) / 12);
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                color: C.ink,
                opacity: done,
                transform: `translateY(${(1 - done) * 10}px)`,
              }}
            >
              <span
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: C.green,
                  color: "#07130F",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                ✓
              </span>
              {label}
            </div>
          );
        })}
      </div>
    </Canvas>
  );
}

function WhiteboardAnimation({ frame }: { frame: number }) {
  const task = easeOut((frame - 4) / 12);
  const evidenceLine = smoothStep((frame - 18) / 16);
  const evidence = easeOut((frame - 29) / 14);
  const storyLine = smoothStep((frame - 40) / 16);
  const story = easeOut((frame - 51) / 14);
  const scenesLine = smoothStep((frame - 62) / 16);
  const scenes = easeOut((frame - 73) / 14);
  const emphasis = smoothStep((frame - 88) / 16);
  const penPhase =
    frame < 40
      ? { progress: evidenceLine, x1: 290, y1: 232, x2: 458, y2: 143 }
      : frame < 62
        ? { progress: storyLine, x1: 290, y1: 251, x2: 478, y2: 251 }
        : { progress: scenesLine, x1: 290, y1: 272, x2: 478, y2: 354 };
  const penX = penPhase.x1 + (penPhase.x2 - penPhase.x1) * penPhase.progress;
  const penY = penPhase.y1 + (penPhase.y2 - penPhase.y1) * penPhase.progress;
  const penOpacity =
    easeOut((frame - 16) / 6) * (1 - smoothStep((frame - 80) / 8));

  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <pattern
          id="whiteboard-dots"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.4" fill="#B8C7D7" opacity="0.42" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="920" height="470" fill="url(#whiteboard-dots)" />

      <g
        opacity={task}
        transform={`translate(190 250) scale(${0.9 + task * 0.1}) translate(-190 -250)`}
      >
        <rect x="92" y="196" width="196" height="108" rx="22" fill="#FFF0A8" />
        <path
          d="M104 210 L276 204 L282 292 L98 298 Z"
          fill="none"
          stroke="#D9A72E"
          strokeWidth="3"
          opacity="0.62"
        />
        <text
          x="190"
          y="246"
          textAnchor="middle"
          fontFamily={HAND}
          fontSize="25"
          fontWeight="400"
          fill={C.ink}
        >
          Agent task
        </text>
        <text
          x="190"
          y="274"
          textAnchor="middle"
          fontFamily={HAND}
          fontSize="18"
          fontWeight="400"
          fill="#526476"
        >
          explain this workflow
        </text>
      </g>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M290 232 C360 196 386 151 458 143"
          stroke="#9DB4C9"
          strokeWidth="8"
          opacity="0.22"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - evidenceLine}
        />
        <path
          d="M290 232 C360 196 386 151 458 143"
          stroke={C.blue}
          strokeWidth="4"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - evidenceLine}
        />
        <path
          d="M290 251 C370 251 396 251 478 251"
          stroke="#9DB4C9"
          strokeWidth="8"
          opacity="0.22"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - storyLine}
        />
        <path
          d="M290 251 C370 251 396 251 478 251"
          stroke={C.amber}
          strokeWidth="4"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - storyLine}
        />
        <path
          d="M290 272 C358 309 402 346 478 354"
          stroke="#9DB4C9"
          strokeWidth="8"
          opacity="0.22"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - scenesLine}
        />
        <path
          d="M290 272 C358 309 402 346 478 354"
          stroke={C.green}
          strokeWidth="4"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - scenesLine}
        />
      </g>

      {[
        {
          x: 464,
          y: 102,
          w: 184,
          h: 82,
          color: C.blue,
          label: "Evidence",
          progress: evidence,
        },
        {
          x: 484,
          y: 210,
          w: 202,
          h: 82,
          color: C.amber,
          label: "Story beats",
          progress: story,
        },
        {
          x: 484,
          y: 316,
          w: 224,
          h: 82,
          color: C.green,
          label: "Video scenes",
          progress: scenes,
        },
      ].map((note) => (
        <g
          key={note.label}
          opacity={note.progress}
          transform={`translate(${note.x + note.w / 2} ${note.y + note.h / 2}) scale(${0.92 + note.progress * 0.08}) translate(${-note.x - note.w / 2} ${-note.y - note.h / 2})`}
        >
          <rect
            x={note.x}
            y={note.y}
            width={note.w}
            height={note.h}
            rx="20"
            fill="#FFFFFF"
            stroke={note.color}
            strokeWidth="3"
          />
          <path
            d={`M${note.x + 12} ${note.y + 10} L${note.x + note.w - 10} ${note.y + 6}`}
            stroke={note.color}
            strokeWidth="2"
            opacity="0.3"
            strokeLinecap="round"
          />
          <circle
            cx={note.x + 24}
            cy={note.y + note.h / 2}
            r="7"
            fill={note.color}
          />
          <text
            x={note.x + 44}
            y={note.y + note.h / 2 + 7}
            fontFamily={HAND}
            fontSize="24"
            fontWeight="400"
            fill={C.ink}
          >
            {note.label}
          </text>
        </g>
      ))}

      <path
        d="M470 306 C540 292 694 298 732 344 C754 380 700 421 602 420 C510 419 450 391 458 348 C462 328 478 315 500 307"
        fill="none"
        stroke={C.blue}
        strokeWidth="5"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - emphasis}
        opacity={emphasis}
      />
      <path
        d="M516 410 C564 416 632 416 681 408"
        fill="none"
        stroke={C.blue}
        strokeWidth="7"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - emphasis}
        opacity={emphasis}
      />
      <g
        opacity={penOpacity}
        transform={`translate(${penX} ${penY}) rotate(-42)`}
      >
        <rect x="-4" y="-22" width="8" height="30" rx="4" fill="#324B61" />
        <path d="M-4 8 L0 16 L4 8 Z" fill={C.blue} />
      </g>
    </svg>
  );
}

function AnimatedArrowPath({
  d,
  progress,
  tipX,
  tipY,
  angle,
  color = "#7892AA",
  strokeWidth = 3,
}: {
  d: string;
  progress: number;
  tipX: number;
  tipY: number;
  angle: number;
  color?: string;
  strokeWidth?: number;
}) {
  const head = easeOut((progress - 0.82) / 0.18);
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - progress}
        opacity={progress}
      />
      <path
        d="M0 0 L-10 -6 L-8 0 L-10 6 Z"
        fill={color}
        opacity={head}
        transform={`translate(${tipX} ${tipY}) rotate(${angle}) scale(${0.72 + head * 0.28})`}
      />
    </g>
  );
}

function ArchitectureDiagram({ frame }: { frame: number }) {
  const agent = easeOut((frame - 4) / 11);
  const evidence = easeOut((frame - 12) / 11);
  const inputLinks = smoothStep((frame - 20) / 14);
  const runtime = easeOut((frame - 27) / 13);
  const story = easeOut((frame - 37) / 11);
  const graph = easeOut((frame - 45) / 11);
  const timeline = easeOut((frame - 53) / 12);
  const media = easeOut((frame - 61) / 11);
  const validation = easeOut((frame - 68) / 10);
  const internalLinks = smoothStep((frame - 48) / 28);
  const renderer = easeOut((frame - 76) / 12);
  const qa = easeOut((frame - 85) / 11);
  const outputLinks = smoothStep((frame - 78) / 20);
  const output = easeOut((frame - 96) / 12);
  const pulse = clamp((frame - 99) / 11);
  const pulseOpacity = pulse * (1 - smoothStep((frame - 108) / 4));

  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <pattern
          id="architecture-grid"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M22 0 H0 V22"
            fill="none"
            stroke="#D7E1EA"
            strokeWidth="1"
            opacity="0.55"
          />
        </pattern>
      </defs>
      <rect
        x="0"
        y="0"
        width="920"
        height="470"
        fill="url(#architecture-grid)"
      />

      <AnimatedArrowPath
        d="M194 174 H234"
        progress={inputLinks}
        tipX={244}
        tipY={174}
        angle={0}
      />
      <AnimatedArrowPath
        d="M178 315 C210 315 210 346 234 346"
        progress={smoothStep((frame - 26) / 14)}
        tipX={244}
        tipY={346}
        angle={0}
      />

      <g opacity={agent}>
        <rect
          x="42"
          y="140"
          width="152"
          height="68"
          rx="19"
          fill="#FFFFFF"
          stroke={C.blue}
          strokeWidth="3"
        />
        <circle cx="68" cy="174" r="12" fill={C.blue} opacity="0.18" />
        <path d="M62 174 L68 168 L74 174 L68 180 Z" fill={C.blue} />
        <text
          x="126"
          y="180"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="17"
          fontWeight="700"
          fill={C.ink}
        >
          Coding agent
        </text>
      </g>

      <g opacity={evidence}>
        <path
          d="M58 272 H150 L178 300 V350 H58 Z"
          fill="#FFFFFF"
          stroke={C.blue}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M150 272 V300 H178"
          fill="#EAF5FD"
          stroke={C.blue}
          strokeWidth="3"
        />
        <line
          x1="80"
          y1="307"
          x2="148"
          y2="307"
          stroke="#9CB1C4"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="80"
          y1="325"
          x2="132"
          y2="325"
          stroke="#9CB1C4"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <text
          x="118"
          y="372"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="16"
          fontWeight="700"
          fill={C.ink}
        >
          Evidence
        </text>
      </g>

      <g opacity={runtime}>
        <rect
          x="244"
          y="88"
          width="386"
          height="302"
          rx="30"
          fill="#F8FBFE"
          stroke={C.coral}
          strokeWidth="3"
        />
        <rect x="260" y="104" width="7" height="34" rx="4" fill={C.coral} />
        <text
          x="279"
          y="129"
          fontFamily={SANS}
          fontSize="19"
          fontWeight="700"
          fill={C.ink}
        >
          Seqvio runtime
        </text>
        <text
          x="598"
          y="127"
          textAnchor="end"
          fontFamily={MONO}
          fontSize="12"
          fill="#7892AA"
        >
          deterministic
        </text>
      </g>

      <AnimatedArrowPath
        d="M407 184 H447"
        progress={internalLinks}
        tipX={457}
        tipY={184}
        angle={0}
        color="#8CA2B7"
        strokeWidth={2.5}
      />
      <AnimatedArrowPath
        d="M525 219 V239"
        progress={smoothStep((frame - 54) / 20)}
        tipX={525}
        tipY={249}
        angle={90}
        color="#8CA2B7"
        strokeWidth={2.5}
      />
      <AnimatedArrowPath
        d="M388 347 C416 347 412 301 435 301"
        progress={smoothStep((frame - 61) / 20)}
        tipX={445}
        tipY={301}
        angle={0}
        color="#8CA2B7"
        strokeWidth={2.5}
      />
      <AnimatedArrowPath
        d="M565 301 C581 301 579 346 584 346"
        progress={smoothStep((frame - 69) / 18)}
        tipX={594}
        tipY={346}
        angle={0}
        color="#8CA2B7"
        strokeWidth={2.5}
      />

      <g opacity={story}>
        <path
          d="M278 150 H385 L407 172 V219 H278 Z"
          fill="#FFF9E9"
          stroke={C.amber}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M385 150 V172 H407"
          fill="#FFF0C7"
          stroke={C.amber}
          strokeWidth="3"
        />
        <line
          x1="299"
          y1="178"
          x2="373"
          y2="178"
          stroke={C.amber}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <line
          x1="299"
          y1="197"
          x2="352"
          y2="197"
          stroke="#C8A75B"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text
          x="342"
          y="238"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="14"
          fontWeight="700"
          fill={C.ink}
        >
          Story plan
        </text>
      </g>

      <g opacity={graph}>
        <rect
          x="457"
          y="149"
          width="138"
          height="70"
          rx="20"
          fill="#F2F8FD"
          stroke={C.blue}
          strokeWidth="3"
        />
        <path
          d="M483 185 L520 171 L564 190 M520 171 L542 204"
          fill="none"
          stroke="#7892AA"
          strokeWidth="2.5"
        />
        <circle cx="483" cy="185" r="7" fill={C.blue} />
        <circle cx="520" cy="171" r="7" fill={C.amber} />
        <circle cx="564" cy="190" r="7" fill={C.green} />
        <circle cx="542" cy="204" r="7" fill={C.coral} />
        <text
          x="526"
          y="238"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="14"
          fontWeight="700"
          fill={C.ink}
        >
          Scene graph
        </text>
      </g>

      <g opacity={timeline}>
        <rect
          x="445"
          y="255"
          width="150"
          height="78"
          rx="17"
          fill="#FFFFFF"
          stroke="#8399AD"
          strokeWidth="3"
        />
        <text
          x="461"
          y="276"
          fontFamily={SANS}
          fontSize="13"
          fontWeight="700"
          fill={C.ink}
        >
          Timeline
        </text>
        {[C.blue, C.amber, C.green, C.coral, C.blue].map((color, index) => (
          <rect
            key={`${color}-${index}`}
            x={460 + index * 24}
            y={289 + (index % 2) * 8}
            width="18"
            height={26 - (index % 2) * 8}
            rx="5"
            fill={color}
            opacity={easeOut((frame - 55 - index * 5) / 8)}
          />
        ))}
        <line
          x1="460"
          y1="319"
          x2="578"
          y2="319"
          stroke="#C2CFDA"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <g opacity={media}>
        <path
          d="M278 332 C278 321 388 321 388 332 V365 C388 378 278 378 278 365 Z"
          fill="#EEF9F5"
          stroke={C.green}
          strokeWidth="3"
        />
        <ellipse
          cx="333"
          cy="332"
          rx="55"
          ry="13"
          fill="#F8FFFC"
          stroke={C.green}
          strokeWidth="3"
        />
        <text
          x="333"
          y="357"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="14"
          fontWeight="700"
          fill={C.ink}
        >
          Media store
        </text>
      </g>

      <g opacity={validation}>
        <path
          d="M594 313 L627 346 L594 379 L561 346 Z"
          fill="#F0FBF7"
          stroke={C.green}
          strokeWidth="3"
        />
        <path
          d="M580 346 L590 356 L608 336"
          fill="none"
          stroke={C.green}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="594"
          y="388"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="12"
          fontWeight="700"
          fill={C.ink}
        >
          Validation
        </text>
      </g>

      <AnimatedArrowPath
        d="M630 184 H636"
        progress={outputLinks}
        tipX={646}
        tipY={184}
        angle={0}
      />
      <AnimatedArrowPath
        d="M627 346 C650 346 648 306 655 306"
        progress={smoothStep((frame - 86) / 18)}
        tipX={665}
        tipY={306}
        angle={0}
      />

      <g opacity={renderer}>
        <path
          d="M674 150 H724 L777 184 L724 218 H674 L646 184 Z"
          fill="#EFF7FD"
          stroke={C.blue}
          strokeWidth="3"
        />
        <path
          d="M678 176 L689 184 L678 192 M742 176 L731 184 L742 192"
          fill="none"
          stroke={C.blue}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="712"
          y="207"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="14"
          fontWeight="700"
          fill={C.ink}
        >
          Renderer
        </text>
      </g>

      <g opacity={qa}>
        <path
          d="M704 267 L743 306 L704 345 L665 306 Z"
          fill="#FFF9E9"
          stroke={C.amber}
          strokeWidth="3"
        />
        <text
          x="704"
          y="312"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="16"
          fontWeight="800"
          fill={C.ink}
        >
          QA
        </text>
      </g>

      <AnimatedArrowPath
        d="M777 184 C783 184 780 234 780 234"
        progress={smoothStep((frame - 91) / 18)}
        tipX={790}
        tipY={234}
        angle={0}
      />
      <AnimatedArrowPath
        d="M743 306 C768 306 770 272 780 272"
        progress={smoothStep((frame - 96) / 18)}
        tipX={790}
        tipY={272}
        angle={0}
      />

      <g
        opacity={output}
        transform={`translate(840 253) scale(${0.92 + output * 0.08}) translate(-840 -253)`}
      >
        <rect
          x="790"
          y="213"
          width="108"
          height="88"
          rx="18"
          fill="#FFFFFF"
          stroke={C.green}
          strokeWidth="3"
        />
        <rect x="801" y="224" width="86" height="49" rx="10" fill="#EAF9F3" />
        <path d="M836 237 L836 260 L856 248.5 Z" fill={C.green} />
        <text
          x="844"
          y="291"
          textAnchor="middle"
          fontFamily={SANS}
          fontSize="13"
          fontWeight="800"
          fill={C.ink}
        >
          MP4
        </text>
      </g>

      <circle
        cx={650 + pulse * 140}
        cy={184 + pulse * 50}
        r="6"
        fill={C.blue}
        opacity={pulseOpacity}
      />
    </svg>
  );
}

function WorkflowCaptureAnimation({ frame }: { frame: number }) {
  const browser = easeOut((frame - 3) / 13);
  const steps = [18, 30, 42].map((start) => easeOut((frame - start) / 11));
  const cursor = smoothStep((frame - 32) / 28);
  const result = easeOut((frame - 57) / 13);
  const click = smoothStep((frame - 56) / 13);
  const clickOpacity = click * (1 - smoothStep((frame - 66) / 5));
  const filmstrip = easeOut((frame - 76) / 14);
  const scan = clamp((frame - 88) / 19);
  const cursorX = 776 - cursor * 164;
  const cursorY = 166 + cursor * 90;

  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0 }}
    >
      <g
        opacity={browser}
        transform={`translate(460 244) scale(${0.96 + browser * 0.04}) translate(-460 -244)`}
      >
        <rect
          x="54"
          y="82"
          width="812"
          height="334"
          rx="26"
          fill="#0D1824"
          stroke="#31465E"
          strokeWidth="3"
        />
        <path d="M54 126 H866" stroke="#31465E" strokeWidth="2" />
        <circle cx="80" cy="104" r="7" fill={C.coral} />
        <circle cx="103" cy="104" r="7" fill={C.amber} />
        <circle cx="126" cy="104" r="7" fill={C.green} />
        <rect x="160" y="92" width="380" height="24" rx="12" fill="#19283A" />
        <text x="178" y="109" fontFamily={MONO} fontSize="12" fill="#9BB0C6">
          workflow.local/run
        </text>
        <rect
          x="770"
          y="91"
          width="72"
          height="26"
          rx="13"
          fill="rgba(244,118,88,.16)"
          stroke={C.coral}
          strokeWidth="2"
        />
        <circle cx="787" cy="104" r="5" fill={C.coral} />
        <text
          x="814"
          y="109"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="12"
          fontWeight="700"
          fill={C.coral}
        >
          REC
        </text>
      </g>

      <g opacity={browser}>
        <rect x="72" y="143" width="178" height="246" rx="18" fill="#111F2D" />
        <text
          x="92"
          y="170"
          fontFamily={SANS}
          fontSize="14"
          fontWeight="700"
          fill={C.text}
        >
          Workflow
        </text>
        {["Open page", "Run action", "Capture result"].map((label, index) => (
          <g key={label} opacity={steps[index]}>
            <circle
              cx="98"
              cy={207 + index * 58}
              r="13"
              fill={[C.blue, C.amber, C.green][index]}
              opacity="0.2"
            />
            <text
              x="98"
              y={212 + index * 58}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="12"
              fontWeight="700"
              fill={[C.blue, C.amber, C.green][index]}
            >
              {index + 1}
            </text>
            <text
              x="124"
              y={212 + index * 58}
              fontFamily={SANS}
              fontSize="14"
              fontWeight="600"
              fill={C.text}
            >
              {label}
            </text>
          </g>
        ))}
      </g>

      <g opacity={browser}>
        <rect x="270" y="143" width="578" height="246" rx="18" fill="#F4F7FA" />
        <rect x="294" y="166" width="202" height="14" rx="7" fill="#C8D7E5" />
        <rect x="294" y="192" width="128" height="9" rx="5" fill="#D9E3EC" />
        <rect
          x="294"
          y="224"
          width="132"
          height="104"
          rx="17"
          fill="#E8F4FD"
          stroke={C.blue}
          strokeWidth="2"
        />
        <circle cx="330" cy="260" r="14" fill={C.blue} opacity="0.25" />
        <path
          d="M350 260 H394 M372 244 L394 260 L372 276"
          fill="none"
          stroke={C.blue}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="455"
          y="216"
          width="328"
          height="112"
          rx="19"
          fill="#FFFFFF"
          stroke={result ? C.green : "#C8D7E5"}
          strokeWidth={result ? 4 : 2}
        />
        <rect x="480" y="240" width="138" height="12" rx="6" fill="#B8C9D8" />
        <rect x="480" y="266" width="236" height="9" rx="5" fill="#D6E0E9" />
        <rect x="480" y="287" width="190" height="9" rx="5" fill="#D6E0E9" />
        <circle cx="748" cy="248" r="16" fill={C.green} opacity={result} />
        <path
          d="M740 248 L746 254 L756 242"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={result}
        />
      </g>

      <circle
        cx="612"
        cy="256"
        r={12 + click * 28}
        fill="none"
        stroke={C.blue}
        strokeWidth="4"
        opacity={clickOpacity}
      />
      <path
        d={`M${cursorX} ${cursorY} L${cursorX + 5} ${cursorY + 25} L${cursorX + 12} ${cursorY + 17} L${cursorX + 21} ${cursorY + 29} L${cursorX + 27} ${cursorY + 25} L${cursorX + 18} ${cursorY + 13} L${cursorX + 29} ${cursorY + 10} Z`}
        fill="#FFFFFF"
        stroke="#152231"
        strokeWidth="2"
      />

      <g opacity={filmstrip} transform={`translateY(${(1 - filmstrip) * 18})`}>
        <rect x="287" y="348" width="502" height="50" rx="13" fill="#142334" />
        {[0, 1, 2, 3, 4].map((index) => (
          <rect
            key={index}
            x={300 + index * 94}
            y="357"
            width="78"
            height="32"
            rx="8"
            fill={
              ["#23405A", "#2B4D66", "#315A70", "#28604F", "#244A65"][index]
            }
            stroke={index === 3 ? C.green : "#47657E"}
            strokeWidth={index === 3 ? 3 : 1}
          />
        ))}
        <line
          x1={300 + scan * 454}
          y1="351"
          x2={300 + scan * 454}
          y2="395"
          stroke={C.coral}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function VisualCard({ mode, frame }: { mode: number; frame: number }) {
  const p = easeOut(frame / 18);
  const exit = smoothStep((frame - 140) / 10);
  const labels = [
    "Animated whiteboards",
    "Architecture diagrams",
    "Workflow captures",
  ];
  return (
    <div
      style={{
        position: "relative",
        width: 920,
        height: 470,
        borderRadius: 28,
        overflow: "hidden",
        background: mode < 2 ? C.light : "#0C1621",
        color: mode < 2 ? C.ink : C.text,
        opacity: 1 - exit,
        transform: `scale(${1 - exit * 0.025})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 3,
          left: 28,
          top: 24,
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: mode === 0 ? HAND : SANS,
          fontSize: 22,
          fontWeight: mode === 0 ? 400 : 700,
          color: mode < 2 ? C.ink : C.text,
          opacity: p,
        }}
      >
        <span style={{ color: [C.blue, C.amber, C.coral][mode] }}>
          {labels[mode]}
        </span>
      </div>
      {mode === 0 && <WhiteboardAnimation frame={frame} />}
      {mode === 1 && <ArchitectureDiagram frame={frame} />}
      {mode === 2 && <WorkflowCaptureAnimation frame={frame} />}
    </div>
  );
}

function ExportWhiteboard({ frame }: { frame: number }) {
  const topic = easeOut((frame - 4) / 13);
  const firstLine = smoothStep((frame - 19) / 18);
  const page = easeOut((frame - 34) / 14);
  const secondLine = smoothStep((frame - 50) / 18);
  const interaction = easeOut((frame - 65) / 14);
  const click = easeOut((frame - 74) / 8) * (1 - smoothStep((frame - 93) / 11));
  const thirdLine = smoothStep((frame - 82) / 18);
  const evidence = easeOut((frame - 98) / 14);
  const finish = smoothStep((frame - 116) / 16);
  const activeIndex = Math.min(3, Math.max(0, Math.floor((frame - 4) / 31)));
  const nodeScale = (index: number, progress: number) =>
    0.86 + progress * 0.14 + (activeIndex === index ? 0.025 : 0);
  const penPhase =
    frame < 50
      ? { progress: firstLine, x1: 225, x2: 289, y: 222 }
      : frame < 82
        ? { progress: secondLine, x1: 447, x2: 511, y: 222 }
        : { progress: thirdLine, x1: 669, x2: 733, y: 222 };
  const penVisible =
    easeOut((frame - 16) / 5) * (1 - smoothStep((frame - 105) / 8));
  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      style={{ position: "absolute", inset: 0 }}
    >
      <rect width="920" height="470" fill="#EDF2F5" />
      <g
        opacity={topic}
        transform={`translate(126 222) scale(${nodeScale(0, topic)}) translate(-126 -222)`}
      >
        <rect
          x="48"
          y="154"
          width="156"
          height="136"
          rx="22"
          fill="#FFFFFF"
          stroke={C.blue}
          strokeWidth="4"
        />
        <path
          d="M68 182 H184"
          stroke={C.blue}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="72" cy="171" r="5" fill={C.coral} />
        <circle cx="88" cy="171" r="5" fill={C.amber} />
        <circle cx="104" cy="171" r="5" fill={C.green} />
        <text x="68" y="214" fontFamily={MONO} fontSize="11" fill="#6B8193">
          topic
        </text>
        <text
          x="68"
          y="246"
          fontFamily={HAND}
          fontSize="25"
          fontWeight="700"
          fill={C.ink}
        >
          SkillBench
        </text>
        <path
          d="M68 264 H148"
          stroke="#D8E5EE"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M68 276 H132"
          stroke="#D8E5EE"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M171 174 l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z"
          fill={C.amber}
        />
        <text
          x="126"
          y="326"
          textAnchor="middle"
          fontFamily={HAND}
          fontSize="25"
          fill={C.ink}
        >
          One topic
        </text>
      </g>
      <g
        opacity={page}
        transform={`translate(348 222) scale(${nodeScale(1, page)}) translate(-348 -222)`}
      >
        <rect
          x="270"
          y="154"
          width="156"
          height="136"
          rx="18"
          fill="#FFFFFF"
          stroke={C.amber}
          strokeWidth="4"
        />
        <path d="M270 181 H426" stroke={C.amber} strokeWidth="3" />
        <circle cx="286" cy="168" r="4" fill={C.coral} />
        <circle cx="299" cy="168" r="4" fill={C.amber} />
        <circle cx="312" cy="168" r="4" fill={C.green} />
        <rect x="287" y="197" width="124" height="22" rx="7" fill="#EAF4FB" />
        <rect x="287" y="231" width="56" height="42" rx="7" fill="#FFF2D8" />
        <rect x="353" y="231" width="58" height="18" rx="6" fill="#EAF7F1" />
        <rect x="353" y="255" width="58" height="18" rx="6" fill="#FCE8E5" />
        <path
          d="M297 226 H330"
          stroke="#6B8193"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M363 226 H399"
          stroke="#6B8193"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <text
          x="348"
          y="326"
          textAnchor="middle"
          fontFamily={HAND}
          fontSize="25"
          fill={C.ink}
        >
          Complete page
        </text>
      </g>
      <g
        opacity={interaction}
        transform={`translate(570 222) scale(${nodeScale(2, interaction)}) translate(-570 -222)`}
      >
        <rect
          x="496"
          y="160"
          width="126"
          height="91"
          rx="13"
          fill="#FFFFFF"
          stroke={C.coral}
          strokeWidth="4"
        />
        <path d="M496 183 H622" stroke={C.coral} strokeWidth="3" />
        <rect x="510" y="196" width="97" height="16" rx="5" fill="#EAF4FB" />
        <rect x="510" y="220" width="45" height="18" rx="5" fill="#FFF2D8" />
        <rect
          x="610"
          y="190"
          width="45"
          height="83"
          rx="10"
          fill="#FFFFFF"
          stroke={C.coral}
          strokeWidth="4"
        />
        <rect x="620" y="207" width="25" height="11" rx="4" fill="#EAF4FB" />
        <rect x="620" y="225" width="25" height="27" rx="4" fill="#EAF7F1" />
        <circle
          cx="550"
          cy="226"
          r={15 + click * 17}
          fill="none"
          stroke={C.coral}
          strokeWidth="4"
          opacity={click}
        />
        <path d="M542 203 l8 27 7-8 10 12 7-6-10-12 11-4z" fill={C.ink} />
        <rect x="510" y="244" width="30" height="8" rx="4" fill="#EAF7F1" />
        <rect x="546" y="244" width="42" height="8" rx="4" fill="#FFF2D8" />
        <text
          x="570"
          y="326"
          textAnchor="middle"
          fontFamily={HAND}
          fontSize="25"
          fill={C.ink}
        >
          Test interactions
        </text>
      </g>
      <g
        opacity={evidence}
        transform={`translate(792 222) scale(${nodeScale(3, evidence)}) translate(-792 -222)`}
      >
        <rect
          x="718"
          y="154"
          width="148"
          height="136"
          rx="20"
          fill="#FFFFFF"
          stroke={C.green}
          strokeWidth="4"
        />
        {[0, 1, 2].map((index) => (
          <g key={index} opacity={easeOut((frame - 103 - index * 5) / 9)}>
            <circle
              cx="742"
              cy={187 + index * 34}
              r="9"
              fill="#EAF7F1"
              stroke={C.green}
              strokeWidth="2"
            />
            <path
              d={`M737 ${187 + index * 34} l4 4 7-9`}
              fill="none"
              stroke={C.green}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d={`M760 ${187 + index * 34} H${835 - index * 9}`}
              stroke={[C.blue, C.amber, C.coral][index]}
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.68"
            />
          </g>
        ))}
        <rect x="816" y="173" width="34" height="20" rx="10" fill="#EAF7F1" />
        <text
          x="833"
          y="187"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="9"
          fontWeight="700"
          fill={C.green}
        >
          PASS
        </text>
        <text
          x="792"
          y="326"
          textAnchor="middle"
          fontFamily={HAND}
          fontSize="25"
          fill={C.ink}
        >
          Review evidence
        </text>
      </g>
      <g
        opacity={Math.max(firstLine, secondLine, thirdLine)}
        pointerEvents="none"
      >
        <path
          d="M214 222 H264"
          fill="none"
          stroke={C.amber}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - firstLine}
        />
        <path
          d="M261 213 L273 222 L260 232"
          fill="none"
          stroke={C.amber}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={easeOut((firstLine - 0.72) / 0.28)}
        />
        <path
          d="M436 222 H488"
          fill="none"
          stroke={C.green}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - secondLine}
        />
        <path
          d="M485 213 L497 222 L484 232"
          fill="none"
          stroke={C.green}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={easeOut((secondLine - 0.72) / 0.28)}
        />
        <path
          d="M632 222 H710"
          fill="none"
          stroke={C.coral}
          strokeWidth="7"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - thirdLine}
        />
        <path
          d="M707 213 L719 222 L706 232"
          fill="none"
          stroke={C.coral}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={easeOut((thirdLine - 0.72) / 0.28)}
        />
      </g>
      <path
        d="M68 354 C250 375 612 375 850 351"
        fill="none"
        stroke={C.blue}
        strokeWidth="5"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - finish}
        opacity="0.7"
      />
      <g
        opacity={penVisible}
        transform={`translate(${penPhase.x1 + (penPhase.x2 - penPhase.x1) * penPhase.progress} ${penPhase.y}) rotate(-38)`}
      >
        <rect x="-4" y="-22" width="8" height="29" rx="4" fill="#314B62" />
        <path
          d="M-4 7 L0 16 L4 7 Z"
          fill={frame < 50 ? C.amber : frame < 82 ? C.coral : C.green}
        />
      </g>
    </svg>
  );
}

function ExportArchitectureLegacy({ frame }: { frame: number }) {
  const nodes = [8, 24, 40, 56, 72, 88].map((start) =>
    easeOut((frame - start) / 13),
  );
  const links = [19, 35, 51, 67, 83].map((start) =>
    smoothStep((frame - start) / 18),
  );
  const packet = smoothStep((frame - 102) / 28);
  const xs = [92, 245, 398, 551, 704, 848];
  const labels = [
    "Run events",
    "Report builder",
    "Field selection",
    "Sensitive data",
    "JSON output",
    "Download",
  ];
  const colors = [C.blue, C.coral, C.amber, C.green, C.blue, C.green];
  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <pattern
          id="export-arch-grid"
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <path d="M22 0 H0 V22" fill="none" stroke="#D4DFE8" opacity=".56" />
        </pattern>
      </defs>
      <rect width="920" height="470" fill="url(#export-arch-grid)" />
      <path
        d="M92 180 C92 122 245 122 245 180"
        fill="none"
        stroke={C.blue}
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - smoothStep((frame - 12) / 24)}
        opacity=".55"
      />
      <path
        d="M92 290 C92 348 245 348 245 290"
        fill="none"
        stroke={C.amber}
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - smoothStep((frame - 20) / 24)}
        opacity=".7"
      />
      {links.map((progress, index) => (
        <AnimatedArrowPath
          key={index}
          d={`M${xs[index] + 49} 235 H${xs[index + 1] - 49}`}
          progress={progress}
          tipX={xs[index + 1] - 39}
          tipY={235}
          angle={0}
          color={colors[index + 1]}
          strokeWidth={3}
        />
      ))}
      {xs.map((x, index) => (
        <g
          key={labels[index]}
          opacity={nodes[index]}
          transform={`translate(${x} 235) scale(${0.82 + nodes[index] * 0.18})`}
        >
          {index === 0 && (
            <g
              fill="none"
              stroke={colors[index]}
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M-35 -22 H28 M-35 0 H38 M-35 22 H18" />
              <circle cx="-43" cy="-22" r="5" fill={colors[index]} />
              <circle cx="-43" cy="0" r="5" fill={colors[index]} />
              <circle cx="-43" cy="22" r="5" fill={colors[index]} />
            </g>
          )}
          {index === 1 && (
            <g>
              <path
                d="M-44 -42 H44 V42 H-44 Z"
                rx="18"
                fill="#FFF1EC"
                stroke={colors[index]}
                strokeWidth="4"
              />
              <path
                d="M-23 -17 H23 M-23 0 H23 M-23 17 H12"
                stroke={colors[index]}
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          )}
          {index === 2 && (
            <g
              fill="#FFF8E6"
              stroke={colors[index]}
              strokeWidth="4"
              strokeLinejoin="round"
            >
              <path d="M-48 -42 H48 L17 -5 V39 H-17 V-5 Z" />
              <circle
                cx="0"
                cy="-20"
                r="7"
                fill={colors[index]}
                stroke="none"
              />
            </g>
          )}
          {index === 3 && (
            <g
              fill="#EAF9F3"
              stroke={colors[index]}
              strokeWidth="4"
              strokeLinejoin="round"
            >
              <path d="M0 -48 L41 -31 V4 C41 29 22 43 0 52 C-22 43 -41 29 -41 4 V-31 Z" />
              <path
                d="M-19 2 L-6 15 L21 -15"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </g>
          )}
          {index === 4 && (
            <g
              fill="#EAF5FD"
              stroke={colors[index]}
              strokeWidth="4"
              strokeLinejoin="round"
            >
              <path d="M-38 -50 H20 L42 -28 V50 H-38 Z" />
              <path
                d="M20 -50 V-28 H42 M-20 -8 H23 M-20 13 H23 M-20 34 H9"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}
          {index === 5 && (
            <g fill="#EAF9F3" stroke={colors[index]} strokeWidth="4">
              <rect x="-48" y="-39" width="96" height="78" rx="16" />
              <path
                d="M0 -23 V16 M-15 2 L0 18 L15 2 M-23 27 H23"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )}
          <text
            x="0"
            y="82"
            textAnchor="middle"
            fontFamily={SANS}
            fontSize="14"
            fontWeight="700"
            fill={C.ink}
          >
            {labels[index]}
          </text>
        </g>
      ))}
      <circle
        cx={141 + packet * 658}
        cy="235"
        r="8"
        fill={C.amber}
        opacity={
          easeOut((frame - 101) / 8) * (1 - smoothStep((frame - 134) / 8))
        }
      />
    </svg>
  );
}

function SeqvioSystemArchitecture({ frame }: { frame: number }) {
  const revealAt = (start: number) => easeOut((frame - start) / 12);
  const drawAt = (start: number) => smoothStep((frame - start) / 18);
  const pulse = smoothStep((frame - 112) / 26);
  const node = (
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    detail: string,
    color: string,
    start: number,
    kind: "default" | "capture" | "contract" | "output" = "default",
  ) => {
    const show = revealAt(start);
    return (
      <g
        key={title}
        opacity={show}
        transform={`translate(${x + width / 2} ${y + height / 2}) scale(${0.86 + show * 0.14}) translate(${-x - width / 2} ${-y - height / 2})`}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={kind === "contract" ? 18 : 12}
          fill={
            kind === "capture"
              ? "#0E1C29"
              : kind === "contract"
                ? "#F5FAFE"
                : kind === "output"
                  ? "#E9F8F1"
                  : "#FFFFFF"
          }
          stroke={color}
          strokeWidth={kind === "contract" ? 3 : 2}
          strokeDasharray={kind === "capture" ? "5 4" : undefined}
        />
        <circle cx={x + 17} cy={y + 18} r="5" fill={color} />
        <text
          x={x + 29}
          y={y + 22}
          fontFamily={SANS}
          fontSize="13"
          fontWeight="750"
          fill={kind === "capture" ? C.text : C.ink}
        >
          {title}
        </text>
      </g>
    );
  };
  const arrow = (
    d: string,
    start: number,
    color: string,
    tipX: number,
    tipY: number,
    angle: number,
    label?: { x: number; y: number; text: string },
    dashed = false,
  ) => {
    const progress = drawAt(start);
    return (
      <g key={`${d}-${label?.text ?? "flow"}`}>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          strokeDasharray={dashed ? ".08 .05" : "1"}
          strokeDashoffset={1 - progress}
          opacity={progress}
        />
        <path
          d="M0 0 L-8 -5 L-7 0 L-8 5 Z"
          fill={color}
          opacity={easeOut((progress - 0.82) / 0.18)}
          transform={`translate(${tipX} ${tipY}) rotate(${angle})`}
        />
        {label && false && (
          <g opacity={easeOut((progress - 0.45) / 0.3)}>
            <rect
              x={label.x - label.text.length * 3.2 - 5}
              y={label.y - 11}
              width={label.text.length * 6.4 + 10}
              height="17"
              rx="5"
              fill="#F8FBFD"
              opacity=".96"
            />
            <text
              x={label.x}
              y={label.y + 1}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="9.5"
              fill="#526A7E"
            >
              {label.text}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      style={{ position: "absolute", inset: 0 }}
    >
      <rect width="920" height="470" fill="#EDF2F5" />

      {node(30, 84, 166, 55, "Coding agent", "creative decisions", C.blue, 4)}
      {node(
        30,
        158,
        166,
        55,
        "Terminal capture",
        "step 03 · 2.4s",
        C.amber,
        12,
        "capture",
      )}
      {node(
        30,
        232,
        166,
        55,
        "Browser capture",
        "click export · 5.8s",
        C.coral,
        20,
        "capture",
      )}

      {node(
        244,
        94,
        170,
        61,
        "EDITORIAL.md",
        "audience · value · order",
        C.blue,
        18,
      )}
      {node(
        244,
        176,
        170,
        61,
        "VISUAL-DESIGN.md",
        "hierarchy · motion · proof",
        C.amber,
        27,
      )}
      {node(
        244,
        258,
        170,
        61,
        "Captured evidence",
        "terminal + browser steps",
        C.coral,
        36,
      )}

      {node(
        460,
        100,
        190,
        86,
        "ExplainerDocument",
        "explainer.json · cues + beats",
        C.blue,
        37,
        "contract",
      )}
      {node(
        460,
        211,
        190,
        64,
        "ExplanationBeat",
        "phrase → action → evidence",
        C.green,
        48,
        "contract",
      )}
      <g opacity={revealAt(60)}>
        {[
          [460, "whiteboard", C.amber],
          [510, "diagram", C.blue],
          [560, "terminal", C.green],
          [610, "browser", C.coral],
        ].map(([x, label, color]) => (
          <g key={String(label)}>
            <rect
              x={Number(x)}
              y="298"
              width="42"
              height="38"
              rx="9"
              fill={`${String(color)}18`}
              stroke={String(color)}
              strokeWidth="1.7"
            />
          </g>
        ))}
      </g>

      {node(
        696,
        84,
        184,
        55,
        "seqvio-audio",
        "measured TTS duration",
        C.blue,
        62,
      )}
      {node(
        696,
        154,
        184,
        55,
        "Semantic timeMap",
        "outputFrame 126 → source 84",
        C.green,
        72,
      )}
      {node(
        696,
        224,
        184,
        55,
        "seqvio-qa",
        "0 errors · 0 unresolved",
        C.amber,
        82,
      )}
      {node(
        696,
        294,
        184,
        55,
        "seqvio-render",
        "Puppeteer + FFmpeg",
        C.coral,
        92,
      )}
      {node(
        738,
        370,
        142,
        52,
        "Local MP4",
        "1920×1080 · 30 fps",
        C.green,
        104,
        "output",
      )}

      {arrow("M196 112 H234", 10, C.blue, 242, 112, 0, {
        x: 215,
        y: 100,
        text: "brief",
      })}
      {arrow(
        "M196 185 H222 Q232 185 232 195 V278 Q232 288 244 288",
        28,
        C.amber,
        252,
        288,
        0,
        { x: 213, y: 245, text: "captured steps" },
        true,
      )}
      {arrow(
        "M196 259 H224",
        34,
        C.coral,
        242,
        259,
        0,
        { x: 215, y: 246, text: "action clock" },
        true,
      )}
      {arrow("M414 124 H448", 40, C.blue, 458, 124, 0, {
        x: 433,
        y: 112,
        text: "reviewed plan",
      })}
      {arrow("M414 206 H438 Q448 206 448 174", 45, C.amber, 448, 164, -90, {
        x: 430,
        y: 195,
        text: "visual brief",
      })}
      {arrow(
        "M414 288 H438 Q448 288 448 240",
        51,
        C.coral,
        448,
        230,
        -90,
        { x: 429, y: 276, text: "evidence refs" },
        true,
      )}
      {arrow("M555 186 V199", 55, C.green, 555, 209, 90, {
        x: 600,
        y: 198,
        text: "cues + beats",
      })}
      {arrow("M555 275 V288", 66, C.green, 555, 298, 90, {
        x: 606,
        y: 288,
        text: "visual targets",
      })}
      {arrow("M650 143 H684", 68, C.blue, 694, 143, 0, {
        x: 669,
        y: 131,
        text: "narration",
      })}
      {arrow("M650 243 H674 Q686 243 686 181", 76, C.green, 686, 171, -90, {
        x: 665,
        y: 227,
        text: "phrase anchors",
      })}
      {arrow("M788 139 V144", 79, C.blue, 788, 154, 90)}
      {arrow("M788 209 V214", 87, C.green, 788, 224, 90)}
      {arrow("M788 279 V284", 96, C.amber, 788, 294, 90)}
      {arrow("M809 349 V360", 108, C.coral, 809, 370, 90, {
        x: 852,
        y: 359,
        text: "frames + audio",
      })}

      <circle
        cx={650 + pulse * 159}
        cy={143 + pulse * 227}
        r="6"
        fill={C.green}
        opacity={revealAt(111) * (1 - smoothStep((frame - 142) / 8))}
      />
    </svg>
  );
}

function ExportBrowserEvidenceLegacy({ frame }: { frame: number }) {
  const enter = easeOut((frame - 3) / 14);
  const cursor = smoothStep((frame - 27) / 30);
  const targetFocus =
    easeOut((frame - 44) / 8) * (1 - smoothStep((frame - 62) / 12));
  const click = easeOut((frame - 55) / 9);
  const result = easeOut((frame - 68) / 16);
  const resultFocus =
    easeOut((frame - 68) / 8) * (1 - smoothStep((frame - 86) / 13));
  const tokens = easeOut((frame - 92) / 18);
  const cursorX = 744 - cursor * 58;
  const cursorY = 164 + cursor * 174;
  return (
    <svg
      width="920"
      height="470"
      viewBox="0 0 920 470"
      style={{ position: "absolute", inset: 0 }}
    >
      <g
        opacity={enter}
        transform={`translate(460 238) scale(${0.95 + enter * 0.05}) translate(-460 -238)`}
      >
        <rect
          x="64"
          y="70"
          width="792"
          height="330"
          rx="26"
          fill="#0D1824"
          stroke="#344B61"
          strokeWidth="3"
        />
        <path d="M64 114 H856" stroke="#344B61" strokeWidth="2" />
        {[C.coral, C.amber, C.green].map((c, i) => (
          <circle key={c} cx={88 + i * 22} cy="92" r="6" fill={c} />
        ))}
        <rect x="166" y="80" width="380" height="24" rx="12" fill="#192A3B" />
        <text
          x="356"
          y="97"
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="12"
          fill="#A8BACB"
        >
          workflow.local/runs/completed
        </text>
        <rect x="90" y="142" width="468" height="220" rx="18" fill="#F3F6F8" />
        <text
          x="118"
          y="180"
          fontFamily={SANS}
          fontSize="21"
          fontWeight="750"
          fill={C.ink}
        >
          Completed workflow run
        </text>
        {[
          ["evt-018", "Collect run events", "18"],
          ["mask-006", "Remove sensitive fields", "6"],
          ["artifact", "Generate JSON report", "ready"],
        ].map(([id, label, value], i) => (
          <g key={id}>
            <circle cx="124" cy={222 + i * 45} r="9" fill={C.green} />
            <text
              x="146"
              y={218 + i * 45}
              fontFamily={MONO}
              fontSize="10"
              fill="#70879A"
            >
              {id}
            </text>
            <text
              x="146"
              y={235 + i * 45}
              fontFamily={SANS}
              fontSize="13"
              fontWeight="650"
              fill={C.ink}
            >
              {label}
            </text>
            <text
              x="520"
              y={230 + i * 45}
              textAnchor="end"
              fontFamily={MONO}
              fontSize="11"
              fill={C.green}
            >
              {value}
            </text>
          </g>
        ))}
        <g
          transform={`translate(705 252) scale(${1 + targetFocus * 0.15 + resultFocus * 0.1}) translate(-705 -252)`}
        >
          <rect
            x="584"
            y="142"
            width="242"
            height="220"
            rx="18"
            fill="#E9F3FA"
            stroke={result ? C.green : C.blue}
            strokeWidth={result ? 4 : 2}
          />
          <text
            x="610"
            y="180"
            fontFamily={SANS}
            fontSize="17"
            fontWeight="700"
            fill={C.ink}
          >
            Run report
          </text>
          <text x="610" y="213" fontFamily={MONO} fontSize="11" fill="#647C8F">
            run_id #1842
          </text>
          <text x="610" y="235" fontFamily={MONO} fontSize="11" fill="#647C8F">
            events 18
          </text>
          <text x="610" y="257" fontFamily={MONO} fontSize="11" fill="#16885B">
            redacted 6 fields
          </text>
          <rect
            x="610"
            y="286"
            width="190"
            height="52"
            rx="14"
            fill={result ? C.green : C.blue}
          />
          <text
            x="705"
            y="318"
            textAnchor="middle"
            fontFamily={SANS}
            fontSize="16"
            fontWeight="760"
            fill="#07131F"
          >
            {result > 0.75 ? "run-report.json" : "Export report"}
          </text>
          <circle
            cx="690"
            cy="318"
            r={12 + click * 26}
            fill="none"
            stroke={C.coral}
            strokeWidth="4"
            opacity={click * (1 - smoothStep((frame - 68) / 8))}
          />
        </g>
      </g>
      <path
        d={`M${cursorX} ${cursorY} l6 27 9-9 13 16 7-6-13-16 13-5z`}
        fill="#fff"
        stroke="#102131"
        strokeWidth="2"
      />
      <g opacity={tokens} transform={`translateY(${(1 - tokens) * 18})`}>
        {["recorded click", "action time", "completed result"].map(
          (label, index) => (
            <g key={label} transform={`translate(${280 + index * 180} 421)`}>
              <path
                d="M-72 -18 H58 L72 0 58 18 H-72 Z"
                fill="rgba(255,186,73,.13)"
                stroke={C.amber}
                strokeWidth="2"
              />
              <circle cx="-51" cy="0" r="5" fill={C.amber} />
              <text x="-38" y="5" fontFamily={MONO} fontSize="12" fill={C.text}>
                {label}
              </text>
            </g>
          ),
        )}
      </g>
    </svg>
  );
}

function SkillBrowserEvidence({ frame }: { frame: number }) {
  const enter = easeOut((frame - 3) / 14);
  const scroll = smoothStep((frame - 26) / 54);
  const focus = easeOut((frame - 44) / 8) * (1 - smoothStep((frame - 70) / 12));
  const checks = easeOut((frame - 82) / 18);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 54,
          width: 816,
          height: 354,
          borderRadius: 24,
          overflow: "hidden",
          border: "2px solid #41566A",
          background: C.light,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 26}px) scale(${0.96 + enter * 0.04 + focus * 0.035})`,
          transformOrigin: "70% 48%",
        }}
      >
        <div
          style={{
            height: 38,
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 16px",
            background: "#DDE5EB",
          }}
        >
          {[C.coral, C.amber, C.green].map((color) => (
            <span
              key={color}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
              }}
            />
          ))}
          <span
            style={{
              margin: "0 auto",
              fontFamily: MONO,
              fontSize: 10,
              color: "#64788A",
            }}
          >
            file:///skillbench.html
          </span>
        </div>
        <div style={{ height: 316, overflow: "hidden", position: "relative" }}>
          <img
            src={skillBenchDesktop}
            alt="SkillBench browser evidence"
            style={{
              width: "100%",
              display: "block",
              transform: `translateY(${-scroll * 72}px)`,
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 132,
          right: 132,
          bottom: 22,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          opacity: checks,
        }}
      >
        {["8/8 sections", "Desktop + mobile", "Menu + FAQ", "0 errors"].map(
          (label, index) => (
            <div
              key={label}
              style={{
                height: 44,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "#122131",
                border: "1px solid #38526A",
                color: C.text,
                fontFamily: MONO,
                fontSize: 11,
                transform: `translateY(${(1 - easeOut((frame - 84 - index * 5) / 12)) * 14}px)`,
              }}
            >
              <span>
                <strong style={{ color: C.green }}>✓</strong> {label}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function ExportVisualCard({ mode, frame }: { mode: number; frame: number }) {
  const p = easeOut(frame / 16);
  const exit = 0;
  const labels = [
    "Explain the value",
    "Explain the system",
    "Show the evidence",
  ];
  return (
    <div
      style={{
        position: "relative",
        width: 920,
        height: 470,
        borderRadius: 28,
        overflow: "hidden",
        background: mode < 2 ? C.light : "#0C1621",
        color: mode < 2 ? C.ink : C.text,
        opacity: 1 - exit,
        transform: `scale(${1 - exit * 0.025})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 3,
          left: 28,
          top: 23,
          fontFamily: mode === 0 ? HAND : SANS,
          fontSize: 22,
          fontWeight: mode === 0 ? 400 : 720,
          color: [C.blue, C.amber, C.coral][mode],
          opacity: p,
        }}
      >
        {labels[mode]}
      </div>
      {mode === 0 && <ExportWhiteboard frame={frame} />}
      {mode === 1 && <SeqvioSystemArchitecture frame={frame} />}
      {mode === 2 && <SkillBrowserEvidence frame={frame} />}
    </div>
  );
}

function VisualScene() {
  const f = useCurrentFrame();
  const contentStart = 10;
  const modeDuration = 150;
  const mode = Math.min(
    1,
    Math.floor(Math.max(0, f - contentStart) / modeDuration),
  );
  const localFrame = Math.max(0, f - contentStart - mode * modeDuration);
  return (
    <Canvas tone={mode === 0 ? C.amber : C.blue} base="#EDF2F5">
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 124,
          width: 920,
          height: 470,
          ...enterWindow(f, contentStart),
        }}
      >
        <ExportVisualCard mode={mode} frame={localFrame} />
      </div>
    </Canvas>
  );
}

function SyncScene() {
  const f = useCurrentFrame();
  const beats = [
    {
      x: 420,
      phrase: "browser checks the page",
      target: "browser action",
      source: "terminal step",
      kind: "terminal",
    },
    {
      x: 680,
      phrase: "layout stays responsive",
      target: "mobile state",
      source: "captured frame",
      kind: "diagram",
    },
    {
      x: 940,
      phrase: "evidence becomes a scene",
      target: "evidence focus",
      source: "click time",
      kind: "browser",
    },
  ] as const;
  const intro = 1;
  const captureIntro =
    (0.72 + easeOut(f / 8) * 0.28) * (1 - smoothStep((f - 28) / 12));
  const capturePath = easeOut((f - 7) / 16);
  const tracks = easeOut((f - 106) / 24);
  const stackOpacity = 1 - smoothStep((f - 126) / 20) * 0.72;
  const scan = smoothStep((f - 162) / 26);
  const final = easeOut((f - 182) / 10);

  const renderTarget = (kind: (typeof beats)[number]["kind"]) => {
    if (kind === "terminal") {
      return (
        <g>
          <path d="M-34 -18 H34 V18 H-34 Z" fill="none" />
          <path d="M-20 -5 L-10 2 L-20 9 M-3 9 H20" />
        </g>
      );
    }
    if (kind === "diagram") {
      return (
        <g>
          <circle cx="-24" cy="0" r="8" />
          <circle cx="24" cy="-13" r="8" />
          <circle cx="24" cy="13" r="8" />
          <path d="M-16 -2 C-2 -12 6 -13 16 -13 M-16 2 C-2 12 6 13 16 13" />
        </g>
      );
    }
    return (
      <g>
        <rect x="-34" y="-19" width="68" height="38" rx="8" />
        <circle cx="11" cy="2" r="9" />
        <path d="M11 -12 V-5 M11 9 V16 M-3 2 H4 M18 2 H25" />
      </g>
    );
  };

  return (
    <Canvas tone={C.green} base="#070A0E">
      <div
        style={{
          position: "absolute",
          left: 76,
          top: 48,
          fontFamily: MONO,
          fontSize: 24,
          fontWeight: 760,
          color: C.text,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 16}px)`,
        }}
      >
        Align narration and visuals
      </div>

      <svg
        width="1280"
        height="720"
        viewBox="0 0 1280 720"
        style={{ position: "absolute", inset: 0, fontFamily: MONO }}
      >
        <defs>
          <linearGradient id="syncMap" x1="0" x2="1">
            <stop offset="0" stopColor={C.blue} />
            <stop offset="1" stopColor={C.green} />
          </linearGradient>
        </defs>

        <g opacity={captureIntro}>
          <path
            d="M468 148 C548 114 650 114 728 148 C762 163 790 163 820 148"
            fill="none"
            stroke="rgba(255,186,73,.28)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - capturePath}
          />
          <g
            transform={`translate(440 148) scale(${0.78 + easeOut((f - 2) / 10) * 0.22})`}
            fill="none"
            stroke={C.green}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M-34 -24 H34 V24 H-34 Z M-19 -7 L-8 1 L-19 9 M-1 10 H20" />
          </g>
          <g
            transform={`translate(848 148) scale(${0.78 + easeOut((f - 13) / 10) * 0.22})`}
            fill="none"
            stroke={C.blue}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={easeOut((f - 12) / 10)}
          >
            <rect x="-38" y="-27" width="76" height="54" rx="10" />
            <path d="M-38 -11 H38" />
            <circle cx="13" cy="7" r="9" />
          </g>
          {[0, 1, 2].map((event) => {
            const eventProgress = easeOut((f - 8 - event * 6) / 9);
            return (
              <circle
                key={event}
                cx={468 + eventProgress * (352 - event * 18)}
                cy={148 - Math.sin(eventProgress * Math.PI) * (34 - event * 6)}
                r={7 - event}
                fill={C.amber}
                opacity={eventProgress}
              />
            );
          })}
        </g>

        {[
          { y: 196, label: "Spoken phrase", color: C.blue },
          { y: 286, label: "Visual action", color: C.green },
          { y: 376, label: "Timing source", color: C.amber },
        ].map((row, index) => {
          const show = easeOut((f - 20 - index * 16) / 14);
          return (
            <g key={row.label} opacity={show * stackOpacity}>
              <circle cx="112" cy={row.y} r="5" fill={row.color} />
              <text
                x="128"
                y={row.y + 6}
                fill={row.color}
                fontSize="17"
                fontWeight="700"
              >
                {row.label}
              </text>
            </g>
          );
        })}

        {beats.map((beat, index) => {
          const phraseIn = easeOut((f - 28 - index * 9) / 14);
          const targetIn = easeOut((f - 54 - index * 9) / 16);
          const sourceIn = easeOut((f - 78 - index * 8) / 16);
          const firstLink = easeOut((f - 76 - index * 7) / 18);
          const secondLink = easeOut((f - 92 - index * 7) / 18);
          const pulse = 0.5 + 0.5 * Math.sin((f - index * 8) * 0.16);
          return (
            <g key={beat.phrase} opacity={stackOpacity}>
              <path
                d={`M${beat.x} 221 V257`}
                stroke={C.blue}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="36"
                strokeDashoffset={36 * (1 - firstLink)}
                opacity={firstLink * 0.8}
              />
              <path
                d={`M${beat.x} 311 V347`}
                stroke={C.green}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="36"
                strokeDashoffset={36 * (1 - secondLink)}
                opacity={secondLink * 0.8}
              />

              <g
                opacity={phraseIn}
                transform={`translate(${beat.x} 196) scale(${0.82 + phraseIn * 0.18})`}
              >
                <rect
                  x="-119"
                  y="-25"
                  width="238"
                  height="50"
                  rx="25"
                  fill="rgba(85,180,255,.10)"
                  stroke={C.blue}
                  strokeWidth="2"
                />
                <circle cx="-100" cy="0" r="5" fill={C.blue} />
                <text
                  x="-88"
                  y="5"
                  fill={C.text}
                  fontSize="12"
                  fontWeight="650"
                >
                  {beat.phrase}
                </text>
              </g>

              <g
                opacity={targetIn}
                transform={`translate(${beat.x} 286) scale(${0.78 + targetIn * 0.22})`}
                fill="none"
                stroke={C.green}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  r={31 + pulse * 2}
                  fill="rgba(74,211,155,.08)"
                  strokeOpacity={0.6 + pulse * 0.3}
                />
                {renderTarget(beat.kind)}
              </g>
              <text
                x={beat.x}
                y="333"
                textAnchor="middle"
                fill={C.green}
                fontSize="14"
                opacity={targetIn}
              >
                {beat.target}
              </text>

              <g
                opacity={sourceIn}
                transform={`translate(${beat.x} 376) scale(${0.8 + sourceIn * 0.2})`}
              >
                <path
                  d="M-76 -20 H60 L76 0 L60 20 H-76 Z"
                  fill="rgba(255,186,73,.10)"
                  stroke={C.amber}
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="-54" cy="0" r="6" fill={C.amber} />
                <text
                  x="-38"
                  y="5"
                  fill={C.text}
                  fontSize="14"
                  fontWeight="650"
                >
                  {beat.source}
                </text>
              </g>
            </g>
          );
        })}

        <g opacity={tracks} transform={`translate(0 ${(1 - tracks) * 22})`}>
          <rect
            x="72"
            y="424"
            width="1136"
            height="196"
            rx="22"
            fill="#0C131C"
            stroke="#27394B"
            strokeWidth="2"
          />

          <text x="98" y="478" fill={C.blue} fontSize="15" fontWeight="700">
            measured speech
          </text>
          <text x="98" y="498" fill="#71869A" fontSize="10.5">
            resolved after TTS
          </text>
          <text x="98" y="559" fill={C.green} fontSize="15" fontWeight="700">
            visual sequence
          </text>
          <text x="98" y="579" fill="#71869A" fontSize="10.5">
            same semantic order
          </text>

          <path d="M292 450 H1168" stroke="#26384A" strokeWidth="2" />
          {[0, 1, 2, 3].map((tick) => {
            const x = [302, 574, 846, 1158][tick];
            return (
              <g key={`tick-${tick}`}>
                <path d={`M${x} 444 V456`} stroke="#60788E" strokeWidth="2" />
                <text
                  x={x}
                  y="440"
                  textAnchor={
                    tick === 0 ? "start" : tick === 3 ? "end" : "middle"
                  }
                  fill="#71869A"
                  fontSize="10"
                >
                  {["0.0s", "1.8s", "3.7s", "5.6s"][tick]}
                </text>
              </g>
            );
          })}

          {beats.map((beat, index) => {
            const anchor = easeOut((f - 116 - index * 9) / 18);
            const speechX = [316, 594, 876][index];
            const visualX = [328, 622, 910][index];
            const width = [220, 238, 252][index];
            const visualWidth = [220, 226, 236][index];
            const active =
              easeOut((f - 132 - index * 10) / 8) *
              (1 - smoothStep((f - 164 - index * 10) / 12));
            const path = `M${speechX + width / 2 - 22} 510 C${speechX + width / 2 + 8} 526 ${visualX + 18} 528 ${visualX + 18} 540`;
            const phrases = [
              "browser checks the page",
              "layout stays responsive",
              "evidence becomes a scene",
            ];
            return (
              <g key={`track-${beat.phrase}`} opacity={anchor}>
                <rect
                  x={speechX}
                  y="466"
                  width={width}
                  height="44"
                  rx="12"
                  fill={
                    active > 0.04
                      ? "rgba(85,180,255,.22)"
                      : "rgba(85,180,255,.10)"
                  }
                  stroke={C.blue}
                  strokeWidth={active > 0.04 ? 3 : 2}
                />
                <circle cx={speechX + 18} cy="488" r="6" fill={C.blue} />
                <text
                  x={speechX + 32}
                  y="485"
                  fill={C.text}
                  fontSize="11.5"
                  fontWeight="700"
                >
                  {phrases[index]}
                </text>
                <text x={speechX + 32} y="501" fill="#8AA0B4" fontSize="9.5">
                  {["1.42s", "1.58s", "1.36s"][index]} measured
                </text>
                {Array.from({ length: 5 }, (_, bar) => (
                  <rect
                    key={bar}
                    x={speechX + width - 51 + bar * 8}
                    y={482 - ((bar * 5 + index * 3) % 5)}
                    width="3"
                    height={10 + ((bar * 7 + index * 4) % 13)}
                    rx="1.5"
                    fill={C.blue}
                    opacity=".78"
                  />
                ))}

                <path
                  d={path}
                  fill="none"
                  stroke="url(#syncMap)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - anchor}
                />
                <circle
                  cx={speechX + width / 2 - 4}
                  cy="510"
                  r={5 + active * 2}
                  fill={C.blue}
                />

                <rect
                  x={visualX}
                  y="540"
                  width={visualWidth}
                  height="52"
                  rx="12"
                  fill={
                    active > 0.04
                      ? "rgba(74,211,155,.20)"
                      : "rgba(74,211,155,.09)"
                  }
                  stroke={C.green}
                  strokeWidth={active > 0.04 ? 3 : 2}
                />
                <circle cx={visualX + 22} cy="566" r="13" fill={C.green} />
                <text
                  x={visualX + 22}
                  y="571"
                  textAnchor="middle"
                  fill="#07130F"
                  fontSize="12"
                  fontWeight="900"
                >
                  {index + 1}
                </text>
                <text
                  x={visualX + 45}
                  y="562"
                  fill={C.text}
                  fontSize="11.5"
                  fontWeight="700"
                >
                  {beat.target}
                </text>
                <text x={visualX + 45} y="578" fill="#8AA0B4" fontSize="9.5">
                  source · {beat.source}
                </text>
              </g>
            );
          })}

          <g opacity={smoothStep((f - 154) / 18)}>
            <rect
              x={292 + scan * 876 - 12}
              y="456"
              width="24"
              height="144"
              rx="12"
              fill="rgba(255,255,255,.06)"
            />
            <path
              d={`M${292 + scan * 876} 452 V604`}
              stroke={C.text}
              strokeWidth="2"
              strokeLinecap="round"
              opacity=".68"
            />
            <circle cx={292 + scan * 876} cy="488" r="6" fill={C.blue} />
            <circle cx={292 + scan * 876} cy="566" r="6" fill={C.green} />
          </g>
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 62,
          display: "flex",
          justifyContent: "center",
          gap: 42,
          fontFamily: MONO,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {["Phrase resolved", "Order preserved", "Timing verified"].map(
          (label, index) => {
            const checked = easeOut((f - 168 - index * 7) / 12);
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  color: C.text,
                  opacity: checked,
                  transform: `translateY(${(1 - checked) * 10}px)`,
                }}
              >
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    color: "#07130F",
                    background: C.green,
                    transform: `scale(${0.65 + checked * 0.35})`,
                  }}
                >
                  ✓
                </span>
                {label}
              </div>
            );
          },
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 18,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 20,
          fontWeight: 700,
          color: C.green,
          opacity: final,
          transform: `translateY(${(1 - final) * 8}px)`,
        }}
      >
        Narration and visuals stay aligned
      </div>
    </Canvas>
  );
}

function QASceneLegacy() {
  const f = useCurrentFrame();
  const checks = ["Timing", "Layout", "Media", "Evidence"];
  const overall = smoothStep((f - 32) / 156);
  const ready = easeOut((f - 192) / 18);
  return (
    <Canvas tone={C.green} base="#070A0E">
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 82,
          width: 560,
          ...reveal(f, 10, { x: -64, y: 0 }),
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>
          Ship check
        </div>
        <div style={{ marginTop: 44 }}>
          {checks.map((label, index) => {
            const enter = easeOut((f - 34 - index * 30) / 16);
            const pass = easeOut((f - 52 - index * 30) / 20);
            return (
              <div
                key={label}
                style={{
                  marginTop: 28,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: enter,
                  transform: `translateX(${(1 - enter) * -34}px)`,
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 13,
                    background: pass > 0.96 ? C.green : C.border,
                    color: C.bg,
                    fontWeight: 900,
                    transform: `scale(${0.72 + pass * 0.28})`,
                  }}
                >
                  {pass > 0.96 ? "✓" : ""}
                </span>
                <span style={{ width: 150, fontSize: 28 }}>{label}</span>
                <span
                  style={{
                    flex: 1,
                    height: 9,
                    borderRadius: 5,
                    background: C.border,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: `${pass * 100}%`,
                      height: "100%",
                      borderRadius: 5,
                      background: C.green,
                    }}
                  />
                </span>
                <span
                  style={{
                    color: C.green,
                    fontFamily: MONO,
                    opacity: pass,
                  }}
                >
                  Pass
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 112,
          top: 148,
          width: 350,
          height: 350,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          background: `conic-gradient(${C.green} ${overall * 360}deg, ${C.border} 0deg)`,
          boxShadow: "0 34px 100px rgba(0,0,0,.34)",
          ...reveal(f, 38, { x: 70, y: 0, scale: 0.88 }),
        }}
      >
        <div
          style={{
            width: 306,
            height: 306,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            borderRadius: "50%",
            background: C.panel,
          }}
        >
          <div>
            <div style={{ fontSize: 78, fontWeight: 820 }}>
              {Math.round(overall * 100)}%
            </div>
            <div
              style={{
                marginTop: 16,
                fontFamily: MONO,
                fontSize: 20,
                color: C.green,
                opacity: ready,
                transform: `translateY(${(1 - ready) * 16}px)`,
              }}
            >
              Ready to share
            </div>
          </div>
        </div>
      </div>
    </Canvas>
  );
}

function QAScene() {
  const f = useCurrentFrame();
  const diagnostics = [
    { label: "Blank frames", target: "key frames" },
    { label: "Text overflow", target: "safe areas" },
    { label: "Pacing", target: "visual holds" },
    { label: "Phrase alignment", target: "timeMap" },
    { label: "Evidence references", target: "capture steps" },
  ];
  const scan = smoothStep((f - 24) / 150);
  const done = easeOut((f - 196) / 14);
  return (
    <Canvas tone={C.green} base="#070A0E">
      <div
        style={{
          position: "absolute",
          left: 78,
          top: 54,
          fontFamily: SANS,
          fontSize: 32,
          fontWeight: 760,
          color: C.text,
          opacity: 0.45 + easeOut(f / 8) * 0.55,
        }}
      >
        Verify before rendering
      </div>
      <div style={{ position: "absolute", left: 80, top: 118, width: 700 }}>
        {diagnostics.map((item, index) => {
          const enter = easeOut((f - index * 21) / 13);
          const pass = easeOut((f - 52 - index * 25) / 16);
          return (
            <div
              key={item.label}
              style={{
                height: 78,
                marginBottom: 10,
                display: "grid",
                gridTemplateColumns: "42px 250px 1fr 70px",
                alignItems: "center",
                gap: 14,
                padding: "0 18px",
                borderRadius: 15,
                background: "rgba(255,255,255,.035)",
                border: `1px solid ${pass > 0.85 ? `${C.green}66` : C.border}`,
                opacity: enter,
                transform: `translateX(${(1 - enter) * -28}px)`,
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  background: pass > 0.85 ? C.green : C.border,
                  color: "#07130F",
                  fontWeight: 900,
                  transform: `scale(${0.78 + pass * 0.22})`,
                }}
              >
                {pass > 0.85 ? "✓" : ""}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 20,
                  fontWeight: 680,
                  color: C.text,
                }}
              >
                {item.label}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 14, color: C.muted }}>
                {item.target}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 14,
                  color: C.green,
                  opacity: pass,
                }}
              >
                pass
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          right: 86,
          top: 132,
          width: 330,
          height: 390,
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 14, color: C.muted }}>
          Representative frames
        </div>
        <div style={{ position: "relative", marginTop: 22, height: 300 }}>
          {[0, 1, 2].map((index) => {
            const show = easeOut((f - 38 - index * 32) / 16);
            const colors = [C.blue, C.amber, C.green];
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: index * 42,
                  top: index * 62,
                  width: 228,
                  height: 132,
                  borderRadius: 15,
                  overflow: "hidden",
                  background: "#0B1722",
                  border: `2px solid ${colors[index]}`,
                  opacity: show,
                  transform: `translateX(${(1 - show) * 38}px)`,
                }}
              >
                <div
                  style={{
                    height: 24,
                    padding: "0 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: `${colors[index]}22`,
                    fontFamily: MONO,
                    fontSize: 9,
                    color: colors[index],
                  }}
                >
                  <span>{["frame 034", "frame 086", "frame 142"][index]}</span>
                  <span>{["terminal", "timeMap", "browser"][index]}</span>
                </div>
                <div
                  style={{
                    padding: 14,
                    fontFamily: MONO,
                    fontSize: 9.5,
                    color: C.text,
                    lineHeight: 1.65,
                  }}
                >
                  {index === 0 && (
                    <>
                      <div style={{ color: C.blue }}>
                        {typedText("$ evaluate saas-landing", f, 43, 0.32)}
                      </div>
                      <div style={{ color: C.green }}>
                        {typedText("PASS 8 sections", f, 56, 0.28)}
                      </div>
                      <div style={{ color: C.amber }}>
                        {typedText("artifact skillbench.html", f, 69, 0.28)}
                      </div>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <div style={{ color: C.blue }}>
                        phrase “check responsive layout”
                      </div>
                      <div style={{ color: C.green }}>
                        output 126 → source 84
                      </div>
                      <div style={{ color: C.amber }}>confidence 0.98</div>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <div>browser desktop + mobile</div>
                      <div style={{ color: C.green }}>0 px overflow</div>
                      <div style={{ color: C.amber }}>click 5.8s</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: scan * 260,
              top: -10,
              bottom: -10,
              width: 3,
              borderRadius: 2,
              background: C.green,
              boxShadow: `0 0 18px ${C.green}`,
              opacity: easeOut((f - 32) / 12) * (1 - done * 0.45),
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 42,
          textAlign: "center",
          opacity: done,
          transform: `translateY(${(1 - done) * 12}px)`,
        }}
      >
        <div
          style={{
            fontFamily: SANS,
            fontSize: 29,
            fontWeight: 760,
            color: C.green,
          }}
        >
          No blocking issues
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: MONO,
            fontSize: 16,
            color: C.text,
          }}
        >
          Ready to render
        </div>
      </div>
    </Canvas>
  );
}

function ApplicationMontage() {
  const f = useCurrentFrame();
  const items = [
    { label: "PR video review", color: C.blue, kind: "diff" },
    { label: "Tool comparison", color: C.amber, kind: "compare" },
    { label: "Tutorial verification", color: C.green, kind: "steps" },
    { label: "Concept explanation", color: C.coral, kind: "graph" },
    { label: "Product review", color: C.blue, kind: "product" },
    { label: "Skill evaluation", color: C.green, kind: "skill" },
  ] as const;
  const phraseAnchors = [60, 101, 141, 181, 221, 261] as const;
  const active = phraseAnchors.reduce(
    (current, start, index) => (f >= start ? index : current),
    0,
  );
  const local = Math.max(0, f - phraseAnchors[active]);
  const nextAnchor = phraseAnchors[active + 1] ?? 307;
  const enter = easeOut(local / 10);
  const exit = smoothStep((f - nextAnchor + 10) / 8);
  const item = items[active];
  const progress = smoothStep((local - 5) / 24);
  const introGrid = easeOut(f / 12) * (1 - smoothStep((f - 48) / 10));
  const finalGrid = easeOut((f - 307) / 12);
  const summaryGrid = Math.max(introGrid, finalGrid);
  const summaryItemOpacity = (index: number) =>
    Math.max(
      easeOut((f - 2 - index * 3) / 9) * (1 - smoothStep((f - 48) / 10)),
      easeOut((f - 307 - index * 2) / 8),
    );

  const visual = () => {
    if (item.kind === "diff")
      return (
        <div
          style={{
            position: "relative",
            width: 900,
            height: 330,
            borderRadius: 20,
            overflow: "hidden",
            background: "#0D1722",
            border: "1px solid #31465E",
          }}
        >
          <div
            style={{
              height: 42,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 18px",
              borderBottom: "1px solid #2D4155",
            }}
          >
            {[C.coral, C.amber, C.green].map((color) => (
              <span
                key={color}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
            <span style={{ marginLeft: 12, color: C.muted, fontSize: 11 }}>
              src/evaluation.ts · pull request #184
            </span>
            <span style={{ marginLeft: "auto", color: C.green, fontSize: 11 }}>
              2 checks added
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              height: 288,
            }}
          >
            {[
              {
                title: "Before",
                color: C.coral,
                lines: [
                  "captureDesktop(page)",
                  "return screenshot",
                  "// no interaction proof",
                  "review(result)",
                ],
              },
              {
                title: "After",
                color: C.green,
                lines: [
                  "captureDesktop(page)",
                  "captureMobile(page)",
                  "verifyInteractions(page)",
                  "return evidenceBundle",
                ],
              },
            ].map((pane, paneIndex) => (
              <div
                key={pane.title}
                style={{
                  position: "relative",
                  padding: "19px 24px",
                  borderLeft: paneIndex ? "1px solid #2D4155" : undefined,
                }}
              >
                <div
                  style={{ color: pane.color, fontSize: 12, fontWeight: 750 }}
                >
                  {pane.title}
                </div>
                <div style={{ marginTop: 16, display: "grid", gap: 9 }}>
                  {pane.lines.map((line, lineIndex) => {
                    const lineIn = easeOut(
                      (local - lineIndex * 4 - paneIndex * 2) / 9,
                    );
                    const changed = paneIndex === 1 && lineIndex > 0;
                    return (
                      <div
                        key={line}
                        style={{
                          height: 38,
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: changed
                            ? "rgba(74,211,155,.12)"
                            : paneIndex === 0 && lineIndex === 2
                              ? "rgba(244,118,88,.10)"
                              : "rgba(255,255,255,.025)",
                          color: changed ? C.green : C.text,
                          opacity: lineIn,
                          transform: `translateX(${(1 - lineIn) * (paneIndex ? 20 : -20)}px)`,
                        }}
                      >
                        <span style={{ color: pane.color }}>
                          {changed ? "+" : lineIndex + 1}
                        </span>
                        {line}
                      </div>
                    );
                  })}
                </div>
                {paneIndex === 1 && (
                  <div
                    style={{
                      position: "absolute",
                      right: 18,
                      bottom: 18,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: C.green,
                      color: "#07130F",
                      fontSize: 11,
                      fontWeight: 850,
                      opacity: easeOut((local - 19) / 9),
                      transform: `scale(${0.82 + easeOut((local - 19) / 9) * 0.18})`,
                    }}
                  >
                    Ready for review
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    if (item.kind === "compare")
      return (
        <div
          style={{
            width: 900,
            height: 330,
            padding: "22px 28px",
            borderRadius: 20,
            background: "#111B27",
            border: "1px solid #344A60",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr 1fr",
              gap: 18,
              alignItems: "center",
              marginBottom: 15,
            }}
          >
            <span style={{ color: C.muted, fontSize: 11 }}>
              measured criteria
            </span>
            <span
              style={{ color: C.amber, textAlign: "center", fontWeight: 800 }}
            >
              Tool A
            </span>
            <span
              style={{ color: C.green, textAlign: "center", fontWeight: 800 }}
            >
              Tool B
            </span>
          </div>
          {[
            "Task accuracy",
            "Responsive output",
            "Interaction coverage",
            "Review effort",
          ].map((metric, metricIndex) => {
            const metricIn = easeOut((local - metricIndex * 4) / 9);
            const valuesA = [78, 72, 61, 68];
            const valuesB = [92, 96, 89, 86];
            return (
              <div
                key={metric}
                style={{
                  height: 58,
                  display: "grid",
                  gridTemplateColumns: "180px 1fr 1fr",
                  gap: 18,
                  alignItems: "center",
                  borderTop: "1px solid #263A4D",
                  opacity: metricIn,
                }}
              >
                <span style={{ color: C.text, fontSize: 12 }}>{metric}</span>
                {[valuesA[metricIndex], valuesB[metricIndex]].map(
                  (value, toolIndex) => (
                    <div
                      key={toolIndex}
                      style={{
                        height: 30,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "0 10px",
                        borderRadius: 8,
                        background: "#0B141E",
                      }}
                    >
                      <span
                        style={{
                          height: 7,
                          width: `${value * progress * 2.25}px`,
                          maxWidth: 220,
                          borderRadius: 4,
                          background: toolIndex ? C.green : C.amber,
                        }}
                      />
                      <span
                        style={{
                          marginLeft: "auto",
                          color: toolIndex ? C.green : C.amber,
                        }}
                      >
                        {Math.round(value * progress)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            );
          })}
        </div>
      );
    if (item.kind === "steps")
      return (
        <svg width="920" height="330" viewBox="0 0 920 330">
          <path
            d="M95 175 C180 130 228 130 310 175 C390 220 448 220 530 175 C610 130 672 130 825 175"
            fill="none"
            stroke="rgba(74,211,155,.22)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M95 175 C180 130 228 130 310 175 C390 220 448 220 530 175 C610 130 672 130 825 175"
            fill="none"
            stroke={C.green}
            strokeWidth="5"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
          />
          {[
            { x: 95, title: "Install", note: "dependencies ready" },
            { x: 310, title: "Generate", note: "example created" },
            { x: 530, title: "Open", note: "browser state" },
            { x: 825, title: "Verify", note: "expected result" },
          ].map((step, index) => {
            const stepIn = easeOut((local - index * 6) / 10);
            return (
              <g
                key={step.title}
                opacity={stepIn}
                transform={`translate(${step.x} 175)`}
              >
                <circle
                  r={40 + (index === 3 ? progress * 5 : 0)}
                  fill="#102231"
                  stroke={C.green}
                  strokeWidth="4"
                />
                <circle r="15" fill={C.green} />
                <path
                  d="M-7 0 l5 6 11-14"
                  fill="none"
                  stroke="#07130F"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <text
                  y="78"
                  textAnchor="middle"
                  fill={C.text}
                  fontSize="17"
                  fontWeight="750"
                >
                  {step.title}
                </text>
                <text y="99" textAnchor="middle" fill="#7F94A7" fontSize="10.5">
                  {step.note}
                </text>
              </g>
            );
          })}
          <g
            opacity={easeOut((local - 17) / 8)}
            transform={`translate(${95 + progress * 730} 175)`}
          >
            <circle r="9" fill="#FFFFFF" />
            <circle r="4" fill={C.green} />
          </g>
        </svg>
      );
    if (item.kind === "graph")
      return (
        <svg width="920" height="330" viewBox="0 0 920 330">
          <defs>
            <marker
              id="concept-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0 0 L8 4 L0 8 Z" fill={C.coral} />
            </marker>
          </defs>
          {[
            "M142 90 C245 90 250 150 345 150",
            "M142 240 C245 240 250 180 345 180",
            "M455 165 C565 165 600 95 690 95",
            "M455 165 C565 165 600 235 690 235",
            "M765 95 C825 95 825 165 865 165",
            "M765 235 C825 235 825 165 865 165",
          ].map((path, index) => {
            const lineDraw = smoothStep((local - index * 3) / 22);
            return (
              <path
                key={path}
                d={path}
                fill="none"
                stroke={index < 2 ? C.blue : C.coral}
                strokeWidth="4"
                strokeLinecap="round"
                markerEnd={
                  index > 1 && lineDraw > 0.86
                    ? "url(#concept-arrow)"
                    : undefined
                }
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - lineDraw}
              />
            );
          })}
          {[
            {
              x: 95,
              y: 90,
              w: 94,
              h: 54,
              label: "Input",
              color: C.blue,
              shape: "rect",
            },
            {
              x: 95,
              y: 240,
              w: 94,
              h: 54,
              label: "Context",
              color: C.blue,
              shape: "rect",
            },
            {
              x: 400,
              y: 165,
              w: 116,
              h: 82,
              label: "Mechanism",
              color: C.coral,
              shape: "circle",
            },
            {
              x: 728,
              y: 95,
              w: 128,
              h: 58,
              label: "Effect A",
              color: C.amber,
              shape: "rect",
            },
            {
              x: 728,
              y: 235,
              w: 128,
              h: 58,
              label: "Effect B",
              color: C.green,
              shape: "rect",
            },
            {
              x: 876,
              y: 165,
              w: 58,
              h: 58,
              label: "Why",
              color: C.coral,
              shape: "circle",
            },
          ].map((node, index) => {
            const nodeIn = easeOut((local - index * 4) / 10);
            return (
              <g
                key={node.label}
                opacity={nodeIn}
                transform={`translate(${node.x} ${node.y}) scale(${0.84 + nodeIn * 0.16})`}
              >
                {node.shape === "circle" ? (
                  <circle
                    r={node.w / 2}
                    fill="#111F2C"
                    stroke={node.color}
                    strokeWidth="4"
                  />
                ) : (
                  <rect
                    x={-node.w / 2}
                    y={-node.h / 2}
                    width={node.w}
                    height={node.h}
                    rx="15"
                    fill="#111F2C"
                    stroke={node.color}
                    strokeWidth="3"
                  />
                )}
                <text
                  textAnchor="middle"
                  y="5"
                  fill={C.text}
                  fontSize="13"
                  fontWeight="750"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
          <circle
            cx={455 + progress * 200}
            cy={165 - progress * 70}
            r="7"
            fill="#FFFFFF"
            opacity={
              progress * (1 - smoothStep(clamp((progress - 0.82) / 0.18, 0, 1)))
            }
          />
        </svg>
      );
    if (item.kind === "product")
      return (
        <div
          style={{
            position: "relative",
            width: 900,
            height: 330,
            borderRadius: 20,
            overflow: "hidden",
            background: "#EEF3F6",
            color: C.ink,
            border: "1px solid #BFCED9",
          }}
        >
          <div
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "0 15px",
              background: "#DCE5EB",
            }}
          >
            {[C.coral, C.amber, C.green].map((color) => (
              <span
                key={color}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
            <span style={{ margin: "0 auto", color: "#667D90", fontSize: 10 }}>
              product.example
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.45fr 1fr",
              gap: 22,
              padding: 22,
            }}
          >
            <div
              style={{
                position: "relative",
                height: 246,
                borderRadius: 15,
                background: "#FFFFFF",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: 72,
                  padding: "17px 20px",
                  background: "#DDEFFF",
                }}
              >
                <div
                  style={{
                    width: 170,
                    height: 13,
                    borderRadius: 7,
                    background: C.blue,
                  }}
                />
                <div
                  style={{
                    width: 230,
                    height: 8,
                    borderRadius: 4,
                    background: "#93B9D8",
                    marginTop: 11,
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                  padding: 16,
                }}
              >
                {[C.amber, C.green, C.coral].map((color, index) => (
                  <div
                    key={color}
                    style={{
                      height: 128,
                      borderRadius: 10,
                      background: `${color}22`,
                      border: `2px solid ${color}`,
                      opacity: easeOut((local - index * 5) / 10),
                    }}
                  />
                ))}
              </div>
              {[
                { x: 120, y: 114 },
                { x: 300, y: 184 },
                { x: 420, y: 112 },
              ].map((pin, index) => (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    left: pin.x,
                    top: pin.y,
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: [C.blue, C.green, C.coral][index],
                    color: "#07131F",
                    fontWeight: 900,
                    opacity: easeOut((local - 10 - index * 5) / 9),
                    transform: `scale(${0.72 + easeOut((local - 10 - index * 5) / 9) * 0.28})`,
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 11 }}>
              {["Usability", "Clarity", "Evidence"].map((label, index) => (
                <div
                  key={label}
                  style={{
                    padding: "13px 15px",
                    borderRadius: 11,
                    background: "#FFFFFF",
                    border: "1px solid #CBD7DF",
                    opacity: easeOut((local - index * 5) / 10),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 750,
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ color: C.green }}>
                      {[8.6, 9.1, 9.4][index]}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      marginTop: 9,
                      borderRadius: 3,
                      background: "#E4EBF0",
                    }}
                  >
                    <div
                      style={{
                        width: `${[86, 91, 94][index] * progress}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: [C.blue, C.amber, C.green][index],
                      }}
                    />
                  </div>
                </div>
              ))}
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 11,
                  background: C.green,
                  color: "#07130F",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 850,
                  opacity: easeOut((local - 19) / 9),
                }}
              >
                Evidence-backed verdict
              </div>
            </div>
          </div>
        </div>
      );
    return (
      <div
        style={{
          position: "relative",
          width: 900,
          height: 330,
          display: "grid",
          gridTemplateColumns: "1.25fr .75fr",
          gap: 18,
        }}
      >
        <div
          style={{
            position: "relative",
            borderRadius: 18,
            overflow: "hidden",
            background: C.light,
            border: "2px solid #41566A",
          }}
        >
          <img
            src={skillBenchDesktop}
            alt="Skill evaluation page"
            style={{
              width: "100%",
              transform: `translateY(${-progress * 34}px) scale(${1 + progress * 0.025})`,
              transformOrigin: "58% 26%",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 18,
              bottom: 16,
              width: 76,
              height: 150,
              borderRadius: 14,
              overflow: "hidden",
              border: `4px solid ${C.green}`,
              background: "#fff",
              opacity: easeOut((local - 9) / 9),
              transform: `translateY(${(1 - easeOut((local - 9) / 9)) * 18}px)`,
            }}
          >
            <img
              src={skillBenchMobile}
              alt="Skill mobile result"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: 238,
              top: 116,
              width: 76,
              height: 76,
              borderRadius: "50%",
              border: `4px solid ${C.green}`,
              opacity: easeOut((local - 14) / 8),
              transform: `scale(${0.72 + easeOut((local - 14) / 8) * 0.28})`,
            }}
          />
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {["8/8 sections", "Desktop + mobile", "Menu + FAQ", "0 errors"].map(
            (label, index) => (
              <div
                key={label}
                style={{
                  borderRadius: 12,
                  background: "rgba(74,211,155,.10)",
                  border: `1px solid ${C.green}`,
                  display: "grid",
                  placeItems: "center",
                  opacity: easeOut((local - index * 5) / 10),
                  fontFamily: MONO,
                  transform: `translateX(${(1 - easeOut((local - index * 5) / 10)) * 18}px)`,
                }}
              >
                <span>
                  <strong style={{ color: C.green }}>✓</strong> {label}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    );
  };

  return (
    <Canvas tone={item.color} base="#070A0E">
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 52,
          textAlign: "center",
          fontFamily: SANS,
          fontSize: 24,
          fontWeight: 750,
          color: C.muted,
        }}
      >
        Use cases for Seqvio
      </div>
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 102,
          bottom: 58,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: enter * (1 - exit) * (1 - summaryGrid),
          transform: `translateY(${(1 - enter) * 22}px)`,
        }}
      >
        <div
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              border: `2px solid ${item.color}`,
              color: item.color,
              fontFamily: MONO,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            {String(active + 1).padStart(2, "0")}
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 38,
              lineHeight: 1.08,
              fontWeight: 780,
              color: C.text,
            }}
          >
            {item.label}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            width: "100%",
            display: "grid",
            placeItems: "center",
            fontFamily: MONO,
            color: C.text,
          }}
        >
          {visual()}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          opacity: summaryGrid,
          transform: `scale(${0.94 + summaryGrid * 0.06})`,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            width: 940,
          }}
        >
          {items.map((entry, index) => (
            <div
              key={entry.label}
              style={{
                height: 132,
                borderRadius: 16,
                background: "#111C29",
                border: "1px solid #31465E",
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "0 18px",
                color: C.text,
                fontFamily: SANS,
                fontSize: 18,
                fontWeight: 700,
                opacity: summaryItemOpacity(index),
              }}
            >
              <svg width="68" height="62" viewBox="0 0 68 62">
                {entry.kind === "diff" && (
                  <g
                    fill="none"
                    stroke={entry.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <rect x="5" y="7" width="58" height="48" rx="9" />
                    <path d="M16 21 H44 M16 31 H52 M16 41 H38" />
                    <path d="M50 17 v12 M44 23 h12" stroke={C.green} />
                  </g>
                )}
                {entry.kind === "compare" && (
                  <g>
                    <rect
                      x="8"
                      y="29"
                      width="18"
                      height="25"
                      rx="5"
                      fill={C.amber}
                    />
                    <rect
                      x="40"
                      y="12"
                      width="18"
                      height="42"
                      rx="5"
                      fill={C.green}
                    />
                    <path d="M5 56 H62" stroke="#60788C" strokeWidth="2" />
                  </g>
                )}
                {entry.kind === "steps" && (
                  <g fill="none" stroke={entry.color} strokeWidth="3">
                    <path d="M10 31 H58" />
                    {[12, 34, 56].map((x) => (
                      <circle key={x} cx={x} cy="31" r="8" fill="#111C29" />
                    ))}
                    <path d="M29 31 l4 4 7-9" stroke="#FFFFFF" />
                  </g>
                )}
                {entry.kind === "graph" && (
                  <g fill="#111C29" stroke={entry.color} strokeWidth="3">
                    <path
                      d="M17 18 C28 18 28 31 34 31 M34 31 C40 31 40 15 51 15 M34 31 C40 31 40 47 51 47"
                      fill="none"
                    />
                    <circle cx="13" cy="18" r="7" />
                    <circle cx="34" cy="31" r="7" />
                    <circle cx="55" cy="15" r="7" />
                    <circle cx="55" cy="47" r="7" />
                  </g>
                )}
                {entry.kind === "product" && (
                  <g fill="none" stroke={entry.color} strokeWidth="3">
                    <rect x="5" y="8" width="58" height="46" rx="8" />
                    <path d="M5 20 H63" />
                    <circle cx="24" cy="36" r="7" />
                    <path d="M38 31 H54 M38 40 H49" />
                  </g>
                )}
                {entry.kind === "skill" && (
                  <g
                    fill="none"
                    stroke={entry.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                  >
                    <rect x="5" y="7" width="43" height="48" rx="8" />
                    <path d="M14 20 H39 M14 30 H34 M14 40 H30" />
                    <circle cx="53" cy="42" r="11" fill="#111C29" />
                    <path d="M48 42 l4 4 7-9" />
                  </g>
                )}
              </svg>
              <span style={{ flex: 1 }}>{entry.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Canvas>
  );
}

function Closing() {
  const f = useCurrentFrame();
  const brand = 1;
  const copy = easeOut((f - 18) / 18);
  const cta = easeOut((f - 58) / 16);
  return (
    <Canvas tone={C.coral} base="#070A0E">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          opacity: brand,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 22,
            }}
          >
            <img
              src={seqvioMark}
              alt=""
              style={{
                width: 124,
                height: 124,
                transform: `scale(${0.72 + brand * 0.28})`,
              }}
            />
            <div
              style={{
                fontFamily: SANS,
                fontSize: 68,
                fontWeight: 760,
                color: C.text,
              }}
            >
              Seqvio
            </div>
          </div>
          <div
            style={{
              marginTop: 34,
              fontFamily: SANS,
              fontSize: 43,
              lineHeight: 1.25,
              fontWeight: 730,
              color: C.text,
              opacity: copy,
              transform: `translateY(${(1 - copy) * 18}px)`,
            }}
          >
            Agent work, explained with{" "}
            <span style={{ color: C.green }}>Seqvio</span>
          </div>
          <div
            style={{
              marginTop: 32,
              display: "inline-block",
              padding: "14px 22px",
              borderRadius: 14,
              background: C.blue,
              color: "#07131F",
              fontFamily: MONO,
              fontSize: 16,
              fontWeight: 700,
              opacity: cta,
              transform: `translateY(${(1 - cta) * 12}px)`,
            }}
          >
            github.com/makesynt/seqvio
          </div>
        </div>
      </div>
    </Canvas>
  );
}

function ClosingLegacy() {
  const f = useCurrentFrame();
  const logo = easeOut((f - 12) / 20);
  const line = easeOut((f - 40) / 20);
  const primaryCta = easeOut((f - 82) / 18);
  const secondaryCta = easeOut((f - 102) / 18);
  return (
    <Canvas tone={C.coral} base="#070A0E">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <img
            src={seqvioMark}
            alt=""
            style={{
              width: 112,
              height: 112,
              opacity: logo,
              transform: `rotate(${(1 - logo) * -12}deg) scale(${0.72 + logo * 0.28})`,
            }}
          />
          <div
            style={{
              marginTop: 24,
              fontSize: 58,
              lineHeight: 1.05,
              fontWeight: 760,
              opacity: line,
              transform: `translateY(${(1 - line) * 34}px)`,
            }}
          >
            Show what your agent built
          </div>
          <div
            style={{
              marginTop: 36,
              display: "flex",
              justifyContent: "center",
              gap: 16,
              opacity: Math.max(primaryCta, secondaryCta),
              transform: `translateY(${(1 - primaryCta) * 18}px)`,
            }}
          >
            <div
              style={{
                padding: "16px 22px",
                borderRadius: 18,
                background: C.blue,
                color: C.bg,
                fontFamily: MONO,
                fontSize: 16,
                opacity: primaryCta,
                transform: `translateX(${(1 - primaryCta) * -22}px)`,
              }}
            >
              github.com/makesynt/seqvio
            </div>
            <div
              style={{
                padding: "16px 22px",
                borderRadius: 18,
                background: C.raised,
                color: C.text,
                fontFamily: MONO,
                fontSize: 16,
                opacity: secondaryCta,
                transform: `translateX(${(1 - secondaryCta) * 110}px) scale(${0.94 + secondaryCta * 0.06})`,
              }}
            >
              npm install -g @seqvio/renderer
            </div>
          </div>
        </div>
      </div>
    </Canvas>
  );
}

export default function SeqvioProductHuntPremium() {
  return (
    <VideoComposition
      id="seqvio-product-hunt-en"
      width={1920}
      height={1080}
      fps={FPS}
      duration={meta.duration}
      backgroundColor={C.bg}
      audio={meta.audio!}
      design={{ width: W, height: H, fit: "contain", align: "center" }}
    >
      <Scene id="hook" duration={SCENES[0]}>
        <DesignStage>
          <Hook />
        </DesignStage>
      </Scene>
      <Transition type="fade" duration={TRANSITIONS[0]} />
      <Scene id="task" duration={SCENES[1]}>
        <DesignStage>
          <TaskScene />
        </DesignStage>
      </Scene>
      <Transition type="slide" duration={TRANSITIONS[1]} />
      <Scene id="review" duration={SCENES[2]}>
        <DesignStage>
          <ReviewSceneV2 />
        </DesignStage>
      </Scene>
      <Transition type="wipe" duration={TRANSITIONS[2]} />
      <Scene id="visuals" duration={SCENES[3]}>
        <DesignStage>
          <VisualScene />
        </DesignStage>
      </Scene>
      <Transition type="fade" duration={TRANSITIONS[3]} />
      <Scene id="sync" duration={SCENES[4]}>
        <DesignStage>
          <SyncScene />
        </DesignStage>
      </Scene>
      <Transition type="slide" duration={TRANSITIONS[4]} />
      <Scene id="qa" duration={SCENES[5]}>
        <DesignStage>
          <QAScene />
        </DesignStage>
      </Scene>
      <Transition type="wipe" duration={TRANSITIONS[5]} />
      <Scene id="applications" duration={SCENES[6]}>
        <DesignStage>
          <ApplicationMontage />
        </DesignStage>
      </Scene>
      <Transition type="fade" duration={TRANSITIONS[6]} />
      <Scene id="closing" duration={SCENES[7]}>
        <DesignStage>
          <Closing />
        </DesignStage>
      </Scene>
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  duration:
    SCENES.reduce((sum, value) => sum + value, 0) +
    TRANSITIONS.reduce((sum, value) => sum + value, 0),
  fps: FPS,
  width: 1920,
  height: 1080,
  design: { width: W, height: H, fit: "contain", align: "center" },
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: [
      {
        id: "hook",
        sceneId: "hook",
        text: "Seqvio is an explainer video toolkit for agents",
      },
      {
        id: "task",
        sceneId: "task",
        text: "We evaluated the real html-anything SaaS landing skill, generated a complete page from one topic, then checked its desktop, mobile, and interactive browser states",
      },
      {
        id: "review",
        sceneId: "review",
        text: "Editorial and visual design files make the story and visual direction reviewable before execution",
      },
      {
        id: "visual-whiteboard",
        sceneId: "visuals",
        text: "Start with a whiteboard explanation of the user's value",
      },
      {
        id: "visual-system",
        sceneId: "visuals",
        text: "Then map the real renderer, timing, audio, and capture flow",
      },
      {
        id: "visual-evidence",
        sceneId: "visuals",
        text: "Finally, preserve the generated page and verified browser states as visual evidence",
      },
      {
        id: "sync",
        sceneId: "sync",
        text: "Explanation Beats bind spoken phrases to visual actions and evidence, while semantic time maps keep everything aligned",
      },
      {
        id: "qa",
        sceneId: "qa",
        text: "Deterministic quality checks catch blank frames, overflow, pacing, phrase alignment, and broken evidence references before rendering",
      },
      {
        id: "applications",
        sceneId: "applications",
        text: "Use the same evidence-led workflow for pull request reviews, tool comparisons, tutorial verification, concept explanations, product reviews, and skill evaluations",
      },
      {
        id: "closing",
        sceneId: "closing",
        text: "Seqvio turns agent work into explainer videos people can follow",
      },
    ],
  },
};
