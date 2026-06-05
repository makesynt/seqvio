/**
 * Example 3: Tutorial Video
 * Complete tutorial with text, shapes, and annotations
 */

import React from 'react';
import { WhiteboardScene, DrawText, DrawShape, DrawImage, Hand } from '../src';

export default function TutorialVideo() {
  return (
    <WhiteboardScene
      width={1920}
      height={1080}
      texture="paper"
    >
      {/* Title */}
      <DrawText
        text="How React Works"
        fontSize={72}
        fontWeight="bold"
        position={{ x: 960, y: 200 }}
        align="center"
        start={0}
        duration={90}
        strokeColor="#2c3e50"
        fillColor="#3498db"
        fillDelay={0.4}
      />

      {/* Subtitle */}
      <DrawText
        text="A Simple Explanation"
        fontSize={36}
        position={{ x: 960, y: 280 }}
        align="center"
        start={90}
        duration={60}
        strokeColor="#7f8c8d"
      />

      {/* Step 1 */}
      <DrawShape
        type="circle"
        position={{ x: 300, y: 500 }}
        size={80}
        start={150}
        duration={45}
        strokeColor="#3498db"
        strokeWidth={4}
        fillColor="#ecf0f1"
        fillDelay={0.3}
      />
      <DrawText
        text="1"
        fontSize={48}
        fontWeight="bold"
        position={{ x: 300, y: 520 }}
        align="center"
        start={195}
        duration={20}
        strokeColor="#2c3e50"
      />
      <DrawText
        text="Components"
        fontSize={32}
        position={{ x: 300, y: 620 }}
        align="center"
        start={215}
        duration={45}
        strokeColor="#2c3e50"
      />

      {/* Arrow 1 */}
      <DrawShape
        type="arrow"
        from={{ x: 380, y: 500 }}
        to={{ x: 560, y: 500 }}
        start={260}
        duration={30}
        strokeColor="#95a5a6"
        strokeWidth={3}
      />

      {/* Step 2 */}
      <DrawShape
        type="circle"
        position={{ x: 640, y: 500 }}
        size={80}
        start={290}
        duration={45}
        strokeColor="#3498db"
        strokeWidth={4}
        fillColor="#ecf0f1"
        fillDelay={0.3}
      />
      <DrawText
        text="2"
        fontSize={48}
        fontWeight="bold"
        position={{ x: 640, y: 520 }}
        align="center"
        start={335}
        duration={20}
        strokeColor="#2c3e50"
      />
      <DrawText
        text="Virtual DOM"
        fontSize={32}
        position={{ x: 640, y: 620 }}
        align="center"
        start={355}
        duration={45}
        strokeColor="#2c3e50"
      />

      {/* Arrow 2 */}
      <DrawShape
        type="arrow"
        from={{ x: 720, y: 500 }}
        to={{ x: 900, y: 500 }}
        start={400}
        duration={30}
        strokeColor="#95a5a6"
        strokeWidth={3}
      />

      {/* Step 3 */}
      <DrawShape
        type="circle"
        position={{ x: 980, y: 500 }}
        size={80}
        start={430}
        duration={45}
        strokeColor="#3498db"
        strokeWidth={4}
        fillColor="#ecf0f1"
        fillDelay={0.3}
      />
      <DrawText
        text="3"
        fontSize={48}
        fontWeight="bold"
        position={{ x: 980, y: 520 }}
        align="center"
        start={475}
        duration={20}
        strokeColor="#2c3e50"
      />
      <DrawText
        text="Real DOM"
        fontSize={32}
        position={{ x: 980, y: 620 }}
        align="center"
        start={495}
        duration={45}
        strokeColor="#2c3e50"
      />

      {/* Key Point Rectangle */}
      <DrawShape
        type="rectangle"
        position={{ x: 400, y: 750 }}
        size={{ width: 1120, height: 150 }}
        start={540}
        duration={60}
        strokeColor="#e74c3c"
        strokeWidth={4}
        roughness={1}
      />

      {/* Key Point Text */}
      <DrawText
        text="Key: React only updates what changed!"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 960, y: 850 }}
        align="center"
        start={600}
        duration={90}
        strokeColor="#e74c3c"
      />

      {/* Checkmark */}
      <DrawShape
        type="line"
        from={{ x: 1450, y: 820 }}
        to={{ x: 1480, y: 860 }}
        start={690}
        duration={20}
        strokeColor="#27ae60"
        strokeWidth={6}
      />
      <DrawShape
        type="line"
        from={{ x: 1480, y: 860 }}
        to={{ x: 1540, y: 780 }}
        start={710}
        duration={30}
        strokeColor="#27ae60"
        strokeWidth={6}
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
  duration: 750,
  fps: 30
};
