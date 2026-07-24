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
const YELLOW = "#f0cf68";
const CYAN = "#7dd3fc";
const GREEN = "#86efac";
const AMBER = "#fbbf24";
const ROSE = "#fda4af";
const VIOLET = "#c4b5fd";
const MINT = "#5eead4";
const HAND_FONT =
  '"Virgil", "LXGW WenKai Lite", "Xiaolai", "Long Cang", "Microsoft YaHei", sans-serif';

const darkChalkTheme = {
  ...excalidrawTheme,
  colors: {
    ink: INK,
    accent: YELLOW,
    accent2: CYAN,
    muted: MUTED,
    surface: BG,
    cta: YELLOW,
    background: BG,
  },
  fontFamily: HAND_FONT,
  cjkHandwritingFamily: "Long Cang",
  textRender: "fill" as const,
  strokeWidth: 2.1,
  strokeWidthBold: 3,
  defaultBorderRadius: 13,
};

type Point = { x: number; y: number };
type SceneKind =
  | "hook"
  | "refund"
  | "independence"
  | "opensource"
  | "darkfactory"
  | "softwarefactory"
  | "ey"
  | "engineers";

interface SceneSpec {
  id: string;
  title: string;
  subtitle: string;
  kind: SceneKind;
  narration: string;
}

const scenes: SceneSpec[] = [
  {
    id: "hook",
    title: "比市场早两三年，和做错了没有区别",
    subtitle: "Matan Grinberg (Factory CEO) @ Sequoia Capital",
    kind: "hook",
    narration:
      "Factory的CEO Matan Grinberg说，比市场早两三年，和做错了没有区别。二零二三年四月，GPT-4刚刚发布一个月，企业还在犹豫要不要让工程师用GitHub Copilot，他就决定要造能全自主完成软件开发的AI智能体。他把这两年叫做沙漠之旅。期间他做了一个近乎不可能的决定，退还接近两百万美元的收入。而他的预言更激进：十二到二十四个月内，九成的编程token将变成异步执行，一个熄灯后软件自己在建造自己的黑暗工厂时代。今天我们用一条线，把这场Sequoia访谈串起来。",
  },
  {
    id: "refund",
    title: "退还全部收入",
    subtitle: "~$2M returned · NPS · 产品基因",
    kind: "refund",
    narration:
      "沙漠里最艰难的一站，是退钱。Factory做到了接近两百万美元的收入，但产品不够好。Matan说得很坦白：如果你擅长销售，当然能签到合同，但如果开发者不喜欢你的产品，那就是一颗定时炸弹，最终会炸得非常惨。于是他们主动把所有客户的钱，全部退了回去。当时团队里那些顶尖人才正收到各大AI实验室的巨额offer，告诉他们钱退了，是Matan做过最艰难的决定之一。支撑这个决定的逻辑是，没有安慰奖，你要么把事情做成了，要么没做成。他还说，发NPS调查没用，开发者用脚投票。Factory的产品基因也因此定下：不是以客户为中心，那是输入指标，真正的目标是造出让客户自己上瘾的东西。",
  },
  {
    id: "independence",
    title: "模型独立：反直觉的竞争优势",
    subtitle: "model-agnostic harness > model+harness co-design",
    kind: "independence",
    narration:
      "被问到Factory和Claude Code、Codex有什么不同，Matan给了一个反直觉的答案：模型独立。他说，企业不想让任何人成为他们的单一故障点，不想让任何人掌控命运。所有经历过云时代的企业都有心理阴影：当年AWS、Azure让你签三年合同给补贴，特别便宜，续约时直接涨十倍，你被锁死了。所以Factory的差异化是，企业能用到Claude Code或Codex的前沿性能，却不必把命运交给任何一个模型提供商。更微妙的论点是：同时训练模型又构建harness，并不会让它更好。一个支持多模型的harness，反而比只针对单一模型优化的更好。就像十年前以为该用个人数据训练个人助手，结果发现用整个互联网数据训练的模型，对每个人都更有帮助。数据之于模型，就像模型之于harness。",
  },
  {
    id: "opensource",
    title: "一半token，流向开源模型",
    subtitle: "GLM 5.2 · 前沿减一代",
    kind: "opensource",
    narration:
      "然后是一个让主持人惊呼的数据：Factory内部对工程师没有任何token限制，而大约一半的token，流向了开源模型。Matan说GLM 5.2非常出色，原因很简单，更快、更便宜，性能足够好。但他指出一个所有人都在犯的错：拿GLM 5.2去比最新的Opus 4.8或GPT 5.6，其实应该拿它去比上一代，因为开源模型通常落后一代。那么开源是否已经达到前沿减一代？答案是斩钉截铁的，是的。他给出一条轨迹：年初不到百分之一的token流向开源，第一季度变成个位数，现在已经超过两位数。他的预测是，绝大多数token会流向开源，但那百分之一最关键的决策token，永远用前沿模型。他打了个比方：给女儿找代数家教，不需要请爱因斯坦，找个高中生就够了。",
  },
  {
    id: "darkfactory",
    title: "从副驾驶模式，到黑暗工厂",
    subtitle: "90% async tokens in 12-24 months",
    kind: "darkfactory",
    narration:
      "整场对话最具冲击力的论断来了。Matan说，十二到二十四个月内，九成的编程token将是异步的。他解释，现在大部分AI编程还是同步的，如果所有开发者明天都病了，Claude Code和Codex的用量会直接归零，因为还是人下指令、AI做完回来等下一个。但真正的智能体原生时代不同：Droid会自己跑，从客户那里发现信号就自己去修，或者自己创建一个初版方案，不等人类启动。这个灵感来自特斯拉超级工厂，到处是机器臂自己在做事，没人在旁边拧螺丝，灯关着机器自己运作，这就是黑暗工厂。而Factory这个名字，正是来自Musk反复强调的，工厂本身就是制造机器的机器。软件开发正在走向同样的方向，在黑暗工厂里，软件自己在建造自己。",
  },
  {
    id: "softwarefactory",
    title: "软件工厂与企业的AGI时刻",
    subtitle: "every company is an AGI - Jack Dorsey",
    kind: "softwarefactory",
    narration:
      "如果软件自己建造自己，那企业该怎么组织？Matan有一套系统思考。他说，梳理一家公司怎么构建软件，你会发现大量隐性知识，要去问待了三十年的老师傅，要走各种审批和清单，高度依赖人的行为和冗余流程。软件工厂的目标，是把这些显性化：搞清楚什么信号决定构建什么功能，把开发流水线画出来，这样才能闭环，这个功能有没有带来更多留存。他做了个尖锐对比：公司裁员完全是拍脑袋，裁两万人看看会发生什么，没有任何科学，但训练模型时你会精确计算改变某个权重的影响。他引用Jack Dorsey的话，每家公司都是一个AGI，所以你应该像训练模型一样优化它的权重，哪些节点承重，哪些需要更多token。十年后回头看，今天凭感觉做功能的方式，会像古代不做会计一样不可思议。",
  },
  {
    id: "ey",
    title: "AI转型剧本：来自EY的惊喜",
    subtitle: "inside-out, not board-driven",
    kind: "ey",
    narration:
      "那么谁在真正转型成功？Matan给了一个令人意外的例子：安永EY。EY通常不被认为是AI前沿的公司，但他们决定不在这件事上迟到，说我们就冲进去，可能搞砸，但显然会尊重那些不能搞砸的东西，比如SEC监管，剩下的放手让工程师去试。Matan总结出一个规律：成功的AI转型来自内部，来自技术团队、一线工程师或内部领导层。如果动力来自董事会，问CEO你在AI方面做了什么，那通常不会有好结果。他还说，那些愿意承认会犯错、愿意主动改造现有流程、认为没有什么是神圣不可侵犯的公司，成功概率最高。",
  },
  {
    id: "engineers",
    title: "工程师不会消失",
    subtitle: "net win · eureka moments",
    kind: "engineers",
    narration:
      "最后，Matan明确驳斥了AI将取代工程师的论调。他说，短期内会有很多痛苦，很多公司在资源分配上做得很糟糕，有大量臃肿，纠偏的过程会很痛，这是所有AI CEO应该承担更多责任的事情。但长期看，工程师是世界上最优秀的系统思考者和问题解决者，世界上有无数可以用软件解决的问题，目前只有一小部分正在被解决，所以我们会把这些工程师重新配置到那些从未被解决的问题上去，这对世界是巨大的净收益。他的根本信念是，真正的智能体原生时代，不只是让工程师更高效，而是让软件在工厂里自己建造自己变成可能。当九成的代码编写变成异步后台任务，工程师终于能把整段整段的时间，投入那些真正需要深度思考的尤里卡时刻。",
  },
];

// Placeholder durations (frames); will be replaced with measured CosyVoice durations.
const SCENE_FRAMES = [933, 1205, 1275, 1287, 1296, 1326, 1072, 1265];
const sceneDurations = scenes.map((_, index) => SCENE_FRAMES[index] ?? 900);
const totalDuration = sceneDurations.reduce((sum, frames) => sum + frames, 0);

function sceneStartFrame(index: number): number {
  return sceneDurations.slice(0, index).reduce((sum, frames) => sum + frames, 0);
}

function opacity(frame: number, start: number, duration = 24): number {
  return Math.max(0, Math.min(1, (frame - start) / duration));
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <DrawText text={title} position={{ x: 70, y: 78 }} fontSize={42} fontWeight="bold" strokeColor={INK} start={8} duration={36} />
      <DrawText text={subtitle} position={{ x: 72, y: 122 }} fontSize={20} strokeColor={MUTED} start={42} duration={30} />
      <DrawShape type="line" from={{ x: 72, y: 148 }} to={{ x: 1208, y: 148 }} strokeColor={DIM} strokeWidth={1.4} start={70} duration={20} />
    </>
  );
}

function Label({ text, x, y, width, color = INK, start, size = 22, align = "center" }: { text: string; x: number; y: number; width: number; color?: string; start: number; size?: number; align?: "left" | "center" | "right" }) {
  return <DrawText text={text} position={{ x: align === "center" ? x + width / 2 : x, y }} align={align} fontSize={size} strokeColor={color} start={start} duration={28} />;
}

function Box({ label, x, y, w, h, color, start, size = 22 }: { label: string; x: number; y: number; w: number; h: number; color: string; start: number; size?: number }) {
  return (
    <>
      <DrawShape type="rounded-rectangle" position={{ x, y }} size={{ width: w, height: h }} strokeColor={color} strokeWidth={2.2} fillColor="none" start={start} duration={28} />
      <Label text={label} x={x + 12} y={y + h / 2 - size * 0.55} width={w - 24} color={color} start={start + 26} size={size} />
    </>
  );
}

function Arrow({ from, to, start, color = CYAN, width = 2.2 }: { from: Point; to: Point; start: number; color?: string; width?: number }) {
  return <DrawShape type="arrow" from={from} to={to} strokeColor={color} strokeWidth={width} start={start} duration={24} />;
}

function ChalkNote({ children, x, y, width, color = MUTED, start, size = 21 }: { children: React.ReactNode; x: number; y: number; width: number; color?: string; start: number; size?: number }) {
  const frame = useCurrentFrame();
  return <div style={{ position: "absolute", left: x, top: y, width, color, opacity: opacity(frame, start), fontFamily: HAND_FONT, fontSize: size, lineHeight: 1.45 }}>{children}</div>;
}

function BlackboardDust() {
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.018), transparent 56%)", opacity: 0.8 }} />;
}

function HookGraphic() {
  return (
    <>
      <Box label="2023.4  GPT-4 发布" x={70} y={250} w={300} h={78} color={MUTED} start={105} size={22} />
      <ChalkNote x={70} y={345} width={300} color={DIM} start={160} size={19}>企业还在犹豫要不要用 Copilot</ChalkNote>
      <Label text="沙漠之旅 · 2年" x={430} y={250} width={260} color={YELLOW} start={230} size={26} />
      <DrawShape type="line" from={{ x: 370, y: 289 }} to={{ x: 470, y: 289 }} strokeColor={YELLOW} strokeWidth={6} start={290} duration={30} />
      <DrawShape type="line" from={{ x: 650, y: 289 }} to={{ x: 760, y: 289 }} strokeColor={YELLOW} strokeWidth={6} start={330} duration={30} />
      <DrawShape type="circle" position={{ x: 542, y: 276 }} size={26} strokeColor={YELLOW} fillColor={YELLOW} start={370} duration={22} />
      <Box label="退还 ~$200万" x={440} y={330} w={240} h={70} color={ROSE} start={390} size={22} />
      <Box label="黑暗工厂" x={770} y={250} w={300} h={78} color={GREEN} start={470} size={24} />
      <ChalkNote x={770} y={345} width={300} color={MINT} start={540} size={19}>90% token 异步 · 熄灯自造</ChalkNote>
      <Label text="比市场早两三年 = 做错了" x={120} y={470} width={620} color={ROSE} start={600} size={27} />
      <Label text="从沙漠，到黑暗工厂" x={250} y={560} width={780} color={YELLOW} start={680} size={30} />
      <DrawShape type="underline" position={{ x: 290, y: 602 }} size={700} strokeColor={YELLOW} start={730} duration={26} />
    </>
  );
}

function RefundGraphic() {
  return (
    <>
      <Box label="收入 ~$200万" x={90} y={250} w={240} h={78} color={AMBER} start={105} size={24} />
      <Arrow from={{ x: 330, y: 289 }} to={{ x: 470, y: 289 }} start={170} color={ROSE} width={3.4} />
      <Label text="主动退还" x={320} y={250} width={170} color={ROSE} start={210} size={24} />
      <Box label="产品不够好" x={480} y={250} w={240} h={78} color={MUTED} start={260} size={24} />
      <DrawShape type="circle" position={{ x: 870, y: 232 }} size={92} strokeColor={ROSE} fillColor="none" start={330} duration={28} />
      <Label text="定时炸弹" x={833} y={262} width={170} color={ROSE} start={380} size={22} />
      <ChalkNote x={800} y={345} width={300} color={MUTED} start={430} size={19}>签了合同 · 开发者不喜欢 → 炸得很惨</ChalkNote>
      <Label text="没有安慰奖 · 成了，或没成" x={120} y={420} width={640} color={INK} start={500} size={26} />
      <ChalkNote x={120} y={465} width={640} color={DIM} start={560} size={20}>NPS 没用 · 开发者用脚投票</ChalkNote>
      <DrawShape type="rounded-rectangle" position={{ x: 120, y: 525 }} size={{ width: 1040, height: 110 }} strokeColor={YELLOW} strokeWidth={2.6} fillColor="none" start={640} duration={32} />
      <Label text="“造出让客户自己上瘾的东西。”" x={200} y={560} width={880} color={YELLOW} start={690} size={27} />
    </>
  );
}

function IndependenceGraphic() {
  const models: [string, string][] = [
    ["Claude", CYAN],
    ["Codex", VIOLET],
    ["GLM", GREEN],
  ];
  return (
    <>
      {models.map(([name, color], index) => {
        const x = 90 + index * 250;
        return (
          <React.Fragment key={name}>
            <Box label={name} x={x} y={235} w={200} h={62} color={String(color)} start={105 + index * 50} size={24} />
            <Arrow from={{ x: x + 100, y: 297 }} to={{ x: 600, y: 360 }} start={150 + index * 50} color={String(color)} width={2} />
          </React.Fragment>
        );
      })}
      <Box label="harness · 模型中立" x={470} y={355} w={280} h={80} color={YELLOW} start={300} size={24} />
      <Arrow from={{ x: 750, y: 395 }} to={{ x: 880, y: 395 }} start={360} color={GREEN} width={3.2} />
      <Box label="企业 · 命运自主" x={880} y={355} w={250} h={80} color={GREEN} start={400} size={22} />
      <DrawShape type="line" from={{ x: 945, y: 250 }} to={{ x: 1075, y: 320 }} strokeColor={ROSE} strokeWidth={2.4} start={470} duration={20} />
      <DrawShape type="line" from={{ x: 1075, y: 250 }} to={{ x: 945, y: 320 }} strokeColor={ROSE} strokeWidth={2.4} start={500} duration={20} />
      <Label text="单一锁定 ✗" x={905} y={210} width={200} color={ROSE} start={540} size={20} />
      <ChalkNote x={90} y={470} width={580} color={MUTED} start={600} size={20}>云时代伤疤：三年合同补贴 → 续约涨 10 倍，你被锁死</ChalkNote>
      <DrawShape type="rounded-rectangle" position={{ x: 700, y: 460 }} size={{ width: 470, height: 120 }} strokeColor={CYAN} strokeWidth={2.4} fillColor="none" start={660} duration={32} />
      <Label text="数据 : 模型  =  模型 : harness" x={720} y={492} width={430} color={CYAN} start={710} size={24} />
      <ChalkNote x={720} y={535} width={430} color={MUTED} start={760} size={19}>多模型 harness → 不 过拟合任何单一模型</ChalkNote>
    </>
  );
}

function OpensourceGraphic() {
  const bars: [string, string, number][] = [
    ["年初", "<1%", 26],
    ["Q1", "个位数", 70],
    ["现在", "两位数", 150],
    ["预测", "绝大多数", 230],
  ];
  return (
    <>
      <Label text="开源 token 份额轨迹" x={90} y={225} width={560} color={GREEN} start={105} size={24} align="left" />
      <DrawShape type="line" from={{ x: 120, y: 440 }} to={{ x: 640, y: 440 }} strokeColor={DIM} strokeWidth={2} start={150} duration={24} />
      {bars.map(([when, pct, h], index) => {
        const x = 130 + index * 130;
        return (
          <React.Fragment key={when}>
            <DrawShape type="rectangle" position={{ x, y: 440 - h }} size={{ width: 80, height: h }} strokeColor={GREEN} fillColor={GREEN} start={190 + index * 60} duration={24} />
            <Label text={pct} x={x - 10} y={440 - h - 34} width={100} color={GREEN} start={220 + index * 60} size={20} />
            <Label text={when} x={x - 10} y={452} width={100} color={MUTED} start={250 + index * 60} size={18} />
          </React.Fragment>
        );
      })}
      <Box label="GLM 5.2" x={720} y={235} w={200} h={66} color={AMBER} start={420} size={24} />
      <ChalkNote x={720} y={315} width={460} color={MUTED} start={470} size={20}>更快 · 更便宜 · 性能够用</ChalkNote>
      <Box label="比 Opus 4.7 / GPT 5.5（上一代）" x={720} y={360} w={460} h={64} color={CYAN} start={520} size={20} />
      <ChalkNote x={720} y={438} width={460} color={DIM} start={570} size={19}>别拿它比最新前沿 - 开源落后一代</ChalkNote>
      <Box label="爱因斯坦" x={120} y={560} w={170} h={66} color={ROSE} start={640} size={20} />
      <Arrow from={{ x: 290, y: 593 }} to={{ x: 360, y: 593 }} start={690} color={YELLOW} width={2.6} />
      <Box label="高中生家教" x={360} y={560} w={180} h={66} color={AMBER} start={720} size={20} />
      <ChalkNote x={560} y={560} width={400} color={MUTED} start={780} size={20}>1% 关键决策 → 前沿模型；其余 → 开源</ChalkNote>
    </>
  );
}

function DarkfactoryGraphic() {
  return (
    <>
      <Box label="同步：人 -> 指令 -> AI -> 等" x={70} y={235} w={360} h={70} color={MUTED} start={105} size={20} />
      <ChalkNote x={70} y={320} width={360} color={DIM} start={160} size={19}>开发者病了 → 用量归零</ChalkNote>
      <Arrow from={{ x: 440, y: 270 }} to={{ x: 540, y: 270 }} start={230} color={GREEN} width={3.4} />
      <Box label="异步：Droid 自己跑" x={540} y={235} w={340} h={70} color={GREEN} start={290} size={22} />
      <ChalkNote x={540} y={320} width={340} color={MINT} start={350} size={19}>发现信号 → 自己修 / 自己建初版</ChalkNote>
      <DrawShape type="rounded-rectangle" position={{ x: 920, y: 235 }} size={{ width: 260, height: 150 }} strokeColor={YELLOW} strokeWidth={2.6} fillColor="none" start={420} duration={32} />
      <Label text="黑暗工厂" x={940} y={258} width={220} color={YELLOW} start={470} size={24} />
      <DrawShape type="line" from={{ x: 950, y: 310 }} to={{ x: 1050, y: 310 }} strokeColor={YELLOW} strokeWidth={2.2} start={520} duration={18} />
      <DrawShape type="line" from={{ x: 970, y: 330 }} to={{ x: 1080, y: 330 }} strokeColor={YELLOW} strokeWidth={2.2} start={545} duration={18} />
      <ChalkNote x={930} y={350} width={240} color={MUTED} start={580} size={18}>灯关着 · 机器臂自己运作</ChalkNote>
      <Box label="90% 编程 token 异步 · 12-24 个月" x={300} y={415} w={680} h={74} color={AMBER} start={630} size={23} />
      <ChalkNote x={120} y={510} width={1040} color={CYAN} start={700} size={21}>灵感：特斯拉超级工厂 · “工厂本身就是制造机器的机器” - Musk</ChalkNote>
      <Label text="在黑暗工厂里，软件自己在建造自己" x={250} y={590} width={780} color={YELLOW} start={780} size={28} />
    </>
  );
}

function SoftwarefactoryGraphic() {
  const pipe: [string, string][] = [
    ["信号", CYAN],
    ["构建", AMBER],
    ["闭环 · 留存", GREEN],
  ];
  return (
    <>
      <Box label="隐性知识" x={70} y={235} w={220} h={70} color={MUTED} start={105} size={23} />
      <ChalkNote x={70} y={320} width={220} color={DIM} start={160} size={18}>30 年老师傅 · 审批 · 清单</ChalkNote>
      <Arrow from={{ x: 290, y: 270 }} to={{ x: 380, y: 270 }} start={230} color={YELLOW} width={3} />
      <Label text="显性化" x={300} y={235} width={120} color={YELLOW} start={270} size={22} />
      {pipe.map(([label, color], index) => {
        const x = 400 + index * 200;
        return (
          <React.Fragment key={label}>
            <Box label={label} x={x} y={235} w={170} h={70} color={String(color)} start={330 + index * 60} size={20} />
            {index < pipe.length - 1 && <Arrow from={{ x: x + 170, y: 270 }} to={{ x: x + 200, y: 270 }} start={370 + index * 60} color={YELLOW} />}
          </React.Fragment>
        );
      })}
      <DrawShape type="rounded-rectangle" position={{ x: 70, y: 400 }} size={{ width: 560, height: 150 }} strokeColor={ROSE} strokeWidth={2.4} fillColor="none" start={560} duration={32} />
      <Label text="裁员 = 拍脑袋 ✗" x={90} y={425} width={520} color={ROSE} start={610} size={24} />
      <ChalkNote x={90} y={475} width={520} color={MUTED} start={660} size={20}>“裁两万人看看会发生什么” · 没有任何科学</ChalkNote>
      <DrawShape type="rounded-rectangle" position={{ x: 670, y: 400 }} size={{ width: 510, height: 150 }} strokeColor={VIOLET} strokeWidth={2.4} fillColor="none" start={720} duration={32} />
      <Label text="每家公司 = 一个 AGI" x={690} y={425} width={470} color={VIOLET} start={770} size={24} />
      <ChalkNote x={690} y={475} width={470} color={MUTED} start={820} size={20}>像训练模型一样优化权重 · 精确算影响 ✓</ChalkNote>
      <Label text="今天凭感觉做功能 = 古代不做会计" x={250} y={590} width={780} color={YELLOW} start={880} size={26} />
    </>
  );
}

function EyGraphic() {
  const traits: [string, string][] = [
    ["承认会犯错", CYAN],
    ["主动改造流程", GREEN],
    ["没有神圣不可侵犯", AMBER],
  ];
  return (
    <>
      <Box label="董事会驱动" x={90} y={235} w={240} h={70} color={ROSE} start={105} size={23} />
      <Label text="✗ 通常没好结果" x={90} y={320} width={240} color={ROSE} start={160} size={22} />
      <Arrow from={{ x: 350, y: 270 }} to={{ x: 450, y: 270 }} start={230} color={GREEN} width={3.2} />
      <Box label="内部驱动" x={460} y={235} w={240} h={70} color={GREEN} start={290} size={24} />
      <ChalkNote x={460} y={320} width={260} color={MINT} start={350} size={20}>技术团队 · 一线 · 内部领导层</ChalkNote>
      <Box label="EY · 安永" x={770} y={235} w={340} h={70} color={AMBER} start={420} size={26} />
      <ChalkNote x={770} y={320} width={360} color={MUTED} start={470} size={20}>不迟到 · 尊重 SEC · 放手让工程师试</ChalkNote>
      {traits.map(([t, color], index) => {
        const x = 110 + index * 360;
        return <Box key={t} label={t} x={x} y={420} w={300} h={70} color={String(color)} start={560 + index * 60} size={22} />;
      })}
      <Label text="成功概率最高的公司" x={300} y={540} width={680} color={YELLOW} start={760} size={27} />
      <DrawShape type="underline" position={{ x: 340, y: 582 }} size={600} strokeColor={YELLOW} start={810} duration={26} />
    </>
  );
}

function EngineersGraphic() {
  return (
    <>
      <Box label="短期：痛苦 · 臃肿 · 纠偏" x={90} y={250} w={340} h={80} color={ROSE} start={105} size={22} />
      <Arrow from={{ x: 430, y: 290 }} to={{ x: 540, y: 290 }} start={180} color={GREEN} width={3.4} />
      <Label text="长期" x={440} y={250} width={120} color={GREEN} start={220} size={26} />
      <Box label="巨大的净收益" x={540} y={250} w={300} h={80} color={GREEN} start={280} size={26} />
      <ChalkNote x={540} y={345} width={340} color={MINT} start={340} size={20}>重新配置到从未被解决的问题</ChalkNote>
      <DrawShape type="rounded-rectangle" position={{ x: 900, y: 235 }} size={{ width: 280, height: 150 }} strokeColor={YELLOW} strokeWidth={2.6} fillColor="none" start={420} duration={32} />
      <Label text="工程师" x={930} y={258} width={220} color={YELLOW} start={470} size={24} />
      <Label text="最优秀的系统思考者" x={920} y={300} width={240} color={INK} start={520} size={20} />
      <Label text="问题解决者" x={920} y={335} width={240} color={INK} start={560} size={20} />
      <DrawShape type="star" position={{ x: 497, y: 387 }} size={86} strokeColor={YELLOW} fillColor="none" start={640} duration={30} />
      <Label text="尤里卡时刻" x={470} y={520} width={300} color={YELLOW} start={700} size={26} />
      <ChalkNote x={760} y={430} width={420} color={CYAN} start={760} size={21}>90% 代码变异步 → 整段时间投入深度思考</ChalkNote>
      <Label text="“让软件在工厂里自己建造自己。”" x={230} y={600} width={820} color={YELLOW} start={840} size={27} />
    </>
  );
}

function RenderGraphic({ kind }: { kind: SceneKind }) {
  switch (kind) {
    case "hook": return <HookGraphic />;
    case "refund": return <RefundGraphic />;
    case "independence": return <IndependenceGraphic />;
    case "opensource": return <OpensourceGraphic />;
    case "darkfactory": return <DarkfactoryGraphic />;
    case "softwarefactory": return <SoftwarefactoryGraphic />;
    case "ey": return <EyGraphic />;
    case "engineers": return <EngineersGraphic />;
    default: return null;
  }
}

function BlackboardScene({ spec }: { spec: SceneSpec }) {
  return (
    <WhiteboardScene width={W} height={H} texture="none" background={BG} theme={darkChalkTheme} singlePen={false}>
      <BlackboardDust />
      <Header title={spec.title} subtitle={spec.subtitle} />
      <RenderGraphic kind={spec.kind} />
    </WhiteboardScene>
  );
}

export default function FactorySoftwareBuildsItselfBlackboardZh() {
  return (
    <VideoComposition id="factory-software-builds-itself-blackboard-zh" width={W} height={H} fps={FPS} duration={totalDuration} backgroundColor={BG} audio={meta.audio}>
      {scenes.map((spec, index) => (
        <Scene key={spec.id} id={spec.id} duration={sceneDurations[index]}>
          <BlackboardScene spec={spec} />
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
      return { id: spec.id, sceneId: spec.id, text: spec.narration, startFrame, endFrame: startFrame + sceneDurations[index] };
    }),
  },
};
