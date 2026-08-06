from manim import MathTex, Scene, SurroundingRectangle, TransformMatchingTex, Write


class AlgebraProof(Scene):
    def construct(self):
        first = MathTex(r"(a+b)^2 = a^2 + 2ab + b^2")
        second = MathTex(r"a^2 + 2ab + b^2 = c^2 + 2ab")
        result = MathTex(r"a^2 + b^2 = c^2", color="#4f8cff")
        self.play(Write(first), run_time=0.9)
        self.play(TransformMatchingTex(first, second), run_time=1.1)
        self.play(TransformMatchingTex(second, result), run_time=1.1)
        self.play(Write(SurroundingRectangle(result, color="#21a179")), run_time=0.5)
        self.wait(0.5)
