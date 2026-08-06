from manim import Axes, Create, Dot, FadeIn, Scene, Text


class GraphExplanation(Scene):
    def construct(self):
        axes = Axes(
            x_range=[0, 4, 1],
            y_range=[0, 8, 2],
            x_length=8,
            y_length=4.5,
            tips=False,
        )
        curve = axes.plot(lambda x: 0.5 * x * x, x_range=[0, 4], color="#4f8cff")
        dot = Dot(axes.c2p(1, 0.5), color="#21a179")
        label = Text("growth accelerates", font_size=28).next_to(axes, direction=[0, -1, 0])
        self.play(Create(axes), run_time=0.8)
        self.play(Create(curve), FadeIn(dot), run_time=1.2)
        self.play(dot.animate.move_to(axes.c2p(3.6, 0.5 * 3.6 * 3.6)), run_time=1.2)
        self.play(FadeIn(label), run_time=0.5)
        self.wait(0.4)
