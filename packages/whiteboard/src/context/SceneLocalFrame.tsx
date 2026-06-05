/**
 * Optional scene-local frame for multi-scene compositions.
 */

import React, { createContext, useContext } from 'react';

const SceneLocalFrameContext = createContext<number | null>(null);

export function SceneLocalFrameProvider({
  value,
  children,
}: {
  value: number;
  children: React.ReactNode;
}) {
  return (
    <SceneLocalFrameContext.Provider value={value}>
      {children}
    </SceneLocalFrameContext.Provider>
  );
}

export function useSceneLocalFrame(): number | null {
  return useContext(SceneLocalFrameContext);
}
