import React from "react";
import type { RenderableMeta } from "@seqvio/core";
import { Scene, VideoComposition } from "@seqvio/core";
import {
  DrawShape,
  DrawText,
  WhiteboardScene,
  excalidrawTheme,
  useCurrentFrame,
} from "@seqvio/whiteboard";

const W = 1280;
const H = 720;
const FPS = 24;
const BG = "#20201f";
const INK = "#f3f1e8";
const MUTED = "#aaa69b";
const DIM = "#706d64";
const ACCENT = "#f0cf68";
const CYAN = "#7dd3fc";
const GREEN = "#86efac";
const AMBER = "#fbbf24";
const ROSE = "#fda4af";
const VIOLET = "#c4b5fd";
const BLUE = "#93c5fd";
const MINT = "#5eead4";
const FLOW = "#9bd7ff";
const PALETTE = [CYAN, GREEN, AMBER, ROSE, VIOLET, BLUE, MINT];
const HAND_FONT_STACK =
  '"Virgil", "LXGW WenKai Lite", "Xiaolai", "Long Cang", "Microsoft YaHei", sans-serif';

const darkSketchTheme = {
  ...excalidrawTheme,
  colors: {
    ink: INK,
    accent: ACCENT,
    accent2: "#d8d3c5",
    muted: MUTED,
    surface: BG,
    cta: ACCENT,
    background: BG,
  },
  textRender: "fill" as const,
  strokeWidth: 2.1,
  strokeWidthBold: 2.8,
  defaultBorderRadius: 12,
  typeScale: {
    display: 68,
    h1: 48,
    h2: 32,
    body: 24,
    caption: 18,
  },
};

type Point = { x: number; y: number };

type SceneKind =
  | "hook"
  | "harness"
  | "rules"
  | "skills"
  | "hooks"
  | "subagents"
  | "mcp"
  | "checkpoints"
  | "verification"
  | "closing";

interface SceneSpec {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  kind: SceneKind;
  duration: number;
  narration: string;
}

const scenes: SceneSpec[] = [
  {
    id: "hook",
    title: "你的 AI 不是不聪明",
    subtitle: "它只是缺一套控制面",
    note: "问题不是“模型够不够强”，而是“工作有没有被控制”。",
    kind: "hook",
    duration: 900,
    narration:
      "如果你用过 Cursor、Claude Code，或者 Codex，你大概率遇到过这个瞬间：它前十分钟像天才，后十分钟突然开始乱改文件、忘记约定、跳过测试，然后非常自信地说完成了。很多人第一反应是，模型还不够强。可真正的问题通常不是智商，而是控制面不够清楚。一个可靠的 coding agent，不只是一个聊天框加一个终端。它需要七个控制器：Rules 决定它记住什么，Skills 决定它怎样完整做事，Hooks 决定哪些动作能继续，Subagents 把复杂任务隔开，MCP 连接真实系统，Checkpoints 让探索可回滚，Verification Loop 让结果必须拿证据说话。看完这期，你会知道为什么同一个模型，在有控制面的项目里像工程师，在没有控制面的项目里只是在高速猜答案。",
  },
  {
    id: "harness",
    title: "先拆开 agent",
    subtitle: "instructions + tools + model",
    note: "真正要设计的是 harness，不是更长的一段提示词。",
    kind: "harness",
    duration: 820,
    narration:
      "先把底层图像摆清楚。一个 coding agent，可以粗暴拆成三件事：instructions、tools、model。Instructions 告诉它这个项目怎么工作，Tools 让它能搜索代码、改文件、跑命令、看浏览器，Model 负责判断下一步。听起来简单，但失控也正是从这里开始的。指令太散，它会忘。工具权限太宽，它会乱碰。模型没有反馈，它会把猜测包装成结论。所以这期不是教你多背几个命令，而是回答一个更有用的问题：怎样给 agent 装上控制器，让它每一步都更可检查、更可恢复、更可信。",
  },
  {
    id: "rules",
    title: "1. Rules",
    subtitle: "先阻止它重复犯同一个错",
    note: "好规则来自真实错误，而不是把整本手册塞进上下文。",
    kind: "rules",
    duration: 860,
    narration:
      "第一个控制器是 Rules。它解决的不是“让 agent 变聪明”，而是让它别反复踩同一个坑。比如这个仓库必须先 build core，再 build whiteboard；生成物不要手改；改完视频旁白要重新提取音频 manifest；前端组件不能随便换设计系统。这些东西如果每次都靠你口头提醒，迟早会漏。Rules、CLAUDE.md、AGENTS.md 的价值，就是把稳定约定放到 agent 会自动看到的位置。但这里有一个反直觉点：规则不是越多越好。规则越长，上下文成本越高，噪声也越多。最好的规则通常很短，带作用域，而且来自一次真实翻车：它刚刚犯过什么错，你就把那个错固化成下一次的护栏。",
  },
  {
    id: "skills",
    title: "2. Skills",
    subtitle: "把“完整做完”写成流程",
    note: "规则告诉它原则；技能告诉它一步一步交付。",
    kind: "skills",
    duration: 900,
    narration:
      "第二个控制器是 Skills。Rules 适合写原则，Skills 适合写流程。差别很大。你告诉 agent“要做得专业”，它可能点头；你给它一个 skill，里面写清楚先读哪些参考文件、怎样改 composition、怎样提取 narration、怎样调用 cosyvoice-fastapi 配音、怎样用 resolved audio 对齐画面，它才更可能完整做完。更关键的是，Skill 可以渐进加载。主文件只告诉 agent 什么时候用，真的需要细节时，再读 scripts、references、assets。这样不会把全部知识一次塞进上下文。技能的本质，是把一次成功经验变成可复用的操作手册。下次不是重新祈祷 agent 懂你，而是让它沿着已经验证过的路线走。",
  },
  {
    id: "hooks",
    title: "3. Hooks",
    subtitle: "把提醒变成可执行边界",
    note: "钩子不是建议，它可以观察、审计、阻断。",
    kind: "hooks",
    duration: 820,
    narration:
      "第三个控制器是 Hooks。这里开始，事情从“提示词”进入“系统边界”。如果你只是写一句“不要运行危险命令”，agent 可能理解，也可能忘。但 hook 可以在它运行终端前真正拦一下，在改文件后自动格式化，在调用外部工具前记录审计日志，在发现密钥时直接阻断。它像 agent loop 里的传感器和闸门。更有意思的是，hook 不一定只会说不。它可以 allow，可以 ask，也可以 deny。也就是说，组织策略不必全部变成口头提醒，一部分可以变成可执行的流程。你不需要相信 agent 永远小心，你只需要把最危险的动作放进必须通过的检查点。",
  },
  {
    id: "subagents",
    title: "4. Subagents",
    subtitle: "别让一个上下文吞下所有任务",
    note: "复杂工作要隔离上下文，也要隔离职责。",
    kind: "subagents",
    duration: 850,
    narration:
      "第四个控制器是 Subagents。它最容易被误解成“多叫几个 AI 来干活”，但真正的价值是上下文隔离。想象一下，让一个 agent 同时搜索大型代码库、读二十个文件、跑一堆命令、再写实现、再审查自己。主对话很快就会被中间日志淹没。Subagent 可以把探索、实现、验证拆到不同上下文里，最后只把结论带回来。更实用的打法，是 maker 和 checker 分离。一个负责写，一个负责怀疑：测试有没有真的跑？边界条件有没有漏？改动有没有超范围？这比让同一个 agent 写完代码再给自己打满分，要可靠得多。",
  },
  {
    id: "mcp",
    title: "5. MCP",
    subtitle: "工具越真实，边界越重要",
    note: "MCP 让 agent 接入系统，也把权限风险带进系统。",
    kind: "mcp",
    duration: 840,
    narration:
      "第五个控制器是 MCP，也就是 Model Context Protocol。它回答的是另一个问题：如果 agent 需要真实系统里的信息，能不能别靠你截图、复制、转述？数据库、Linear、Notion、Google Drive、浏览器、设计稿、内部 API，都可以通过 MCP 变成 agent 能调用的工具或资源。工作方式会立刻变掉。以前它只能说“你去查一下 issue”，现在它可以自己读 issue、查日志、跑接口、把证据放进回答里。但这里也有反转：工具越真实，权限越危险。API key、数据范围、服务器代码、审计记录，都必须认真看。MCP 不是把 agent 放出去随便跑，而是给它开一扇有门禁、有日志、有边界的门。",
  },
  {
    id: "checkpoints",
    title: "6. Checkpoints",
    subtitle: "让探索有撤回键",
    note: "检查点适合会话内回滚；Git 仍然负责长期历史。",
    kind: "checkpoints",
    duration: 760,
    narration:
      "第六个控制器是 Checkpoints。coding agent 很适合探索，问题是探索一定会走错。它可能试一个重构方向，发现牵一发动全身；也可能改了一堆文件，最后只有一半方向是对的。Checkpoints 的价值，是在关键动作前留下本地快照，让你能从聊天时间线里预览和恢复。它不是 Git 的替代品。Git 适合长期版本控制、协作和历史；Checkpoints 更像会话里的撤回键，适合快速退回某一次 agent 尝试之前。这个控制器会改变你的心理负担：你可以允许 agent 更大胆地探索，因为每一段探索都有比较清楚的回滚点。",
  },
  {
    id: "verification",
    title: "7. Verification Loop",
    subtitle: "让证据结束对话",
    note: "没有验证，agent 只是更快地产生看似完成的输出。",
    kind: "verification",
    duration: 900,
    narration:
      "第七个控制器，是 Verification Loop。它不是某个按钮，而是一种结束任务的方式。一个没有验证循环的 agent，很容易把“我觉得完成了”当成完成。真正可靠的循环应该是：先计划，再行动，观察工具结果，运行检查，根据证据更新下一步。验证可以很普通：build 过了吗？lint 过了吗？测试真的跑了吗？也可以很贴近任务：页面截图有没有错位？字幕有没有对齐？生成视频有没有长静音？CosyVoice 合成出来的音频文件是不是非空，时长是不是匹配？重点不是仪式感，而是证据链。让证据驱动下一轮，而不是让 agent 的自信驱动结论。",
  },
  {
    id: "closing",
    title: "怎么开始",
    subtitle: "不要一次搭平台，先修一个失控点",
    note: "从真实问题加控制器，而不是从完整平台开始。",
    kind: "closing",
    duration: 820,
    narration:
      "最后，把这七个控制器收成一个最小实践。不要一上来就搭一整套 agent 平台。先问一个更小的问题：我的 agent 最常在哪一步失控？如果它总忘项目约定，先写 Rules。如果它总把发布流程做一半，做一个 Skill。如果它会碰危险命令，加 Hooks。如果任务太大、上下文太乱，拆 Subagents。如果它需要真实系统，接 MCP。如果你怕它探索过头，用 Checkpoints。如果它经常自信交差，就补 Verification Loop。真正会用 coding agent 的人，不是把提示词越写越长，而是把控制器放在正确的位置。模型负责推理，控制面负责让推理落在可检查、可恢复、可信的工程系统里。",
  },
];

const COSYVOICE_FALLBACK_SCENE_FRAMES = [
  1120, 980, 1040, 1100, 980, 1020, 1010, 910, 1080, 980,
];
const sceneDurations = scenes.map((scene, index) =>
  Math.max(scene.duration, COSYVOICE_FALLBACK_SCENE_FRAMES[index] ?? 0),
);
const totalDuration = sceneDurations.reduce(
  (sum, duration) => sum + duration,
  0,
);

function sceneStartFrame(index: number): number {
  let frame = 0;
  for (let i = 0; i < index; i++) frame += sceneDurations[i];
  return frame;
}

function opacity(frame: number, start: number, duration = 24): number {
  return Math.max(0, Math.min(1, (frame - start) / duration));
}

function colorAt(index: number): string {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <DrawText
        text={title}
        position={{ x: 70, y: 78 }}
        fontSize={42}
        fontWeight="bold"
        strokeColor={INK}
        start={8}
        duration={36}
      />
      <DrawText
        text={subtitle}
        position={{ x: 72, y: 122 }}
        fontSize={23}
        strokeColor={MUTED}
        start={42}
        duration={30}
      />
      <DrawShape
        type="line"
        from={{ x: 72, y: 148 }}
        to={{ x: 1208, y: 148 }}
        strokeColor={DIM}
        strokeWidth={1.4}
        start={70}
        duration={20}
      />
    </>
  );
}

function Takeaway({ text, start = 360 }: { text: string; start?: number }) {
  return (
    <>
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 88, y: 618 }}
        size={{ width: 1104, height: 54 }}
        strokeColor={ACCENT}
        strokeWidth={1.8}
        fillColor="none"
        start={start}
        duration={28}
      />
      <DrawText
        text={text}
        position={{ x: 640, y: 653 }}
        align="center"
        fontSize={23}
        fontWeight="bold"
        strokeColor={ACCENT}
        start={start + 30}
        duration={34}
      />
    </>
  );
}

function FadeLabel({
  text,
  x,
  y,
  width = 190,
  color = INK,
  start = 120,
  size = 22,
  mono = false,
}: {
  text: string;
  x: number;
  y: number;
  width?: number;
  color?: string;
  start?: number;
  size?: number;
  mono?: boolean;
}) {
  return (
    <DrawText
      text={text}
      position={{ x: x + width / 2, y }}
      align="center"
      fontSize={size}
      fontWeight="normal"
      font={
        mono
          ? '"JetBrains Mono", "SFMono-Regular", Consolas, monospace'
          : undefined
      }
      strokeColor={color}
      start={start}
      duration={30}
    />
  );
}

function Box({
  label,
  x,
  y,
  w,
  h,
  color,
  start,
  fontSize = 22,
}: {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  start: number;
  fontSize?: number;
}) {
  return (
    <>
      <DrawShape
        type="rounded-rectangle"
        position={{ x, y }}
        size={{ width: w, height: h }}
        strokeColor={color}
        strokeWidth={2.2}
        fillColor="none"
        start={start}
        duration={28}
      />
      <FadeLabel
        text={label}
        x={x + 14}
        y={y + h / 2 - fontSize / 1.8}
        width={w - 28}
        color={color}
        start={start + 26}
        size={fontSize}
      />
    </>
  );
}

function Arrow({
  from,
  to,
  start,
  color = FLOW,
}: {
  from: Point;
  to: Point;
  start: number;
  color?: string;
}) {
  return (
    <DrawShape
      type="arrow"
      from={from}
      to={to}
      strokeColor={color}
      strokeWidth={2.1}
      start={start}
      duration={22}
    />
  );
}

function BulletList({
  items,
  x,
  y,
  start,
  gap = 44,
}: {
  items: string[];
  x: number;
  y: number;
  start: number;
  gap?: number;
}) {
  return (
    <>
      {items.map((item, index) => (
        <React.Fragment key={item}>
          <DrawShape
            type="circle"
            position={{ x, y: y + index * gap - 8 }}
            size={12}
            strokeColor={colorAt(index)}
            fillColor={colorAt(index)}
            start={start + index * 26}
            duration={10}
          />
          <DrawText
            text={item}
            position={{ x: x + 26, y: y + index * gap }}
            fontSize={22}
            strokeColor={colorAt(index)}
            start={start + index * 26 + 10}
            duration={22}
          />
        </React.Fragment>
      ))}
    </>
  );
}

function MiniFile({
  title,
  lines,
  x,
  y,
  w,
  color,
  start,
}: {
  title: string;
  lines: string[];
  x: number;
  y: number;
  w: number;
  color: string;
  start: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        padding: "18px 22px",
        border: `2px dashed ${color}`,
        borderRadius: 14,
        color,
        opacity: opacity(frame, start, 24),
        fontFamily: HAND_FONT_STACK,
        fontSize: 17,
        lineHeight: 1.55,
        boxSizing: "border-box",
      }}
    >
      <div style={{ color: INK, marginBottom: 8 }}>{title}</div>
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function Loop({
  labels,
  center = { x: 640, y: 375 },
  radius = 180,
  start = 120,
}: {
  labels: string[];
  center?: Point;
  radius?: number;
  start?: number;
}) {
  const pts = labels.map((_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
  return (
    <>
      {labels.map((label, index) => {
        const next = pts[(index + 1) % pts.length];
        const current = pts[index];
        return (
          <React.Fragment key={label}>
            <Box
              label={label}
              x={current.x - 74}
              y={current.y - 36}
              w={148}
              h={72}
              color={colorAt(index)}
              start={start + index * 30}
              fontSize={20}
            />
            <Arrow
              from={{
                x: current.x + (next.x - current.x) * 0.25,
                y: current.y + (next.y - current.y) * 0.25,
              }}
              to={{
                x: current.x + (next.x - current.x) * 0.68,
                y: current.y + (next.y - current.y) * 0.68,
              }}
              start={start + index * 30 + 18}
              color={VIOLET}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

function RenderGraphic({ kind }: { kind: SceneKind }) {
  switch (kind) {
    case "hook":
      return (
        <>
          <DrawShape
            type="rounded-rectangle"
            position={{ x: 160, y: 210 }}
            size={{ width: 960, height: 330 }}
            strokeColor={VIOLET}
            strokeWidth={2.4}
            fillColor="none"
            start={76}
            duration={34}
          />
          <FadeLabel
            text="coding agent control plane"
            x={416}
            y={230}
            width={450}
            color={VIOLET}
            start={104}
            size={26}
            mono
          />
          {[
            "Rules",
            "Skills",
            "Hooks",
            "Subagents",
            "MCP",
            "Checkpoints",
            "Verify",
          ].map((label, index) => {
            const col = index % 4;
            const row = Math.floor(index / 4);
            return (
              <Box
                key={label}
                label={label}
                x={230 + col * 215}
                y={300 + row * 110}
                w={170}
                h={70}
                color={colorAt(index)}
                start={128 + index * 20}
                fontSize={21}
              />
            );
          })}
          <Arrow
            from={{ x: 590, y: 545 }}
            to={{ x: 590, y: 585 }}
            start={300}
            color={ACCENT}
          />
          <DrawText
            text="不是更长的提示词，而是更清楚的控制器"
            position={{ x: 640, y: 572 }}
            align="center"
            fontSize={23}
            fontWeight="normal"
            strokeColor={ACCENT}
            start={322}
            duration={30}
          />
        </>
      );
    case "harness":
      return (
        <>
          <Box
            label="instructions"
            x={120}
            y={320}
            w={230}
            h={92}
            color={BLUE}
            start={110}
          />
          <Arrow
            from={{ x: 360, y: 366 }}
            to={{ x: 500, y: 366 }}
            start={155}
          />
          <Box
            label="tools"
            x={515}
            y={320}
            w={230}
            h={92}
            color={AMBER}
            start={180}
          />
          <Arrow
            from={{ x: 755, y: 366 }}
            to={{ x: 895, y: 366 }}
            start={225}
          />
          <Box
            label="model"
            x={910}
            y={320}
            w={230}
            h={92}
            color={GREEN}
            start={250}
          />
          <DrawShape
            type="rounded-rectangle"
            position={{ x: 265, y: 235 }}
            size={{ width: 750, height: 270 }}
            strokeColor={DIM}
            strokeWidth={1.4}
            fillColor="none"
            start={310}
            duration={24}
          />
          <FadeLabel
            text="agent harness"
            x={520}
            y={498}
            width={240}
            color={MUTED}
            start={335}
            size={23}
            mono
          />
        </>
      );
    case "rules":
      return (
        <>
          <MiniFile
            title="AGENTS.md / CLAUDE.md"
            lines={[
              "- build: npm run build",
              "- never edit dist/",
              "- run tests before done",
              "- frontend rules in /web",
            ]}
            x={120}
            y={260}
            w={420}
            color={BLUE}
            start={110}
          />
          <MiniFile
            title=".cursor/rules/*.mdc"
            lines={[
              "alwaysApply: false",
              "description: api conventions",
              "globs: src/api/**/*.ts",
              "content: focused guidance",
            ]}
            x={740}
            y={260}
            w={420}
            color={VIOLET}
            start={180}
          />
          <Arrow
            from={{ x: 545, y: 355 }}
            to={{ x: 730, y: 355 }}
            start={260}
            color={FLOW}
          />
          <Box
            label="persistent context"
            x={500}
            y={475}
            w={280}
            h={70}
            color={GREEN}
            start={310}
          />
        </>
      );
    case "skills":
      return (
        <>
          <Box
            label="SKILL.md"
            x={110}
            y={310}
            w={190}
            h={82}
            color={MINT}
            start={105}
          />
          <Arrow
            from={{ x: 308, y: 351 }}
            to={{ x: 438, y: 351 }}
            start={145}
          />
          <Box
            label="scripts/"
            x={450}
            y={242}
            w={170}
            h={70}
            color={AMBER}
            start={170}
          />
          <Box
            label="references/"
            x={450}
            y={355}
            w={190}
            h={70}
            color={CYAN}
            start={205}
          />
          <Box
            label="assets/"
            x={450}
            y={468}
            w={170}
            h={70}
            color={ROSE}
            start={240}
          />
          <Arrow
            from={{ x: 648, y: 351 }}
            to={{ x: 785, y: 351 }}
            start={285}
          />
          <Box
            label="repeatable workflow"
            x={800}
            y={310}
            w={300}
            h={82}
            color={GREEN}
            start={310}
          />
          <FadeLabel
            text="progressive loading = lower context cost"
            x={390}
            y={548}
            width={500}
            color={MUTED}
            start={365}
            size={22}
            mono
          />
        </>
      );
    case "hooks":
      return (
        <>
          <Box
            label="before read"
            x={105}
            y={245}
            w={190}
            h={66}
            color={BLUE}
            start={105}
          />
          <Box
            label="before shell"
            x={105}
            y={350}
            w={190}
            h={66}
            color={AMBER}
            start={145}
          />
          <Box
            label="after edit"
            x={105}
            y={455}
            w={190}
            h={66}
            color={GREEN}
            start={185}
          />
          <Arrow
            from={{ x: 305, y: 384 }}
            to={{ x: 505, y: 384 }}
            start={230}
          />
          <Box
            label="hook script"
            x={520}
            y={325}
            w={230}
            h={100}
            color={VIOLET}
            start={255}
          />
          <Arrow
            from={{ x: 760, y: 384 }}
            to={{ x: 890, y: 312 }}
            start={305}
            color={GREEN}
          />
          <Arrow
            from={{ x: 760, y: 384 }}
            to={{ x: 890, y: 384 }}
            start={325}
            color={AMBER}
          />
          <Arrow
            from={{ x: 760, y: 384 }}
            to={{ x: 890, y: 456 }}
            start={345}
            color={ROSE}
          />
          <Box
            label="allow"
            x={910}
            y={276}
            w={160}
            h={58}
            color={GREEN}
            start={370}
            fontSize={20}
          />
          <Box
            label="ask"
            x={910}
            y={381}
            w={160}
            h={58}
            color={AMBER}
            start={395}
            fontSize={20}
          />
          <Box
            label="deny"
            x={910}
            y={486}
            w={160}
            h={58}
            color={ROSE}
            start={420}
            fontSize={20}
          />
        </>
      );
    case "subagents":
      return (
        <>
          <Box
            label="parent agent"
            x={500}
            y={225}
            w={260}
            h={78}
            color={INK}
            start={105}
          />
          <Arrow
            from={{ x: 585, y: 312 }}
            to={{ x: 285, y: 415 }}
            start={155}
            color={BLUE}
          />
          <Arrow
            from={{ x: 640, y: 312 }}
            to={{ x: 640, y: 415 }}
            start={175}
            color={AMBER}
          />
          <Arrow
            from={{ x: 695, y: 312 }}
            to={{ x: 995, y: 415 }}
            start={195}
            color={GREEN}
          />
          <Box
            label="explore"
            x={165}
            y={420}
            w={220}
            h={78}
            color={BLUE}
            start={225}
          />
          <Box
            label="maker"
            x={530}
            y={420}
            w={220}
            h={78}
            color={AMBER}
            start={255}
          />
          <Box
            label="checker"
            x={895}
            y={420}
            w={220}
            h={78}
            color={GREEN}
            start={285}
          />
          <FadeLabel
            text="separate context windows"
            x={422}
            y={538}
            width={430}
            color={MUTED}
            start={335}
            size={23}
            mono
          />
        </>
      );
    case "mcp":
      return (
        <>
          <Box
            label="agent"
            x={520}
            y={320}
            w={240}
            h={92}
            color={ACCENT}
            start={105}
          />
          {[
            ["Linear", 150, 230],
            ["DB", 905, 230],
            ["Browser", 145, 470],
            ["Docs", 910, 470],
          ].map(([label, x, y], index) => (
            <React.Fragment key={label}>
              <Box
                label={String(label)}
                x={Number(x)}
                y={Number(y)}
                w={210}
                h={70}
                color={colorAt(index)}
                start={150 + index * 32}
              />
              <Arrow
                from={{ x: Number(x) + 105, y: Number(y) + 35 }}
                to={{ x: 640, y: 366 }}
                start={185 + index * 32}
                color={colorAt(index)}
              />
            </React.Fragment>
          ))}
          <DrawShape
            type="rounded-rectangle"
            position={{ x: 395, y: 225 }}
            size={{ width: 490, height: 285 }}
            strokeColor={DIM}
            strokeWidth={1.5}
            fillColor="none"
            start={315}
            duration={26}
          />
          <FadeLabel
            text="permissions / auth / audit"
            x={445}
            y={505}
            width={390}
            color={ROSE}
            start={345}
            size={22}
            mono
          />
        </>
      );
    case "checkpoints":
      return (
        <>
          <Box
            label="checkpoint 1"
            x={155}
            y={300}
            w={215}
            h={76}
            color={BLUE}
            start={105}
          />
          <Arrow
            from={{ x: 378, y: 338 }}
            to={{ x: 520, y: 338 }}
            start={150}
          />
          <Box
            label="agent edits"
            x={535}
            y={300}
            w={215}
            h={76}
            color={AMBER}
            start={175}
          />
          <Arrow
            from={{ x: 758, y: 338 }}
            to={{ x: 900, y: 338 }}
            start={220}
          />
          <Box
            label="checkpoint 2"
            x={915}
            y={300}
            w={215}
            h={76}
            color={GREEN}
            start={245}
          />
          <Arrow
            from={{ x: 1020, y: 385 }}
            to={{ x: 660, y: 500 }}
            start={305}
            color={ROSE}
          />
          <Box
            label="restore"
            x={545}
            y={492}
            w={215}
            h={70}
            color={ROSE}
            start={330}
          />
          <FadeLabel
            text="local rollback != git history"
            x={410}
            y={230}
            width={460}
            color={MUTED}
            start={370}
            size={23}
            mono
          />
        </>
      );
    case "verification":
      return (
        <>
          <Loop
            labels={["plan", "act", "observe", "verify", "update"]}
            start={105}
            radius={175}
          />
          <MiniFile
            title="evidence"
            lines={[
              "build: passed",
              "tests: 42 passed",
              "screenshot: ok",
              "risk: auth edge case",
            ]}
            x={870}
            y={250}
            w={300}
            color={GREEN}
            start={310}
          />
        </>
      );
    case "closing":
      return (
        <>
          <BulletList
            items={[
              "总忘约定 -> 写 Rules",
              "重复流程 -> 做 Skills",
              "危险动作 -> 加 Hooks",
              "任务太大 -> 拆 Subagents",
              "需要真实系统 -> 接 MCP",
              "探索失控 -> 用 Checkpoints",
              "自信交差 -> 补 Verification",
            ]}
            x={190}
            y={215}
            start={105}
            gap={48}
          />
          <Box
            label="控制器放对位置，agent 才可靠"
            x={660}
            y={500}
            w={420}
            h={82}
            color={ACCENT}
            start={355}
            fontSize={24}
          />
        </>
      );
    default:
      return null;
  }
}

function ControllerScene({ spec }: { spec: SceneSpec }) {
  return (
    <WhiteboardScene
      width={W}
      height={H}
      texture="none"
      background={BG}
      theme={darkSketchTheme}
      singlePen={false}
    >
      <Header title={spec.title} subtitle={spec.subtitle} />
      <RenderGraphic kind={spec.kind} />
      <Takeaway text={spec.note} start={spec.kind === "hook" ? 332 : 360} />
    </WhiteboardScene>
  );
}

export default function CodingAgentControllers() {
  return (
    <VideoComposition
      id="coding-agent-controllers"
      width={W}
      height={H}
      fps={FPS}
      duration={totalDuration}
      backgroundColor={BG}
      audio={meta.audio}
    >
      {scenes.map((spec, index) => (
        <Scene key={spec.id} id={spec.id} duration={sceneDurations[index]}>
          <ControllerScene spec={spec} />
        </Scene>
      ))}
    </VideoComposition>
  );
}

export const meta: RenderableMeta = {
  fps: FPS,
  duration: totalDuration,
  width: W,
  height: H,
  audio: {
    fps: FPS,
    lockToAudio: true,
    narration: scenes.map((spec, index) => {
      const startFrame = sceneStartFrame(index);
      return {
        id: spec.id,
        sceneId: spec.id,
        text: spec.narration,
        startFrame,
        endFrame: startFrame + sceneDurations[index],
      };
    }),
  },
};
