import React from 'react';
import type { RenderableMeta } from '@seqvio/core';
import { Scene, Transition, VideoComposition } from '@seqvio/core';
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
const TRANSITION = 0;
const BASE_SCENE = 705;
const ANIMATION_SPAN = 540;
const AUDIO_SCENE_FRAMES = [
  682, 686, 702, 618, 653, 603, 651, 666, 607, 649, 635, 695, 619, 635, 607,
  635, 616,
];

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
const SOFT = '#b8b1ff';
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
  strokeWidth: 2.2,
  strokeWidthBold: 2.8,
  defaultBorderRadius: 12,
  typeScale: {
    display: 78,
    h1: 50,
    h2: 34,
    body: 24,
    caption: 18,
  },
};

type Point = { x: number; y: number };

interface SceneSpec {
  id: string;
  title: string;
  subtitle: string;
  note: string;
  narration: string;
  kind: string;
}

const scenes: SceneSpec[] = [
  {
    id: 'hook',
    title: 'Loop Engineering',
    subtitle: '从提示词，变成会自己推进的系统',
    note: '你不再反复催 agent；你设计催动 agent 的循环。',
    kind: 'hook',
    narration:
      '过去我们把重点放在写一个更好的提示词：给上下文，等结果，再补一句下一步。Loop engineering 说的是另一件事：把这件手动来回，升级成一个会发现任务、分派任务、验证结果、记录状态，并继续决定下一步的系统。',
  },
  {
    id: 'single-turn',
    title: '单次提示的问题',
    subtitle: 'prompt -> answer -> you -> prompt',
    note: '单轮交互靠人续命；循环把续命动作工程化。',
    kind: 'single',
    narration:
      '单次提示最大的瓶颈不是模型不会写代码，而是人始终站在回路中央。你要判断下一步，要提醒它项目习惯，要检查它有没有骗过自己。只要这些动作都靠你手动做，agent 就只是一个很强的工具，还不是一个稳定流程。',
  },
  {
    id: 'core-loop',
    title: '核心循环',
    subtitle: 'goal -> plan -> act -> observe -> verify -> update',
    note: '循环的关键不是“自动跑”，而是每一圈都有可检查的出口。',
    kind: 'cycle',
    narration:
      '一个最小循环通常从目标开始：先规划，再调用工具或修改代码，然后观察结果，运行测试或评审，最后把状态写下来。如果验证没有通过，它不是等人重新提示，而是带着新的观察进入下一圈，直到满足停止条件。',
  },
  {
    id: 'five-pieces',
    title: 'Addy 的五个部件',
    subtitle: 'automation / worktree / skill / connector / sub-agent',
    note: '再加一个外部状态文件，循环才不会每次失忆。',
    kind: 'five',
    narration:
      'Addy Osmani 把工程部件拆成五个：自动化提供心跳，工作树隔离并行修改，技能保存项目知识，插件和连接器让系统碰到真实工具，子代理把创作和检查分开。第六个看似普通却很重要：外部状态。',
  },
  {
    id: 'automation',
    title: '1. Automation',
    subtitle: '循环的心跳',
    note: '定时发现问题，自动进入 triage，而不是等你想起来。',
    kind: 'automation',
    narration:
      '自动化让循环真正成为循环。它可以每天扫描失败的 CI、整理 issue、寻找刚引入的 bug，或者定期生成进展简报。好的自动化不只是定时运行一段提示词，而是带着项目技能、明确的输入范围和可验证的输出条件运行。',
  },
  {
    id: 'worktrees',
    title: '2. Worktrees',
    subtitle: '并行不互相踩文件',
    note: '隔离不是奢侈品；多个 agent 同时工作时，它是安全带。',
    kind: 'worktrees',
    narration:
      '一旦多个 agent 同时工作，冲突就会变成主要失败模式。工作树把每个任务放进独立目录和分支，让一个 agent 的实验不会污染另一个 agent 的修复。机械冲突减少之后，人类评审的带宽才成为真正上限。',
  },
  {
    id: 'skills',
    title: '3. Skills',
    subtitle: '把项目知识写在循环外面',
    note: '不要让每次运行都重新猜测你的工程习惯。',
    kind: 'skills',
    narration:
      '技能解决的是意图债。项目怎么构建，哪些约定不能碰，怎样验证，一个新会话如果不知道，就会用自信的猜测补空。把这些写进技能后，循环每次都能从同一份知识开始，而不是从零重新推理。',
  },
  {
    id: 'connectors',
    title: '4. Connectors',
    subtitle: '循环碰到真实工具',
    note: '只看文件系统的 loop 很小；接上工具后才进入真实工作流。',
    kind: 'connectors',
    narration:
      '连接器和插件让循环不只会改本地文件。它可以读 issue tracker，查询数据库，检查 staging API，发消息，开 PR，关联工单。区别在于：agent 不再只是告诉你该怎么做，而是能在实际环境里完成闭环。',
  },
  {
    id: 'subagents',
    title: '5. Sub-agents',
    subtitle: 'maker != checker',
    note: '写代码的 agent，不应该单独给自己打满分。',
    kind: 'subagents',
    narration:
      '子代理最有价值的用法，是把生成者和检查者分开。一个 agent 负责提出方案和修改，另一个 agent 用不同指令、甚至不同模型做审查。这样可以抓到第一位 agent 说服了自己、却没有真正证明的地方。',
  },
  {
    id: 'state',
    title: '6. State / Memory',
    subtitle: '模型会忘，仓库不会',
    note: '状态不一定高级；Markdown、Linear、数据库都可以。',
    kind: 'state',
    narration:
      '长期循环需要外部记忆。它可以是 Markdown 文件、Linear 看板，或者数据库记录。重点是它不只存在于当前对话里。每次运行结束，都把已完成、下一步、失败原因和证据写在外面，下一次循环才能接着走。',
  },
  {
    id: 'langchain-core',
    title: 'LangChain: agent loop',
    subtitle: 'model + tools + observation + memory',
    note: '可靠 agent 不是一个模型，而是围绕任务设计的 harness。',
    kind: 'langcore',
    narration:
      'LangChain 的文章从 agent loop 讲起：模型决定下一步，工具执行动作，观察结果回到上下文，记忆保留必要状态。模型很重要，但可靠性来自 harness：你给它什么工具，怎么记录轨迹，什么时候继续，什么时候停。',
  },
  {
    id: 'verification',
    title: 'Verification Loop',
    subtitle: '测试、eval、trace、人类审查',
    note: '每一层循环都要能回答：这真的变好了吗？',
    kind: 'verify',
    narration:
      '第二层是验证循环。代码测试、静态检查、评测集、运行轨迹和人工审查，都可以成为判断依据。没有验证，循环只是更快地产生输出；有了验证，循环才知道什么时候重试，什么时候回滚，什么时候交给人。',
  },
  {
    id: 'events',
    title: 'Event-driven Loop',
    subtitle: 'cron / webhook / queue / inbox',
    note: '循环可以被时间触发，也可以被事件触发。',
    kind: 'events',
    narration:
      '第三层是事件驱动。循环不必只靠人按开始，它可以被定时任务、webhook、队列、CI 失败、客服消息或 triage inbox 触发。事件层决定工作从哪里来，也决定哪些发现需要排队、升级或者静默归档。',
  },
  {
    id: 'hill-climb',
    title: 'Hill-climbing Loop',
    subtitle: '生成多个候选 -> 评分 -> 保留更好的',
    note: '当目标可度量时，循环可以像爬坡一样迭代改进。',
    kind: 'hill',
    narration:
      '更高一层是 hill climbing。系统生成多个候选，用评分函数、评测结果或用户反馈比较它们，然后保留更好的版本继续变异。这个模式很强，但也很危险：指标如果错了，系统会非常努力地优化错东西。',
  },
  {
    id: 'control',
    title: '控制面',
    subtitle: 'budget / scope / stop condition / review',
    note: '越自动，越需要清晰边界。',
    kind: 'control',
    narration:
      'Loop engineering 不是把方向盘完全扔掉。越自动，越需要预算、作用域、权限、停止条件和审查点。token 成本、工具权限、失败重试次数、可修改文件范围，都应该是循环设计的一部分，而不是事故之后才补。',
  },
  {
    id: 'first-loop',
    title: '设计第一个 loop',
    subtitle: '从一个无聊、可验证、低风险的任务开始',
    note: '小循环跑稳，再叠加更复杂的循环。',
    kind: 'first',
    narration:
      '最好的第一个循环，不是全自动产品经理，而是一个无聊、重复、可验证、低风险的任务。比如每天整理失败测试，生成修复候选，跑测试，让检查者审阅，再把结论写进状态文件。先让小循环可信，再扩大边界。',
  },
  {
    id: 'closing',
    title: '结论',
    subtitle: 'Prompting is the interface. Loops are the system.',
    note: '提示词还在，但核心能力变成了设计可验证的循环。',
    kind: 'closing',
    narration:
      '所以，提示词没有消失，它变成了系统内部的一层接口。真正值得练习的是：怎样让目标、工具、验证、状态和人类审查形成闭环。未来的高杠杆工作，不只是会问 agent，而是会设计 agent 反复工作的环境。',
  },
];

const expandedNarration: Record<string, string> = {
  hook:
    ' 这和把一个很长的提示词塞给模型不一样。提示词解决的是一次回答的质量，循环解决的是一段工作的连续性。你可以把它想成一个小型操作系统：目标进入系统，工具产生变化，验证器检查变化，状态文件记录证据，然后下一轮根据证据继续推进。真正的变化是，人不再负责每一分钟的推动，而是负责设计边界、检查结果、调整策略。',
  'single-turn':
    ' 单轮交互的问题，在复杂任务里会被放大。第一轮模型也许写得不错，但第二轮它忘了哪些假设已经被证明，第三轮它可能绕开了失败的测试，第四轮它开始用看似合理的解释掩盖没有验证的事实。于是人类不断被拉回细节里：你要问它有没有跑测试，要提醒它别改无关文件，要重新讲一遍项目背景。这些不是智能不足，而是流程没有被工程化。',
  'core-loop':
    ' 这里最关键的是 observe 和 verify 这两个动作。Observe 是把工具反馈、错误日志、测试结果、用户评论看成新的输入；verify 是用明确标准判断结果是否足够好。很多自动化失败，不是因为它不会 act，而是因为它没有认真 observe，也没有强约束 verify。一个好循环应该能说清楚：这一圈为什么开始，做了什么，证据是什么，下一圈为什么值得继续。',
  'five-pieces':
    ' 这五个部件不是装饰，而是把 agent 从聊天框里搬到工程环境里的支架。自动化负责什么时候启动，工作树负责哪里修改，技能负责知道项目习惯，连接器负责接触真实系统，子代理负责分工和互相质疑。外部状态则像循环的日志本：它让下一次运行不必重新猜测上一轮发生了什么，也让人类可以审计每一步。',
  automation:
    ' 举个例子：每天早上，自动化可以读取昨晚失败的 CI，按失败类型归类，挑出一个最小可修复项，开一个隔离工作树，尝试修复，再把测试结果写入状态文件。如果失败，它不要假装完成，而是记录失败原因和下一步建议。这样的自动化看起来朴素，但它把“发现问题、尝试处理、留下证据”变成了稳定节奏。',
  worktrees:
    ' 在真实仓库里，隔离尤其重要。一个 agent 在改认证逻辑，另一个在补测试，第三个在更新文档，如果它们共享同一个工作目录，很快就会互相踩文件，最后没有人知道哪个改动引入了问题。工作树让每个假设都有自己的空间：可以大胆尝试，可以独立跑测试，也可以只把通过验证的结果合并回来。',
  skills:
    ' 技能最好写得像项目里的操作手册，而不是抽象宣言。比如：安装依赖用什么命令，渲染视频用什么参数，哪些目录是生成物，哪些文件不要碰，失败时先看哪份日志。它还可以记录审美原则，比如叙事视频不能有长静音，参考视频要分析图形语言，文字不能超出边框。这样 agent 每次醒来，都能站在同一套经验上工作。',
  connectors:
    ' 连接器的价值在于闭环。没有连接器，agent 只能说“你应该去 Linear 查一下这个 issue”，或者“你应该在 Slack 里通知某个人”。有了连接器，它可以自己读 issue 的上下文，查 staging API 的响应，附上测试日志，创建 PR，再把摘要发回团队频道。当然，这也意味着权限设计要更严格：能读什么，能写什么，什么动作必须先经过人类确认。',
  subagents:
    ' maker-checker 分离可以显著降低自我确认偏差。写代码的 agent 天然倾向于解释自己的方案为什么合理；检查者则应该被要求从失败模式出发：边界条件是什么，测试是否真的覆盖，日志是否支持结论，有没有改动超出任务范围。更进一步，还可以让一个 agent 负责生成多个候选，另一个只负责评分和挑错。',
  state:
    ' 状态文件不需要神秘。一个简单的 STATE.md 就够有用：当前目标、已经尝试过的方案、通过的验证、失败的命令、剩余风险、下一步建议。它的价值是跨会话、跨代理、跨时间。没有外部状态，循环每次启动都像第一次见到项目；有了状态，循环可以承认历史，避免重复劳动，也让人类更容易接管。',
  'langchain-core':
    ' LangChain 文章里强调的 agent loop，可以理解为模型、工具、观察和记忆之间的协议。模型不是孤立地“想一想”，它要基于上下文选择工具；工具不是黑箱，它必须返回可被观察的结果；观察不是闲聊，它会进入下一步决策；记忆也不是无限聊天记录，而是为了任务保留必要状态。可靠性来自这些环节的契约。',
  verification:
    ' 验证循环可以分层设计。最低层是命令是否成功，比如 build、lint、unit test。再上一层是行为是否正确，比如截图是否非空、字幕是否对齐、接口返回是否符合预期。更高一层是质量是否变好，比如可读性、用户体验、解释是否清楚。不同层级的验证不能互相替代：测试通过不等于讲得清楚，画面漂亮也不等于逻辑正确。',
  events:
    ' 事件层决定循环从哪里得到工作。cron 适合定期巡检，webhook 适合响应外部变化，队列适合削峰和重试，inbox 适合把模糊请求先归类。一个成熟系统不会把所有事件都立刻执行，它会判断优先级、风险和权限。有些事件可以自动处理，有些只生成候选方案，有些必须升级给人类。',
  'hill-climb':
    ' hill climbing 在可度量任务里很有用，比如优化提示词、改进检索召回、调整视频节奏、比较多个 UI 方案。系统可以生成几个版本，跑同一组评测，保留分数更好的版本继续迭代。但这里最容易出问题的是指标。指标如果只看速度，系统可能牺牲正确性；指标如果只看通过率，系统可能学会绕过真实问题。',
  control:
    ' 控制面是把自动化变得可控的地方。预算限制防止循环无限消耗 token 和时间；作用域限制防止 agent 改到不该改的文件；权限限制防止工具调用越界；停止条件让系统知道什么时候交付；审查点让高风险动作回到人类手里。好的控制面不是束缚智能，而是让智能可以被安全地放大。',
  'first-loop':
    ' 这个第一个循环应该足够小，小到你能清楚判断它有没有成功。比如“每天找出一个失败测试并生成诊断报告”，比“自动修完整个项目”更适合起步。先让它稳定读取输入，稳定运行命令，稳定写状态，稳定接受检查。等这个小循环可信之后，再逐步增加修复、开 PR、通知团队等能力。',
  closing:
    ' 所以 loop engineering 的核心不是追求完全无人参与，而是重新安排人和系统的分工。人设计目标、边界、验证和审查；agent 负责在边界内反复执行、观察和记录。提示词仍然重要，但它只是循环里的一个接口。真正的杠杆来自可验证、可恢复、可审计、可持续运行的工作环境。',
};

const productionScenes = scenes.map((scene) => ({
  ...scene,
  narration: `${scene.narration}${expandedNarration[scene.id] ?? ''}`,
}));

const sceneDurations = productionScenes.map((_, index) => AUDIO_SCENE_FRAMES[index]);
const totalDuration =
  sceneDurations.reduce((sum, duration) => sum + duration, 0) +
  (productionScenes.length - 1) * TRANSITION;

function sceneStartFrame(index: number): number {
  let frame = 0;
  for (let i = 0; i < index; i++) {
    frame += sceneDurations[i] + TRANSITION;
  }
  return frame;
}

function t(frame: number): number {
  return Math.round((frame / BASE_SCENE) * ANIMATION_SPAN);
}

function d(frames: number): number {
  return Math.max(1, Math.round((frames / BASE_SCENE) * ANIMATION_SPAN));
}

function colorAt(index: number): string {
  return PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

function colorFor(value = ''): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return colorAt(hash);
}

function alpha(hex: string, opacityValue: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacityValue})`;
}

function opacity(frame: number, start: number, duration = 24): number {
  return Math.max(0, Math.min(1, (frame - start) / duration));
}

function iconForLabel(label: string): string {
  const value = label.toLowerCase();
  if (value.includes('prompt') || value.includes('skill') || value.includes('state')) return 'document';
  if (value.includes('you') || value.includes('human')) return 'person';
  if (value.includes('agent') || value.includes('maker') || value.includes('planner')) return 'robot';
  if (value.includes('checker') || value.includes('verify') || value.includes('verified') || value.includes('accept') || value.includes('fix') || value.includes('test')) return 'check';
  if (value.includes('answer') || value.includes('code') || value.includes('api') || value.includes('tools') || value.includes('refactor')) return 'screen';
  if (value.includes('schedule') || value.includes('cron')) return 'calendar';
  if (value.includes('discover') || value.includes('observe') || value.includes('trace')) return 'magnify';
  if (value.includes('repo') || value.includes('worktree') || value.includes('branch')) return 'branch';
  if (value.includes('db') || value.includes('memory')) return 'database';
  if (value.includes('slack') || value.includes('inbox')) return 'message';
  if (value.includes('score') || value.includes('budget')) return 'gauge';
  if (value.includes('variant')) return 'spark';
  if (value.includes('loop') || value.includes('resume') || value.includes('update')) return 'cycle';
  if (value.includes('goal') || value.includes('task')) return 'target';
  if (value.includes('plan')) return 'map';
  if (value.includes('act') || value.includes('run')) return 'bolt';
  return 'node';
}

function IconGlyph({
  icon,
  cx,
  cy,
  size,
  color,
  start,
}: {
  icon: string;
  cx: number;
  cy: number;
  size: number;
  color: string;
  start: number;
}) {
  const frame = useCurrentFrame();
  const o = opacity(frame, t(start), d(24));
  const s = size / 96;
  const x = cx - 48 * s;
  const y = cy - 48 * s;
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const thin = { ...common, strokeWidth: 3 };

  let glyph: React.ReactNode;
  switch (icon) {
    case 'person':
      glyph = (
        <>
          <path {...common} d="M38 34 C37 20 58 18 61 31 C63 40 58 49 49 50 C41 51 37 44 38 34 Z" />
          <path {...common} d="M31 76 C32 61 39 54 49 54 C61 54 68 61 69 76" />
          <path {...thin} d="M36 72 L62 72" />
        </>
      );
      break;
    case 'robot':
      glyph = (
        <>
          <rect {...common} x="24" y="34" width="48" height="34" rx="15" />
          <path {...common} d="M48 34 L48 24" />
          <circle {...common} cx="48" cy="20" r="3" />
          <circle {...thin} cx="38" cy="51" r="4" />
          <circle {...thin} cx="58" cy="51" r="4" />
          <path {...thin} d="M40 62 C45 66 52 66 57 62" />
          <path {...thin} d="M22 45 L16 39 M74 45 L80 39" />
        </>
      );
      break;
    case 'screen':
      glyph = (
        <>
          <rect {...common} x="18" y="24" width="60" height="42" rx="5" />
          <path {...thin} d="M28 36 L40 36 M28 46 L48 46 M28 56 L38 56" />
          <path {...thin} d="M56 42 L50 48 L56 54 M63 42 L69 48 L63 54" />
          <path {...thin} d="M42 74 L54 74 M48 66 L48 74" />
        </>
      );
      break;
    case 'document':
      glyph = (
        <>
          <path {...common} d="M30 18 H58 L72 32 V78 H30 Z" />
          <path {...thin} d="M58 18 V33 H72" />
          <path {...thin} d="M40 43 H62 M40 54 H58 M40 65 H53" />
        </>
      );
      break;
    case 'calendar':
      glyph = (
        <>
          <rect {...common} x="22" y="26" width="56" height="50" rx="8" />
          <path {...thin} d="M22 40 H78 M36 20 V31 M64 20 V31" />
          <path {...thin} d="M36 52 H39 M49 52 H52 M62 52 H65 M36 64 H39 M49 64 H52" />
        </>
      );
      break;
    case 'magnify':
      glyph = (
        <>
          <circle {...common} cx="44" cy="43" r="22" />
          <path {...common} d="M61 60 L77 76" />
          <path {...thin} d="M36 42 C39 34 49 31 57 36" />
        </>
      );
      break;
    case 'branch':
      glyph = (
        <>
          <circle {...common} cx="29" cy="28" r="8" />
          <circle {...common} cx="67" cy="28" r="8" />
          <circle {...common} cx="48" cy="70" r="8" />
          <path {...common} d="M32 36 C35 54 43 55 48 62" />
          <path {...common} d="M64 36 C61 54 53 55 48 62" />
        </>
      );
      break;
    case 'database':
      glyph = (
        <>
          <ellipse {...common} cx="48" cy="27" rx="25" ry="10" />
          <path {...common} d="M23 27 V67 C23 73 34 79 48 79 C62 79 73 73 73 67 V27" />
          <path {...thin} d="M23 47 C23 53 34 59 48 59 C62 59 73 53 73 47" />
        </>
      );
      break;
    case 'message':
      glyph = (
        <>
          <path {...common} d="M20 27 H76 V62 H49 L34 76 V62 H20 Z" />
          <path {...thin} d="M33 42 H64 M33 53 H54" />
        </>
      );
      break;
    case 'check':
      glyph = (
        <>
          <circle {...common} cx="48" cy="48" r="30" />
          <path {...common} d="M32 49 L43 61 L66 36" />
          <path {...thin} d="M70 22 L78 14 M76 32 L88 30" />
        </>
      );
      break;
    case 'gauge':
      glyph = (
        <>
          <path {...common} d="M22 65 C23 39 34 25 49 25 C64 25 75 39 76 65" />
          <path {...thin} d="M31 61 H66 M48 60 L62 43" />
          <circle {...thin} cx="48" cy="60" r="4" />
        </>
      );
      break;
    case 'spark':
      glyph = (
        <>
          <path {...common} d="M48 16 L55 39 L78 48 L55 56 L48 80 L39 56 L18 48 L39 39 Z" />
          <path {...thin} d="M24 22 L30 29 M70 20 L64 30 M75 73 L67 65" />
        </>
      );
      break;
    case 'cycle':
      glyph = (
        <>
          <path {...common} d="M67 34 C56 21 33 25 27 43" />
          <path {...common} d="M29 35 L27 43 L35 42" />
          <path {...common} d="M29 62 C41 76 63 71 69 53" />
          <path {...common} d="M67 61 L69 53 L61 54" />
        </>
      );
      break;
    case 'target':
      glyph = (
        <>
          <circle {...common} cx="48" cy="48" r="30" />
          <circle {...thin} cx="48" cy="48" r="17" />
          <circle {...thin} cx="48" cy="48" r="5" />
          <path {...thin} d="M76 20 L61 35 M76 20 H64 M76 20 V32" />
        </>
      );
      break;
    case 'map':
      glyph = (
        <>
          <path {...common} d="M20 30 L40 22 L58 30 L76 22 V68 L58 76 L40 68 L20 76 Z" />
          <path {...thin} d="M40 22 V68 M58 30 V76" />
        </>
      );
      break;
    case 'bolt':
      glyph = (
        <path {...common} d="M54 14 L26 52 H47 L39 82 L70 40 H50 Z" />
      );
      break;
    default:
      glyph = (
        <>
          <circle {...common} cx="48" cy="48" r="28" />
          <path {...thin} d="M33 49 H63 M48 34 V64" />
        </>
      );
  }

  return (
    <svg
      width={W}
      height={H}
      style={{ position: 'absolute', inset: 0, opacity: o, overflow: 'visible' }}
    >
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path
          d="M18 48 C18 23 73 16 80 42 C88 72 33 87 20 62 C17 56 17 52 18 48 Z"
          fill={alpha(color, 0.065)}
          stroke={alpha(color, 0.7)}
          strokeWidth={2.4}
          strokeDasharray={icon === 'node' ? '8 7' : undefined}
        />
        {glyph}
      </g>
    </svg>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <DrawText
        text={title}
        position={{ x: 70, y: 86 }}
        fontSize={46}
        fontWeight="bold"
        strokeColor={INK}
        start={t(0)}
        duration={d(30)}
      />
      <DrawText
        text={subtitle}
        position={{ x: 72, y: 130 }}
        fontSize={22}
        strokeColor={MUTED}
        start={t(30)}
        duration={d(28)}
      />
      <DrawShape
        type="line"
        from={{ x: 70, y: 156 }}
        to={{ x: 1210, y: 156 }}
        strokeColor={DIM}
        strokeWidth={1.4}
        start={t(58)}
        duration={d(18)}
      />
    </>
  );
}

function Takeaway({ text }: { text: string }) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 76,
        right: 76,
        bottom: 36,
        color: INK,
        fontSize: 23,
        lineHeight: 1.35,
        fontFamily: '"Long Cang", "Microsoft YaHei", sans-serif',
        opacity: opacity(frame, t(505), d(36)),
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        textAlign: 'left',
      }}
    >
      {text}
    </div>
  );
}

function DashedBox({
  x,
  y,
  w,
  h,
  label,
  start,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  start: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const o = opacity(frame, t(start), d(28));
  const lineColor = color ?? colorFor(label ?? `${x}-${y}`);
  return (
    <svg
      width={W}
      height={H}
      style={{ position: 'absolute', inset: 0, opacity: o, overflow: 'visible' }}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={18}
        fill={alpha(lineColor, 0.025)}
        stroke={lineColor}
        strokeWidth={2}
        strokeDasharray="10 10"
      />
      {label ? (
        <text
          x={x + 18}
          y={y + 28}
          fill={lineColor}
          fontSize={16}
          fontFamily='"Virgil", "Microsoft YaHei", sans-serif'
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}

function CurvedArrow({
  from,
  to,
  start,
  label,
  color = FLOW,
}: {
  from: Point;
  to: Point;
  start: number;
  label?: string;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const p = opacity(frame, t(start), d(32));
  const cx = (from.x + to.x) / 2;
  const cy = Math.min(from.y, to.y) - 80;
  const pathD = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  return (
    <svg
      width={W}
      height={H}
      style={{ position: 'absolute', inset: 0, opacity: p, overflow: 'visible' }}
    >
      <defs>
        <marker
          id={`arrow-${from.x}-${to.x}-${start}`}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill={color} />
        </marker>
      </defs>
      <path
        d={pathD}
        stroke={color}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
        markerEnd={`url(#arrow-${from.x}-${to.x}-${start})`}
      />
      {label ? (
        <text x={cx - 42} y={cy - 10} fill={color} fontSize={18}>
          {label}
        </text>
      ) : null}
    </svg>
  );
}

function Node({
  label,
  x,
  y,
  start,
  width = 182,
  height = 72,
  color,
}: {
  label: string;
  x: number;
  y: number;
  start: number;
  width?: number;
  height?: number;
  color?: string;
}) {
  const frame = useCurrentFrame();
  const nodeColor = color ?? colorFor(label);
  const centerX = x + width / 2;
  const centerY = y + Math.min(48, height / 2);
  const iconSize = Math.max(58, Math.min(92, Math.min(width * 0.48, height + 20)));
  const labelOpacity = opacity(frame, t(start + 18), d(18));
  return (
    <>
      <IconGlyph
        icon={iconForLabel(label)}
        cx={centerX}
        cy={centerY}
        size={iconSize}
        color={nodeColor}
        start={start}
      />
      <div
        style={{
          position: 'absolute',
          left: centerX - width / 2,
          top: y + height + 10,
          width,
          color: nodeColor,
          fontFamily: '"Virgil", "Microsoft YaHei", sans-serif',
          fontSize: Math.min(21, Math.max(15, width / Math.max(8, label.length) * 1.45)),
          fontWeight: 700,
          lineHeight: 1.12,
          textAlign: 'center',
          overflowWrap: 'anywhere',
          opacity: labelOpacity,
        }}
      >
        {label}
      </div>
    </>
  );
}

function BulletList({
  items,
  x,
  y,
  start,
  gap = 58,
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
            start={t(start + index * 24)}
            duration={d(10)}
          />
          <DrawText
            text={item}
            position={{ x: x + 28, y: y + index * gap }}
            fontSize={23}
            strokeColor={colorAt(index)}
            start={t(start + index * 24 + 10)}
            duration={d(22)}
          />
        </React.Fragment>
      ))}
    </>
  );
}

function MiniCode({
  lines,
  start,
  color = CYAN,
  x = 760,
  y = 232,
  width = 395,
  fontSize = 18,
}: {
  lines: string[];
  start: number;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
}) {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        padding: '22px 26px',
        border: `2px dashed ${color}`,
        borderRadius: 16,
        color,
        fontFamily: '"JetBrains Mono", Consolas, monospace',
        fontSize,
        lineHeight: 1.7,
        opacity: opacity(frame, t(start), d(32)),
        overflow: 'hidden',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
      }}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
}

function LoopCycle({
  labels,
  start = 120,
  center = { x: 640, y: 360 },
}: {
  labels: string[];
  start?: number;
  center?: Point;
}) {
  const r = 180;
  const pts = labels.map((_, index) => {
    const a = -Math.PI / 2 + (index * Math.PI * 2) / labels.length;
    return { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r };
  });
  return (
    <>
      {labels.map((label, index) => (
        <React.Fragment key={label}>
          <Node
            label={label}
            x={pts[index].x - 75}
            y={pts[index].y - 35}
            width={150}
            height={70}
            start={start + index * 34}
          />
          <DrawShape
            type="arrow"
            from={{
              x: pts[index].x + (pts[(index + 1) % pts.length].x - pts[index].x) * 0.24,
              y: pts[index].y + (pts[(index + 1) % pts.length].y - pts[index].y) * 0.24,
            }}
            to={{
              x: pts[index].x + (pts[(index + 1) % pts.length].x - pts[index].x) * 0.72,
              y: pts[index].y + (pts[(index + 1) % pts.length].y - pts[index].y) * 0.72,
            }}
            strokeColor={SOFT}
            strokeWidth={1.8}
            start={start + index * 34 + 18}
            duration={18}
          />
        </React.Fragment>
      ))}
    </>
  );
}

function RenderGraphic({ kind }: { kind: string }) {
  switch (kind) {
    case 'hook':
      return (
        <>
          <DashedBox x={104} y={232} w={1068} h={285} label="system boundary" start={92} color={VIOLET} />
          <Node label="prompt" x={165} y={330} start={115} color={BLUE} />
          <DrawShape type="arrow" from={{ x: 355, y: 365 }} to={{ x: 505, y: 365 }} strokeColor={FLOW} start={155} duration={22} />
          <Node label="agent" x={520} y={330} start={175} color={AMBER} />
          <CurvedArrow from={{ x: 700, y: 330 }} to={{ x: 520, y: 330 }} start={220} label="loop" color={AMBER} />
          <DrawShape type="arrow" from={{ x: 705, y: 365 }} to={{ x: 855, y: 365 }} strokeColor={FLOW} start={260} duration={22} />
          <Node label="verified work" x={870} y={330} width={210} start={280} color={GREEN} />
        </>
      );
    case 'single':
      return (
        <>
          <Node label="you" x={150} y={238} start={110} color={ROSE} />
          <DrawShape type="arrow" from={{ x: 335, y: 274 }} to={{ x: 495, y: 274 }} strokeColor={FLOW} start={145} duration={20} />
          <Node label="agent" x={510} y={238} start={166} color={AMBER} />
          <DrawShape type="arrow" from={{ x: 695, y: 274 }} to={{ x: 855, y: 274 }} strokeColor={FLOW} start={200} duration={20} />
          <Node label="answer" x={870} y={238} start={220} color={BLUE} />
          <DashedBox x={132} y={405} w={1015} h={115} start={285} color={ROSE} />
          <BulletList items={['判断下一步', '补项目上下文', '手动验证结果']} x={205} y={437} start={325} gap={34} />
        </>
      );
    case 'cycle':
      return <LoopCycle labels={['goal', 'plan', 'act', 'observe', 'verify', 'update']} start={105} />;
    case 'five':
      return (
        <>
          <DashedBox x={132} y={225} w={1015} h={275} label="loop toolkit" start={95} color={CYAN} />
          <BulletList
            items={['Automations：发现与触发', 'Worktrees：隔离并行任务', 'Skills：项目知识', 'Connectors：真实工具', 'Sub-agents：创作与检查分离']}
            x={220}
            y={290}
            start={120}
            gap={43}
          />
        </>
      );
    case 'automation':
      return (
        <>
          <Node label="schedule" x={155} y={330} start={110} color={BLUE} />
          <DrawShape type="arrow" from={{ x: 340, y: 365 }} to={{ x: 500, y: 365 }} strokeColor={FLOW} start={148} duration={20} />
          <Node label="discover" x={515} y={330} start={170} color={CYAN} />
          <DrawShape type="arrow" from={{ x: 700, y: 365 }} to={{ x: 860, y: 365 }} strokeColor={FLOW} start={210} duration={20} />
          <Node label="triage inbox" x={875} y={330} width={220} start={232} color={GREEN} />
          <DrawShape type="line" from={{ x: 250, y: 454 }} to={{ x: 1010, y: 454 }} strokeColor={AMBER} strokeWidth={1.5} start={290} duration={20} />
          <DrawText text="heartbeat: every hour / every day / on failure" position={{ x: 640, y: 495 }} align="center" fontSize={22} strokeColor={MUTED} start={320} duration={30} />
        </>
      );
    case 'worktrees':
      return (
        <>
          <Node label="main repo" x={90} y={326} start={105} color={VIOLET} />
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <DrawShape type="arrow" from={{ x: 278, y: 362 }} to={{ x: 455, y: 250 + i * 112 }} strokeColor={SOFT} start={145 + i * 38} duration={20} />
              <Node label={`worktree ${i + 1}`} x={470} y={214 + i * 112} width={205} start={165 + i * 38} color={CYAN} />
              <DrawShape type="arrow" from={{ x: 686, y: 250 + i * 112 }} to={{ x: 865, y: 250 + i * 112 }} strokeColor={FLOW} start={220 + i * 38} duration={18} />
              <Node label={['fix auth', 'refactor api', 'write tests'][i]} x={880} y={214 + i * 112} width={220} start={238 + i * 38} color={colorAt(i + 2)} />
            </React.Fragment>
          ))}
        </>
      );
    case 'skills':
      return (
        <>
          <MiniCode
            start={115}
            color={MINT}
            x={760}
            y={448}
            width={395}
            lines={['SKILL.md', 'build: npm run build', 'verify: npm test', 'rules: avoid X', 'style: use local APIs']}
          />
          <Node label="cold agent" x={150} y={320} width={205} start={130} color={ROSE} />
          <DrawShape type="arrow" from={{ x: 360, y: 356 }} to={{ x: 540, y: 356 }} strokeColor={FLOW} start={180} duration={22} />
          <Node label="reads skill" x={555} y={320} width={205} start={210} color={MINT} />
          <DrawShape type="arrow" from={{ x: 760, y: 356 }} to={{ x: 905, y: 356 }} strokeColor={FLOW} start={250} duration={22} />
          <Node label="project-aware" x={920} y={320} width={230} start={280} color={GREEN} />
        </>
      );
    case 'connectors':
      return (
        <>
          <Node label="loop" x={535} y={318} start={110} color={AMBER} />
          {[
            ['Linear', 210, 225],
            ['DB', 870, 225],
            ['Slack', 210, 425],
            ['staging API', 870, 425],
          ].map(([label, x, y], i) => (
            <React.Fragment key={label}>
              <Node label={String(label)} x={Number(x)} y={Number(y)} start={155 + i * 32} />
              <DrawShape
                type="arrow"
                from={{ x: Number(x) + 90, y: Number(y) + 36 }}
                to={{ x: 625, y: 354 }}
                strokeColor={colorAt(i)}
                start={190 + i * 32}
                duration={18}
              />
            </React.Fragment>
          ))}
          <DashedBox x={150} y={195} w={980} h={350} label="MCP / plugins / connectors" start={315} color={VIOLET} />
        </>
      );
    case 'subagents':
      return (
        <>
          <Node label="planner" x={155} y={270} start={110} color={BLUE} />
          <DrawShape type="arrow" from={{ x: 340, y: 306 }} to={{ x: 505, y: 306 }} strokeColor={FLOW} start={145} duration={20} />
          <Node label="maker" x={520} y={270} start={168} color={AMBER} />
          <DrawShape type="arrow" from={{ x: 705, y: 306 }} to={{ x: 870, y: 306 }} strokeColor={FLOW} start={205} duration={20} />
          <Node label="checker" x={885} y={270} start={228} color={GREEN} />
          <DrawShape type="arrow" from={{ x: 975, y: 346 }} to={{ x: 975, y: 455 }} strokeColor={SOFT} start={285} duration={20} />
          <Node label="evidence" x={885} y={465} start={310} color={CYAN} />
          <DrawShape type="arrow" from={{ x: 880, y: 500 }} to={{ x: 705, y: 345 }} strokeColor={SOFT} start={350} duration={22} />
        </>
      );
    case 'state':
      return (
        <>
          <LoopCycle labels={['run', 'observe', 'write state', 'resume']} start={105} />
          <MiniCode
            start={300}
            color={AMBER}
            x={910}
            y={238}
            width={270}
            fontSize={16}
            lines={['STATE.md', '- done: tests mapped', '- next: fix flaky auth', '- blocker: missing seed data']}
          />
        </>
      );
    case 'langcore':
      return (
        <>
          <DashedBox x={170} y={220} w={940} h={340} label="agent harness" start={100} color={BLUE} />
          <Node label="model" x={540} y={250} start={120} color={AMBER} />
          <Node label="tools" x={245} y={405} start={160} color={CYAN} />
          <Node label="observation" x={540} y={405} start={200} color={GREEN} />
          <Node label="memory" x={835} y={405} start={240} color={VIOLET} />
          <DrawShape type="arrow" from={{ x: 630, y: 325 }} to={{ x: 335, y: 405 }} strokeColor={FLOW} start={280} duration={16} />
          <DrawShape type="arrow" from={{ x: 427, y: 440 }} to={{ x: 540, y: 440 }} strokeColor={FLOW} start={300} duration={16} />
          <DrawShape type="arrow" from={{ x: 720, y: 440 }} to={{ x: 835, y: 440 }} strokeColor={FLOW} start={320} duration={16} />
          <DrawShape type="arrow" from={{ x: 925, y: 405 }} to={{ x: 705, y: 325 }} strokeColor={FLOW} start={340} duration={16} />
        </>
      );
    case 'verify':
      return (
        <>
          <Node label="candidate" x={160} y={330} start={110} color={ROSE} />
          <DrawShape type="arrow" from={{ x: 345, y: 366 }} to={{ x: 490, y: 366 }} strokeColor={FLOW} start={145} duration={20} />
          <DashedBox x={505} y={255} w={310} h={220} label="verification" start={170} color={GREEN} />
          <BulletList items={['tests', 'evals', 'trace', 'review']} x={565} y={315} start={205} gap={42} />
          <DrawShape type="arrow" from={{ x: 820, y: 366 }} to={{ x: 965, y: 366 }} strokeColor={FLOW} start={330} duration={20} />
          <Node label="accept / retry" x={980} y={330} width={205} start={355} color={AMBER} />
        </>
      );
    case 'events':
      return (
        <>
          <BulletList items={['cron', 'webhook', 'queue', 'CI failure', 'triage inbox']} x={185} y={260} start={105} gap={55} />
          <DashedBox x={520} y={230} w={585} h={260} label="event router" start={220} color={VIOLET} />
          <Node label="classify" x={575} y={320} start={250} color={CYAN} />
          <DrawShape type="arrow" from={{ x: 760, y: 356 }} to={{ x: 900, y: 356 }} strokeColor={FLOW} start={285} duration={20} />
          <Node label="start loop" x={915} y={320} start={310} color={GREEN} />
        </>
      );
    case 'hill':
      return (
        <>
          <Node label="variant A" x={150} y={240} start={110} color={ROSE} />
          <Node label="variant B" x={150} y={355} start={145} color={VIOLET} />
          <Node label="variant C" x={150} y={470} start={180} color={BLUE} />
          <DrawShape type="arrow" from={{ x: 340, y: 276 }} to={{ x: 560, y: 360 }} strokeColor={ROSE} start={215} duration={18} />
          <DrawShape type="arrow" from={{ x: 340, y: 391 }} to={{ x: 560, y: 390 }} strokeColor={VIOLET} start={235} duration={18} />
          <DrawShape type="arrow" from={{ x: 340, y: 506 }} to={{ x: 560, y: 420 }} strokeColor={BLUE} start={255} duration={18} />
          <Node label="score" x={575} y={355} start={285} color={AMBER} />
          <DrawShape type="arrow" from={{ x: 760, y: 391 }} to={{ x: 930, y: 391 }} strokeColor={GREEN} start={320} duration={20} />
          <Node label="keep better" x={945} y={355} width={205} start={345} color={GREEN} />
          <CurvedArrow from={{ x: 1015, y: 355 }} to={{ x: 240, y: 240 }} start={390} label="iterate" color={AMBER} />
        </>
      );
    case 'control':
      return (
        <>
          <DashedBox x={170} y={225} w={940} h={300} label="control plane" start={105} color={AMBER} />
          <BulletList
            items={['budget：token 与时间上限', 'scope：能改哪些文件', 'permission：能调用哪些工具', 'stop：怎样算完成', 'review：何时交给人']}
            x={245}
            y={285}
            start={135}
            gap={43}
          />
        </>
      );
    case 'first':
      return (
        <>
          <Node label="boring task" x={120} y={330} start={105} width={205} color={BLUE} />
          <DrawShape type="arrow" from={{ x: 330, y: 366 }} to={{ x: 455, y: 366 }} strokeColor={FLOW} start={140} duration={18} />
          <Node label="small loop" x={470} y={330} start={165} width={205} color={AMBER} />
          <DrawShape type="arrow" from={{ x: 680, y: 366 }} to={{ x: 805, y: 366 }} strokeColor={FLOW} start={205} duration={18} />
          <Node label="trusted evidence" x={820} y={330} start={230} width={250} color={GREEN} />
          <MiniCode
            start={315}
            color={CYAN}
            x={372}
            y={455}
            width={535}
            fontSize={16}
            lines={['task: summarize failing CI', 'verify: rerun target test', 'state: append STATE.md', 'human: review only deltas']}
          />
        </>
      );
    case 'closing':
      return (
        <>
          <LoopCycle labels={['goal', 'tools', 'verify', 'state', 'human']} start={105} />
          <DrawText
            text="Design the loop."
            position={{ x: 640, y: 363 }}
            align="center"
            fontSize={39}
            fontWeight="bold"
            strokeColor={ACCENT}
            start={340}
            duration={34}
          />
        </>
      );
    default:
      return null;
  }
}

function LoopScene({ spec }: { spec: SceneSpec }) {
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

export default function LoopEngineeringExplainer() {
  const timeline = productionScenes.flatMap((spec, index) => {
    const items = [
      <Scene key={spec.id} id={spec.id} duration={sceneDurations[index]}>
        <LoopScene spec={spec} />
      </Scene>,
    ];
    if (TRANSITION > 0 && index < productionScenes.length - 1) {
      items.push(
        <Transition
          key={`${spec.id}-transition`}
          type="fade"
          duration={TRANSITION}
        />
      );
    }
    return items;
  });

  return (
    <VideoComposition
      id="loop-engineering-explainer"
      width={W}
      height={H}
      fps={FPS}
      duration={totalDuration}
      backgroundColor={BG}
      audio={meta.audio}
    >
      {timeline}
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
    narration: productionScenes.map((spec, index) => {
      const sceneStart = sceneStartFrame(index);
      return {
        id: spec.id,
        sceneId: spec.id,
        text: spec.narration,
        startFrame: sceneStart,
        endFrame: sceneStart + sceneDurations[index],
      };
    }),
  },
};
