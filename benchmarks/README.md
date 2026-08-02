# Render Benchmarks

Seqvio benchmarks four 1280x720, 30 fps explanation workloads: code, terminal,
browser, and a mixed timeline. Fixtures are generated locally and require no
network access.

```bash
npm run benchmark:render
npm run benchmark:render:check
```

`benchmark:render` writes `output/benchmarks/latest.json`. The check command
runs three samples and compares medians with `render-baseline.json` only when
platform, architecture, and CPU model match the stored reference. Other hosts
still produce an artifact, but do not turn machine differences into false
regressions.

The report includes render factor, renderer throughput, setup time, process-tree
peak RSS, output size, and static-frame cache hit rate. Refresh the reference
only after reviewing a three-sample run:

```bash
npm run benchmark:render:update
```
