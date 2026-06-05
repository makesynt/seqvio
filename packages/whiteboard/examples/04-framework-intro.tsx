/**
 * Seqvio Whiteboard Framework Introduction
 * A whiteboard animation introducing the framework's key features
 */

import React from 'react';
import {
  WhiteboardScene,
  DrawText,
  DrawShape,
  Hand
} from '../src';

export default function FrameworkIntro() {
  return (
    <WhiteboardScene
      width={1920}
      height={1080}
      texture="paper"
      strokeColor="#2c3e50"
    >
      {/* ===== SCENE 1: Title ===== */}
      <DrawText
        text="Seqvio Whiteboard"
        fontSize={72}
        fontWeight="bold"
        position={{ x: 960, y: 300 }}
        align="center"
        start={0}
        duration={120}
        strokeColor="#2c3e50"
        fillColor="#3498db"
        fillDelay={0.4}
      />

      <DrawText
        text="The World's First Open-Source AI Whiteboard Framework"
        fontSize={36}
        position={{ x: 960, y: 400 }}
        align="center"
        start={120}
        duration={90}
        strokeColor="#7f8c8d"
      />

      {/* Underline for emphasis */}
      <DrawShape
        type="underline"
        position={{ x: 460, y: 430 }}
        size={1000}
        start={210}
        duration={45}
        strokeColor="#3498db"
        strokeWidth={4}
      />

      {/* ===== SCENE 2: Key Features Title ===== */}
      <DrawText
        text="Key Features"
        fontSize={64}
        fontWeight="bold"
        position={{ x: 960, y: 600 }}
        align="center"
        start={270}
        duration={90}
        strokeColor="#2c3e50"
      />

      {/* ===== SCENE 3: Feature 1 - Open Source ===== */}
      <DrawShape
        type="circle"
        position={{ x: 300, y: 300 }}
        size={90}
        start={360}
        duration={60}
        strokeColor="#27ae60"
        fillColor="#d5f4e6"
        fillDelay={0.5}
      />

      <DrawText
        text="1"
        fontSize={52}
        fontWeight="bold"
        position={{ x: 300, y: 320 }}
        align="center"
        start={420}
        duration={25}
        strokeColor="#27ae60"
      />

      <DrawShape
        type="rectangle"
        position={{ x: 400, y: 250 }}
        size={{ width: 450, height: 120 }}
        start={445}
        duration={75}
        strokeColor="#27ae60"
        strokeWidth={3}
        roughness={1}
      />

      <DrawText
        text="100% Open Source"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 625, y: 290 }}
        align="center"
        start={520}
        duration={60}
        strokeColor="#27ae60"
      />

      <DrawText
        text="MIT License - Free Forever"
        fontSize={28}
        position={{ x: 625, y: 335 }}
        align="center"
        start={580}
        duration={50}
        strokeColor="#7f8c8d"
      />

      {/* ===== SCENE 4: Feature 2 - React + TypeScript ===== */}
      <DrawShape
        type="circle"
        position={{ x: 300, y: 480 }}
        size={90}
        start={630}
        duration={60}
        strokeColor="#3498db"
        fillColor="#ebf5fb"
        fillDelay={0.5}
      />

      <DrawText
        text="2"
        fontSize={52}
        fontWeight="bold"
        position={{ x: 300, y: 500 }}
        align="center"
        start={690}
        duration={25}
        strokeColor="#3498db"
      />

      <DrawShape
        type="rectangle"
        position={{ x: 400, y: 430 }}
        size={{ width: 450, height: 120 }}
        start={715}
        duration={75}
        strokeColor="#3498db"
        strokeWidth={3}
        roughness={1}
      />

      <DrawText
        text="React + TypeScript"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 625, y: 470 }}
        align="center"
        start={790}
        duration={60}
        strokeColor="#3498db"
      />

      <DrawText
        text="Modern & Type-Safe"
        fontSize={28}
        position={{ x: 625, y: 515 }}
        align="center"
        start={850}
        duration={50}
        strokeColor="#7f8c8d"
      />

      {/* ===== SCENE 5: Feature 3 - AI-Powered ===== */}
      <DrawShape
        type="circle"
        position={{ x: 300, y: 660 }}
        size={90}
        start={900}
        duration={60}
        strokeColor="#9b59b6"
        fillColor="#f4ecf7"
        fillDelay={0.5}
      />

      <DrawText
        text="3"
        fontSize={52}
        fontWeight="bold"
        position={{ x: 300, y: 680 }}
        align="center"
        start={960}
        duration={25}
        strokeColor="#9b59b6"
      />

      <DrawShape
        type="rectangle"
        position={{ x: 400, y: 610 }}
        size={{ width: 450, height: 120 }}
        start={985}
        duration={75}
        strokeColor="#9b59b6"
        strokeWidth={3}
        roughness={1}
      />

      <DrawText
        text="AI-Friendly Design"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 625, y: 650 }}
        align="center"
        start={1060}
        duration={60}
        strokeColor="#9b59b6"
      />

      <DrawText
        text="Claude Code & Cursor Ready"
        fontSize={28}
        position={{ x: 625, y: 695 }}
        align="center"
        start={1120}
        duration={50}
        strokeColor="#7f8c8d"
      />

      {/* ===== SCENE 6: Feature 4 - Rich Components ===== */}
      <DrawShape
        type="circle"
        position={{ x: 300, y: 840 }}
        size={90}
        start={1170}
        duration={60}
        strokeColor="#e67e22"
        fillColor="#fef5e7"
        fillDelay={0.5}
      />

      <DrawText
        text="4"
        fontSize={52}
        fontWeight="bold"
        position={{ x: 300, y: 860 }}
        align="center"
        start={1230}
        duration={25}
        strokeColor="#e67e22"
      />

      <DrawShape
        type="rectangle"
        position={{ x: 400, y: 790 }}
        size={{ width: 450, height: 120 }}
        start={1255}
        duration={75}
        strokeColor="#e67e22"
        strokeWidth={3}
        roughness={1}
      />

      <DrawText
        text="Rich Components"
        fontSize={42}
        fontWeight="bold"
        position={{ x: 625, y: 830 }}
        align="center"
        start={1330}
        duration={60}
        strokeColor="#e67e22"
      />

      <DrawText
        text="Text, Shapes, Images & More"
        fontSize={28}
        position={{ x: 625, y: 875 }}
        align="center"
        start={1390}
        duration={50}
        strokeColor="#7f8c8d"
      />

      {/* ===== SCENE 7: Components Showcase ===== */}
      <DrawText
        text="Components"
        fontSize={56}
        fontWeight="bold"
        position={{ x: 1350, y: 200 }}
        align="center"
        start={1440}
        duration={75}
        strokeColor="#2c3e50"
      />

      {/* Component icons */}
      {/* Circle for shapes */}
      <DrawShape
        type="circle"
        position={{ x: 1150, y: 350 }}
        size={80}
        start={1515}
        duration={50}
        strokeColor="#e74c3c"
        fillColor="#fadbd8"
      />
      <DrawText
        text="Shapes"
        fontSize={24}
        position={{ x: 1150, y: 430 }}
        align="center"
        start={1565}
        duration={35}
        strokeColor="#2c3e50"
      />

      {/* Text representation */}
      <DrawShape
        type="rectangle"
        position={{ x: 1220, y: 320 }}
        size={{ width: 100, height: 60 }}
        start={1600}
        duration={50}
        strokeColor="#3498db"
        strokeWidth={2}
      />
      <DrawText
        text="Text"
        fontSize={24}
        position={{ x: 1270, y: 430 }}
        align="center"
        start={1650}
        duration={35}
        strokeColor="#2c3e50"
      />

      {/* Arrow */}
      <DrawShape
        type="arrow"
        from={{ x: 1350, y: 330 }}
        to={{ x: 1450, y: 370 }}
        start={1685}
        duration={40}
        strokeColor="#27ae60"
        strokeWidth={5}
      />
      <DrawText
        text="Arrows"
        fontSize={24}
        position={{ x: 1400, y: 430 }}
        align="center"
        start={1725}
        duration={35}
        strokeColor="#2c3e50"
      />

      {/* Star */}
      <DrawShape
        type="star"
        position={{ x: 1530, y: 350 }}
        size={70}
        start={1760}
        duration={50}
        strokeColor="#f39c12"
        fillColor="#fef9e7"
      />
      <DrawText
        text="Stars"
        fontSize={24}
        position={{ x: 1530, y: 430 }}
        align="center"
        start={1810}
        duration={35}
        strokeColor="#2c3e50"
      />

      {/* ===== SCENE 8: Hand Animation ===== */}
      <DrawText
        text="+ Animated Hands"
        fontSize={38}
        fontWeight="bold"
        position={{ x: 1350, y: 520 }}
        align="center"
        start={1845}
        duration={60}
        strokeColor="#e74c3c"
      />

      {/* Drawing indicator */}
      <DrawShape
        type="underline"
        position={{ x: 1150, y: 555 }}
        size={400}
        start={1905}
        duration={45}
        strokeColor="#e74c3c"
        strokeWidth={3}
      />

      {/* ===== SCENE 9: Easy to Use ===== */}
      <DrawText
        text="Easy to Use"
        fontSize={64}
        fontWeight="bold"
        position={{ x: 1350, y: 680 }}
        align="center"
        start={1950}
        duration={75}
        strokeColor="#2c3e50"
      />

      {/* Code-like representation */}
      <DrawShape
        type="rectangle"
        position={{ x: 1050, y: 770 }}
        size={{ width: 600, height: 130 }}
        start={2025}
        duration={75}
        strokeColor="#34495e"
        strokeWidth={3}
        fillColor="#ecf0f1"
        fillDelay={0.3}
      />

      <DrawText
        text="<DrawText text='Hello' />"
        fontSize={32}
        fontWeight="normal"
        position={{ x: 1350, y: 810 }}
        align="center"
        start={2100}
        duration={75}
        strokeColor="#27ae60"
      />

      <DrawText
        text="<DrawShape type='circle' />"
        fontSize={32}
        fontWeight="normal"
        position={{ x: 1350, y: 860 }}
        align="center"
        start={2175}
        duration={75}
        strokeColor="#3498db"
      />

      {/* ===== SCENE 10: Call to Action ===== */}
      <DrawShape
        type="rectangle"
        position={{ x: 510, y: 450 }}
        size={{ width: 900, height: 180 }}
        start={2250}
        duration={90}
        strokeColor="#e74c3c"
        strokeWidth={5}
        roughness={2}
      />

      <DrawText
        text="Start Creating Today!"
        fontSize={68}
        fontWeight="bold"
        position={{ x: 960, y: 540 }}
        align="center"
        start={2340}
        duration={90}
        strokeColor="#e74c3c"
      />

      {/* GitHub info */}
      <DrawText
        text="github.com/unifiedvideo/framework"
        fontSize={36}
        position={{ x: 960, y: 720 }}
        align="center"
        start={2430}
        duration={75}
        strokeColor="#2c3e50"
      />

      {/* MIT License badge */}
      <DrawShape
        type="rectangle"
        position={{ x: 810, y: 800 }}
        size={{ width: 300, height: 80 }}
        start={2505}
        duration={60}
        strokeColor="#27ae60"
        fillColor="#d5f4e6"
        fillDelay={0.4}
      />

      <DrawText
        text="MIT License"
        fontSize={38}
        fontWeight="bold"
        position={{ x: 960, y: 855 }}
        align="center"
        start={2565}
        duration={50}
        strokeColor="#27ae60"
      />

      {/* Final checkmark */}
      <DrawShape
        type="line"
        from={{ x: 1450, y: 520 }}
        to={{ x: 1490, y: 570 }}
        start={2615}
        duration={25}
        strokeColor="#27ae60"
        strokeWidth={8}
      />
      <DrawShape
        type="line"
        from={{ x: 1490, y: 570 }}
        to={{ x: 1570, y: 460 }}
        start={2640}
        duration={35}
        strokeColor="#27ae60"
        strokeWidth={8}
      />

      {/* Animated Hand following the drawing */}
      <Hand
        action="write"
        follow={true}
        visible={true}
        style="realistic"
      />
    </WhiteboardScene>
  );
}

export const meta = {
  duration: 2700,  // 90 seconds at 30fps
  fps: 30,
  title: "Seqvio Whiteboard Framework Introduction",
  description: "A whiteboard animation introducing the key features of the framework"
};
