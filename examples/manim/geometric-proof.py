import numpy as np
from manim import Create, FadeIn, MathTex, Polygon, Scene, Text, VGroup


def square_on(p1, p2, side):
    edge = p2 - p1
    normal = np.array([-edge[1], edge[0], 0.0])
    normal = normal / np.linalg.norm(normal) * np.linalg.norm(edge) * side
    return Polygon(p1, p2, p2 + normal, p1 + normal)


class GeometricPythagoreanProof(Scene):
    def construct(self):
        a = np.array([-1.6, -0.9, 0.0])
        b = np.array([1.2, -0.9, 0.0])
        c = np.array([-1.6, 1.2, 0.0])
        triangle = Polygon(a, b, c, color="#e2e8f0", fill_color="#1e293b", fill_opacity=0.65)
        square_a = square_on(a, c, 1).set_fill("#38bdf8", opacity=0.28).set_stroke("#38bdf8")
        square_b = square_on(a, b, -1).set_fill("#34d399", opacity=0.28).set_stroke("#34d399")
        square_c = square_on(b, c, -1).set_fill("#fbbf24", opacity=0.24).set_stroke("#fbbf24")
        labels = VGroup(
            MathTex("a^2", color="#38bdf8").move_to(square_a.get_center()),
            MathTex("b^2", color="#34d399").move_to(square_b.get_center()),
            MathTex("c^2", color="#fbbf24").move_to(square_c.get_center()),
        )
        title = Text("Areas on a right triangle", font_size=28).to_edge(np.array([0, 1, 0]))
        result = MathTex("a^2+b^2=c^2", color="#e2e8f0").to_edge(np.array([0, -1, 0]))
        self.play(FadeIn(title), Create(triangle), run_time=0.8)
        self.play(Create(square_a), Create(square_b), run_time=1.0)
        self.play(Create(square_c), FadeIn(labels), run_time=1.1)
        self.play(FadeIn(result), run_time=0.7)
        self.wait(0.5)
