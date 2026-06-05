/**
 * Example 2: Shapes Demo
 * Drawing various shapes with whiteboard effect
 */

import React from 'react';
import { WhiteboardScene, DrawText, DrawShape, Hand } from '../src';

export default function ShapesDemo() {
  return (
    <WhiteboardScene
      width={1920}
      height={1080}
      texture="whiteboard"
    >
      {/* Title */}
      <DrawText
        text="Shapes Demo"
        fontSize={64}
        fontWeight="bold"
        position={{ x: 960, y: 150 }}
        align="center"
        start={0}
        duration={60}
        strokeColor="#2c3e50"
      />

      {/* Circle */}
      <DrawShape
        type="circle"
        position={{ x: 300, y: 400 }}
        size={150}
        start={60}
        duration={60}
        strokeColor="#e74c3c"
        strokeWidth={4}
      />
      <DrawText
        text="Circle"
        fontSize={32}
        position={{ x: 300, y: 550 }}
        align="center"
        start={120}
        duration={30}
        strokeColor="#2c3e50"
      />

      {/* Rectangle */}
      <DrawShape
        type="rectangle"
        position={{ x: 550, y: 325 }}
        size={{ width: 200, height: 150 }}
        start={150}
        duration={60}
        strokeColor="#3498db"
        strokeWidth={4}
        roughness={2}
      />
      <DrawText
        text="Rectangle"
        fontSize={32}
        position={{ x: 650, y: 550 }}
        align="center"
        start={210}
        duration={30}
        strokeColor="#2c3e50"
      />

      {/* Arrow */}
      <DrawShape
        type="arrow"
        from={{ x: 900, y: 350 }}
        to={{ x: 1100, y: 450 }}
        start={240}
        duration={45}
        strokeColor="#27ae60"
        strokeWidth={5}
      />
      <DrawText
        text="Arrow"
        fontSize={32}
        position={{ x: 1000, y: 550 }}
        align="center"
        start={285}
        duration={30}
        strokeColor="#2c3e50"
      />

      {/* Star */}
      <DrawShape
        type="star"
        position={{ x: 1400, y: 400 }}
        size={150}
        start={315}
        duration={60}
        strokeColor="#f39c12"
        strokeWidth={4}
        fillColor="#f39c12"
        fillDelay={0.5}
      />
      <DrawText
        text="Star"
        fontSize={32}
        position={{ x: 1400, y: 550 }}
        align="center"
        start={375}
        duration={30}
        strokeColor="#2c3e50"
      />

      {/* Underline at the bottom */}
      <DrawShape
        type="underline"
        position={{ x: 400, y: 850 }}
        size={1120}
        start={405}
        duration={60}
        strokeColor="#e74c3c"
        strokeWidth={3}
      />

      <Hand
        action="write"
        follow={true}
        visible={true}
      />
    </WhiteboardScene>
  );
}

export const meta = {
  duration: 480,
  fps: 30
};
