# Manim validation scenes

These Python scenes validate Seqvio's optional integration with the Python
package `manim`. The adapter is TypeScript/Node.js, but rendering happens in the
external Python runtime. Generated MP4 files are then consumed as seekable media
by `ManimClip`.

The repository-local validation environment is `.venv-manim`, and the fixtures
are currently validated with `manim==0.20.1`.

```powershell
# Windows PowerShell, from the repository root
python -m venv .venv-manim
.\.venv-manim\Scripts\python.exe -m pip install manim==0.20.1
.\.venv-manim\Scripts\python.exe -m manim -ql examples\manim\equation.py EquationDerivation --media_dir output\manim-media
.\.venv-manim\Scripts\python.exe -m manim -ql --fps 30 examples\manim\graph.py GraphExplanation --media_dir output\manim-media
.\.venv-manim\Scripts\python.exe -m manim -ql --fps 30 examples\manim\proof.py AlgebraProof --media_dir output\manim-media
.\.venv-manim\Scripts\python.exe -m manim -ql --fps 30 -r 1280,720 examples\manim\geometric-proof.py GeometricPythagoreanProof --media_dir output\manim-geometric-proof-media
```

```bash
# macOS or Linux, from the repository root
python3 -m venv .venv-manim
./.venv-manim/bin/python -m pip install manim==0.20.1
./.venv-manim/bin/python -m manim -ql examples/manim/equation.py EquationDerivation --media_dir output/manim-media
./.venv-manim/bin/python -m manim -ql --fps 30 examples/manim/graph.py GraphExplanation --media_dir output/manim-media
./.venv-manim/bin/python -m manim -ql --fps 30 examples/manim/proof.py AlgebraProof --media_dir output/manim-media
./.venv-manim/bin/python -m manim -ql --fps 30 -r 1280,720 examples/manim/geometric-proof.py GeometricPythagoreanProof --media_dir output/manim-geometric-proof-media
```

The adapter accepts the same executable through `pythonCommand` or the
repository helper's `--python` option. `seqvio-doctor` discovers `.venv-manim`
automatically; set `SEQVIO_MANIM_PYTHON` when using another environment.

The graph, symbolic proof, and geometric proof fixtures cover coordinate
animation, symbolic transformation, and a triangle-area construction. See the
[Manim integration guide](../../docs/MANIM-INTEGRATION.md) for adapter rendering,
manifests, cache behavior, `ExplainerDocument`, and `ExplanationBeat` markers.
