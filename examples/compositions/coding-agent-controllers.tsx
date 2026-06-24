import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { Scene, VideoComposition } from '@seqvio/core';
import {
  DrawShape,
  DrawText,
  WhiteboardScene,
  excalidrawTheme,
  useCurrentFrame,
} from '@seqvio/whiteboard';

const W = 1280;
const H = 720;
const FPS = 24;
const BG = '#20201f';
const INK = '#f3f1e8';
const MUTED = '#aaa69b';
const DIM = '#706d64';
const ACCENT = '#f0cf68';
const CYAN = '#7dd3fc';
const GREEN = '#86efac';
const AMBER = '#fbbf24';
const ROSE = '#fda4af';
const VIOLET = '#c4b5fd';
const BLUE = '#93c5fd';
const MINT = '#5eead4';
const FLOW = '#9bd7ff';
const PALETTE = [CYAN, GREEN, AMBER, ROSE, VIOLET, BLUE, MINT];

const darkSketchTheme = {
  ...excalidrawTheme,
  colors: {
    ink: INK,
    accent: ACCENT,
    accent2: '#d8d3c5',
    muted: MUTED,
    surface: BG,
    cta: ACCENT,
    background: BG,
  },
  textRender: 'fill' as const,
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
  | 'hook'
  | 'harness'
  | 'rules'
  | 'skills'
  | 'hooks'
  | 'subagents'
  | 'mcp'
  | 'checkpoints'
  | 'verification'
  | 'closing';

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
    id: 'hook',
    title: '别再把 AI 当聊天框',
    subtitle: 'Coding Agent 真正变强的 7 个控制器',
    note: '从“问 AI”，升级到“设计 agent 的工作系统”。',
    kind: 'hook',
    duration: 780,
    narration:
      '今天的 coding agent，已经不是一个等你一句一句追问的聊天框。Cursor、Claude Code、Codex 这些工具真正变强的地方，不只是模型更聪明，而是它们周围开始出现一整套控制器。规则决定它记住什么。技能决定它怎样做事。钩子决定什么动作可以继续。子代理决定谁来写，谁来查。MCP 决定它能接触哪些真实系统。检查点让你可以回滚。验证循环让它不能只靠自信交差。这期视频，我们把这七个控制器拆开，看看怎样把 coding agent 从临时助手，变成更可靠的工程系统。',
  },
  {
    id: 'harness',
    title: '先看底层结构',
    subtitle: 'instructions + tools + model',
    note: '可靠性不只来自模型，而来自 harness 的设计。',
    kind: 'harness',
    duration: 700,
    narration:
      '先建立一个底层心智模型。一个 coding agent，不只是一个大模型。Cursor 文档把它拆成三块：指令、工具和模型。指令告诉它应该怎样理解项目。工具让它能搜索代码、读写文件、运行终端、打开浏览器。模型负责判断下一步。Claude 的文章也在强调类似的事情：不同控制方式的差别，不是名字好不好听，而是它们什么时候加载、占多少上下文、有没有权限、能不能隔离复杂任务。也就是说，真正要学的不是多背几个命令，而是学会设计 agent 的控制面。',
  },
  {
    id: 'rules',
    title: '1. Rules',
    subtitle: '长期上下文，不要每次重讲',
    note: '项目规则适合写稳定约定，不适合塞完整手册。',
    kind: 'rules',
    duration: 720,
    narration:
      '第一个控制器是规则。规则解决的是长期上下文问题。模型不会在两次完成之间天然保留记忆，所以项目里的稳定约定，需要被写进 Rules、CLAUDE.md，或者 AGENTS.md。比如：这个仓库怎样构建，生成物不能改，前端组件怎么组织，提交前要跑哪些测试。好规则应该短、具体、有作用域。Cursor 的规则可以 Always Apply，也可以按文件模式触发，也可以让 agent 根据描述自己拉取。关键是，不要把整本风格指南塞进去。规则越长，上下文成本越高，噪声也越大。最好的规则，通常来自 agent 反复犯过的真实错误。',
  },
  {
    id: 'skills',
    title: '2. Skills',
    subtitle: '把重复流程封装成工作流',
    note: '规则告诉它原则；技能告诉它怎么完整做完一件事。',
    kind: 'skills',
    duration: 720,
    narration:
      '第二个控制器是技能。规则更像长期约定，技能更像可复用的操作手册。一个 Skill 可以包含说明、脚本、模板、参考文件和素材。Cursor 的 Skills 文档强调了一个很重要的点：技能是渐进加载的。主文件先告诉 agent 什么时候用它，真正需要细节时，再去读 references、scripts 或 assets。这就比把所有知识都塞进系统提示更经济。比如这个视频项目里，Seqvio 技能会告诉 agent：怎样写 composition，怎样提取旁白，怎样合成 ElevenLabs，怎样用 resolved audio 对齐画面。技能的价值，是把一次成功经验变成下一次可复用的流程。',
  },
  {
    id: 'hooks',
    title: '3. Hooks',
    subtitle: '把护栏放进 agent loop',
    note: '钩子不是提示词，它可以观察、审计、阻断。',
    kind: 'hooks',
    duration: 720,
    narration:
      '第三个控制器是 Hooks。Hooks 的角色很像 agent loop 里的护栏和传感器。它可以在读文件前、改文件后、运行终端前、调用 MCP 前、子代理开始和结束时触发。你可以用它自动格式化文件，记录审计日志，扫描密钥，阻断危险命令，或者在会话开始时注入必要上下文。这里最关键的是权限。Cursor 的 hook 可以返回 allow、ask 或 deny。命令型 hook 甚至可以用退出码二阻断动作。换句话说，Hooks 不只是“提醒 agent 小心点”，它能把一部分组织策略变成可执行的边界。',
  },
  {
    id: 'subagents',
    title: '4. Subagents',
    subtitle: '把上下文和职责隔离',
    note: '复杂任务不要只靠一个 agent 自问自答。',
    kind: 'subagents',
    duration: 720,
    narration:
      '第四个控制器是子代理。子代理最重要的能力，不是听起来像多了几个人，而是上下文隔离。探索大型代码库、跑一串终端命令、操作浏览器，这些任务会产生大量中间输出。如果都塞进主对话，主 agent 很快就被日志淹没。子代理可以在自己的上下文里完成搜索、调试、验证，然后只把结论交回来。更实用的模式，是 maker 和 checker 分离。一个 agent 负责实现，另一个 agent 只负责怀疑：测试有没有真跑，边界条件有没有漏，改动有没有超范围。这样比让写代码的 agent 自己给自己打满分可靠得多。',
  },
  {
    id: 'mcp',
    title: '5. MCP',
    subtitle: '连接真实工具，也连接真实风险',
    note: '能接触外部系统之后，权限设计必须更认真。',
    kind: 'mcp',
    duration: 710,
    narration:
      '第五个控制器是 MCP，也就是 Model Context Protocol。它让 agent 能连接外部工具和数据源：数据库、Linear、Notion、Google Drive、浏览器、设计稿、内部 API，都可以变成 agent 可调用的工具或资源。这个能力会显著改变工作方式。以前 agent 只能说“你去查一下 issue”，现在它可以自己读取 issue、查日志、跑接口、附上证据。但 MCP 也把风险带进来了。Cursor 文档里明确提醒：验证来源，检查权限，限制 API key，审计服务器代码。对 coding agent 来说，工具越真实，权限边界就越重要。',
  },
  {
    id: 'checkpoints',
    title: '6. Checkpoints',
    subtitle: '探索可以大胆，回滚必须容易',
    note: '检查点是本地撤销；Git 仍然是长期版本控制。',
    kind: 'checkpoints',
    duration: 660,
    narration:
      '第六个控制器是检查点。coding agent 的一个现实特点是：它很适合探索，但探索一定会有走错的时候。Cursor 的 Checkpoints 会在 agent 做重要改动前保存本地快照，你可以在聊天时间线里预览并恢复。它和 Git 的角色不同。Git 是长期版本控制，适合留下历史和协作；Checkpoints 更像 agent 会话里的安全绳，适合快速回到某一步。这个能力会改变你使用 agent 的心理模型：你可以让它尝试一个重构方向，但前提是每一段探索都有清晰的回滚点。',
  },
  {
    id: 'verification',
    title: '7. Verification Loop',
    subtitle: '没有验证，agent 只是更快地产生输出',
    note: '让证据驱动下一轮，而不是让自信驱动结论。',
    kind: 'verification',
    duration: 760,
    narration:
      '第七个控制器，是验证循环。它不是某一个按钮，而是一种使用方式。Agent 先计划，再行动，然后观察工具结果，运行测试或检查，再根据证据更新下一步。验证可以很简单：build 是否通过，lint 是否通过，单元测试是否通过。也可以更贴近任务：页面截图是否正常，字幕是否对齐，生成视频有没有长静音，API 返回是否符合预期。重点是，每一轮都要留下证据。没有验证，agent 只是更快地产生更多输出。有了验证，它才知道什么时候重试，什么时候回滚，什么时候交给人类。',
  },
  {
    id: 'closing',
    title: '怎么开始',
    subtitle: '从一个重复错误开始，加一个控制器',
    note: '不要一次装满控制面；让真实问题决定下一层控制。',
    kind: 'closing',
    duration: 680,
    narration:
      '最后给一个最小实践建议。不要一上来就搭一整套复杂 agent 平台。先观察：agent 在你的项目里最常犯什么错？如果它总忘项目约定，先写一条规则。如果它总不会完整发布，做一个技能。如果它会运行危险命令，加 hook。如果任务太大，就拆给子代理。如果它需要真实系统，就接 MCP。如果你害怕探索失控，依赖检查点。如果它经常自信地说完成，就补验证循环。真正会用 coding agent 的人，不是把提示词写得越来越长，而是把控制器放在正确的位置，让系统每一次工作都更可检查、更可恢复、更可信。',
  },
];

const RESOLVED_EDGE_SCENE_FRAMES = [
  1006, 941, 1104, 1109, 995, 1051, 1075, 901, 1031, 1083,
];
const sceneDurations = scenes.map(
  (scene, index) => Math.max(scene.duration, RESOLVED_EDGE_SCENE_FRAMES[index] ?? 0)
);
const totalDuration = sceneDurations.reduce((sum, duration) => sum + duration, 0);

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

function Takeaway({ text }: { text: string }) {
  return (
    <>
      <DrawShape
        type="rounded-rectangle"
        position={{ x: 88, y: 618 }}
        size={{ width: 1104, height: 54 }}
        strokeColor={ACCENT}
        strokeWidth={1.8}
        fillColor="none"
        start={360}
        duration={28}
      />
      <DrawText
        text={text}
        position={{ x: 640, y: 653 }}
        align="center"
        fontSize={23}
        fontWeight="bold"
        strokeColor={ACCENT}
        start={390}
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
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        color,
        opacity: opacity(frame, start, 24),
        fontFamily: mono
          ? '"JetBrains Mono", Consolas, monospace'
          : '"Virgil", "LXGW WenKai Lite", "Microsoft YaHei", sans-serif',
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.15,
        textAlign: 'center',
        overflowWrap: 'anywhere',
      }}
    >
      {text}
    </div>
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
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        padding: '18px 22px',
        border: `2px dashed ${color}`,
        borderRadius: 14,
        color,
        opacity: opacity(frame, start, 24),
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize: 17,
        lineHeight: 1.55,
        boxSizing: 'border-box',
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
    case 'hook':
      return (
        <>
          <DrawShape
            type="rounded-rectangle"
            position={{ x: 160, y: 210 }}
            size={{ width: 960, height: 330 }}
            strokeColor={VIOLET}
            strokeWidth={2.4}
            fillColor="none"
            start={98}
            duration={30}
          />
          <FadeLabel text="coding agent control plane" x={416} y={230} width={450} color={VIOLET} start={125} size={26} mono />
          {['Rules', 'Skills', 'Hooks', 'Subagents', 'MCP', 'Checkpoints', 'Verify'].map((label, index) => {
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
                start={160 + index * 24}
                fontSize={21}
              />
            );
          })}
          <Arrow from={{ x: 590, y: 545 }} to={{ x: 590, y: 585 }} start={350} color={ACCENT} />
          <FadeLabel text="不是更长的提示词，而是更清楚的控制器" x={390} y={565} width={500} color={ACCENT} start={370} size={23} />
        </>
      );
    case 'harness':
      return (
        <>
          <Box label="instructions" x={120} y={320} w={230} h={92} color={BLUE} start={110} />
          <Arrow from={{ x: 360, y: 366 }} to={{ x: 500, y: 366 }} start={155} />
          <Box label="tools" x={515} y={320} w={230} h={92} color={AMBER} start={180} />
          <Arrow from={{ x: 755, y: 366 }} to={{ x: 895, y: 366 }} start={225} />
          <Box label="model" x={910} y={320} w={230} h={92} color={GREEN} start={250} />
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
          <FadeLabel text="agent harness" x={520} y={498} width={240} color={MUTED} start={335} size={23} mono />
        </>
      );
    case 'rules':
      return (
        <>
          <MiniFile
            title="AGENTS.md / CLAUDE.md"
            lines={['- build: npm run build', '- never edit dist/', '- run tests before done', '- frontend rules in /web']}
            x={120}
            y={260}
            w={420}
            color={BLUE}
            start={110}
          />
          <MiniFile
            title=".cursor/rules/*.mdc"
            lines={['alwaysApply: false', 'description: api conventions', 'globs: src/api/**/*.ts', 'content: focused guidance']}
            x={740}
            y={260}
            w={420}
            color={VIOLET}
            start={180}
          />
          <Arrow from={{ x: 545, y: 355 }} to={{ x: 730, y: 355 }} start={260} color={FLOW} />
          <Box label="persistent context" x={500} y={475} w={280} h={70} color={GREEN} start={310} />
        </>
      );
    case 'skills':
      return (
        <>
          <Box label="SKILL.md" x={110} y={310} w={190} h={82} color={MINT} start={105} />
          <Arrow from={{ x: 308, y: 351 }} to={{ x: 438, y: 351 }} start={145} />
          <Box label="scripts/" x={450} y={242} w={170} h={70} color={AMBER} start={170} />
          <Box label="references/" x={450} y={355} w={190} h={70} color={CYAN} start={205} />
          <Box label="assets/" x={450} y={468} w={170} h={70} color={ROSE} start={240} />
          <Arrow from={{ x: 648, y: 351 }} to={{ x: 785, y: 351 }} start={285} />
          <Box label="repeatable workflow" x={800} y={310} w={300} h={82} color={GREEN} start={310} />
          <FadeLabel text="progressive loading = lower context cost" x={390} y={548} width={500} color={MUTED} start={365} size={22} mono />
        </>
      );
    case 'hooks':
      return (
        <>
          <Box label="before read" x={105} y={245} w={190} h={66} color={BLUE} start={105} />
          <Box label="before shell" x={105} y={350} w={190} h={66} color={AMBER} start={145} />
          <Box label="after edit" x={105} y={455} w={190} h={66} color={GREEN} start={185} />
          <Arrow from={{ x: 305, y: 384 }} to={{ x: 505, y: 384 }} start={230} />
          <Box label="hook script" x={520} y={325} w={230} h={100} color={VIOLET} start={255} />
          <Arrow from={{ x: 760, y: 384 }} to={{ x: 890, y: 312 }} start={305} color={GREEN} />
          <Arrow from={{ x: 760, y: 384 }} to={{ x: 890, y: 384 }} start={325} color={AMBER} />
          <Arrow from={{ x: 760, y: 384 }} to={{ x: 890, y: 456 }} start={345} color={ROSE} />
          <Box label="allow" x={910} y={276} w={160} h={58} color={GREEN} start={370} fontSize={20} />
          <Box label="ask" x={910} y={381} w={160} h={58} color={AMBER} start={395} fontSize={20} />
          <Box label="deny" x={910} y={486} w={160} h={58} color={ROSE} start={420} fontSize={20} />
        </>
      );
    case 'subagents':
      return (
        <>
          <Box label="parent agent" x={500} y={225} w={260} h={78} color={INK} start={105} />
          <Arrow from={{ x: 585, y: 312 }} to={{ x: 285, y: 415 }} start={155} color={BLUE} />
          <Arrow from={{ x: 640, y: 312 }} to={{ x: 640, y: 415 }} start={175} color={AMBER} />
          <Arrow from={{ x: 695, y: 312 }} to={{ x: 995, y: 415 }} start={195} color={GREEN} />
          <Box label="explore" x={165} y={420} w={220} h={78} color={BLUE} start={225} />
          <Box label="maker" x={530} y={420} w={220} h={78} color={AMBER} start={255} />
          <Box label="checker" x={895} y={420} w={220} h={78} color={GREEN} start={285} />
          <FadeLabel text="separate context windows" x={422} y={538} width={430} color={MUTED} start={335} size={23} mono />
        </>
      );
    case 'mcp':
      return (
        <>
          <Box label="agent" x={520} y={320} w={240} h={92} color={ACCENT} start={105} />
          {[
            ['Linear', 150, 230],
            ['DB', 905, 230],
            ['Browser', 145, 470],
            ['Docs', 910, 470],
          ].map(([label, x, y], index) => (
            <React.Fragment key={label}>
              <Box label={String(label)} x={Number(x)} y={Number(y)} w={210} h={70} color={colorAt(index)} start={150 + index * 32} />
              <Arrow
                from={{ x: Number(x) + 105, y: Number(y) + 35 }}
                to={{ x: 640, y: 366 }}
                start={185 + index * 32}
                color={colorAt(index)}
              />
            </React.Fragment>
          ))}
          <DrawShape type="rounded-rectangle" position={{ x: 395, y: 225 }} size={{ width: 490, height: 285 }} strokeColor={DIM} strokeWidth={1.5} fillColor="none" start={315} duration={26} />
          <FadeLabel text="permissions / auth / audit" x={445} y={505} width={390} color={ROSE} start={345} size={22} mono />
        </>
      );
    case 'checkpoints':
      return (
        <>
          <Box label="checkpoint 1" x={155} y={300} w={215} h={76} color={BLUE} start={105} />
          <Arrow from={{ x: 378, y: 338 }} to={{ x: 520, y: 338 }} start={150} />
          <Box label="agent edits" x={535} y={300} w={215} h={76} color={AMBER} start={175} />
          <Arrow from={{ x: 758, y: 338 }} to={{ x: 900, y: 338 }} start={220} />
          <Box label="checkpoint 2" x={915} y={300} w={215} h={76} color={GREEN} start={245} />
          <Arrow from={{ x: 1020, y: 385 }} to={{ x: 660, y: 500 }} start={305} color={ROSE} />
          <Box label="restore" x={545} y={492} w={215} h={70} color={ROSE} start={330} />
          <FadeLabel text="local rollback != git history" x={410} y={230} width={460} color={MUTED} start={370} size={23} mono />
        </>
      );
    case 'verification':
      return (
        <>
          <Loop labels={['plan', 'act', 'observe', 'verify', 'update']} start={105} radius={175} />
          <MiniFile
            title="evidence"
            lines={['build: passed', 'tests: 42 passed', 'screenshot: ok', 'risk: auth edge case']}
            x={870}
            y={250}
            w={300}
            color={GREEN}
            start={310}
          />
        </>
      );
    case 'closing':
      return (
        <>
          <BulletList
            items={['总忘约定 -> 写 Rules', '重复流程 -> 做 Skills', '危险动作 -> 加 Hooks', '任务太大 -> 拆 Subagents', '需要真实系统 -> 接 MCP', '探索失控 -> 用 Checkpoints', '自信交差 -> 补 Verification']}
            x={190}
            y={215}
            start={105}
            gap={48}
          />
          <Box label="控制器放对位置，agent 才可靠" x={660} y={500} w={420} h={82} color={ACCENT} start={355} fontSize={24} />
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
      <Takeaway text={spec.note} />
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
        <Scene
          key={spec.id}
          id={spec.id}
          duration={sceneDurations[index]}
        >
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
