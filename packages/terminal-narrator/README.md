# @seqvio/terminal-narrator

把 coding agent / shell 的终端会话录成讲解视频：捕获 TTY 流 → xterm
状态回放 → `ExplainerDocument` → ExplanationBeat 音画对齐 → 可选 TTS
旁白 → QA / MP4。

当前 CLI 的 capture contract 已稳定；生产管线已经使用 manifest → shared capture
dispatcher → IR → TSX，legacy `writeComposition` writer 已移除。

**范围**：机制 1（外壳调教 Claude Code）+ 机制 3（日志回放渲染）。**不含** MCP（机制 2）。

---

## 机制 1：外壳模拟人类调教 Claude Code

主控在 PTY **外**调度，子进程跑 Claude Code：

1. spawn `claude`（或 `--claudeBin`）
2. 可选 `startupWaitMs` / `readyPattern` 等提示符就绪
3. 按 `typeDelayMs` 逐字输入 Skill（如 `/my-skill arg`）
4. 捕获思考过程 / 工具调用 / 终端输出
5. 机制 3 回放渲染 + 可选旁白

```powershell
# 需本机已安装并登录 Claude Code
node packages/terminal-narrator/dist/cli.js record --sample-claude --skill "/help" --withAudio --provider edge-tts --voice zh-CN-YunxiNeural
```

Claude sample 默认会先等待真实的 `❯` 提示符，再开始逐字输入；可用
`SEQVIO_CLAUDE_READY_PATTERN` 覆盖，或在自定义 plan 中设置 `readyPattern`。

常用参数：

| 参数 | 说明 |
|------|------|
| `--sample-claude` | 机制 1 示例 plan（默认 1280×720 + VHS 外观） |
| `--skill` | 输入文本，默认 `/help`（也可用 `SEQVIO_DEMO_SKILL`） |
| `--claudeBin` | Claude 可执行文件（默认 `CLAUDE_BIN` 或 `claude` / `claude.cmd`） |
| `--cwd` | 录制会话工作目录 |

也可用自定义 `plan.json`：把 `shell.command` 设为 Claude，并配置 `typeDelayMs` / `startupWaitMs` / `readyPattern`。

---

## 机制 3 冒烟（不依赖 Claude）

```powershell
npm run build
node packages/terminal-narrator/dist/cli.js record --sample --withAudio --provider edge-tts --voice zh-CN-YunxiNeural
```

---

## 输出产物

- `plan.json`
- `recording-manifest.json` — Seqvio 内部时间轴
- `capture-manifest.json` — shared capture contract
- `explainer.json` — canonical ExplainerDocument IR
- `session.cast` — asciinema v2（可用 `asciinema play`）
- `composition.tsx` — 从 TerminalSceneSpec 编译的 TerminalXtermDemo
- `audio-manifest.json` — 每步 narration cue、ExplanationBeat、capture evidence 和 scene timing
- `audio-manifest.resolved.json`（`--withAudio`）— TTS 后的 Beat outputFrame 与 semantic timeMap
- `final.mp4`
- `qa-report.json` — capture、画面、节奏、媒体和音频诊断；错误会使作业失败
- `artifacts.json` — 版本化状态与相对产物路径

CLI contract `1.0` 支持 `--json`、稳定退出码、单调进度、`--jobId` 和旧作业
防覆盖。完整约定见
[`docs/CAPTURE-CLI-CONTRACT.md`](../../docs/CAPTURE-CLI-CONTRACT.md)。

---

## Plan 契约（节选）

```json
{
  "version": "1.0",
  "name": "Claude skill demo",
  "viewport": { "width": 1280, "height": 720 },
  "presentation": "vhs",
  "startupWaitMs": 2500,
  "readyPattern": ">",
  "typeDelayMs": 40,
  "shell": {
    "command": "claude",
    "args": [],
    "cols": 140,
    "rows": 40,
    "cwd": ".",
    "useConpty": false
  },
  "inputs": [
    { "id": "skill", "label": "运行 /my-skill", "text": "/my-skill demo", "afterMs": 20000 }
  ],
  "finalWaitMs": 4000,
  "timeoutMs": 180000
}
```

Windows：建议 `shell.useConpty: false`，减少 ConPTY 噪声。

## 回归测试

构建后可以从仓库根目录运行：

```powershell
npm run smoke:terminal:native

# 需要 Claude Code 已安装并登录；会执行真实 /help 会话
npm run smoke:terminal:claude
```

native compose 会先通过 `@xterm/headless` 回放 PTY 流，再生成确定性的屏幕快照。
因此 alternate screen、滚动区域、光标移动和宽字符由完整终端状态机处理；
`TerminalDemo` 自带的轻量 ANSI 解析仅作为直接传入普通 events 时的兼容回退。

---

## 旁白 / 字幕

| 参数 | 说明 |
|------|------|
| `--withAudio` | TTS 合成旁白并 mux 进 MP4 |
| `--burnCaptions` | 把字幕烧录进画面；必须同时使用 `--withAudio` |
| `--provider` | `edge-tts`（默认）/ `elevenlabs` / `openai` / `minimax` |
| `--voice` | 提供商 voice id |

录制器会用 stdout echo 修正 step 时间；编译器为每个步骤同时生成旁白 cue
和 `evidence.captureStepId` 对应的 ExplanationBeat。开启 `--withAudio` 后，
实际 TTS 时长会解析短语锚点并生成 semantic timeMap。只有显式添加
`--burnCaptions` 才会烧录 step captions；未开启音频时仍写出 audio/caption
元数据，但 `final.mp4` 不包含合成旁白或烧录字幕。所有作业在完成前都会
运行 capture QA；无音频作业仍检查捕获、画面和节奏，但不会错误要求音轨。

1280x720 的确定性 release smoke 会覆盖 capture → IR → Beat resolution →
capture QA → MP4 → FFmpeg 完整解码：

```powershell
npm run smoke:release-pipeline:terminal
```

---

## 未来方向

- 从外部 `.cast` 直接导入回放
- `TerminalSceneSpec` 更丰富镜头（局部放大 / 分屏）
