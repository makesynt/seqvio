# Manim validation

The repository-local validation environment is `.venv-manim`.

```powershell
python -m venv .venv-manim
.venv-manim\Scripts\python.exe -m pip install manim==0.20.1
.venv-manim\Scripts\python.exe -m manim -ql examples\manim\equation.py EquationDerivation --media_dir output\manim-media
.venv-manim\Scripts\python.exe -m manim -ql --fps 30 examples\manim\graph.py GraphExplanation --media_dir output\manim-media
.venv-manim\Scripts\python.exe -m manim -ql --fps 30 examples\manim\proof.py AlgebraProof --media_dir output\manim-media
.venv-manim\Scripts\python.exe -m manim -ql --fps 30 -r 1280,720 examples\manim\geometric-proof.py GeometricPythagoreanProof --media_dir output\manim-geometric-proof-media
```

The adapter can use the same executable through its `pythonCommand` option.
The graph, symbolic proof, and geometric proof fixtures cover coordinate animation,
symbolic transformation, and a triangle-area construction. Their rendered MP4 files
are consumed as seekable media by `ManimClip`.
