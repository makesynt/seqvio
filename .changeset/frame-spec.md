---
"@seqvio/renderer": minor
---

**Stage C — frame.md 设计系统（HyperFrames #3 借鉴）**

`seqvio-generate frame-spec init` 新子命令，将当前主题的设计 token 导出为一份面向镜头的 `FRAME.md` 规范文件，供 AI agent 排版时作为设计约束参考。

- 支持 4 种风格：`whiteboard/default`、`whiteboard/studio`、`whiteboard/field-note`、`scatterbrain`
- 导出内容：画布尺寸/安全区、type scale、spacing tokens、色板、字体栈、各风格注意事项
- `--style`、`--width`、`--height`、`--out`、`--force` 选项
- 默认输出到 `./FRAME.md`；可指定 `--out` 到任意路径
- 仓库级模板位于 `docs/frame-spec/FRAME.md`（1920×1080 whiteboard/default）
- 文档：`skills/seqvio/references/frame-spec.md`
