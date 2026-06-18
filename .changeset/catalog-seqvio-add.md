---
"@seqvio/renderer": minor
---

**Stage D — Catalog 可复用 block + `seqvio-add`（HyperFrames #4 借鉴）**

新 `seqvio-add` CLI bin，从仓库内 `catalog/` 目录一键复制可复用的 TSX 场景片段到项目中。

首批 4 个 block：
- `cover-card` — 白板标题卡（animated display + subtitle）
- `scatter-list` — Scatterbrain 便签列表（2×2 sticky-note 布局）
- `stat-card` — 白板指标卡（大数字 + 下划线 + 标签）
- `caption-bar` — 底部字幕条组件（可复用于任何场景）

用法：
```bash
seqvio-add --list                  # 列出所有可用 block
seqvio-add cover-card              # 复制到 examples/compositions/
seqvio-add scatter-list --dest ./  # 复制到自定义目录
```

- 自动检测 `examples/compositions/` 目录作为默认目标
- 校验所需包是否在 package.json 中（missing 时 warn 但不阻塞）
- `--force` 覆盖已有文件
- 文档：`skills/seqvio/references/catalog.md`
