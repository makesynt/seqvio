/**
 * Example 1: Hello World
 * Simplest whiteboard animation
 */

import React from 'react';
import { WhiteboardScene, DrawText, Hand } from '../src';

export default function HelloWorld() {
  return (
    <WhiteboardScene width={1920} height={1080} texture="paper">
      <DrawText
        text="Hello, World!"
        fontSize={72}
        fontWeight="bold"
        position={{ x: 960, y: 540 }}
        align="center"
        start={0}
        duration={90}
        strokeColor="#3498db"
      />

      <Hand
        position={{ x: 960, y: 540 }}
        action="write"
        follow={true}
        visible={true}
      />
    </WhiteboardScene>
  );
}

export const meta = {
  duration: 120,
  fps: 30
};
