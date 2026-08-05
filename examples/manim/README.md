# Manim validation

The repository-local validation environment is `.venv-manim`.

```powershell
python -m venv .venv-manim
.venv-manim\Scripts\python.exe -m pip install manim==0.20.1
.venv-manim\Scripts\python.exe -m manim -ql examples\manim\equation.py EquationDerivation --media_dir output\manim-media
```

The adapter can use the same executable through its `pythonCommand` option.
