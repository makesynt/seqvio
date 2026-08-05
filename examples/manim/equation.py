from manim import MathTex, Scene, Write


class EquationDerivation(Scene):
    def construct(self):
        equation = MathTex(r"a^2 + b^2 = c^2")
        self.play(Write(equation))
        self.wait(0.5)
